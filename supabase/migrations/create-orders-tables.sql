-- ============================================================================
-- Criação das tabelas: orders e order_items
-- Para gerenciar pedidos de empresas e itens de pedidos (licenças de cursos)
-- ============================================================================

-- ============================================================================
-- Tabela: orders (Pedidos das empresas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  total_amount BIGINT NOT NULL, -- Valor total em centavos
  total_items INTEGER NOT NULL DEFAULT 0,
  total_licenses INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON public.orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ============================================================================
-- Tabela: order_items (Itens do pedido - licenças de cursos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL,
  course_title TEXT NOT NULL,
  course_nr TEXT NOT NULL,
  course_level TEXT,
  course_modality TEXT,
  course_image_url TEXT,
  unit_price BIGINT NOT NULL, -- Preço unitário em centavos
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal BIGINT NOT NULL, -- unit_price * quantity em centavos
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_course_id ON public.order_items(course_id);

-- ============================================================================
-- Trigger: Atualizar updated_at automaticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Função: Gerar número de pedido único
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Formato: OE-YYYYMMDD-XXXX (Ex: OE-20231024-92841)
    new_number := 'OE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    
    SELECT COUNT(*) INTO exists_count FROM public.orders WHERE order_number = new_number;
    
    IF exists_count = 0 THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Política: Empresas podem ver seus próprios pedidos
CREATE POLICY "Companies can view their own orders"
  ON public.orders
  FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- Política: Empresas podem criar seus próprios pedidos
CREATE POLICY "Companies can create their own orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- Política: Super admins podem ver todos os pedidos
CREATE POLICY "Super admins can view all orders"
  ON public.orders
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'super_admin'
    )
  );

-- Política: Super admins podem atualizar pedidos
CREATE POLICY "Super admins can update all orders"
  ON public.orders
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'super_admin'
    )
  );

-- Política: Empresas podem ver itens de seus pedidos
CREATE POLICY "Companies can view their order items"
  ON public.order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
      )
    )
  );

-- Política: Super admins podem ver todos os itens
CREATE POLICY "Super admins can view all order items"
  ON public.order_items
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'super_admin'
    )
  );

-- ============================================================================
-- Comentários nas tabelas
-- ============================================================================
COMMENT ON TABLE public.orders IS 'Pedidos realizados por empresas para aquisição de licenças de cursos';
COMMENT ON TABLE public.order_items IS 'Itens individuais de cada pedido (licenças de cursos)';
COMMENT ON COLUMN public.orders.status IS 'pending: aguardando pagamento, paid: pago, cancelled: cancelado, refunded: reembolsado';
COMMENT ON COLUMN public.orders.total_amount IS 'Valor total do pedido em centavos';
COMMENT ON COLUMN public.orders.total_items IS 'Número total de itens (cursos diferentes) no pedido';
COMMENT ON COLUMN public.orders.total_licenses IS 'Número total de licenças (soma de todas as quantidades) no pedido';
COMMENT ON COLUMN public.order_items.unit_price IS 'Preço unitário do curso em centavos';
COMMENT ON COLUMN public.order_items.subtotal IS 'Subtotal do item (unit_price * quantity) em centavos';

-- ============================================================================
-- Verificação
-- ============================================================================
SELECT 'Tabelas criadas com sucesso!' AS status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items');
