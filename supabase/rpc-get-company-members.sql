-- Função RPC para buscar membros da empresa com dados do usuário
-- SECURITY DEFINER permite contornar RLS
-- Executar no SQL Editor do Supabase

CREATE OR REPLACE FUNCTION get_company_members_with_users(p_company_id INT)
RETURNS TABLE (
  member_id INT,
  user_id INT,
  department VARCHAR,
  job_function VARCHAR,
  user_full_name VARCHAR,
  user_email VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.user_id,
    cm.department,
    cm.job_function,
    u.full_name,
    u.email
  FROM company_members cm
  INNER JOIN users u ON u.id = cm.user_id
  WHERE cm.company_id = p_company_id
    AND cm.removed_at IS NULL
  ORDER BY cm.hired_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION get_company_members_with_users(INT) TO authenticated;

-- Testar a função (descomente para testar)
-- SELECT * FROM get_company_members_with_users(1);
