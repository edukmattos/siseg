-- ============================================================
-- SOLUÇÃO ALTERNATIVA: Função RPC com SECURITY DEFINER
-- Isso contorna completamente o problema de RLS
-- ============================================================

-- 1. Criar função que adiciona membro à empresa (ignora RLS)
CREATE OR REPLACE FUNCTION add_company_member(
    p_company_id INT,
    p_user_id INT,
    p_department VARCHAR(100),
    p_job_function VARCHAR(100),
    p_role VARCHAR(50)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER  -- Executa com permissões do dono da função (postgres)
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário chamador é dono da empresa
    IF NOT EXISTS (
        SELECT 1 FROM companies c
        INNER JOIN users u ON c.owner_id = u.id
        WHERE c.id = p_company_id
        AND u.user_uuid = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Usuário não tem permissão para adicionar membros a esta empresa';
    END IF;
    
    -- Inserir o membro (esta operação ignora RLS porque está dentro da função SECURITY DEFINER)
    INSERT INTO company_members (company_id, user_id, department, job_function, role)
    VALUES (p_company_id, p_user_id, p_department, p_job_function, p_role)
    ON CONFLICT (company_id, user_id) DO UPDATE SET
        department = EXCLUDED.department,
        job_function = EXCLUDED.job_function,
        role = EXCLUDED.role,
        removed_at = NULL;
END;
$$;

-- 2. Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION add_company_member TO authenticated;

-- 3. Verificar se a função foi criada
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    proargtypes as argument_types
FROM pg_proc 
WHERE proname = 'add_company_member';

-- ============================================================
-- RESULTADO ESPERADO:
-- ✅ Função add_company_member criada com security_definer = true
-- ✅ Função pode ser chamada via supabase.rpc('add_company_member', {...})
-- ============================================================
