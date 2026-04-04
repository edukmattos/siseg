-- ============================================================
-- CORREÇÃO DEFINITIVA: Atualizar course_id e gerar licenças
-- Execute TODO este script no Supabase SQL Editor
-- ============================================================

-- 1. Atualizar course_id dos itens do pedido 6 baseado no preço unitário
UPDATE order_items
SET course_id = CASE unit_price_cents
    WHEN 18900 THEN 1  -- NR-10
    WHEN 24500 THEN 2  -- NR-35
    WHEN 31200 THEN 4  -- NR-12
    WHEN 15600 THEN 5  -- NR-18
    ELSE course_id
END
WHERE order_id = 6 AND (course_id IS NULL OR course_id = 0);

-- 2. Verificar se atualizou corretamente
SELECT '=== Pedido 6 - Após atualização ===' as info;
SELECT id, order_id, course_id, unit_price_cents, total_cents
FROM order_items
WHERE order_id = 6;

-- 3. Gerar licenças para pedido 6
SELECT '=== Gerando licenças para pedido 6 ===' as info;
SELECT public.generate_licenses_for_order(6, 'LIC') as result;

-- 4. Verificar licenças criadas
SELECT '=== Licenças criadas para pedido 6 ===' as info;
SELECT id, license_code, course_id, order_id, company_id, status, created_at
FROM licenses
WHERE order_id = 6
ORDER BY created_at DESC;

-- 5. Contar total de licenças
SELECT '=== Total de licenças da empresa 3 ===' as info;
SELECT COUNT(*) as total_licenses
FROM licenses
WHERE company_id = 3;
