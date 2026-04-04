-- ============================================================
-- TESTE DIRETO: Query usada pela função generate_licenses_for_order
-- ============================================================

-- Testar a query que a função usa para buscar itens do pedido 6
SELECT oi.id, oi.order_id, oi.course_id, oi.quantity, oi.unit_price_cents, oi.total_cents, c.title, c.nr_code
FROM order_items oi
INNER JOIN courses c ON c.id = oi.course_id
WHERE oi.order_id = 6;

-- Se retornar 0 rows, verificar se existem order_items para o pedido 6
SELECT 'Verificando order_items sem join com courses:' as info;
SELECT id, order_id, course_id, quantity, unit_price_cents, total_cents
FROM order_items
WHERE order_id = 6;

-- Verificar se o course_id existe na tabela courses
SELECT 'Verificando se os course_ids existem:' as info;
SELECT DISTINCT oi.course_id, c.id as course_exists, c.title, c.nr_code
FROM order_items oi
LEFT JOIN courses c ON c.id = oi.course_id
WHERE oi.order_id = 6;
