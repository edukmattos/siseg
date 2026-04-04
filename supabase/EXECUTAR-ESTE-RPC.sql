-- ============================================================
-- EXECUTAR ESTE SCRIPT NO SUPABASE SQL EDITOR
-- Resolve o erro de RLS usando função RPC com SECURITY DEFINER
-- ============================================================

-- 1. Criar função RPC que contorna RLS
CREATE OR REPLACE FUNCTION add_company_member(
    p_company_id INT,
    p_user_id INT,
    p_department VARCHAR(100),
    p_job_function VARCHAR(100),
    p_role VARCHAR(50)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário chamador é owner (employer) da empresa
    IF NOT EXISTS (
        SELECT 1 FROM companies c
        INNER JOIN users u ON c.owner_id = u.id
        WHERE c.id = p_company_id
        AND u.user_uuid = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Usuário não tem permissão para adicionar membros a esta empresa';
    END IF;

    -- Inserir o membro (ignora RLS porque está dentro de SECURITY DEFINER)
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

-- 3. Verificar se a função foi criada corretamente
SELECT 
    proname as nome_funcao,
    prosecdef as security_definer,
    proargnames as parametros
FROM pg_proc 
WHERE proname = 'add_company_member';

-- ============================================================
-- RESULTADO ESPERADO:
-- ✅ Sucesso: "Success. No rows returned"
-- ✅ Tabela com: nome_funcao = "add_company_member", security_definer = "t" (true)
-- ============================================================
--
-- APÓS EXECUTAR:
-- 1. Volte ao aplicativo (localhost)
-- 2. Recarregue a página (F5)
-- 3. Tente adicionar um aluno novamente
-- 4. Deve funcionar! ✅
-- ============================================================
