-- ============================================================
-- CORREÇÃO: Adicionar políticas de INSERT para company_members
-- Permite que donos de empresas adicionem membros
-- ============================================================

-- Remover política existente se houver
DROP POLICY IF EXISTS "company_members_insert_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_update_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_delete_policy" ON company_members;

-- Política de INSERT: Dono da empresa pode adicionar membros
CREATE POLICY "company_members_insert_policy"
    ON company_members FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT c.id FROM companies c WHERE c.owner_id = public.get_current_user_id()
        )
    );

-- Política de UPDATE: Dono da empresa pode atualizar membros
CREATE POLICY "company_members_update_policy"
    ON company_members FOR UPDATE
    USING (
        company_id IN (
            SELECT c.id FROM companies c WHERE c.owner_id = public.get_current_user_id()
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT c.id FROM companies c WHERE c.owner_id = public.get_current_user_id()
        )
    );

-- Política de DELETE: Dono da empresa pode remover membros
CREATE POLICY "company_members_delete_policy"
    ON company_members FOR DELETE
    USING (
        company_id IN (
            SELECT c.id FROM companies c WHERE c.owner_id = public.get_current_user_id()
        )
    );

-- ============================================================
-- Verificação: Listar todas as políticas de company_members
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
