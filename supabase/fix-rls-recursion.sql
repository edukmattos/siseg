-- ============================================================
-- FIX: Infinite recursion detected in policy for relation 'users'
-- 
-- CAUSA: Políticas RLS na tabela 'users' referenciam a própria
-- tabela 'users', causando recursão infinita no PostgreSQL.
--
-- SOLUÇÃO: Usar auth.uid() diretamente nas políticas de 'users'
-- e criar uma função SECURITY DEFINER para consultas em outras
-- tabelas que precisam verificar o role do usuário.
--
-- EXECUTE NO SQL EDITOR DO SUPABASE (Dashboard > SQL Editor)
-- ============================================================


-- ============================================================
-- PASSO 1: Remover TODAS as políticas existentes da tabela users
-- ============================================================

-- Listar políticas atuais para referência:
-- SELECT policyname FROM pg_policies WHERE tablename = 'users';

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    RAISE NOTICE 'Removida política: %', pol.policyname;
  END LOOP;
END;
$$;


-- ============================================================
-- PASSO 2: Criar função auxiliar SECURITY DEFINER
-- Esta função acessa a tabela users sem disparar as políticas RLS,
CREATE OR REPLACE FUNCTION public.get_my_user_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1;
$$;

-- Resetar a propriedade de search_path de uma função existente (previne erros "cannot drop because dependencies")
ALTER FUNCTION public.get_my_user_id() RESET search_path;

-- Garantir que auth anon/authenticated pode chamar a função
GRANT EXECUTE ON FUNCTION public.get_my_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_user_id() TO anon;


-- Função para verificar role sem recursão
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE user_uuid = auth.uid() LIMIT 1;
$$;

ALTER FUNCTION public.get_my_role() RESET search_path;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;


-- ============================================================
-- PASSO 3: Recriar políticas da tabela USERS sem recursão
-- Usa auth.uid() diretamente em vez de fazer sub-query em users
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver o próprio perfil (usa auth.uid() diretamente)
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  USING (user_uuid = auth.uid());

-- Super admin pode ver todos os usuários
-- Usa JWT metadata para evitar recursão (alternativa: ver nota abaixo)
CREATE POLICY "users_select_super_admin"
  ON public.users
  FOR SELECT
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'super_admin'
  );

-- Usuário pode atualizar o próprio perfil
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  USING (user_uuid = auth.uid())
  WITH CHECK (user_uuid = auth.uid());

-- Usuário pode inserir o próprio perfil (durante signup)
CREATE POLICY "users_insert_own"
  ON public.users
  FOR INSERT
  WITH CHECK (user_uuid = auth.uid());

-- Super admin pode fazer tudo (via JWT metadata)
CREATE POLICY "users_all_super_admin"
  ON public.users
  FOR ALL
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'super_admin'
  );


-- ============================================================
-- PASSO 4: Corrigir políticas da tabela ORDERS
-- Usar get_my_user_id() em vez de sub-query direta em users
-- ============================================================

-- Remover políticas antigas de orders
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
    RAISE NOTICE 'Removida política orders: %', pol.policyname;
  END LOOP;
END;
$$;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Empresa pode ver seus próprios pedidos
CREATE POLICY "orders_select_company"
  ON public.orders
  FOR SELECT
  USING (
    company_id IN (
      SELECT c.id FROM public.companies c WHERE c.owner_id = public.get_my_user_id()
    )
    OR
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm
      WHERE cm.user_id = public.get_my_user_id() AND cm.removed_at IS NULL
    )
  );

-- Super admin pode ver todos os pedidos
CREATE POLICY "orders_select_super_admin"
  ON public.orders
  FOR SELECT
  USING (public.get_my_role() = 'super_admin');

-- Empresa pode criar pedidos para si mesma
CREATE POLICY "orders_insert_company"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT c.id FROM public.companies c WHERE c.owner_id = public.get_my_user_id()
    )
  );

-- Super admin pode modificar qualquer pedido
CREATE POLICY "orders_update_super_admin"
  ON public.orders
  FOR UPDATE
  USING (public.get_my_role() = 'super_admin');


-- ============================================================
-- PASSO 5: Corrigir políticas da tabela COMPANIES
-- ============================================================

-- Remover políticas antigas de companies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'companies' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.companies', pol.policyname);
    RAISE NOTICE 'Removida política companies: %', pol.policyname;
  END LOOP;
END;
$$;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Owner pode ver sua empresa
CREATE POLICY "companies_select_owner"
  ON public.companies
  FOR SELECT
  USING (owner_id = public.get_my_user_id());

-- Membros da empresa podem ver a empresa
CREATE POLICY "companies_select_members"
  ON public.companies
  FOR SELECT
  USING (
    id IN (
      SELECT cm.company_id FROM public.company_members cm
      WHERE cm.user_id = public.get_my_user_id() AND cm.removed_at IS NULL
    )
  );

-- Super admin pode ver todas as empresas
CREATE POLICY "companies_select_super_admin"
  ON public.companies
  FOR SELECT
  USING (public.get_my_role() = 'super_admin');

-- Owner pode atualizar sua empresa
CREATE POLICY "companies_update_owner"
  ON public.companies
  FOR UPDATE
  USING (owner_id = public.get_my_user_id())
  WITH CHECK (owner_id = public.get_my_user_id());

-- Super admin pode modificar qualquer empresa
CREATE POLICY "companies_all_super_admin"
  ON public.companies
  FOR ALL
  USING (public.get_my_role() = 'super_admin');

-- Qualquer usuário autenticado pode criar empresa (necessário no signup)
CREATE POLICY "companies_insert_authenticated"
  ON public.companies
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- ============================================================
-- PASSO 6: Verificar resultado final
-- ============================================================

SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('users', 'orders', 'companies')
  AND schemaname = 'public'
ORDER BY tablename, policyname;
