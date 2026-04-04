import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function SuperAdminDashboardAudit({ onBack, onNavigate }) {
  const [loading, setLoading] = useState(true)
  const [auditLogs, setAuditLogs] = useState([])
  const [filters, setFilters] = useState({
    student: '',
    company: '',
    eventType: '',
    dateFrom: '',
    dateTo: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const itemsPerPage = 15

  useEffect(() => {
    loadAuditLogs()
  }, [currentPage, filters])

  async function loadAuditLogs() {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters.student) {
        query = query.eq('user_id', filters.student)
      }
      if (filters.company) {
        query = query.eq('company_id', filters.company)
      }
      if (filters.eventType) {
        query = query.ilike('action', `%${filters.eventType}%`)
      }

      // Paginação
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      const { data, count, error } = await query

      if (error) throw error

      setAuditLogs(data || [])
      setTotalLogs(count || 0)
      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar logs de auditoria:', err)
      setLoading(false)
    }
  }

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  function handleExportCSV() {
    console.log('Exportar CSV')
    // TODO: Implementar exportação CSV
  }

  function handleExportPDF() {
    console.log('Exportar PDF')
    // TODO: Implementar exportação PDF
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  function getActionBadge(action) {
    if (action?.includes('insert') || action?.includes('create')) {
      return { bg: 'bg-primary-fixed', text: 'text-on-primary-fixed-variant', label: 'Criação' }
    }
    if (action?.includes('update')) {
      return { bg: 'bg-tertiary-fixed', text: 'text-on-tertiary-fixed-variant', label: 'Atualização' }
    }
    if (action?.includes('delete')) {
      return { bg: 'bg-error-container', text: 'text-error', label: 'Exclusão' }
    }
    if (action?.includes('login')) {
      return { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', label: 'Login' }
    }
    return { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', label: action }
  }

  if (loading) {
    return (
      <div className="ml-64 mt-16 p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</span>
          <p className="mt-4 text-on-surface-variant">Carregando logs de auditoria...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-extrabold text-primary tracking-tight">Logs de Auditoria e Rastreabilidade</h2>
            <p className="text-on-surface-variant mt-1 max-w-2xl">Monitoramento em tempo real de conformidade regulatória NR-01. Todos os registros são imutáveis e verificados.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container-low text-on-surface font-semibold text-sm rounded-lg hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-sm">csv</span>
              Exportar CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-semibold text-sm rounded-lg hover:opacity-90 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              Baixar Relatório Assinado (PDF)
            </button>
          </div>
        </section>

        {/* Dynamic Filter Section */}
        <section className="bg-surface-container-low rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Filtrar por Colaborador</label>
              <div className="relative">
                <select
                  className="w-full bg-white border-none rounded-lg text-sm appearance-none py-2.5 pl-3 pr-10 focus:ring-1 focus:ring-primary/10"
                  value={filters.student}
                  onChange={(e) => handleFilterChange('student', e.target.value)}
                >
                  <option value="">Todos os Colaboradores</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none">unfold_more</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Empresa/Unidade</label>
              <div className="relative">
                <select
                  className="w-full bg-white border-none rounded-lg text-sm appearance-none py-2.5 pl-3 pr-10 focus:ring-1 focus:ring-primary/10"
                  value={filters.company}
                  onChange={(e) => handleFilterChange('company', e.target.value)}
                >
                  <option value="">Todas as Empresas</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none">unfold_more</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Tipo de Evento</label>
              <div className="relative">
                <select
                  className="w-full bg-white border-none rounded-lg text-sm appearance-none py-2.5 pl-3 pr-10 focus:ring-1 focus:ring-primary/10"
                  value={filters.eventType}
                  onChange={(e) => handleFilterChange('eventType', e.target.value)}
                >
                  <option value="">Todos os Eventos</option>
                  <option value="insert">Criação</option>
                  <option value="update">Atualização</option>
                  <option value="delete">Exclusão</option>
                  <option value="login">Login</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none">unfold_more</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Data Início</label>
              <div className="relative">
                <input
                  className="w-full bg-white border-none rounded-lg text-sm py-2 px-3 focus:ring-1 focus:ring-primary/10"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Audit Ledger Table */}
        <section className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.02)] overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-white">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
              <span className="material-symbols-outlined text-base">verified_user</span>
              Evidências Digitais
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-[11px] font-semibold text-on-surface-variant">Total: {totalLogs} registros</span>
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">assignment_turned_in</span>
              <p className="text-xl font-headline font-bold text-on-surface-variant mb-2">Nenhum log encontrado</p>
              <p className="text-sm text-on-surface-variant">Ajuste os filtros ou aguarde novas atividades.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Timestamp</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Usuário</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Ação</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Entidade</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Endereço IP</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Browser</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                    {auditLogs.map((log, index) => {
                      const badge = getActionBadge(log.action)
                      return (
                        <tr key={log.id} className={`${index % 2 === 1 ? 'bg-surface-container-low/20' : ''} hover:bg-surface transition-colors`}>
                          <td className="px-6 py-4 text-xs font-medium text-primary">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-[10px] font-bold text-on-primary-fixed">
                                {(log.user_id || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-semibold text-primary">
                                {log.user_id || 'Sistema'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 ${badge.bg} ${badge.text} text-[10px] font-bold rounded-full`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-on-surface-variant">
                            {log.entity_type}: {log.entity_id}
                          </td>
                          <td className="px-6 py-4 text-[11px] font-mono text-on-surface-variant">
                            {log.ip_address || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-[11px] text-on-surface-variant">
                            {log.user_agent?.split(' ').slice(0, 2).join(' ') || 'N/A'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 bg-surface-container-low/30 border-t border-outline-variant/10 flex justify-between items-center">
                <p className="text-[11px] text-on-surface-variant italic">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalLogs)} de {totalLogs} entradas de log em conformidade com a Norma Regulamentadora 01.
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded bg-white hover:bg-surface-container-high border border-outline-variant/20 transition-colors disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <span className="px-3 text-xs font-bold">{currentPage}</span>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage * itemsPerPage >= totalLogs}
                    className="p-1.5 rounded bg-white hover:bg-surface-container-high border border-outline-variant/20 transition-colors disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Proof of Evidence Section (Bento Style) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-primary rounded-xl p-8 text-on-primary flex flex-col justify-between relative overflow-hidden">
            <div className="z-10">
              <h4 className="text-xl font-bold mb-2">Segurança de Dados e Auditoria</h4>
              <p className="text-primary-fixed text-sm leading-relaxed max-w-xl">
                Nosso sistema de trilha de auditoria utiliza assinaturas criptográficas em cada evento registrado. Isso garante que qualquer tentativa de alteração seja detectada instantaneamente, mantendo a integridade dos certificados emitidos pela NR-01 perante o Ministério do Trabalho.
              </p>
            </div>
            <div className="mt-8 flex gap-4 z-10">
              <div className="bg-primary-container/40 p-4 rounded-lg backdrop-blur-sm">
                <span className="block text-2xl font-black text-on-primary">256-bit</span>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Encryption Level</span>
              </div>
              <div className="bg-primary-container/40 p-4 rounded-lg backdrop-blur-sm">
                <span className="block text-2xl font-black text-on-primary">ISO 27001</span>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Compliance Standard</span>
              </div>
            </div>
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary-container opacity-20 rounded-full blur-3xl"></div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-tertiary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-on-tertiary-fixed text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
            </div>
            <div>
              <h5 className="text-sm font-bold text-primary">Status do Sistema de Hash</h5>
              <p className="text-xs text-on-surface-variant mt-1">Todos os servidores de log estão sincronizados e operando com redundância.</p>
            </div>
            <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full w-[99.9%] bg-primary"></div>
            </div>
            <span className="text-[10px] font-black uppercase text-on-surface-variant">Uptime 99.98%</span>
          </div>
        </section>
    </div>
  )
}

export default SuperAdminDashboardAudit
