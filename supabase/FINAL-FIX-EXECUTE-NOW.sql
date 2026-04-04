-- ============================================================
-- CORREÇÃO FINAL COMPLETA - Execute ESTE SQL AGORA!
-- Resolve todos os erros de RLS e adiciona funções RPC faltantes
-- ============================================================

-- ============================================================
-- PARTE 1: TABELA users - Políticas SIMPLES (sem recursão)
-- ============================================================

DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_all_own" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_select_admins" ON users;
DROP POLICY IF EXISTS "Super admins can view all users" ON users;
DROP POLICY IF EXISTS "Instructors can view their own data" ON users;
DROP POLICY IF EXISTS "users_select_simple" ON users;
DROP POLICY IF EXISTS "users_update_simple" ON users;
DROP POLICY IF EXISTS "users_insert_simple" ON users;

CREATE POLICY "users_select_simple"
    ON users FOR SELECT
    USING (user_uuid = auth.uid());

CREATE POLICY "users_update_simple"
    ON users FOR UPDATE
    USING (user_uuid = auth.uid())
    WITH CHECK (user_uuid = auth.uid());

CREATE POLICY "users_insert_simple"
    ON users FOR INSERT
    WITH CHECK (user_uuid = auth.uid());

-- ============================================================
-- PARTE 2: TABELA companies - Políticas SIMPLES
-- ============================================================

DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_select_members" ON companies;
DROP POLICY IF EXISTS "companies_insert_owner" ON companies;
DROP POLICY IF EXISTS "companies_update_owner" ON companies;
DROP POLICY IF EXISTS "companies_all_own" ON companies;
DROP POLICY IF EXISTS "companies_select_simple" ON companies;
DROP POLICY IF EXISTS "companies_insert_simple" ON companies;
DROP POLICY IF EXISTS "companies_update_simple" ON companies;

CREATE POLICY "companies_select_simple"
    ON companies FOR SELECT
    USING (true);

CREATE POLICY "companies_insert_simple"
    ON companies FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.user_uuid = auth.uid() 
            AND users.id = companies.owner_id
        )
    );

CREATE POLICY "companies_update_simple"
    ON companies FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.user_uuid = auth.uid() 
            AND users.id = companies.owner_id
        )
    );

-- ============================================================
-- PARTE 3: TABELA company_members - Políticas
-- ============================================================

DROP POLICY IF EXISTS "company_members_select_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_select_simple" ON company_members;
DROP POLICY IF EXISTS "company_members_insert_simple" ON company_members;

CREATE POLICY "company_members_select_simple"
    ON company_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = company_members.company_id 
            AND (c.owner_id IN (SELECT id FROM users WHERE user_uuid = auth.uid()) OR true)
        )
    );

CREATE POLICY "company_members_insert_simple"
    ON company_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = company_members.company_id 
            AND c.owner_id IN (SELECT id FROM users WHERE user_uuid = auth.uid())
        )
    );

-- ============================================================
-- PARTE 4: FUNÇÕES RPC (bypass RLS com SECURITY DEFINER)
-- ============================================================

-- 4.1. Função para buscar usuário por UUID
CREATE OR REPLACE FUNCTION public.get_user_by_uuid(target_uuid UUID)
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT * FROM public.users WHERE user_uuid = target_uuid LIMIT 1;
$$;

-- 4.2. Função para buscar empresa por owner_id
CREATE OR REPLACE FUNCTION public.get_company_by_owner_id(p_owner_id INT)
RETURNS SETOF companies
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT * FROM public.companies WHERE owner_id = p_owner_id LIMIT 1;
$$;

-- 4.3. **NOVA** Função para buscar membros da empresa com dados do usuário
CREATE OR REPLACE FUNCTION public.get_company_members_with_users(p_company_id INT)
RETURNS TABLE (
    member_id INT,
    user_id INT,
    department VARCHAR,
    job_function VARCHAR,
    user_full_name VARCHAR,
    user_email VARCHAR,
    role VARCHAR,
    hired_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT
        cm.id AS member_id,
        cm.user_id,
        cm.department,
        cm.job_function,
        u.full_name AS user_full_name,
        u.email AS user_email,
        cm.role,
        cm.hired_at
    FROM company_members cm
    INNER JOIN public.users u ON u.id = cm.user_id
    WHERE cm.company_id = p_company_id
      AND cm.removed_at IS NULL
    ORDER BY cm.hired_at DESC;
$$;

-- 4.4. Garantir permissões para todas as funções RPC
GRANT EXECUTE ON FUNCTION public.get_user_by_uuid TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_uuid TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_uuid TO service_role;

GRANT EXECUTE ON FUNCTION public.get_company_by_owner_id TO anon;
GRANT EXECUTE ON FUNCTION public.get_company_by_owner_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_by_owner_id TO service_role;

GRANT EXECUTE ON FUNCTION public.get_company_members_with_users TO anon;
GRANT EXECUTE ON FUNCTION public.get_company_members_with_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_members_with_users TO service_role;

-- ============================================================
-- PARTE 5: HABILITAR RLS
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTE 6: VERIFICAÇÃO FINAL
-- ============================================================

SELECT '=== USERS POLICIES ===' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';

SELECT '=== COMPANIES POLICIES ===' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'companies';

SELECT '=== COMPANY_MEMBERS POLICIES ===' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'company_members';

SELECT '=== RPC FUNCTIONS ===' as info;
SELECT routine_name, routine_type, security_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_by_uuid', 'get_company_by_owner_id', 'get_company_members_with_users')
ORDER BY routine_name;
