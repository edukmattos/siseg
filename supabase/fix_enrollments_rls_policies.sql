-- ============================================================
-- POLÍTICAS RLS PARA TABELA ENROLLMENTS
-- Permitir UPDATE de progresso pelo próprio usuário
-- ============================================================

-- Política para SELECT (ler próprias matrículas)
DROP POLICY IF EXISTS "enrollments_select_policy" ON enrollments;
CREATE POLICY "enrollments_select_policy"
    ON enrollments FOR SELECT
    TO authenticated
    USING (
        user_id = public.get_current_user_id() OR
        company_id IN (
            SELECT c.id FROM companies c WHERE c.owner_id = public.get_current_user_id()
        )
    );

-- Política para UPDATE (atualizar próprio progresso)
DROP POLICY IF EXISTS "enrollments_update_policy" ON enrollments;
CREATE POLICY "enrollments_update_policy"
    ON enrollments FOR UPDATE
    TO authenticated
    USING (user_id = public.get_current_user_id())
    WITH CHECK (user_id = public.get_current_user_id());

-- Política para INSERT (apenas via RPC ou admin)
DROP POLICY IF EXISTS "enrollments_insert_policy" ON enrollments;
CREATE POLICY "enrollments_insert_policy"
    ON enrollments FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
SELECT '=== Políticas de enrollments criadas com sucesso ===' as info;

SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'enrollments'
ORDER BY policyname;
