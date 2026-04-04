-- ============================================================
-- VERIFICAR CURSOS EXISTENTES E MAPEAR PARA OS PEDIDOS
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Verificar TODOS os cursos que existem no banco
SELECT '=== 1. Cursos existentes no banco ===' as info;
SELECT id, title, nr_code, modality, workload_hours
FROM courses
ORDER BY id;

-- 2. Verificar os itens do pedido 6 com preços
SELECT '=== 2. Itens do pedido 6 ===' as info;
SELECT id, order_id, course_id, quantity, unit_price_cents, total_cents
FROM order_items
WHERE order_id = 6;

-- 3. Se não houver cursos, precisamos criá-los primeiro
-- Descomente a seção abaixo se a QUERY 1 retornou 0 rows

/*
-- 4. Criar cursos que correspondem aos preços dos itens
SELECT '=== 4. Criando cursos ===' as info;

INSERT INTO courses (title, nr_code, modality, workload_hours, price_cents, is_active)
VALUES 
    ('Segurança em Instalações Elétricas', 'NR-10', 'online', 40, 18900, true),
    ('Trabalho em Altura', 'NR-35', 'hybrid', 8, 24500, true),
    ('Segurança em Máquinas e Equipamentos', 'NR-12', 'hybrid', 16, 31200, true),
    ('Segurança na Indústria da Construção', 'NR-18', 'online', 6, 15600, true)
RETURNING id, title, nr_code, price_cents;

-- 5. Atualizar course_id dos itens do pedido 6
SELECT '=== 5. Atualizando course_id dos itens ===' as info;

UPDATE order_items oi
SET course_id = c.id
FROM courses c
WHERE oi.order_id = 6 
  AND oi.unit_price_cents = c.price_cents
  AND oi.course_id IS NULL;

-- 6. Verificar se atualizou
SELECT '=== 6. Verificação final ===' as info;
SELECT oi.id, oi.order_id, oi.course_id, c.title, c.nr_code, oi.unit_price_cents
FROM order_items oi
LEFT JOIN courses c ON c.id = oi.course_id
WHERE oi.order_id = 6;
*/
