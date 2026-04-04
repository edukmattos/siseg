-- ============================================================
-- CRIAR CURSOS E GERAR LICENÇAS - SCRIPT SIMPLES
-- Execute TODO este script no Supabase SQL Editor
-- ============================================================

TRUNCATE courses RESTART IDENTITY CASCADE;

-- 1. Inserir cursos apenas se NÃO existirem ainda
INSERT INTO courses (title, nr_code, level, modality, workload_hours, price_cents, is_active, is_esocial_valid)
SELECT 'Segurança em Instalações Elétricas', 'NR-10', 'Básico', 'Online', 40, 18900, true, true
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE nr_code = 'NR-10' AND workload_hours = 40 AND price_cents = 18900);

INSERT INTO courses (title, nr_code, level, modality, workload_hours, price_cents, is_active, is_esocial_valid)
SELECT 'Trabalho em Altura', 'NR-35', 'Prático', 'Híbrido', 8, 24500, true, true
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE nr_code = 'NR-35' AND workload_hours = 8 AND price_cents = 24500);

INSERT INTO courses (title, nr_code, level, modality, workload_hours, price_cents, is_active, is_esocial_valid)
SELECT 'Segurança em Máquinas e Equipamentos', 'NR-12', 'Especialista', 'Híbrido', 16, 31200, true, false
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE nr_code = 'NR-12' AND workload_hours = 16 AND price_cents = 31200);

INSERT INTO courses (title, nr_code, level, modality, workload_hours, price_cents, is_active, is_esocial_valid)
SELECT 'Segurança na Indústria da Construção', 'NR-18', 'Integração', 'Online', 6, 15600, true, false
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE nr_code = 'NR-18' AND workload_hours = 6 AND price_cents = 15600);

-- 2. Verificar cursos
SELECT '=== Cursos ===' as info;
SELECT id, title, nr_code, price_cents
FROM courses
WHERE nr_code IN ('NR-10', 'NR-35', 'NR-12', 'NR-18')
ORDER BY id;

-- 3. Atualizar course_id dos itens do pedido 6
UPDATE order_items oi
SET course_id = c.id
FROM courses c
WHERE oi.order_id = 6 
  AND oi.unit_price_cents = c.price_cents
  AND (oi.course_id IS NULL OR oi.course_id = 0);

-- 4. Verificar itens
SELECT '=== Itens do pedido 6 ===' as info;
SELECT oi.id, oi.course_id, c.title, c.nr_code, oi.unit_price_cents
FROM order_items oi
JOIN courses c ON c.id = oi.course_id
WHERE oi.order_id = 6;

-- 5. Gerar licenças
SELECT '=== Gerando licenças ===' as info;
SELECT public.generate_licenses_for_order(6, 'LIC') as result;

-- 6. Verificar licenças
SELECT '=== Licenças criadas ===' as info;
SELECT id, license_code, course_id, order_id, status
FROM licenses
WHERE order_id = 6;
