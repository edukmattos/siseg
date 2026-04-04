-- ============================================================
-- FUNÇÕES RPC PARA LICENÇAS E PEDIDOS
-- Bypass RLS com SECURITY DEFINER
-- ============================================================

-- ============================================================
-- 1. BUSCAR PEDIDOS DA EMPRESA (com order_items)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_company_orders(p_company_id INT)
RETURNS TABLE (
    order_id INT,
    order_status VARCHAR,
    payment_status VARCHAR,
    total_cents INT,
    created_at TIMESTAMPTZ,
    items JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id AS order_id,
        o.status AS order_status,
        o.payment_status,
        o.total_cents,
        o.created_at,
        (
            SELECT COALESCE(
                json_agg(
                    json_build_object(
                        'item_id', oi.id,
                        'course_id', oi.course_id,
                        'course_title', c.title,
                        'nr_code', c.nr_code,
                        'quantity', oi.quantity,
                        'unit_price_cents', oi.unit_price_cents,
                        'total_cents', oi.total_cents,
                        'license_codes', oi.license_codes
                    )
                ),
                '[]'::json
            )
            FROM order_items oi
            LEFT JOIN courses c ON c.id = oi.course_id
            WHERE oi.order_id = o.id
        ) AS items
    FROM orders o
    WHERE o.company_id = p_company_id
    ORDER BY o.created_at DESC;
END;
$$;

-- ============================================================
-- 2. BUSCAR LICENÇAS DA EMPRESA
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_company_licenses(
    p_company_id INT,
    p_course_id INT DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    license_id INT,
    license_code VARCHAR,
    course_id INT,
    course_title VARCHAR,
    nr_code VARCHAR,
    assigned_to INT,
    user_full_name VARCHAR,
    user_email VARCHAR,
    status VARCHAR,
    expires_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id AS license_id,
        l.license_code,
        l.course_id,
        c.title AS course_title,
        c.nr_code,
        l.assigned_to,
        u.full_name AS user_full_name,
        u.email AS user_email,
        l.status,
        l.expires_at,
        l.activated_at,
        l.created_at
    FROM licenses l
    INNER JOIN courses c ON c.id = l.course_id
    LEFT JOIN users u ON u.id = l.assigned_to
    WHERE l.company_id = p_company_id
      AND (p_course_id IS NULL OR l.course_id = p_course_id)
      AND (p_status IS NULL OR l.status = p_status)
    ORDER BY l.created_at DESC;
END;
$$;

-- ============================================================
-- 3. CRIAR LICENÇAS PARA UM PEDIDO (após pagamento)
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_licenses_for_order(
    p_order_id INT,
    p_license_prefix VARCHAR DEFAULT 'LIC'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_license_code VARCHAR;
    v_licenses_created INT := 0;
    v_licenses_array JSONB := '[]'::jsonb;
BEGIN
    -- Buscar pedido
    SELECT * INTO v_order FROM orders WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Pedido não encontrado');
    END IF;
    
    IF v_order.payment_status != 'paid' THEN
        RETURN json_build_object('success', false, 'error', 'Pagamento ainda não foi confirmado');
    END IF;
    
    -- Processar cada item do pedido
    FOR v_item IN
        SELECT oi.*, c.nr_code
        FROM order_items oi
        INNER JOIN courses c ON c.id = oi.course_id
        WHERE oi.order_id = p_order_id
    LOOP
        -- Gerar licenças para a quantidade comprada
        FOR i IN 1..v_item.quantity LOOP
            -- Gerar código único
            v_license_code := v_license_prefix || '-' || v_item.nr_code || '-' || 
                             UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
            
            -- Inserir licença
            INSERT INTO licenses (
                license_code,
                course_id,
                company_id,
                order_id,
                status,
                expires_at
            ) VALUES (
                v_license_code,
                v_item.course_id,
                v_order.company_id,
                p_order_id,
                'available',
                NOW() + INTERVAL '1 year' -- Licença válida por 1 ano
            );
            
            -- Atualizar array de licenças no order_item
            v_licenses_array := v_licenses_array || to_jsonb(v_license_code);
            v_licenses_created := v_licenses_created + 1;
        END LOOP;
        
        -- Atualizar order_item com os códigos gerados
        UPDATE order_items
        SET license_codes = ARRAY(
            SELECT jsonb_array_elements_text(v_licenses_array)
        )
        WHERE id = v_item.id;
        
        -- Resetar array para próximo item
        v_licenses_array := '[]'::jsonb;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'licenses_created', v_licenses_created,
        'order_id', p_order_id
    );
END;
$$;

-- ============================================================
-- 4. ATRIBUIR LICENÇA A UM ALUNO
-- ============================================================
CREATE OR REPLACE FUNCTION public.assign_license_to_user(
    p_license_id INT,
    p_user_id INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_license RECORD;
    v_user RECORD;
    v_enrollment RECORD;
BEGIN
    -- Verificar licença
    SELECT * INTO v_license FROM licenses WHERE id = p_license_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Licença não encontrada');
    END IF;
    
    IF v_license.status != 'available' THEN
        RETURN json_build_object('success', false, 'error', 'Licença não está disponível');
    END IF;
    
    -- Verificar usuário
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
    END IF;
    
    -- Atribuir licença
    UPDATE licenses
    SET
        assigned_to = p_user_id,
        status = 'assigned'
    WHERE id = p_license_id;
    
    -- Criar matrícula automaticamente
    INSERT INTO enrollments (
        user_id,
        course_id,
        company_id,
        license_id,
        status
    ) VALUES (
        p_user_id,
        v_license.course_id,
        v_license.company_id,
        p_license_id,
        'active'
    )
    ON CONFLICT (user_id, course_id) DO NOTHING;
    
    -- Buscar matrícula criada
    SELECT * INTO v_enrollment
    FROM enrollments
    WHERE user_id = p_user_id
      AND course_id = v_license.course_id
      AND license_id = p_license_id
    LIMIT 1;
    
    RETURN json_build_object(
        'success', true,
        'license_id', p_license_id,
        'assigned_to', p_user_id,
        'enrollment_id', v_enrollment.id
    );
END;
$$;

-- ============================================================
-- 5. REVogar LICENÇA (liberar para reatribuição)
-- ============================================================
CREATE OR REPLACE FUNCTION public.revoke_license(
    p_license_id INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_license RECORD;
BEGIN
    SELECT * INTO v_license FROM licenses WHERE id = p_license_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Licença não encontrada');
    END IF;
    
    -- Atualizar licença
    UPDATE licenses
    SET
        assigned_to = NULL,
        status = 'available',
        activated_at = NULL
    WHERE id = p_license_id;
    
    -- Cancelar matrícula associada
    UPDATE enrollments
    SET status = 'cancelled'
    WHERE license_id = p_license_id
      AND status IN ('active', 'in_progress');
    
    RETURN json_build_object(
        'success', true,
        'license_id', p_license_id,
        'message', 'Licença revogada com sucesso'
    );
END;
$$;

-- ============================================================
-- 6. BUSCAR LICENÇAS DISPONÍVEIS PARA ATRIBUIÇÃO
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_available_licenses(
    p_company_id INT,
    p_course_id INT DEFAULT NULL,
    p_limit INT DEFAULT 50
)
RETURNS TABLE (
    license_id INT,
    license_code VARCHAR,
    course_id INT,
    course_title VARCHAR,
    nr_code VARCHAR,
    expires_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT
        l.id AS license_id,
        l.license_code,
        l.course_id,
        c.title AS course_title,
        c.nr_code,
        l.expires_at
    FROM licenses l
    INNER JOIN courses c ON c.id = l.course_id
    WHERE l.company_id = p_company_id
      AND l.status = 'available'
      AND (p_course_id IS NULL OR l.course_id = p_course_id)
      AND (l.expires_at IS NULL OR l.expires_at > NOW())
    ORDER BY l.created_at ASC
    LIMIT p_limit;
$$;

-- ============================================================
-- 7. BUSCAR ESTATÍSTICAS DE LICENÇAS DA EMPRESA
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_company_license_stats(p_company_id INT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_licenses', COALESCE(SUM(CASE WHEN status != 'revoked' THEN 1 ELSE 0 END), 0),
        'available', COALESCE(SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END), 0),
        'assigned', COALESCE(SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END), 0),
        'in_progress', COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0),
        'completed', COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0),
        'expired', COALESCE(SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END), 0),
        'revoked', COALESCE(SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END), 0)
    ) INTO v_stats
    FROM licenses
    WHERE company_id = p_company_id;
    
    RETURN v_stats;
END;
$$;

-- ============================================================
-- 8. BUSCAR DETALHES DE UM ITEM DE PEDIDO
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_order_item_details(p_item_id INT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_item RECORD;
    v_result JSON;
BEGIN
    SELECT
        oi.*,
        c.title AS course_title,
        c.nr_code,
        c.modality,
        c.workload_hours,
        COALESCE(
            (SELECT COUNT(*) FROM licenses WHERE order_id = oi.order_id AND course_id = oi.course_id),
            0
        ) AS licenses_generated
    INTO v_item
    FROM order_items oi
    INNER JOIN courses c ON c.id = oi.course_id
    WHERE oi.id = p_item_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item não encontrado');
    END IF;
    
    SELECT json_build_object(
        'success', true,
        'item_id', v_item.id,
        'order_id', v_item.order_id,
        'course_id', v_item.course_id,
        'course_title', v_item.course_title,
        'nr_code', v_item.nr_code,
        'modality', v_item.modality,
        'workload_hours', v_item.workload_hours,
        'quantity', v_item.quantity,
        'unit_price_cents', v_item.unit_price_cents,
        'total_cents', v_item.total_cents,
        'license_codes', v_item.license_codes,
        'licenses_generated', v_item.licenses_generated
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- ============================================================
-- 9. ATUALIZAR STATUS DE LICENÇA (in_progress, completed, expired)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_license_status(
    p_license_id INT,
    p_new_status VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_valid_statuses TEXT[] := ARRAY['available', 'assigned', 'in_progress', 'completed', 'expired', 'revoked'];
BEGIN
    -- Validar status
    IF NOT p_new_status = ANY(v_valid_statuses) THEN
        RETURN json_build_object('success', false, 'error', 'Status inválido');
    END IF;
    
    UPDATE licenses
    SET
        status = p_new_status,
        activated_at = CASE
            WHEN p_new_status IN ('in_progress', 'completed') AND activated_at IS NULL THEN NOW()
            ELSE activated_at
        END
    WHERE id = p_license_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Licença não encontrada');
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'license_id', p_license_id,
        'new_status', p_new_status
    );
END;
$$;

-- ============================================================
-- 10. BUSCAR ALUNOS COM LICENÇAS ATIVAS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_students_with_active_licenses(
    p_company_id INT
)
RETURNS TABLE (
    user_id INT,
    user_full_name VARCHAR,
    user_email VARCHAR,
    licenses_count INT,
    courses JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id AS user_id,
        u.full_name AS user_full_name,
        u.email AS user_email,
        COUNT(l.id) AS licenses_count,
        (
            SELECT COALESCE(
                json_agg(
                    json_build_object(
                        'license_id', l2.id,
                        'license_code', l2.license_code,
                        'course_id', c.id,
                        'course_title', c.title,
                        'nr_code', c.nr_code,
                        'status', l2.status,
                        'activated_at', l2.activated_at,
                        'expires_at', l2.expires_at
                    )
                ),
                '[]'::json
            )
            FROM licenses l2
            INNER JOIN courses c ON c.id = l2.course_id
            WHERE l2.assigned_to = u.id
              AND l2.status IN ('assigned', 'in_progress')
        ) AS courses
    FROM users u
    INNER JOIN licenses l ON l.assigned_to = u.id
    WHERE l.company_id = p_company_id
      AND l.status IN ('assigned', 'in_progress')
    GROUP BY u.id, u.full_name, u.email
    ORDER BY u.full_name;
END;
$$;

-- ============================================================
-- GARANTIR PERMISSÕES
-- ============================================================
GRANT EXECUTE ON FUNCTION public.get_company_orders TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_licenses TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_licenses_for_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_license_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_license TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_licenses TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_license_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_item_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_license_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_students_with_active_licenses TO authenticated;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT '=== TODAS AS FUNÇÕES RPC CRIADAS ===' as info;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE 'get_%' OR routine_name LIKE 'assign_%' OR routine_name LIKE 'revoke_%' OR routine_name LIKE 'generate_%' OR routine_name LIKE 'update_%'
ORDER BY routine_name;
