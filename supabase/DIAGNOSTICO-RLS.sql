-- ============================================================
-- DIAGNÓSTICO: Verificar estado atual das políticas e dados
-- Executar no Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Verificar políticas atuais de company_members
SELECT '=== POLÍTICAS DE COMPANY_MEMBERS ===' as info;
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'company_members' 
ORDER BY policyname;

-- 2. Verificar políticas atuais de users
SELECT '=== POLÍTICAS DE USERS ===' as info;
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;

-- 3. Verificar se há empresas e seus donos
SELECT '=== EMPRESAS E DONOS ===' as info;
SELECT 
    c.id as company_id,
    c.fantasy_name,
    c.owner_id,
    u.full_name as owner_name,
    u.email as owner_email,
    u.user_uuid as owner_uuid
FROM companies c
LEFT JOIN users u ON c.owner_id = u.id
ORDER BY c.id;

-- 4. Contar registros em company_members
SELECT '=== CONTAGEM DE COMPANY_MEMBERS ===' as info;
SELECT COUNT(*) as total_membros FROM company_members;

-- 5. Verificar se existe função handle_new_user
SELECT '=== TRIGGER E FUNÇÃO ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 6. Verificar se a função existe
SELECT 
    proname as function_name,
    prorettype::regtype as return_type,
    prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 7. Testar subquery usada na política (simulando o que o RLS faz)
SELECT '=== TESTE DA SUBQUERY DA POLÍTICA ===' as info;
-- Esta query simula o que a política RLS verifica
-- Substitua 'SEU_USER_UUID_AQUI' pelo UUID real do usuário logado
SELECT 
    c.id as company_id,
    c.fantasy_name,
    u.id as user_id_check
FROM companies c
WHERE c.owner_id IN (
    SELECT u2.id
    FROM users u2
    WHERE u2.user_uuid = auth.uid()  -- auth.uid() retorna NULL se não estiver logado
);

-- 8. Verificar session_user e auth.uid()
SELECT '=== INFORMAÇÕES DE SESSÃO ===' as info;
SELECT 
    current_user as database_user,
    session_user as session_user,
    auth.uid() as auth_uid,
    auth.jwt() as auth_jwt;

-- ============================================================
-- INSTRUÇÕES:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Copie os resultados e envie para análise
-- 3. Especialmente importante: resultado do item 8 (auth.uid())
-- ============================================================
