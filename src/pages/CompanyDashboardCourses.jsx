import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import CompanyDashboardLayout from '../components/CompanyDashboardLayout'
import AssignLicenseModal from '../components/AssignLicenseModal'

function CompanyDashboardCourses({ onBack, useLayout = true }) {
  const { company } = useAuth()
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState('courses')
  
  // Modal State
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  
  // Menu State
  const [openMenuId, setOpenMenuId] = useState(null)
  
  // Dados do portfólio
  const [portfolio, setPortfolio] = useState([])
  
  // Dados dos colaboradores
  const [enrollments, setEnrollments] = useState([])
  const [filteredEnrollments, setFilteredEnrollments] = useState([])
  
  // Filtros
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Carregar dados
  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company])

  // Filtrar quando filtros mudam
  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseFilter, statusFilter, enrollments])

  async function loadData() {
    if (!company?.id) return

    setLoading(true)
    try {
      // Buscar licenças da empresa agrupadas por curso
      const { data: licensesData, error: licensesError } = await supabase
        .from('licenses')
        .select(`
          *,
          course:courses(id, title, nr_code, modality, workload_hours)
        `)
        .eq('company_id', company.id)

      if (licensesError) throw licensesError

      // Agrupar licenças por curso
      const coursesMap = {}
      licensesData?.forEach(license => {
        const courseId = license.course_id
        if (!coursesMap[courseId]) {
          coursesMap[courseId] = {
            id: courseId,
            title: license.course?.title || 'N/A',
            nr_code: license.course?.nr_code || 'N/A',
            modality: license.course?.modality || 'online',
            workload_hours: license.course?.workload_hours || 0,
            totalLicenses: 0,
            usedLicenses: 0,
            availableLicenses: 0,
          }
        }
        coursesMap[courseId].totalLicenses++
        if (license.status !== 'available') {
          coursesMap[courseId].usedLicenses++
        } else {
          coursesMap[courseId].availableLicenses++
        }
      })

      const portfolioData = Object.values(coursesMap)
      setPortfolio(portfolioData)

      // Buscar matrículas com dados do usuário e curso
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          user_id,
          course_id,
          company_id,
          license_id,
          status,
          progress_percentage,
          enrolled_at,
          started_at,
          completed_at,
          expires_at,
          last_access_at,
          course:courses(id, title, nr_code),
          license:licenses(id, license_code, status, expires_at, activated_at)
        `)
        .eq('company_id', company.id)
        .order('enrolled_at', { ascending: false })

      if (enrollmentsError) throw enrollmentsError

      // Buscar dados dos usuários vinculados via RPC (contorna RLS)
      const userIds = [...new Set((enrollmentsData || []).map(e => e.user_id).filter(Boolean))]
      let usersMap = {}
      
      if (userIds.length > 0) {
        const { data: membersData, error: membersError } = await supabase.rpc('get_company_members_with_users', {
          p_company_id: company.id
        })
        
        if (!membersError && membersData) {
          usersMap = membersData.reduce((acc, m) => {
            acc[m.user_id] = { full_name: m.user_full_name, email: m.user_email }
            return acc
          }, {})
        }
      }

      // Enriquecer dados das matrículas
      const enrichedEnrollments = (enrollmentsData || []).map((enrollment) => {
        const progress = parseFloat(enrollment.progress_percentage) || 0
        const lastAccess = enrollment.last_access_at || enrollment.enrolled_at
        const userData = usersMap[enrollment.user_id] || {}

        // Determinar status
        let status = 'Em Andamento'
        if (enrollment.status === 'completed') {
          status = 'Concluído'
        } else if (enrollment.expires_at && new Date(enrollment.expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
          status = 'Vencendo em 30 dias'
        } else if (enrollment.status === 'cancelled') {
          status = 'Cancelado'
        }

        return {
          ...enrollment,
          display_name: userData.full_name || 'N/A',
          display_email: userData.email || '',
          display_id: enrollment.user_id,
          progress,
          lastAccess,
          status,
        }
      })

      setEnrollments(enrichedEnrollments)
      setFilteredEnrollments(enrichedEnrollments)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handlers para o Modal
  function handleOpenAssignModal(course) {
    setSelectedCourse(course)
    setShowAssignModal(true)
  }

  function handleAssignSuccess() {
    loadData() // Recarregar dados após vincular
  }

  async function handleRevokeLicense(licenseId, studentName) {
    if (!licenseId) return

    if (!confirm(`Tem certeza que deseja revogar a licença de ${studentName}?\n\nO acesso ao curso será bloqueado imediatamente e a licença ficará disponível para outro Colaborador.`)) {
      return
    }

    try {
      const { data, error } = await supabase.rpc('revoke_license', {
        p_license_id: licenseId
      })

      if (error) throw error

      if (data?.success) {
        alert('Licença revogada com sucesso!')
        loadData() // Recarregar dados
      } else {
        alert('Erro: ' + (data?.error || 'Falha ao revogar.'))
      }
    } catch (err) {
      console.error('Erro ao revogar licença:', err)
      alert('Erro ao processar: ' + err.message)
    }
  }

  function applyFilters() {
    let filtered = [...enrollments]

    if (courseFilter !== 'all') {
      filtered = filtered.filter(e => e.course_id === parseInt(courseFilter))
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter)
    }

    setFilteredEnrollments(filtered)
    setCurrentPage(1)
  }

  function formatLastAccess(dateString) {
    if (!dateString) return 'Nunca'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays} dias atrás`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function getStatusBadgeColor(status) {
    switch (status) {
      case 'Concluído':
        return 'bg-primary-fixed text-on-primary-fixed-variant'
      case 'Em Andamento':
        return 'bg-secondary-fixed text-on-secondary-fixed-variant'
      case 'Vencendo em 30 dias':
        return 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
      case 'Cancelado':
        return 'bg-surface-container-highest text-slate-500'
      default:
        return 'bg-surface-container-highest text-slate-500'
    }
  }

  function getInitials(name) {
    if (!name) return '??'
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }

  function getAvatarColor(index) {
    const colors = ['bg-primary-fixed text-primary', 'bg-tertiary-fixed text-on-tertiary-fixed', 'bg-error-container text-on-error-container', 'bg-secondary-fixed text-on-secondary-fixed']
    return colors[index % colors.length]
  }

  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage)
  const paginatedEnrollments = filteredEnrollments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const content = (
    <div className="w-full pt-6 px-6 pb-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold text-primary tracking-tight font-headline mb-3">
            Gestão de Treinamentos Corporativos
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed font-body">
            Administre o inventário de licenças ativas, vincule novos colaboradores a treinamentos regulatórios e monitore o status de conformidade em tempo real.
          </p>
        </div>
        <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-all scale-100 active:scale-95 shadow-lg whitespace-nowrap">
          <span className="material-symbols-outlined">person_add</span>
          Vincular Novo Colaborador
        </button>
      </div>

      {/* Portfólio Adquirido (Bento Grid Style) */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-primary rounded-full"></div>
          <h2 className="text-xl font-bold font-headline text-primary">Portfólio Adquirido</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface-container-lowest p-6 rounded-xl animate-pulse">
                <div className="h-12 w-12 bg-surface-container-highest rounded-xl mb-6"></div>
                <div className="h-4 bg-surface-container-highest rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-surface-container-highest rounded mb-6 w-1/2"></div>
                <div className="h-2 bg-surface-container-highest rounded-full mb-6"></div>
                <div className="h-10 bg-surface-container-highest rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : portfolio.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portfolio.map((course, index) => {
              const usagePercent = course.totalLicenses > 0 
                ? Math.round((course.usedLicenses / course.totalLicenses) * 100) 
                : 0

              return (
                <div
                  key={course.id}
                  className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border-none group hover:-translate-y-1 transition-transform"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">school</span>
                    </div>
                    <span className="bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
                      {course.nr_code}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-headline mb-2">{course.title}</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Licenças em Uso</span>
                      <span className="font-bold">{course.usedLicenses}/{course.totalLicenses}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-container transition-all"
                        style={{ width: `${usagePercent}%` }}
                      ></div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleOpenAssignModal(course)}
                    className="w-full py-2.5 rounded-lg border border-outline-variant/30 text-primary font-semibold text-sm hover:bg-surface-container-low transition-colors"
                  >
                    Vincular Colaboradores
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-primary-fixed/20 to-surface-container-lowest p-12 rounded-xl border-2 border-dashed border-primary/30 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-primary">menu_book</span>
            </div>
            <h3 className="text-2xl font-headline font-bold text-primary mb-3">Nenhum curso adquirido ainda</h3>
            <p className="text-on-surface-variant mb-6 max-w-md mx-auto leading-relaxed">
              Para gerenciar treinamentos, primeiro é necessário adquirir cursos através do catálogo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <div className="bg-surface-container-low px-6 py-4 rounded-xl border border-outline-variant/20">
                <p className="text-sm text-on-surface-variant mb-2">📋 Passos para começar:</p>
                <ol className="text-xs text-on-surface-variant space-y-1.5 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">1.</span>
                    <span>Acesse o catálogo de cursos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">2.</span>
                    <span>Adicione cursos ao carrinho</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">3.</span>
                    <span>Finalize o pedido</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">4.</span>
                    <span>Confirme o pagamento no Painel Financeiro</span>
                  </li>
                </ol>
              </div>
            </div>
            <button
              onClick={() => onBack?.()}
              className="mt-6 bg-primary text-on-primary px-8 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-all mx-auto"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Voltar ao Catálogo
            </button>
          </div>
        )}
      </section>

      {/* Colaboradores Vinculados Section */}
      <section>
        <div className="bg-surface-container-low rounded-2xl p-1 shadow-sm">
          <div className="bg-surface-container-lowest rounded-2xl p-8">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6">
              <div className="flex items-center gap-3 mr-auto lg:mr-0">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <h2 className="text-xl font-bold font-headline text-primary">Colaboradores Vinculados</h2>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                <div className="flex flex-1 lg:flex-none items-center gap-2 bg-surface p-2 rounded-lg border border-outline-variant/10">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">filter_list</span>
                  <select
                    className="bg-transparent border-none focus:ring-0 text-sm font-medium text-on-surface-variant w-full cursor-pointer"
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                  >
                    <option value="all">Todos os Cursos</option>
                    {portfolio.map(course => (
                      <option key={course.id} value={course.id}>{course.nr_code}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-1 lg:flex-none items-center gap-2 bg-surface p-2 rounded-lg border border-outline-variant/10">
                  <select
                    className="bg-transparent border-none focus:ring-0 text-sm font-medium text-on-surface-variant w-full cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Status: Todos</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Vencendo em 30 dias">Vencendo em 30 dias</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modern Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/80 font-label">
                      Colaborador
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/80 font-label">
                      Treinamento
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/80 font-label">
                      Progresso
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/80 font-label text-center">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/80 font-label">
                      Última Atividade
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/80 font-label"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">progress_activity</span>
                          <p className="text-sm text-slate-500">Carregando colaboradores...</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedEnrollments.length > 0 ? (
                    paginatedEnrollments.map((enrollment, index) => (
                      <tr key={enrollment.id} className="hover:bg-surface transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getAvatarColor(index)}`}>
                              {getInitials(enrollment.display_name)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-on-surface">
                                {enrollment.display_name}
                              </div>
                              <div className="text-[11px] text-on-surface-variant">
                                ID: #{enrollment.display_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm font-semibold">
                            {enrollment.course?.nr_code} {enrollment.course?.title?.split(' ').slice(0, 2).join(' ')}
                          </div>
                          <div className="text-[11px] text-on-surface-variant italic">
                            {enrollment.license?.license_code || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-primary w-8">
                              {enrollment.progress}%
                            </span>
                            <div className="flex-1 h-1 bg-surface-container-highest rounded-full max-w-[100px]">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${enrollment.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusBadgeColor(enrollment.status)}`}>
                            {enrollment.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-on-surface-variant">
                          {formatLastAccess(enrollment.lastAccess)}
                        </td>
                        <td className="px-6 py-5 text-right relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === enrollment.id ? null : enrollment.id)}
                            className="p-2 text-slate-400 hover:text-primary transition-colors rounded-full hover:bg-surface-container-low"
                          >
                            <span className="material-symbols-outlined">more_vert</span>
                          </button>

                          {openMenuId === enrollment.id && (
                            <div className="absolute right-12 top-2 w-48 bg-white rounded-lg shadow-xl border border-outline-variant/10 z-50 overflow-hidden">
                              <button
                                onClick={() => {
                                  alert('Funcionalidade de detalhes em desenvolvimento.')
                                  setOpenMenuId(null)
                                }}
                                className="w-full px-4 py-3 text-sm text-left hover:bg-surface-container-low flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-sm">info</span>
                                Ver Detalhes
                              </button>
                              <button
                                onClick={() => {
                                  handleRevokeLicense(enrollment.license?.id, enrollment.display_name)
                                  setOpenMenuId(null)
                                }}
                                className="w-full px-4 py-3 text-sm text-left text-error hover:bg-error-container/10 flex items-center gap-2 border-t border-outline-variant/10"
                              >
                                <span className="material-symbols-outlined text-sm">person_remove</span>
                                Revogar Licença
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-outline-variant">group_off</span>
                          </div>
                          <p className="text-sm font-bold text-on-surface-variant">Nenhum colaborador vinculado</p>
                          <p className="text-xs text-on-surface-variant/70">Vincule colaboradores aos cursos adquiridos</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredEnrollments.length > 0 && (
              <div className="mt-8 flex justify-between items-center px-6">
                <div className="text-xs text-on-surface-variant">
                  Exibindo <span className="font-bold">{((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredEnrollments.length)}</span> de <span className="font-bold">{filteredEnrollments.length}</span> registros
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:bg-surface-container-low transition-colors disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                        currentPage === page
                          ? 'bg-primary text-on-primary'
                          : 'text-on-surface-variant hover:bg-surface-container-low'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:bg-surface-container-low transition-colors disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )

  // Renderizar o Modal de Vinculação
  const modalComponent = (
    <AssignLicenseModal
      isOpen={showAssignModal}
      onClose={() => setShowAssignModal(false)}
      course={selectedCourse}
      onSuccess={handleAssignSuccess}
    />
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
        {modalComponent}
        {content}
      </CompanyDashboardLayout>
    )
  }

  // Se useLayout for false, retorna apenas o conteúdo
  return (
    <>
      {modalComponent}
      {content}
    </>
  )
}

export default CompanyDashboardCourses
