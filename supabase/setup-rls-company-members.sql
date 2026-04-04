-- Política RLS para permitir que donos de empresas vejam os dados de seus membros
-- Executar no SQL Editor do Supabase

-- Criar política para permitir que owners de empresas vejam os membros de suas empresas
CREATE POLICY "Company owners can view their company members"
  ON users
  FOR SELECT
  USING (
    user_uuid IN (
      SELECT cm_user.user_uuid
      FROM company_members cm
      INNER JOIN companies c ON c.id = cm.company_id
      INNER JOIN users owner ON owner.id = c.owner_id
      INNER JOIN users cm_user ON cm_user.id = cm.user_id
      WHERE owner.user_uuid = auth.uid()
      AND cm.removed_at IS NULL
    )
    OR
    -- Permitir que o usuário veja seus próprios dados
    user_uuid = auth.uid()
    OR
    -- Permitir que super_admins vejam todos os usuários
    EXISTS (
      SELECT 1 FROM users WHERE user_uuid = auth.uid() AND role = 'super_admin'
    )
  );

-- Criar política para permitir leitura de usuários vinculados à mesma empresa (para employers que são membros)
CREATE POLICY "Company members can view other members in same company"
  ON users
  FOR SELECT
  USING (
    user_uuid IN (
      SELECT cm2_user.user_uuid
      FROM company_members cm1
      INNER JOIN company_members cm2 ON cm1.company_id = cm2.company_id
      INNER JOIN users cm1_user ON cm1_user.id = cm1.user_id
      INNER JOIN users cm2_user ON cm2_user.id = cm2.user_id
      WHERE cm1_user.user_uuid = auth.uid()
      AND cm1.removed_at IS NULL
      AND cm2.removed_at IS NULL
    )
    OR
    user_uuid = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users WHERE user_uuid = auth.uid() AND role = 'super_admin'
    )
  );

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
