-- Política RLS para permitir leitura de usuários com role instructor
-- Executar no SQL Editor do Supabase

-- Habilitar RLS na tabela users (se ainda não estiver habilitado)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir que super_admins leiam todos os usuários
CREATE POLICY "Super admins can view all users"
  ON users
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'super_admin'
    )
  );

-- Criar política para permitir que instrutores vejam seus próprios dados
CREATE POLICY "Instructors can view their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Alternativa: Se quiser que qualquer usuário autenticado possa ver instrutores:
-- DROP POLICY IF EXISTS "Allow authenticated users to view instructors" ON users;
-- CREATE POLICY "Allow authenticated users to view instructors"
--   ON users
--   FOR SELECT
--   TO authenticated
--   USING (role = 'instructor' OR role = 'teacher');

-- Verificar se as políticas foram criadas
SELECT * FROM pg_policies WHERE tablename = 'users';
