-- ============================================================================
-- Políticas RLS para a tabela order_items
-- Corrigir erro 403: "new row violates row-level security policy"
-- Corrigir erro: "operator does not exist: integer = uuid"
-- ============================================================================

-- Habilitar RLS na tabela order_items (se ainda não estiver habilitado)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Política: Empresas podem inserir itens em seus próprios pedidos
-- JOIN através da tabela users para converter uuid -> integer
CREATE POLICY "Companies can insert items in their orders"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT o.id 
      FROM public.orders o
      JOIN public.companies c ON o.company_id = c.id
      WHERE c.owner_id IN (
        SELECT u.id FROM public.users u WHERE u.user_uuid = auth.uid()
      )
    )
  );

-- Política: Super admins podem inserir itens em qualquer pedido
CREATE POLICY "Super admins can insert items in any order"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT u.user_uuid FROM public.users u WHERE u.role = 'super_admin'
    )
  );

-- Verificar se as políticas foram criadas
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'order_items';
