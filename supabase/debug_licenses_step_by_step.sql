-- ============================================================
-- DIAGNÓSTICO DETALHADO PASSO A PASSO
-- Execute cada query separadamente e veja os resultados
-- ============================================================

-- QUERY 1: Verificar se os course_ids foram atualizados
SELECT '=== QUERY 1: Itens do pedido 6 ===' as info;
SELECT oi.id, oi.order_id, oi.course_id, c.title as course_title, c.nr_code, oi.quantity
FROM order_items oi
LEFT JOIN courses c ON c.id = oi.course_id
WHERE oi.order_id = 6;

-- QUERY 2: Verificar se as courses existem com esses IDs
SELECT '=== QUERY 2: Cursos existentes ===' as info;
SELECT id, title, nr_code
FROM courses
WHERE id IN (1, 2, 3, 4, 5, 6)
ORDER BY id;

-- QUERY 3: Testar INSERT direto de UMA licença (sem função)
SELECT '=== QUERY 3: Testando INSERT direto ===' as info;
INSERT INTO licenses (license_code, course_id, company_id, order_id, status, expires_at)
VALUES ('LIC-TEST-001', 1, 3, 6, 'available', NOW() + INTERVAL '1 year')
RETURNING id, license_code, course_id;

-- QUERY 4: Se QUERY 3 funcionou, deletar a licença de teste
SELECT '=== QUERY 4: Limpando licença de teste ===' as info;
DELETE FROM licenses WHERE license_code = 'LIC-TEST-001';

-- QUERY 5: Verificar políticas RLS da tabela licenses
SELECT '=== QUERY 5: Políticas RLS ===' as info;
SELECT policyname, cmd, roles::text[], qual, with_check
FROM pg_policies
WHERE tablename = 'licenses';

-- QUERY 6: Verificar se RLS está ativado
SELECT '=== QUERY 6: RLS ativado? ===' as info;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'licenses';
