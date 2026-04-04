-- ============================================================
-- CRIAR USUÁRIO SUPER ADMIN
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. Criar usuário no Supabase Auth (se ainda não existir)
-- Substitua 'admin@nr01.com.br' e 'SuaSenhaForte123!' pelos dados desejados
SELECT auth.users.id
FROM auth.users
WHERE auth.users.email = 'admin@nr01.com.br';

-- Se não existir, crie manualmente pelo Supabase Dashboard:
-- Authentication → Users → Add User → Email: admin@nr01.com.br

-- 2. Atualizar o role para 'super_admin' na tabela users
-- Substitua 'SEU_UUID_AQUI' pelo UUID do usuário admin
UPDATE users
SET role = 'super_admin'
WHERE email = 'admin@nr01.com.br';

-- 3. Verificar se o usuário foi atualizado
SELECT 
    id,
    user_uuid,
    full_name,
    email,
    role
FROM users
WHERE role = 'super_admin';

-- ============================================================
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/vbpunolnqikllwanfvxi/auth/users
-- 2. Crie um usuário com email: admin@nr01.com.br
-- 3. Execute a query acima para definir o role como 'super_admin'
-- 4. Faça login com este usuário
-- 5. O dashboard Super Admin será exibido automaticamente ✅
-- ============================================================
