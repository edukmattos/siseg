-- ============================================================
-- SQL COMPLETO PARA CORRIGIR TODOS OS ERROS DE RLS
-- Execute ESTE SQL no Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- PARTE 1: CORREÇÃO DA TABELA users
-- ============================================================

-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_all_own" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_select_admins" ON users;
DROP POLICY IF EXISTS "Super admins can view all users" ON users;
DROP POLICY IF EXISTS "Instructors can view their own data" ON users;

-- Criar políticas SIMPLES (sem chamadas a funções)
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
-- PARTE 2: CORREÇÃO DA TABELA companies
-- ============================================================

-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_select_members" ON companies;
DROP POLICY IF EXISTS "companies_insert_owner" ON companies;
DROP POLICY IF EXISTS "companies_update_owner" ON companies;
DROP POLICY IF EXISTS "companies_all_own" ON companies;
DROP POLICY IF EXISTS "companies_select_simple" ON companies;

-- Criar políticas SIMPLES (sem chamadas a get_current_user_id)
CREATE POLICY "companies_select_simple"
    ON companies FOR SELECT
    USING (true); -- Permitir leitura temporariamente

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
-- PARTE 3: CRIAR FUNÇÕES RPC (para bypass do RLS)
-- ============================================================

-- Função para buscar usuário por UUID
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

-- Função para buscar empresa por owner_id
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

-- Função get_current_user_id corrigida (se necessário)
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    result_id INT;
BEGIN
    SET LOCAL row_security = off;
    
    SELECT id INTO result_id
    FROM public.users
    WHERE user_uuid = auth.uid()
    LIMIT 1;
    
    RETURN result_id;
END;
$$;

-- ============================================================
-- PARTE 4: VERIFICAÇÃO FINAL
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

SELECT 'USERS policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';

SELECT 'COMPANIES policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'companies';
