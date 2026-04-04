-- ============================================================
-- RPC: CONFIRMAR PAGAMENTO DO PEDIDO
-- Atualiza payment_status para 'paid' e gera licenças automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION public.confirm_order_payment(
    p_order_id INT,
    p_payment_method VARCHAR DEFAULT 'pix'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_licenses_result JSON;
    v_items_count INT;
BEGIN
    -- Buscar pedido
    SELECT * INTO v_order FROM orders WHERE id = p_order_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Pedido não encontrado');
    END IF;

    -- Verificar se já está pago
    IF v_order.payment_status = 'paid' THEN
        RETURN json_build_object('success', false, 'error', 'Pedido já foi pago');
    END IF;

    -- Verificar se não está cancelado
    IF v_order.payment_status = 'cancelled' THEN
        RETURN json_build_object('success', false, 'error', 'Pedido cancelado não pode ser pago');
    END IF;

    -- Atualizar status do pagamento E status do pedido
    UPDATE orders
    SET
        status = 'approved',
        payment_status = 'paid',
        payment_date = NOW(),
        payment_method = COALESCE(NULLIF(v_order.payment_method, 'pending'), p_payment_method),
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Verificar se existem itens no pedido
    SELECT COUNT(*) INTO v_items_count
    FROM order_items
    WHERE order_id = p_order_id;

    IF v_items_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Pedido não possui itens. Não é possível gerar licenças.',
            'order_id', p_order_id
        );
    END IF;

    -- Gerar licenças automaticamente
    BEGIN
        SELECT public.generate_licenses_for_order(p_order_id, 'LIC') INTO v_licenses_result;
        
        -- Verificar se a geração foi bem sucedida
        IF v_licenses_result->>'success' = 'false' THEN
            RETURN json_build_object(
                'success', true,
                'order_id', p_order_id,
                'payment_status', 'paid',
                'payment_date', NOW(),
                'warning', 'Pagamento confirmado, mas falha ao gerar licenças',
                'licenses_error', v_licenses_result->>'error'
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Se falhar a geração de licenças, ainda retorna sucesso no pagamento
        RETURN json_build_object(
            'success', true,
            'order_id', p_order_id,
            'payment_status', 'paid',
            'payment_date', NOW(),
            'warning', 'Pagamento confirmado, mas erro ao gerar licenças',
            'error_detail', SQLERRM
        );
    END;

    RETURN json_build_object(
        'success', true,
        'order_id', p_order_id,
        'payment_status', 'paid',
        'payment_date', NOW(),
        'licenses', v_licenses_result
    );
END;
$$;

-- ============================================================
-- GARANTIR PERMISSÃO
-- ============================================================
GRANT EXECUTE ON FUNCTION public.confirm_order_payment TO authenticated;

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
SELECT '=== RPC confirm_order_payment criada com sucesso ===' as info;
