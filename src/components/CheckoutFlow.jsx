import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

function CheckoutFlow({ onClose }) {
  const { user, company } = useAuth()
  const { items, totalPrice, clearCart } = useCart()
  const [step, setStep] = useState('review')
  const [loading, setLoading] = useState(false)
  const [orderData, setOrderData] = useState(null)

  function formatPrice(cents) {
    return (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  async function handleCheckout() {
    if (!user?.id || !company?.id) {
      alert('Usuário ou empresa não encontrados. Faça login novamente.')
      return
    }

    setLoading(true)

    try {
      // Calcular totais
      const totalCents = totalPrice
      const discountCents = 0

      // Preparar itens no formato JSONB
      const itemsData = items.map((item) => {
        // Course ID deve ser um número válido (> 0)
        const isValidCourseId = typeof item.id === 'number' && item.id > 0

        if (!isValidCourseId) {
          console.error('❌ Course ID inválido:', item.id, item.title)
        }

        return {
          course_id: isValidCourseId ? item.id : null,
          quantity: item.quantity || 1,
          unit_price_cents: item.priceCents,
          total_cents: item.priceCents * (item.quantity || 1),
        }
      })

      console.log('📦 Items sendo enviados para RPC:', itemsData)

      // Usar função RPC para criar pedido (contorna RLS problemático)
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_order_with_items', {
        p_company_id: company.id,
        p_user_id: user.id,
        p_total_cents: totalCents,
        p_discount_cents: discountCents,
        p_payment_method: 'credit_card',
        p_due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        p_items: itemsData,
      })

      if (rpcError || !rpcResult?.success) {
        console.error('Erro na RPC:', rpcError, rpcResult)
        throw new Error(rpcResult?.error || 'Erro ao criar pedido')
      }

      // Buscar pedido criado para exibir confirmação
      const { data: orderData, error: orderFetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', rpcResult.order_id)
        .single()

      if (orderFetchError) {
        console.warn('Não foi possível buscar o pedido criado:', orderFetchError)
      }

      // Sucesso!
      setOrderData({ order: orderData, items: itemsData })
      clearCart()
      setStep('success')
    } catch (err) {
      console.error('Erro ao criar pedido:', err)
      alert('Erro ao processar pedido: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // STEP: Sucesso
  // ============================================================
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-2">
          <span className="material-symbols-outlined text-4xl text-green-600">
            check_circle
          </span>
        </div>
        
        <div>
          <h3 className="text-2xl font-headline font-extrabold text-primary mb-2">
            Pedido Realizado!
          </h3>
          <p className="text-on-surface-variant mb-2 max-w-sm mx-auto">
            Seu pedido foi criado com sucesso. Aguarde a confirmação do pagamento para receber suas licenças.
          </p>
          {orderData?.order?.order_number && (
            <p className="text-sm font-bold text-primary bg-primary-fixed px-4 py-2 rounded-lg inline-block">
              Pedido: {orderData.order.order_number}
            </p>
          )}
          {orderData?.order?.id && (
            <p className="text-sm font-bold text-primary bg-primary-fixed px-4 py-2 rounded-lg inline-block">
              Pedido: #{orderData.order.id}
            </p>
          )}
        </div>

        {orderData?.order && (
          <div className="w-full bg-surface-container-low rounded-xl p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant">Pedido ID</span>
              <span className="text-sm font-bold text-primary">#{orderData.order.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant">Itens</span>
              <span className="text-sm font-bold text-primary">{orderData.items?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant">Licenças</span>
              <span className="text-sm font-bold text-primary">
                {orderData.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
              </span>
            </div>
            <div className="border-t border-surface-container-high pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-on-surface">Total</span>
              <span className="text-xl font-headline font-extrabold text-primary">
                R$ {formatPrice(orderData.order.total_cents)}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="bg-primary text-white px-8 py-4 rounded-xl font-headline font-bold hover:opacity-90 transition-all w-full"
        >
          Voltar ao Catálogo
        </button>
      </div>
    )
  }

  // ============================================================
  // STEP: Review do Pedido
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Stepper */}
      <nav className="flex items-center justify-between w-full mb-8">
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm mb-2 shadow-lg">
            <span className="material-symbols-outlined text-sm">check</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-primary">
            Cadastro
          </span>
        </div>
        <div className="h-px bg-surface-container-highest flex-grow mx-4 -mt-6" />
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm mb-2 shadow-lg">
            <span className="material-symbols-outlined text-sm">check</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-primary">
            Plano
          </span>
        </div>
        <div className="h-px bg-surface-container-highest flex-grow mx-4 -mt-6" />
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm mb-2 shadow-lg">
            3
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-primary">
            Pagamento
          </span>
        </div>
      </nav>

      <div>
        <h3 className="text-2xl font-headline font-extrabold tracking-tight text-primary">
          Revisão do Pedido
        </h3>
        <p className="text-sm text-on-surface-variant mt-1">
          {user?.full_name} — {company?.fantasy_name}
        </p>
      </div>

      {/* Items */}
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-tighter">
                {item.nr}
              </span>
              <div>
                <p className="text-sm font-headline font-bold text-on-surface truncate max-w-[200px]">
                  {item.title}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {item.quantity}x licença(s)
                </p>
              </div>
            </div>
            <span className="text-sm font-headline font-extrabold text-primary">
              R$ {formatPrice(item.priceCents * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="border-t border-surface-container-high pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">Total</span>
          <span className="text-2xl font-headline font-extrabold text-primary">
            R$ {formatPrice(totalPrice)}
          </span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-primary hover:opacity-90 text-white font-bold py-5 rounded-xl transition-all shadow-[0_20px_40px_rgba(9,20,38,0.1)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              <span>Processando...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">lock</span>
              <span>Confirmar e Pagar</span>
            </>
          )}
        </button>

        <button
          onClick={onClose}
          className="w-full text-sm text-on-surface-variant hover:text-primary transition-colors py-2 font-medium"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default CheckoutFlow
