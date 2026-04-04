-- ============================================================
-- FUNÇÃO DE DIAGNÓSTICO: Verificar autenticação e permissões
-- ============================================================

CREATE OR REPLACE FUNCTION debug_auth_info()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_uid UUID;
    v_current_user TEXT;
    v_session_user TEXT;
    v_user_record RECORD;
    v_company_record RECORD;
    v_result JSON;
BEGIN
    -- Capturar informações de autenticação
    v_auth_uid := auth.uid();
    v_current_user := current_user;
    v_session_user := session_user;
    
    -- Buscar dados do usuário logado
    SELECT id, user_uuid, full_name, email, role
    INTO v_user_record
    FROM users
    WHERE user_uuid = v_auth_uid;
    
    -- Buscar empresas do usuário
    SELECT c.id, c.fantasy_name, c.owner_id
    INTO v_company_record
    FROM companies c
    WHERE c.owner_id = v_user_record.id
    LIMIT 1;
    
    -- Montar JSON com informações de diagnóstico
    v_result := json_build_object(
        'auth_uid', v_auth_uid::TEXT,
        'current_user', v_current_user,
        'session_user', v_session_user,
        'user_found', v_user_record IS NOT NULL,
        'user_data', CASE 
            WHEN v_user_record IS NOT NULL THEN json_build_object(
                'id', v_user_record.id,
                'user_uuid', v_user_record.user_uuid::TEXT,
                'full_name', v_user_record.full_name,
                'email', v_user_record.email,
                'role', v_user_record.role
            )
            ELSE NULL
        END,
        'company_found', v_company_record IS NOT NULL,
        'company_data', CASE
            WHEN v_company_record IS NOT NULL THEN json_build_object(
                'id', v_company_record.id,
                'fantasy_name', v_company_record.fantasy_name,
                'owner_id', v_company_record.owner_id
            )
            ELSE NULL
        END,
        'all_companies', (
            SELECT json_agg(json_build_object(
                'id', c.id,
                'fantasy_name', c.fantasy_name,
                'owner_id', c.owner_id,
                'owner_user', json_build_object(
                    'id', u.id,
                    'full_name', u.full_name,
                    'user_uuid', u.user_uuid::TEXT
                )
            ))
            FROM companies c
            LEFT JOIN users u ON c.owner_id = u.id
        ),
        'all_users', (
            SELECT json_agg(json_build_object(
                'id', u.id,
                'full_name', u.full_name,
                'email', u.email,
                'user_uuid', u.user_uuid::TEXT,
                'role', u.role
            ))
            FROM users u
            LIMIT 10
        )
    );
    
    RETURN v_result;
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION debug_auth_info TO authenticated;

-- ============================================================
-- COMO USAR:
-- 1. Execute este script no Supabase SQL Editor
-- 2. No seu aplicativo (console do navegador F12), execute:
--
--    const { data } = await supabase.rpc('debug_auth_info');
--    console.log('Debug Auth:', data);
--
-- 3. Envie o resultado do console para análise
-- ============================================================
