-- ============================================================
-- SOLUÇÃO DEFINITIVA: Eliminar recursão infinita em users
-- A função get_current_user_id() está causando recursão!
-- Precisamos usar SECURITY DEFINER com RLS desabilitado
-- ============================================================

-- 1. Remover TODAS as políticas de users (começar do zero)
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_all_own" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_select_admins" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "Super admins can view all users" ON users;
DROP POLICY IF EXISTS "Instructors can view their own data" ON users;

-- 2. Recriar a função get_current_user_id SEM recursão
-- O segredo é usar SET LOCAL row_security = off
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    result_id INT;
BEGIN
    -- Desabilitar RLS APENAS para esta transação
    SET LOCAL row_security = off;
    
    SELECT id INTO result_id
    FROM public.users
    WHERE user_uuid = auth.uid()
    LIMIT 1;
    
    RETURN result_id;
END;
$$;

-- 3. Criar políticas SIMPLES que NÃO chamam get_current_user_id()
-- Usar comparação direta com user_uuid
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

-- 4. Recriar a função RPC get_user_by_uuid (garantir que existe)
CREATE OR REPLACE FUNCTION public.get_user_by_uuid(target_uuid UUID)
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT * FROM public.users WHERE user_uuid = target_uuid LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_by_uuid TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_uuid TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_uuid TO service_role;

-- 5. Recriar a função RPC get_company_by_owner_id
CREATE OR REPLACE FUNCTION public.get_company_by_owner_id(p_owner_id INT)
RETURNS SETOF companies
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT * FROM public.companies WHERE owner_id = p_owner_id LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_by_owner_id TO anon;
GRANT EXECUTE ON FUNCTION public.get_company_by_owner_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_by_owner_id TO service_role;

-- 6. Políticas SIMPLES para companies (sem get_current_user_id)
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_select_members" ON companies;
DROP POLICY IF EXISTS "companies_insert_owner" ON companies;
DROP POLICY IF EXISTS "companies_update_owner" ON companies;
DROP POLICY IF EXISTS "companies_all_own" ON companies;
DROP POLICY IF EXISTS "companies_select_simple" ON companies;

CREATE POLICY "companies_select_simple"
    ON companies FOR SELECT
    USING (true); -- Temporariamente permitir leitura para todos

-- 7. Garantir RLS habilitado em ambas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 8. Verificar se ficou correto
SELECT 'USERS policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';

SELECT 'COMPANIES policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'companies';

SELECT 'Functions:' as info;
SELECT routine_name, security_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name = 'get_user_by_uuid' OR routine_name = 'get_company_by_owner_id' OR routine_name = 'get_current_user_id');
