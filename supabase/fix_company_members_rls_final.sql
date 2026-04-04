-- ============================================================
-- CORREÇÃO FINAL: Políticas RLS para company_members
-- Problema: A função get_current_user_id() depende da tabela users
-- Solução: Usar subquery direta que conecta auth.users -> users.id
-- ============================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "company_members_insert_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_update_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_delete_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_select_policy" ON company_members;

-- ============================================================
-- POLÍTICA DE INSERT
-- Permite que o dono da empresa adicione membros
-- ============================================================
CREATE POLICY "company_members_insert_policy"
    ON company_members FOR INSERT
    WITH CHECK (
        -- Verifica se o usuário logado (auth.users) é o dono da empresa
        company_id IN (
            SELECT c.id 
            FROM companies c
            INNER JOIN users u ON c.owner_id = u.id
            WHERE u.user_uuid = auth.uid()
        )
    );

-- ============================================================
-- POLÍTICA DE UPDATE
-- Permite que o dono da empresa atualize membros
-- ============================================================
CREATE POLICY "company_members_update_policy"
    ON company_members FOR UPDATE
    USING (
        company_id IN (
            SELECT c.id 
            FROM companies c
            INNER JOIN users u ON c.owner_id = u.id
            WHERE u.user_uuid = auth.uid()
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT c.id 
            FROM companies c
            INNER JOIN users u ON c.owner_id = u.id
            WHERE u.user_uuid = auth.uid()
        )
    );

-- ============================================================
-- POLÍTICA DE DELETE
-- Permite que o dono da empresa remova membros
-- ============================================================
CREATE POLICY "company_members_delete_policy"
    ON company_members FOR DELETE
    USING (
        company_id IN (
            SELECT c.id 
            FROM companies c
            INNER JOIN users u ON c.owner_id = u.id
            WHERE u.user_uuid = auth.uid()
        )
    );

-- ============================================================
-- POLÍTICA DE SELECT
-- Permite ver membros da própria empresa ou se for membro
-- ============================================================
CREATE POLICY "company_members_select_policy"
    ON company_members FOR SELECT
    USING (
        -- É membro da empresa
        user_id IN (
            SELECT u.id 
            FROM users u 
            WHERE u.user_uuid = auth.uid()
        )
        OR
        -- OU é dono da empresa
        company_id IN (
            SELECT c.id 
            FROM companies c
            INNER JOIN users u ON c.owner_id = u.id
            WHERE u.user_uuid = auth.uid()
        )
    );

-- ============================================================
-- VERIFICAÇÃO: Listar todas as políticas de company_members
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
WHERE tablename = 'company_members'
ORDER BY policyname;

-- ============================================================
-- TESTE RÁPIDO (opcional - descomente para testar)
-- ============================================================
-- Verificar se o usuário logado consegue ver sua empresa
-- SELECT c.id, c.fantasy_name, u.id as owner_id, u.full_name
-- FROM companies c
-- INNER JOIN users u ON c.owner_id = u.id
-- WHERE u.user_uuid = auth.uid();

-- ============================================================
-- NOTAS IMPORTANTES:
-- ============================================================
-- 1. Esta política faz JOIN direto entre companies e users
--    usando o user_uuid do auth.users (auth.uid())
--
-- 2. Não depende da função get_current_user_id() que pode
--    falhar se as políticas da tabela users estiverem restritivas
--
-- 3. A política de SELECT permite que:
--    - Membros vejam outros membros da mesma empresa
--    - Donos vejam todos os membros de suas empresas
--
-- 4. Se ainda der erro, verifique:
--    - Se o usuário tem perfil na tabela users
--    - Se a empresa está vinculada corretamente (owner_id)
--    - Se o auth.uid() está retornando o UUID correto
