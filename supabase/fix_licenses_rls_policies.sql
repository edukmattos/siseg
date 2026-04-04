-- ============================================================
-- POLÍTICAS RLS PARA TABELA LICENSES
-- Permitir INSERT/UPDATE via funções SECURITY DEFINER
-- ============================================================

-- Política para INSERT (usado por generate_licenses_for_order)
DROP POLICY IF EXISTS "licenses_insert_policy" ON licenses;
CREATE POLICY "licenses_insert_policy"
    ON licenses FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política para UPDATE (usado para atualizar status das licenças)
DROP POLICY IF EXISTS "licenses_update_policy" ON licenses;
CREATE POLICY "licenses_update_policy"
    ON licenses FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
SELECT '=== Políticas de licenças criadas com sucesso ===' as info;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'licenses'
ORDER BY policyname;
