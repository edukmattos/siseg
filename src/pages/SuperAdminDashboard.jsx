import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SuperAdminLayout from '../components/SuperAdminLayout'
import SuperAdminDashboardInstructors from './SuperAdminDashboardInstructors'
import SuperAdminDashboardAudit from './SuperAdminDashboardAudit'
import SuperAdminDashboardFinance from './SuperAdminDashboardFinance'
import SuperAdminCatalogManagement from './SuperAdminCatalogManagement'
import SuperAdminDashboardCourseDetail from './SuperAdminDashboardCourseDetail'

function SuperAdminDashboard({ onBack }) {
  const { user } = useAuth()
  const [currentTab, setCurrentTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [stats, setStats] = useState({
    companies: 0,
    students: 0,
    certificates: 0,
    courses: 0,
  })
  // eslint-disable-next-line no-unused-vars
  const [pendingCourses, setPendingCourses] = useState([])
  const [recentLogs, setRecentLogs] = useState([])

  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadDashboardData() {
    try {
      // Buscar estatísticas
      const [companiesRes, usersRes, certsRes, coursesRes] = await Promise.all([
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('certificates').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
      ])

      setStats({
        companies: companiesRes.count || 0,
        students: usersRes.count || 0,
        certificates: certsRes.count || 0,
        courses: coursesRes.count || 0,
      })

      // Buscar logs recentes (audit_logs)
      const { data: logsData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentLogs(logsData || [])

      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar dados do Super Admin:', err)
      setLoading(false)
    }
  }

  // eslint-disable-next-line no-unused-vars
  function handleApproveCourse(courseId) {
    console.log('Aprovar curso:', courseId)
    // TODO: Implementar aprovação
  }

  // eslint-disable-next-line no-unused-vars
  function handleRejectCourse(courseId) {
    console.log('Rejeitar curso:', courseId)
    // TODO: Implementar rejeição
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</span>
          <p className="mt-4 text-on-surface-variant">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const isSubPage = currentTab === 'finance' || currentTab === 'instructors' || currentTab === 'audit' || currentTab === 'catalog' || currentTab === 'courseDetail'

  return (
    <SuperAdminLayout
      currentTab={currentTab}
      onNavigate={setCurrentTab}
      onBack={onBack}
      hideHeader={isSubPage}
      fullScreen={isSubPage}
    >
      <div className={isSubPage ? 'w-full' : 'w-full max-w-full overflow-hidden'}>
      {currentTab === 'finance' ? (
        <SuperAdminDashboardFinance onBack={onBack} />
      ) : currentTab === 'instructors' ? (
        <SuperAdminDashboardInstructors onBack={onBack} onNavigate={setCurrentTab} />
      ) : currentTab === 'audit' ? (
        <SuperAdminDashboardAudit onBack={onBack} onNavigate={setCurrentTab} />
      ) : currentTab === 'catalog' ? (
        <SuperAdminCatalogManagement onShowCourseDetails={(course) => { setSelectedCourse(course); setCurrentTab('courseDetail') }} />
      ) : currentTab === 'courseDetail' ? (
        <SuperAdminDashboardCourseDetail
          courseId={selectedCourse?.id}
          onBack={() => setCurrentTab('catalog')}
          onUpdate={() => {
            setCurrentTab('catalog')
            setSelectedCourse(null)
          }}
        />
      ) : (
        <>
          {/* Page Header */}
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-primary mb-1">Painel de Controle</h2>
              <p className="text-on-surface-variant font-body">Monitoramento de conformidade e aprovação de currículos normativos.</p>
            </div>
            <div className="flex gap-2 bg-surface-container-low p-1 rounded-xl">
              <button className="px-4 py-2 bg-white shadow-sm rounded-lg text-sm font-bold text-primary">Hoje</button>
              <button className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Semana</button>
              <button className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Mês</button>
            </div>
          </div>

        {/* Bento Stats Grid */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          {/* Empresas Ativas */}
          <div className="col-span-12 md:col-span-3 bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border border-transparent">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                <span className="material-symbols-outlined">domain</span>
              </div>
              <span className="text-emerald-600 flex items-center text-sm font-bold">
                +12% <span className="material-symbols-outlined text-sm">arrow_upward</span>
              </span>
            </div>
            <h3 className="text-slate-500 font-label text-xs uppercase tracking-widest font-semibold mb-1">Empresas Ativas</h3>
            <p className="text-3xl font-extrabold text-primary font-headline tracking-tighter">{stats.companies.toLocaleString('pt-BR')}</p>
          </div>

          {/* Colaboradores */}
          <div className="col-span-12 md:col-span-3 bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border border-transparent">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                <span className="material-symbols-outlined">school</span>
              </div>
              <span className="text-emerald-600 flex items-center text-sm font-bold">
                +8% <span className="material-symbols-outlined text-sm">arrow_upward</span>
              </span>
            </div>
            <h3 className="text-slate-500 font-label text-xs uppercase tracking-widest font-semibold mb-1">Colaboradores Matriculados</h3>
            <p className="text-3xl font-extrabold text-primary font-headline tracking-tighter">{stats.students.toLocaleString('pt-BR')}</p>
          </div>

          {/* Certificados Emitidos */}
          <div className="col-span-12 md:col-span-6 bg-primary-container p-6 rounded-xl text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
                <path d="M0 100 C 20 0 50 0 100 100" fill="transparent" stroke="white" strokeWidth="0.5" />
                <path d="M0 80 C 30 20 60 20 100 80" fill="transparent" stroke="white" strokeWidth="0.5" />
              </svg>
            </div>
            <div className="relative z-10 flex justify-between h-full">
              <div className="flex flex-col justify-between">
                <div>
                  <h3 className="text-on-primary-container font-label text-xs uppercase tracking-widest font-semibold mb-1">Certificados Emitidos (MTD)</h3>
                  <p className="text-4xl font-black font-headline tracking-tighter">{stats.certificates.toLocaleString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <span className="text-xs text-on-primary-container">Total de certificados válidos na plataforma</span>
                </div>
              </div>
              <div className="w-48 flex items-end">
                <div className="flex items-end gap-1 w-full h-24">
                  <div className="w-full bg-blue-400/20 h-[30%] rounded-t-sm"></div>
                  <div className="w-full bg-blue-400/30 h-[45%] rounded-t-sm"></div>
                  <div className="w-full bg-blue-400/40 h-[25%] rounded-t-sm"></div>
                  <div className="w-full bg-blue-400/60 h-[60%] rounded-t-sm"></div>
                  <div className="w-full bg-blue-400/80 h-[85%] rounded-t-sm"></div>
                  <div className="w-full bg-blue-400 h-[100%] rounded-t-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-12 gap-8">
          {/* Cursos e Atividades Recentes */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] overflow-hidden">
              <div className="px-6 py-6 flex justify-between items-center bg-white">
                <h3 className="text-lg font-bold text-primary">Cursos Cadastrados</h3>
                <div className="flex items-center gap-2">
                  <select className="text-xs font-semibold bg-surface-container-low border-none rounded-lg px-3 py-2 text-on-surface-variant focus:ring-primary">
                    <option>Todos os Status</option>
                    <option>Ativos</option>
                    <option>Inativos</option>
                  </select>
                  <button className="p-2 bg-surface-container-low rounded-lg text-slate-500 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">filter_list</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low">
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label">Nome do Curso / NR</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label">Carga Horária</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label">Modalidade</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label">Status</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed font-bold text-xs">
                            NR10
                          </div>
                          <div>
                            <p className="text-sm font-bold text-primary">Segurança em Eletricidade</p>
                            <p className="text-xs text-slate-500">Reciclagem Bienal</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500">40 horas</td>
                      <td className="px-6 py-5 text-sm text-slate-500">Online</td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          Ativo
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 hover:bg-surface-container-high text-slate-400 rounded-lg transition-colors" title="Editar">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button className="p-2 hover:bg-surface-container-high text-slate-400 rounded-lg transition-colors" title="Ver Detalhes">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold text-xs">
                            NR35
                          </div>
                          <div>
                            <p className="text-sm font-bold text-primary">Trabalho em Altura</p>
                            <p className="text-xs text-slate-500">Formação Básica</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500">8 horas</td>
                      <td className="px-6 py-5 text-sm text-slate-500">Híbrido</td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          Ativo
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 hover:bg-surface-container-high text-slate-400 rounded-lg transition-colors" title="Editar">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button className="p-2 hover:bg-surface-container-high text-slate-400 rounded-lg transition-colors" title="Ver Detalhes">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold text-xs">
                            NR33
                          </div>
                          <div>
                            <p className="text-sm font-bold text-primary">Espaço Confinado</p>
                            <p className="text-xs text-slate-500">Supervisor de Entrada</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500">16 horas</td>
                      <td className="px-6 py-5 text-sm text-slate-500">Presencial</td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                          Pendente
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" title="Aprovar">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                          </button>
                          <button className="p-2 hover:bg-error-container text-error rounded-lg transition-colors" title="Rejeitar">
                            <span className="material-symbols-outlined text-lg">cancel</span>
                          </button>
                          <button className="p-2 hover:bg-surface-container-high text-slate-400 rounded-lg transition-colors" title="Ver Detalhes">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-white border-t border-slate-50 flex justify-center">
                <button className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                  Ver todos os cursos
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Analytics & Logs */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Crescimento de Emissões */}
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border border-transparent">
              <h3 className="text-lg font-bold text-primary mb-6">Crescimento de Emissões</h3>
              <div className="space-y-6">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meta Trimestral</div>
                    <div className="text-right">
                      <span className="text-xs font-black inline-block text-primary">82%</span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-surface-container-highest">
                    <div className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary" style={{ width: '82%' }}></div>
                  </div>
                </div>
                <div className="h-32 flex items-end justify-between px-2">
                  <div className="w-3 bg-surface-container-low h-[40%] rounded-full"></div>
                  <div className="w-3 bg-surface-container-low h-[55%] rounded-full"></div>
                  <div className="w-3 bg-primary-fixed h-[70%] rounded-full"></div>
                  <div className="w-3 bg-primary h-[90%] rounded-full"></div>
                  <div className="w-3 bg-primary h-[85%] rounded-full"></div>
                  <div className="w-3 bg-primary-container h-[100%] rounded-full"></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase px-1">
                  <span>Mai</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Ago</span>
                  <span>Set</span>
                  <span>Out</span>
                </div>
              </div>
            </div>

            {/* Logs Recentes */}
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border border-transparent">
              <h3 className="text-lg font-bold text-primary mb-4">Logs Recentes</h3>
              <div className="space-y-4">
                {recentLogs.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum log recente</p>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="flex gap-4">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        log.action?.includes('insert') ? 'bg-emerald-500' :
                        log.action?.includes('update') ? 'bg-blue-500' :
                        log.action?.includes('delete') ? 'bg-error' : 'bg-slate-400'
                      }`}></div>
                      <div>
                        <p className="text-sm font-bold text-primary">{log.action}</p>
                        <p className="text-xs text-slate-500">{log.entity_type}: {log.entity_id}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button className="w-full mt-6 py-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest border border-slate-100 rounded-lg">
                Ver Todos os Logs
              </button>
            </div>
          </div>
        </div>
        </>
      )}
      </div>
    </SuperAdminLayout>
  )
}

export default SuperAdminDashboard
