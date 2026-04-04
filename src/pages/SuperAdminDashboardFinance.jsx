import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function SuperAdminDashboardFinance({ onBack }) {
  const { user } = useAuth()
  const [currentTab, setCurrentTab] = useState('finance')
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('month')
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    totalLicenses: 0,
    activeLicenses: 0,
    licensesGrowth: 0,
    avgTicket: 0,
  })

  const [revenueChartData, setRevenueChartData] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [topCompanies, setTopCompanies] = useState([])

  useEffect(() => {
    loadFinanceData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  async function loadFinanceData() {
    try {
      setLoading(true)

      // Buscar todos os pedidos (para o painel admin)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          company:companies(fantasy_name, corporate_email),
          items:order_items(*)
        `)
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Erro ao buscar orders:', ordersError)
        setLoading(false)
        return
      }

      if (ordersData && ordersData.length > 0) {
        // Métricas baseadas apenas em pedidos pagos
        const paidOrders = ordersData.filter(o => o.payment_status === 'paid')
        const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total_cents, 0)
        const totalOrders = paidOrders.length

        // Calcular receita do mês atual
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthlyOrders = ordersData.filter(order =>
          new Date(order.created_at) >= firstDayOfMonth
        )
        const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total_cents, 0)

        // Calcular licenças ativas
        const { data: licensesData } = await supabase
          .from('licenses')
          .select('status')
          .in('status', ['assigned', 'in_progress'])

        const activeLicenses = licensesData?.length || 0
        const totalLicenses = ordersData.reduce((sum, order) => {
          const orderLicenses = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
          return sum + orderLicenses
        }, 0)

        // Ticket médio
        const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

        // Crescimento simulado (comparar com mês anterior)
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthOrders = ordersData.filter(order => {
          const orderDate = new Date(order.created_at)
          return orderDate >= lastMonth && orderDate < firstDayOfMonth
        })
        const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total_cents, 0)
        const revenueGrowth = lastMonthRevenue > 0
          ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          : 0

        setStats({
          totalRevenue,
          monthlyRevenue,
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
          totalOrders,
          ordersGrowth: 12.5,
          totalLicenses,
          activeLicenses,
          licensesGrowth: 8.3,
          avgTicket,
        })

        // Dados para gráfico de receita (últimos 6 meses)
        const monthlyData = []
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

          const monthOrders = ordersData.filter(order => {
            const orderDate = new Date(order.created_at)
            return orderDate >= monthStart && orderDate <= monthEnd
          })

          const monthRevenue = monthOrders.reduce((sum, order) => sum + order.total_cents, 0)

          monthlyData.push({
            month: monthStart.toLocaleString('pt-BR', { month: 'short' }),
            revenue: monthRevenue,
          })
        }
        setRevenueChartData(monthlyData)

        // Pedidos recentes (top 5)
        setRecentOrders(ordersData.slice(0, 5))

        // Top empresas por receita
        const companyRevenue = {}
        ordersData.forEach(order => {
          const companyId = order.company_id
          if (!companyRevenue[companyId]) {
            companyRevenue[companyId] = {
              company_name: order.company?.fantasy_name || 'N/A',
              total: 0,
              orders: 0,
            }
          }
          companyRevenue[companyId].total += order.total_cents
          companyRevenue[companyId].orders += 1
        })

        const topCompaniesList = Object.entries(companyRevenue)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 5)
          .map(([id, data]) => ({ id, ...data }))

        setTopCompanies(topCompaniesList)
      }

      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err)
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
        loadFinanceData() // Recarregar dados
      } else {
        alert('Erro ao confirmar pagamento: ' + (data?.error || 'Erro desconhecido'))
      }
    } catch (err) {
      console.error('Erro ao confirmar pagamento:', err)
      alert('Erro ao processar pagamento: ' + err.message)
    }
  }

  function formatCurrency(valueInCents) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valueInCents / 100)
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  function getStatusBadge(status) {
    const map = {
      paid:      { label: 'Pago',      cls: 'bg-emerald-100 text-emerald-700' },
      approved:  { label: 'Aprovado',  cls: 'bg-primary-fixed text-on-primary-fixed-variant' },
      pending:   { label: 'Pendente',  cls: 'bg-amber-100 text-amber-700' },
      overdue:   { label: 'Vencido',   cls: 'bg-red-100 text-red-700' },
      cancelled: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-500' },
      processing: { label: 'Processando', cls: 'bg-secondary-fixed text-on-secondary-fixed-variant' },
      completed: { label: 'Concluído', cls: 'bg-emerald-100 text-emerald-700' },
    }
    const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-500' }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>
        {s.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</span>
          <p className="mt-4 text-on-surface-variant">Carregando dados financeiros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pt-6 px-6 pb-12">
        {/* Page Header - Compacto */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-primary">
              Painel Financeiro Global
            </h2>
            <p className="text-sm text-on-surface-variant font-body mt-1">
              Análise de receita, pedidos e performance financeira da plataforma.
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-2 bg-surface-container-low p-1 rounded-xl">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                timeRange === 'week'
                  ? 'bg-white shadow-sm text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                timeRange === 'month'
                  ? 'bg-white shadow-sm text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setTimeRange('quarter')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                timeRange === 'quarter'
                  ? 'bg-white shadow-sm text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Trimestre
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                timeRange === 'year'
                  ? 'bg-white shadow-sm text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Ano
            </button>
          </div>
        </div>

        {/* Bento Stats Grid - Espaçamento reduzido */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          {/* Total Revenue Card */}
          <div className="col-span-12 md:col-span-4 bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border border-transparent">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <span className={`flex items-center text-sm font-bold ${
                stats.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}%
                <span className="material-symbols-outlined text-sm ml-1">
                  {stats.revenueGrowth >= 0 ? 'arrow_upward' : 'arrow_downward'}
                </span>
              </span>
            </div>
            <h3 className="text-slate-500 font-label text-xs uppercase tracking-widest font-semibold mb-1">
              Receita Total
            </h3>
            <p className="text-3xl font-extrabold text-primary font-headline tracking-tighter">
              {formatCurrency(stats.totalRevenue)}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              {formatCurrency(stats.monthlyRevenue)} este mês
            </p>
          </div>

          {/* Total Orders Card */}
          <div className="col-span-12 md:col-span-4 bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border border-transparent">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                <span className="material-symbols-outlined">shopping_cart</span>
              </div>
              <span className="text-emerald-600 flex items-center text-sm font-bold">
                +{stats.ordersGrowth}%
                <span className="material-symbols-outlined text-sm">arrow_upward</span>
              </span>
            </div>
            <h3 className="text-slate-500 font-label text-xs uppercase tracking-widest font-semibold mb-1">
              Pedidos Pagos
            </h3>
            <p className="text-3xl font-extrabold text-primary font-headline tracking-tighter">
              {formatNumber(stats.totalOrders)}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Ticket médio: {formatCurrency(stats.avgTicket)}
            </p>
          </div>

          {/* Active Licenses Card */}
          <div className="col-span-12 md:col-span-4 bg-primary-container p-6 rounded-xl text-white relative overflow-hidden">
            {/* Abstract Texture BG */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
                <path d="M0 100 C 20 0 50 0 100 100" fill="transparent" stroke="white" strokeWidth="0.5" />
                <path d="M0 80 C 30 20 60 20 100 80" fill="transparent" stroke="white" strokeWidth="0.5" />
              </svg>
            </div>
            
            <div className="relative z-10 flex justify-between h-full">
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-on-primary-container font-label text-xs uppercase tracking-widest font-semibold mb-1">
                    Licenças Ativas
                  </h3>
                  <p className="text-4xl font-black font-headline tracking-tighter">
                    {formatNumber(stats.activeLicenses)}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex-1">
                    <div className="text-xs text-on-primary-container mb-1">
                      Total de licenças vendidas
                    </div>
                    <div className="text-lg font-bold">
                      {formatNumber(stats.totalLicenses)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-on-primary-container mb-1">
                      Crescimento
                    </div>
                    <div className="text-lg font-bold text-emerald-300">
                      +{stats.licensesGrowth}%
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Visual Chart */}
              <div className="w-32 flex items-end ml-6">
                <div className="flex items-end gap-1 w-full h-24">
                  {[30, 45, 25, 60, 85, 100].map((height, i) => (
                    <div
                      key={i}
                      className="w-full bg-white/40 rounded-t-sm transition-all"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Espaçamento reduzido */}
        <div className="grid grid-cols-12 gap-6">
          {/* Recent Orders Table */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] overflow-hidden">
              <div className="px-6 py-6 flex justify-between items-center bg-white">
                <div>
                  <h3 className="text-lg font-bold text-primary">Pedidos Recentes</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Total: {recentOrders.length} pedido(s)</p>
                </div>
                <button className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                  Ver todos
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low">
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label">
                        Empresa
                      </th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label">
                        Data
                      </th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label">
                        Itens
                      </th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label">
                        Licenças
                      </th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label">
                        Status
                      </th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label text-right">
                        Valor
                      </th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label text-center">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => {
                        const totalItems = order.items?.length || 0
                        const totalLicenses = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
                        
                        return (
                          <tr key={order.id} className="hover:bg-surface-container-low/50 transition-colors">
                            <td className="px-6 py-5">
                              <div>
                                <p className="text-sm font-bold text-primary">
                                  {order.company?.fantasy_name || 'N/A'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {order.company?.corporate_email}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-sm text-slate-500">
                              {new Date(order.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-sm font-medium text-slate-700">
                                {totalItems} curso(s)
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                {totalLicenses}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              {getStatusBadge(order.payment_status)}
                            </td>
                            <td className="px-6 py-5 text-right">
                              <span className="text-sm font-bold text-primary">
                                {formatCurrency(order.total_cents)}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              {/* Botão para confirmar pagamento (apenas para pedidos pendentes) */}
                              {order.payment_status === 'pending' && (
                                <button
                                  onClick={() => handleConfirmPayment(order.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors inline-flex items-center justify-center"
                                  title="Confirmar Pagamento"
                                >
                                  <span className="material-symbols-outlined text-lg">payment</span>
                                </button>
                              )}
                              {/* Mostrar ícone de check se já pago */}
                              {order.payment_status === 'paid' && (
                                <span className="p-2 text-green-500 inline-flex items-center justify-center" title="Pago">
                                  <span className="material-symbols-outlined text-lg">check_circle</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
                            <p className="text-sm font-medium text-slate-400">Nenhum pedido encontrado</p>
                            <p className="text-xs text-slate-300">Os pedidos aparecerão aqui</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Revenue Growth Chart */}
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border border-transparent">
              <h3 className="text-lg font-bold text-primary mb-6">
                Crescimento de Receita
              </h3>
              
              <div className="space-y-6">
                {/* Monthly Progress */}
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Meta Mensal
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black inline-block text-primary">
                        78%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-surface-container-highest">
                    <div
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                      style={{ width: '78%' }}
                    />
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="h-32 flex items-end justify-between px-2 gap-2">
                  {revenueChartData.map((data, i) => {
                    const maxRevenue = Math.max(...revenueChartData.map(d => d.revenue))
                    const heightPercent = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0
                    
                    return (
                      <div key={i} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-full rounded-full transition-all ${
                            i === revenueChartData.length - 1
                              ? 'bg-primary'
                              : i >= revenueChartData.length - 3
                              ? 'bg-primary-container'
                              : 'bg-primary-fixed'
                          }`}
                          style={{ height: `${Math.max(heightPercent, 10)}%` }}
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-2">
                          {data.month}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Top Companies */}
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border border-transparent">
              <h3 className="text-lg font-bold text-primary mb-4">
                Top Empresas
              </h3>
              
              <div className="space-y-4">
                {topCompanies.map((company, index) => (
                  <div key={company.id} className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-primary">
                        {company.company_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {company.orders} pedido(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">
                        {formatCurrency(company.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest border border-slate-100 rounded-lg">
                Ver Ranking Completo
              </button>
            </div>
          </div>
        </div>
    </div>
  )
}

export default SuperAdminDashboardFinance
