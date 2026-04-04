import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import CompanyDashboardLayout from '../components/CompanyDashboardLayout'

function CompanyDashboardOrders({ onBack, useLayout = true }) {
  const { company } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [currentTab, setCurrentTab] = useState('orders')
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({
    monthlySpending: 0,
    growth: '+0%',
    activeLicenses: 0,
    licenseCapacity: 0,
  })

  const itemsPerPage = 5

  // Carregar pedidos do banco
  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company])

  async function loadOrders() {
    if (!company?.id) return

    setLoading(true)
    try {
      // Buscar pedidos da empresa com itens
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            course_id,
            quantity,
            unit_price_cents,
            total_cents
          )
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      setOrders(ordersData || [])

      // Calcular estatísticas
      const paidOrders = ordersData?.filter(o => o.payment_status === 'paid') || []
      const totalLicenses = paidOrders.reduce((sum, order) => {
        const licenses = order.order_items?.reduce((acc, item) => acc + item.quantity, 0) || 0
        return sum + licenses
      }, 0)

      // Calcular crescimento (comparando com mês anterior)
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const currentMonthOrders = paidOrders.filter(o => {
        const orderDate = new Date(o.created_at)
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
      })

      const previousMonthOrders = paidOrders.filter(o => {
        const orderDate = new Date(o.created_at)
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
        return orderDate.getMonth() === prevMonth && orderDate.getFullYear() === prevYear
      })

      const currentMonthSpending = currentMonthOrders.reduce((sum, o) => sum + o.total_cents, 0)
      const previousMonthSpending = previousMonthOrders.reduce((sum, o) => sum + o.total_cents, 0)

      const growthRate = previousMonthSpending > 0
        ? ((currentMonthSpending - previousMonthSpending) / previousMonthSpending * 100).toFixed(1)
        : currentMonthSpending > 0 ? '100' : '0'

      setStats({
        monthlySpending: currentMonthSpending,
        growth: growthRate > 0 ? `+${growthRate}%` : `${growthRate}%`,
        activeLicenses: totalLicenses,
        licenseCapacity: Math.min(100, Math.round((totalLicenses / 1000) * 100)),
      })
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err)
    } finally {
      setLoading(false)
    }
  }

  // Confirmar pagamento manualmente
  async function handleConfirmPayment(orderId) {
    if (!confirm('Confirmar o pagamento deste pedido? As licenças serão geradas automaticamente.')) {
      return
    }

    try {
      const { data, error } = await supabase.rpc('confirm_order_payment', {
        p_order_id: orderId,
      })

      if (error) throw error

      console.log('Resposta da RPC confirm_order_payment:', data) // Debug

      if (data?.success) {
        if (data?.warning) {
          alert('Atenção: ' + data.warning + '\nDetalhe: ' + (data.licenses_error || data.error_detail || 'Erro desconhecido'))
        } else {
          alert('Pagamento confirmado com sucesso! Licenças geradas automaticamente.')
        }
        loadOrders() // Recarregar lista
      } else {
        alert('Erro ao confirmar pagamento: ' + (data?.error || 'Erro desconhecido'))
      }
    } catch (err) {
      console.error('Erro ao confirmar pagamento:', err)
      alert('Erro ao processar pagamento: ' + err.message)
    }
  }

  const filteredOrders = orders.filter(order =>
    String(order.id).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  function getStatusBadge(status) {
    switch (status) {
      case 'approved':
      case 'paid':
        return <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-bold rounded-full">Aprovado</span>
      case 'pending':
        return <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed-variant text-[11px] font-bold rounded-full">Pendente</span>
      case 'overdue':
        return <span className="px-3 py-1 bg-error-container text-on-error-container text-[11px] font-bold rounded-full">Vencido</span>
      case 'cancelled':
        return <span className="px-3 py-1 bg-surface-container-highest text-slate-500 text-[11px] font-bold rounded-full">Cancelado</span>
      case 'processing':
        return <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed-variant text-[11px] font-bold rounded-full">Processando</span>
      case 'completed':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full">Concluído</span>
      default:
        return null
    }
  }

  function formatCurrency(cents) {
    const valueInReais = typeof cents === 'number' ? cents / 100 : cents
    return `R$ ${valueInReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Removido: getItemsBadgeColor não é mais necessário

  const content = (
    <div className="w-full space-y-4 overflow-hidden py-4 pl-0 pr-2">
      {/* Title and Context */}
      <div className="flex justify-between items-end w-full">
        <div>
          <h1 className="text-3xl font-extrabold text-primary font-headline tracking-tight">Histórico de Pedidos</h1>
          <p className="text-slate-500 font-medium mt-1">Gerenciamento centralizado de faturas e licenciamentos NR-01</p>
        </div>
        <div className="flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/20">
          <span className="material-symbols-outlined text-slate-400 text-lg mr-2">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-48 p-0 outline-none"
            placeholder="Buscar pedidos..."
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
          />
        </div>
      </div>

      {/* Hero Summary Section (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {/* Monthly Spending Card */}
        <div className="col-span-1 md:col-span-2 bg-primary-container p-6 rounded-xl text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-on-primary-container text-sm font-semibold uppercase tracking-widest mb-2">Gasto Mensal (Outubro)</p>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-12 w-48 bg-white/20 rounded mb-4"></div>
                <div className="h-4 w-32 bg-white/10 rounded"></div>
              </div>
            ) : (
              <>
                <h2 className="text-5xl font-extrabold font-headline tracking-tighter mb-4">{formatCurrency(stats.monthlySpending)}</h2>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  <span>{stats.growth} em relação ao mês anterior</span>
                </div>
              </>
            )}
          </div>
          {/* Abstract Background Graphic */}
          <div className="absolute right-[-10%] top-[-20%] w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
          <div className="absolute right-4 bottom-4 opacity-20">
            <span className="material-symbols-outlined text-9xl">payments</span>
          </div>
        </div>

        {/* Total Licenses Card */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/10">
          <div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest mb-2">Licenças Ativas</p>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-10 w-24 bg-surface-container-highest rounded mb-4"></div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full"></div>
              </div>
            ) : (
              <>
                <h2 className="text-4xl font-extrabold font-headline text-primary">{stats.activeLicenses}</h2>
                <div className="mt-6 space-y-3">
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full" style={{ width: `${stats.licenseCapacity}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{stats.licenseCapacity}% da capacidade contratada utilizada</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/10 w-full">
        <div className="px-3 py-3 flex justify-between items-center bg-white border-b border-[#c5c6cd]/10">
          <div>
            <h3 className="text-xl font-bold text-primary font-headline">Transações Recentes</h3>
            <p className="text-sm text-slate-500">Relatório detalhado por certificação</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filtrar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
              <span className="material-symbols-outlined text-sm">download</span>
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-3 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">ID do Pedido</th>
                <th className="px-3 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Data da Compra</th>
                <th className="px-3 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Itens / Licenças</th>
                <th className="px-3 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 text-right">Valor Total</th>
                <th className="px-3 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 text-center">Status</th>
                <th className="px-3 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c5c6cd]/10">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-3 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">progress_activity</span>
                      <p className="text-sm text-slate-500">Carregando pedidos...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
                  const totalLicenses = order.order_items?.reduce((acc, item) => acc + item.quantity, 0) || 0
                  const totalItems = order.order_items?.length || 0

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-5 text-sm font-bold text-primary">#{order.id}</td>
                      <td className="px-3 py-5 text-sm text-slate-600">{formatDate(order.created_at)}</td>
                      <td className="px-3 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-primary">{totalItems} item(s)</span>
                          <span className="text-[10px] text-on-surface-variant">{totalLicenses} licença(s)</span>
                        </div>
                      </td>
                      <td className="px-3 py-5 text-sm font-bold text-primary text-right">{formatCurrency(order.total_cents)}</td>
                      <td className="px-3 py-5 text-center">
                        {getStatusBadge(order.payment_status)}
                      </td>
                      <td className="px-3 py-5 text-right">
                        {/* Botão para confirmar pagamento (apenas para pedidos pendentes) */}
                        {order.payment_status === 'pending' && (
                          <button
                            onClick={() => handleConfirmPayment(order.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Confirmar Pagamento"
                          >
                            <span className="material-symbols-outlined">payment</span>
                          </button>
                        )}
                        
                        {/* Botões existentes */}
                        {order.payment_status !== 'cancelled' && (
                          <>
                            <button className="p-2 text-slate-400 hover:text-primary transition-colors" title="Ver detalhes">
                              <span className="material-symbols-outlined">description</span>
                            </button>
                            <button className="p-2 text-slate-400 hover:text-primary transition-colors" title="Download Fatura">
                              <span className="material-symbols-outlined">download</span>
                            </button>
                          </>
                        )}
                        {order.payment_status === 'cancelled' && (
                          <span className="opacity-30 pointer-events-none inline-block">
                            <button className="p-2">
                              <span className="material-symbols-outlined">download</span>
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-3 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                      <p className="text-sm text-slate-500">Nenhum pedido encontrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-3 py-3 bg-surface-container-low border-t border-[#c5c6cd]/10 flex justify-between items-center">
          <p className="text-xs font-medium text-slate-500">
            Mostrando <span className="text-primary font-bold">{((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> de {filteredOrders.length} resultados
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 text-slate-400 hover:bg-white hover:text-primary transition-all disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  currentPage === page
                    ? 'bg-primary text-white'
                    : 'border border-outline-variant/30 text-slate-600 hover:bg-white hover:text-primary'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 text-slate-400 hover:bg-white hover:text-primary transition-all disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Notice Card */}
      <div className="bg-surface-container p-6 rounded-xl border-l-4 border-primary flex items-start gap-4 w-full">
        <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
        <div className="space-y-1">
          <h4 className="font-bold text-primary text-sm font-headline">Manutenção de Registros (Compliance Core)</h4>
          <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
            Em conformidade estrita com a NR-01, todos os comprovantes de treinamento e licenciamentos adquiridos devem ser mantidos em arquivo digital por um período mínimo de 5 anos. Este painel simplificado garante o acesso rápido aos registros para fins de fiscalização e auditoria.
          </p>
        </div>
      </div>
    </div>
  )

  // Se useLayout for true, envolve com o layout
  if (useLayout) {
    return (
      <CompanyDashboardLayout
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        onBack={onBack}
        hideHeader
      >
        {content}
      </CompanyDashboardLayout>
    )
  }

  // Se useLayout for false, retorna apenas o conteúdo
  return content
}

export default CompanyDashboardOrders
