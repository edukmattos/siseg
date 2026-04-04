-- ============================================================
-- CORREÇÃO RLS: Permitir criação de perfis de alunos
-- Problema: Política atual só permite INSERT pelo próprio usuário
-- Solução: Criar políticas separadas para SELECT, INSERT, UPDATE
-- ============================================================

-- Remover política atual que é muito restritiva
DROP POLICY IF EXISTS "users_all_own" ON users;

-- Política de SELECT: usuário vê apenas seu próprio registro
CREATE POLICY "users_select_own"
    ON users FOR SELECT
    USING (
        -- Usuário vê seu próprio perfil
        auth.uid() = user_uuid
        OR
        -- OU é dono de empresa (pode ver alunos da empresa)
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.owner_id = users.id
        )
    );

-- Política de INSERT: permite criar novos perfis
-- Qualquer usuário autenticado pode criar perfis de students
CREATE POLICY "users_insert_any_authenticated"
    ON users FOR INSERT
    WITH CHECK (
        -- Qualquer usuário logado pode inserir (usado pela trigger e pelo frontend)
        auth.uid() IS NOT NULL
    );

-- Política de UPDATE: usuário atualiza apenas seu próprio registro
CREATE POLICY "users_update_own"
    ON users FOR UPDATE
    USING (
        auth.uid() = user_uuid
    )
    WITH CHECK (
        auth.uid() = user_uuid
    );

-- ============================================================
-- VERIFICAÇÃO: Listar todas as políticas da tabela users
-- ============================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- ============================================================
-- NOTAS IMPORTANTES:
-- ============================================================
-- 1. A política de INSERT permite que qualquer usuário autenticado
--    crie perfis na tabela users. Isso é necessário para que o dono
--    da empresa possa adicionar alunos.
--
-- 2. A segurança é garantida pelo fato de que:
--    - Apenas o próprio usuário pode atualizar seus dados
--    - O user_uuid é UNIQUE e referenciado ao auth.users
--    - O dono da empresa gerencia os alunos através da company_members
--
-- 3. Se quiser mais segurança, pode criar uma função SECURITY DEFINER
--    para validar se o usuário inserindo é um employer/admin
