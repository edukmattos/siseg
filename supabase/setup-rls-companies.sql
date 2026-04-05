-- Políticas RLS para a tabela companies
-- Executar no SQL Editor do Supabase

-- Habilitar RLS na tabela companies (se ainda não estiver habilitado)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Política para permitir que owners vejam suas próprias empresas
-- Compara user_uuid (uuid) com auth.uid() (uuid)
CREATE POLICY "Owners can view their own companies"
  ON companies
  FOR SELECT
  USING (
    owner_id IN (
      SELECT id FROM users WHERE user_uuid = auth.uid()
    )
  );

-- Política para permitir que membros da empresa vejam a empresa
CREATE POLICY "Company members can view their company"
  ON companies
  FOR SELECT
  USING (
    id IN (
      SELECT cm.company_id 
      FROM company_members cm
      INNER JOIN users u ON u.id = cm.user_id
      WHERE u.user_uuid = auth.uid()
      AND cm.removed_at IS NULL
    )
  );

-- Política para permitir que super_admins vejam todas as empresas
CREATE POLICY "Super admins can view all companies"
  ON companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE user_uuid = auth.uid() AND role = 'super_admin'
    )
  );

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY policyname;
