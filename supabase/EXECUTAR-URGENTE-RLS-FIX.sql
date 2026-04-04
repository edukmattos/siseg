-- ============================================================
-- EXECUTAR ESTE SCRIPT NO SUPABASE SQL EDITOR
-- Resolve o erro de RLS em company_members IMEDIATAMENTE
-- ============================================================

-- Passo 1: Remover TODAS as políticas existentes de company_members
DROP POLICY IF EXISTS "company_members_insert_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_update_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_delete_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_select_policy" ON company_members;
DROP POLICY IF EXISTS "Empresa pode ver membros" ON company_members;
DROP POLICY IF EXISTS "Dono pode inserir membros" ON company_members;

-- Passo 2: Criar novas políticas simplificadas
-- Usando subquery direta que conecta auth.users -> users.id -> companies

-- POLÍTICA DE INSERT (o mais importante!)
CREATE POLICY "company_members_insert_policy"
    ON company_members FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT c.id 
            FROM companies c
            WHERE c.owner_id IN (
                SELECT u.id 
                FROM users u 
                WHERE u.user_uuid = auth.uid()
            )
        )
    );

-- POLÍTICA DE SELECT
CREATE POLICY "company_members_select_policy"
    ON company_members FOR SELECT
    USING (true);  -- Temporariamente aberto para debug

-- POLÍTICA DE UPDATE
CREATE POLICY "company_members_update_policy"
    ON company_members FOR UPDATE
    USING (
        company_id IN (
            SELECT c.id 
            FROM companies c
            WHERE c.owner_id IN (
                SELECT u.id 
                FROM users u 
                WHERE u.user_uuid = auth.uid()
            )
        )
    );

-- POLÍTICA DE DELETE
CREATE POLICY "company_members_delete_policy"
    ON company_members FOR DELETE
    USING (
        company_id IN (
            SELECT c.id 
            FROM companies c
            WHERE c.owner_id IN (
                SELECT u.id 
                FROM users u 
                WHERE u.user_uuid = auth.uid()
            )
        )
    );

-- Passo 3: Verificar se as políticas foram criadas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'company_members'
ORDER BY policyname;

-- ============================================================
-- INSTRUÇÕES:
-- 1. Copie TODO este script
-- 2. Vá para https://supabase.com/dashboard
-- 3. Selecione seu projeto
-- 4. Clique em "SQL Editor" no menu lateral
-- 5. Cole o script e clique em "Run"
-- 6. Verifique se 4 políticas foram listadas no resultado
-- 7. Volte para o aplicativo e tente adicionar um aluno novamente
-- ============================================================
