-- ============================================================
-- DIAGNÓSTICO COMPLETO: Investigar erro 500 na tabela users
-- Execute este SQL para entender o que está causando o erro
-- ============================================================

-- 1. Verificar TODAS as políticas ativas na tabela users
SELECT 
    policyname,
    cmd,
    roles,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 2. Verificar se o RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- 3. Testar a query que está falhando MANUALMENTE
-- (Simulando o que o AuthContext faz)
SELECT * FROM users WHERE user_uuid = 'd0dfff5d-226d-44e6-9eb8-2f36a0128824';

-- 4. Verificar estrutura da tabela users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 5. Verificar se a função get_current_user_id existe e está correta
SELECT 
    routine_name,
    routine_type,
    security_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name = 'get_current_user_id';

-- 6. Verificar triggers na tabela users
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- 7. Verificar índices na tabela users
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users';

-- 8. Verificar se há alguma trigger problemática no auth.users
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';
