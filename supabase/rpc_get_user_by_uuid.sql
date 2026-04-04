-- ============================================================
-- FUNÇÃO RPC: Buscar usuário por UUID com bypass do RLS
-- Esta função permite que o frontend contorne o erro 500
-- ============================================================

-- Criar função que busca usuário por UUID (bypass RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_user_by_uuid(target_uuid UUID)
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    -- Esta função roda como SECURITY DEFINER, então bypassa o RLS
    SELECT * FROM public.users WHERE user_uuid = target_uuid LIMIT 1;
$$;

-- Garantir que a função tem as permissões corretas
GRANT EXECUTE ON FUNCTION public.get_user_by_uuid TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_uuid TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_uuid TO service_role;

-- Verificar se a função foi criada corretamente
SELECT 
    routine_name,
    routine_type,
    security_type,
    routine_body,
    external_name
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name = 'get_user_by_uuid';
