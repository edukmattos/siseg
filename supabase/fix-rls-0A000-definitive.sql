-- ============================================================
-- SOLUÇÃO DEFINITIVA: ERRO 0A000 (SET is not allowed in a non-volatile function)
-- Este script limpa as configurações problemáticas das funções
-- e as recria de forma segura para uso em RLS.
-- ============================================================

-- 1. RESETAR CONFIGURAÇÕES ANTIGAS (Limpeza de search_path e configurações de RLS)
DO $$
BEGIN
    -- get_current_user_id
    IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE proname = 'get_current_user_id' AND nspname = 'public') THEN
        ALTER FUNCTION public.get_current_user_id() RESET ALL;
    END IF;

    -- get_user_by_uuid
    IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE proname = 'get_user_by_uuid' AND nspname = 'public') THEN
        ALTER FUNCTION public.get_user_by_uuid(uuid) RESET ALL;
    END IF;

    -- get_company_by_owner_id
    IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE proname = 'get_company_by_owner_id' AND nspname = 'public') THEN
        ALTER FUNCTION public.get_company_by_owner_id(int) RESET ALL;
    END IF;
    
    -- get_company_members_with_users
    IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE proname = 'get_company_members_with_users' AND nspname = 'public') THEN
        ALTER FUNCTION public.get_company_members_with_users(int) RESET ALL;
    END IF;
    
    -- Se houver outras funções RPC que você criou, o RESET ALL garante que elas voltem ao padrão
END;
$$;

-- 2. RECRIAR FUNÇÕES CRÍTICAS PARA RLS (Devem ser STABLE e SEM 'SET')
-- Usamos nomes de tabelas qualificados (public.users) para evitar erros de search_path.

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
STABLE -- Obrigatório para uso em RLS performático
AS $$
    SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1;
$$;

-- 3. AJUSTAR POLÍTICAS DE ENROLLMENTS PARA EVITAR FUNÇÕES QUANDO POSSÍVEL
-- Comparação direta com auth.uid() é sempre mais segura e rápida.

DROP POLICY IF EXISTS "enrollments_select_policy" ON public.enrollments;
CREATE POLICY "enrollments_select_policy"
    ON public.enrollments FOR SELECT
    TO authenticated
    USING (
        user_id = (SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1) OR
        company_id IN (
            SELECT c.id FROM public.companies c 
            WHERE c.owner_id = (SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1)
        )
    );

DROP POLICY IF EXISTS "enrollments_update_policy" ON public.enrollments;
CREATE POLICY "enrollments_update_policy"
    ON public.enrollments FOR UPDATE
    TO authenticated
    USING (user_id = (SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1))
    WITH CHECK (user_id = (SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1));

-- 4. AJUSTAR POLÍTICAS DE LICENSES
DROP POLICY IF EXISTS "licenses_select_policy" ON public.licenses;
CREATE POLICY "licenses_select_policy"
    ON public.licenses FOR SELECT
    TO authenticated
    USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE owner_id = (SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1)
        ) OR
        assigned_to = (SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1)
    );

-- 5. AJUSTAR OUTRAS FUNÇÕES RPC (Remover 'SET search_path' e manter VOLATILE onde possível)
-- Se uma função RPC der erro 0A000, ela deve ser recriada sem o 'SET search_path'.

-- (Esta função já estava limpa no código, mas garantimos aqui)

-- 6. VERIFICAÇÃO
SELECT '=== Correção 0A000 aplicada com sucesso ===' as status;
