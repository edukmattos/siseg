-- ============================================================
-- CORREÇÃO FINAL: Erro 500 na consulta de usuários
-- Problema: Função get_current_user_id() com recursão infinita
-- Solução: Simplificar política de users e corrigir função
-- ============================================================

-- 1. Remover TODAS as políticas existentes da tabela users
DROP POLICY IF EXISTS "users_all_own" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_select_admins" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "Super admins can view all users" ON users;
DROP POLICY IF EXISTS "Instructors can view their own data" ON users;

-- 2. Recriar a função get_current_user_id sem recursão
-- Esta função precisa fazer bypass da RLS para funcionar
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    -- Desabilitar RLS temporariamente para esta query específica
    SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1;
$$;

-- 3. Criar política CORRETA para tabela users
-- Usuários podem ver e atualizar apenas seu próprio registro
CREATE POLICY "users_select_own"
    ON users FOR SELECT
    USING (auth.uid() = user_uuid);

CREATE POLICY "users_update_own"
    ON users FOR UPDATE
    USING (auth.uid() = user_uuid)
    WITH CHECK (auth.uid() = user_uuid);

CREATE POLICY "users_insert_own"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = user_uuid);

-- 4. Garantir que o RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Verificar se ficou correto
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
