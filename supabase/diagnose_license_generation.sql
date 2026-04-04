-- ============================================================
-- DIAGNÓSTICO COMPLETO - POR QUE AS LICENÇAS NÃO SÃO GERADAS
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Verificar se a função confirm_order_payment existe
SELECT '=== 1. Verificando função confirm_order_payment ===' as info;
SELECT routine_name, data_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'confirm_order_payment';

-- 2. Verificar se a função generate_licenses_for_order existe
SELECT '=== 2. Verificando função generate_licenses_for_order ===' as info;
SELECT routine_name, data_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'generate_licenses_for_order';

-- 3. Verificar políticas da tabela licenses
SELECT '=== 3. Políticas da tabela licenses ===' as info;
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'licenses';

-- 4. Verificar pedidos 6 e 7
SELECT '=== 4. Dados dos pedidos 6 e 7 ===' as info;
SELECT id, company_id, user_id, status, payment_status, payment_method, payment_date, total_cents
FROM orders
WHERE id IN (6, 7);

-- 5. Verificar itens dos pedidos
SELECT '=== 5. Itens dos pedidos 6 e 7 ===' as info;
SELECT oi.id, oi.order_id, oi.course_id, oi.quantity, oi.unit_price_cents, oi.total_cents, c.title, c.nr_code
FROM order_items oi
LEFT JOIN courses c ON c.id = oi.course_id
WHERE oi.order_id IN (6, 7);

-- 6. Verificar se já existem licenças para os pedidos
SELECT '=== 6. Licenças existentes para pedidos 6 e 7 ===' as info;
SELECT id, license_code, course_id, order_id, company_id, status, created_at
FROM licenses
WHERE order_id IN (6, 7);

-- 7. Contar total de licenças da empresa 3
SELECT '=== 7. Total de licenças da empresa 3 ===' as info;
SELECT COUNT(*) as total_licenses
FROM licenses
WHERE company_id = 3;

-- 8. Testar geração de licenças para pedido 6
SELECT '=== 8. Testando generate_licenses_for_order(6) ===' as info;
SELECT public.generate_licenses_for_order(6, 'LIC') as result;

-- 9. Se o passo 8 falhou, verificar o schema da tabela courses
SELECT '=== 9. Verificando colunas da tabela courses ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'courses'
  AND column_name IN ('nr_code', 'title', 'id')
ORDER BY column_name;

-- 10. Verificar RLS na tabela licenses
SELECT '=== 10. RLS ativado na tabela licenses? ===' as info;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'licenses';
