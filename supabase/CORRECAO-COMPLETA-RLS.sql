-- ============================================================
-- SCRIPT COMPLETO: Correção RLS para Adição de Alunos
-- Executar no Supabase Dashboard → SQL Editor
-- Projeto: vbpunolnqikllwanfvxi
-- ============================================================
--
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/vbpunolnqikllwanfvxi/sql/new
-- 2. Cole TODO este script
-- 3. Clique em "Run" (ou Ctrl+Enter)
-- 4. Verifique se todas as queries executaram com sucesso
-- ============================================================

-- ============================================================
-- PARTE 1: Remover políticas antigas
-- ============================================================

-- Remover políticas de company_members
DROP POLICY IF EXISTS "company_members_insert_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_update_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_delete_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_select_policy" ON company_members;
DROP POLICY IF EXISTS "Empresa pode ver membros" ON company_members;
DROP POLICY IF EXISTS "Dono pode inserir membros" ON company_members;

-- Remover política antiga de users
DROP POLICY IF EXISTS "users_all_own" ON users;

-- ============================================================
-- PARTE 2: Criar trigger para criação automática de perfis
-- ============================================================

-- Função para criar perfil do usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_uuid, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a função quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PARTE 3: Criar novas políticas para tabela users
-- ============================================================

-- Política de SELECT: usuário vê apenas seu próprio registro
CREATE POLICY "users_select_own"
    ON users FOR SELECT
    USING (auth.uid() = user_uuid);

-- Política de INSERT: qualquer usuário autenticado pode criar perfis
CREATE POLICY "users_insert_any_authenticated"
    ON users FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política de UPDATE: usuário atualiza apenas seu próprio registro
CREATE POLICY "users_update_own"
    ON users FOR UPDATE
    USING (auth.uid() = user_uuid)
    WITH CHECK (auth.uid() = user_uuid);

-- ============================================================
-- PARTE 4: Criar novas políticas para company_members
-- ============================================================

-- Política de INSERT: dono da empresa pode adicionar membros
CREATE POLICY "company_members_insert_policy"
    ON company_members FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT c.id
            FROM companies c
            WHERE c.owner_id IN (
                SELECT u.id
                FROM users u
                WHERE u.user_uuid = auth.uid()
            )
        )
    );

-- Política de SELECT: permite visualização (temporariamente aberta para debug)
CREATE POLICY "company_members_select_policy"
    ON company_members FOR SELECT
    USING (true);

-- Política de UPDATE: dono da empresa pode atualizar membros
CREATE POLICY "company_members_update_policy"
    ON company_members FOR UPDATE
    USING (
        company_id IN (
            SELECT c.id
            FROM companies c
            WHERE c.owner_id IN (
                SELECT u.id
                FROM users u
                WHERE u.user_uuid = auth.uid()
            )
        )
    );

-- Política de DELETE: dono da empresa pode remover membros
CREATE POLICY "company_members_delete_policy"
    ON company_members FOR DELETE
    USING (
        company_id IN (
            SELECT c.id
            FROM companies c
            WHERE c.owner_id IN (
                SELECT u.id
                FROM users u
                WHERE u.user_uuid = auth.uid()
            )
        )
    );

-- ============================================================
-- PARTE 5: Verificação
-- ============================================================

-- Verificar políticas de users
SELECT 'users' as tabela, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;

-- Verificar políticas de company_members
SELECT 'company_members' as tabela, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'company_members' 
ORDER BY policyname;

-- Verificar trigger
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================================
-- RESULTADO ESPERADO:
-- ============================================================
-- ✅ users: 3 políticas (users_insert_any_authenticated, users_select_own, users_update_own)
-- ✅ company_members: 4 políticas (delete, insert, select, update)
-- ✅ Trigger: on_auth_user_created (AFTER INSERT on auth.users)
-- ============================================================
