-- ============================================================
-- CORREÇÃO DEFINITIVA DE TODOS OS ERROS DE RLS
-- Execute ESTE SQL COMPLETO no Supabase Dashboard
-- ============================================================

-- ===== PARTE 1: USERS =====
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_all_own" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_select_simple" ON users;
DROP POLICY IF EXISTS "users_update_simple" ON users;
DROP POLICY IF EXISTS "users_insert_simple" ON users;
DROP POLICY IF EXISTS "Super admins can view all users" ON users;
DROP POLICY IF EXISTS "Instructors can view their own data" ON users;
DROP POLICY IF EXISTS "users_select_admins" ON users;

CREATE POLICY "users_select_simple" ON users FOR SELECT
    USING (user_uuid = auth.uid());

CREATE POLICY "users_update_simple" ON users FOR UPDATE
    USING (user_uuid = auth.uid()) WITH CHECK (user_uuid = auth.uid());

CREATE POLICY "users_insert_simple" ON users FOR INSERT
    WITH CHECK (user_uuid = auth.uid());

-- ===== PARTE 2: COMPANIES =====
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_select_simple" ON companies;
DROP POLICY IF EXISTS "companies_insert_simple" ON companies;
DROP POLICY IF EXISTS "companies_update_simple" ON companies;
DROP POLICY IF EXISTS "companies_all_own" ON companies;
DROP POLICY IF EXISTS "companies_select_members" ON companies;
DROP POLICY IF EXISTS "companies_insert_owner" ON companies;
DROP POLICY IF EXISTS "companies_update_owner" ON companies;

CREATE POLICY "companies_select_simple" ON companies FOR SELECT
    USING (true);

CREATE POLICY "companies_insert_simple" ON companies FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.user_uuid = auth.uid() AND users.id = companies.owner_id));

CREATE POLICY "companies_update_simple" ON companies FOR UPDATE
    USING (EXISTS (SELECT 1 FROM users WHERE users.user_uuid = auth.uid() AND users.id = companies.owner_id));

-- ===== PARTE 3: ORDERS =====
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;
DROP POLICY IF EXISTS "orders_select_own" ON orders;
DROP POLICY IF EXISTS "orders_insert_own" ON orders;
DROP POLICY IF EXISTS "orders_select_simple" ON orders;
DROP POLICY IF EXISTS "orders_insert_simple" ON orders;
DROP POLICY IF EXISTS "orders_update_simple" ON orders;

CREATE POLICY "orders_select_simple" ON orders FOR SELECT
    USING (true);

CREATE POLICY "orders_insert_simple" ON orders FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT user_uuid FROM users WHERE id = user_id));

CREATE POLICY "orders_update_simple" ON orders FOR UPDATE
    USING (auth.uid() IN (SELECT user_uuid FROM users WHERE id = user_id));

-- ===== PARTE 4: ORDER_ITEMS =====
DROP POLICY IF EXISTS "order_items_select_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_select_simple" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_simple" ON order_items;

CREATE POLICY "order_items_select_simple" ON order_items FOR SELECT
    USING (true);

CREATE POLICY "order_items_insert_simple" ON order_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id IN (SELECT id FROM users WHERE user_uuid = auth.uid())));

-- ===== PARTE 5: COMPANY_MEMBERS =====
DROP POLICY IF EXISTS "company_members_select_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_select_simple" ON company_members;
DROP POLICY IF EXISTS "company_members_insert_simple" ON company_members;

CREATE POLICY "company_members_select_simple" ON company_members FOR SELECT
    USING (true);

-- ===== PARTE 6: FUNÇÕES RPC =====
CREATE OR REPLACE FUNCTION public.get_user_by_uuid(target_uuid UUID)
RETURNS SETOF users LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$ SELECT * FROM public.users WHERE user_uuid = target_uuid LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.get_company_by_owner_id(p_owner_id INT)
RETURNS SETOF companies LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$ SELECT * FROM public.companies WHERE owner_id = p_owner_id LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.get_company_members_with_users(p_company_id INT)
RETURNS TABLE (member_id INT, user_id INT, department VARCHAR, job_function VARCHAR, user_full_name VARCHAR, user_email VARCHAR, role VARCHAR, hired_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
    SELECT cm.id, cm.user_id, cm.department, cm.job_function, u.full_name, u.email, cm.role, cm.hired_at
    FROM company_members cm INNER JOIN public.users u ON u.id = cm.user_id
    WHERE cm.company_id = p_company_id AND cm.removed_at IS NULL ORDER BY cm.hired_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.create_order_with_items(
    p_company_id INT, p_user_id INT, p_total_cents INT, p_items JSONB,
    p_discount_cents INT DEFAULT 0, p_payment_method VARCHAR DEFAULT 'credit_card', p_due_date TIMESTAMPTZ DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order_id INT; v_item JSONB;
BEGIN
    INSERT INTO orders (company_id, user_id, status, total_cents, discount_cents, payment_method, payment_status, due_date)
    VALUES (p_company_id, p_user_id, 'pending', p_total_cents, p_discount_cents, p_payment_method, 'pending', COALESCE(p_due_date, NOW() + INTERVAL '7 days'))
    RETURNING id INTO v_order_id;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        INSERT INTO order_items (order_id, course_id, quantity, unit_price_cents, total_cents)
        VALUES (v_order_id, NULLIF((v_item->>'course_id')::INT, 0), COALESCE((v_item->>'quantity')::INT, 1), (v_item->>'unit_price_cents')::INT, (v_item->>'total_cents')::INT);
    END LOOP;
    RETURN json_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ===== PARTE 7: PERMISSÕES =====
GRANT EXECUTE ON FUNCTION public.get_user_by_uuid TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_by_owner_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_members_with_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items TO authenticated;

-- ===== PARTE 8: VERIFICAÇÃO =====
SELECT '=== POLICIES ===' as info;
SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('users', 'companies', 'orders', 'order_items', 'company_members') ORDER BY tablename;

SELECT '=== FUNCTIONS ===' as info;
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND (routine_name LIKE '%order%' OR routine_name LIKE '%user%' OR routine_name LIKE '%company%') ORDER BY routine_name;
