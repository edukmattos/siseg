-- ============================================================
-- FUNÇÃO RPC: Criar pedido com bypass do RLS
-- Solução temporária enquanto o RLS não é corrigido
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_order_with_items(
    p_company_id INT,
    p_user_id INT,
    p_total_cents INT,
    p_items JSONB,
    p_discount_cents INT DEFAULT 0,
    p_payment_method VARCHAR DEFAULT 'credit_card',
    p_due_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id INT;
    v_item JSONB;
BEGIN
    -- 1. Criar pedido
    INSERT INTO orders (
        company_id,
        user_id,
        status,
        total_cents,
        discount_cents,
        payment_method,
        payment_status,
        due_date
    ) VALUES (
        p_company_id,
        p_user_id,
        'pending',
        p_total_cents,
        p_discount_cents,
        p_payment_method,
        'pending',
        COALESCE(p_due_date, NOW() + INTERVAL '7 days')
    )
    RETURNING id INTO v_order_id;

    -- 2. Inserir itens do pedido
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id,
            course_id,
            quantity,
            unit_price_cents,
            total_cents
        ) VALUES (
            v_order_id,
            NULLIF((v_item->>'course_id')::INT, 0),  -- Permite NULL se course_id for 0 ou null
            COALESCE((v_item->>'quantity')::INT, 1),
            (v_item->>'unit_price_cents')::INT,
            (v_item->>'total_cents')::INT
        );
    END LOOP;

    -- 3. Retornar resultado
    RETURN json_build_object(
        'success', true,
        'order_id', v_order_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.create_order_with_items TO authenticated;

-- Verificar
SELECT routine_name, routine_type, security_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_order_with_items';
