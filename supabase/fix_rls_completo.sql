-- ============================================================
-- SCRIPT COMPLETO: Criar função + Políticas RLS para company_members
-- Execute TUDO de uma vez no SQL Editor do Supabase
-- ============================================================

-- 1. Criar função helper (necessária para as políticas)
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1;
$$;

-- 2. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "company_members_insert_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_update_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_delete_policy" ON company_members;

-- 3. Política de INSERT: Dono da empresa pode adicionar membros
CREATE POLICY "company_members_insert_policy"
    ON company_members FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT c.id FROM companies c WHERE c.owner_id = public.get_current_user_id()
        )
    );

-- 4. Política de UPDATE: Dono da empresa pode atualizar membros
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

-- 5. Política de DELETE: Dono da empresa pode remover membros
CREATE POLICY "company_members_delete_policy"
    ON company_members FOR DELETE
    USING (
        company_id IN (
            SELECT c.id FROM companies c WHERE c.owner_id = public.get_current_user_id()
        )
    );

-- 6. Verificação: Listar todas as políticas criadas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'company_members'
ORDER BY policyname;
