import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import StudentDashboardMenuSide from '../components/StudentDashboardMenuSide'
import CoursePlayer from '../components/CoursePlayer'

function StudentDashboard({ onBack, onShowSettings }) {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [activeCourse, setActiveCourse] = useState(null)
  const [activeEnrollment, setActiveEnrollment] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [certificates, setCertificates] = useState([])
  const [stats, setStats] = useState({
    completed: 0,
    inProgress: 0,
    expiringSoon: 0,
    timeInvested: 0,
    efficiencyRate: 0,
  })
  const [weeklyActivity] = useState([40, 60, 90, 50, 75, 30, 85]) // Percentuais de atividade semanal

  useEffect(() => {
    loadStudentData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadStudentData() {
    if (!user?.id) return

    try {
      // Buscar matrículas do Colaborador
      const { data: enrollmentsData, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(
            id, title, nr_code, level, modality, workload_hours, image_url
          )
        `)
        .eq('user_id', user.id)

      if (enrollError) throw enrollError

      setEnrollments(enrollmentsData || [])

      // Calcular estatísticas
      const completed = enrollmentsData?.filter(e => e.status === 'completed').length || 0
      const inProgress = enrollmentsData?.filter(e => e.status === 'in_progress' || e.status === 'active').length || 0

      // Calcular tempo investido (soma das horas dos cursos em andamento)
      const timeInvested = enrollmentsData?.reduce((acc, curr) => {
        const hours = curr.course?.workload_hours || 0
        const progress = curr.progress_percentage || 0
        return acc + (hours * progress / 100)
      }, 0) || 0

      // Calcular taxa de eficiência (média de progresso dos cursos ativos)
      const activeEnrollments = enrollmentsData?.filter(e => 
        e.status === 'in_progress' || e.status === 'active'
      ) || []
      const efficiencyRate = activeEnrollments.length > 0
        ? Math.round(activeEnrollments.reduce((acc, curr) => acc + (curr.progress_percentage || 0), 0) / activeEnrollments.length)
        : 0

      // Verificar certificados próximos da expiração
      const { data: certsData, error: certError } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)

      if (!certError) {
        setCertificates(certsData || [])

        // Verificar expiração nos próximos 30 dias
        const now = new Date()
        const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        const expiring = certsData?.filter(c => {
          if (!c.expiry_date) return false
          const expiry = new Date(c.expiry_date)
          return expiry <= thirtyDays && expiry >= now
        }).length || 0

        setStats({
          completed,
          inProgress,
          expiringSoon: expiring,
          timeInvested: Math.round(timeInvested * 10) / 10,
          efficiencyRate,
        })
      }
    } catch (err) {
      console.error('Erro ao carregar dados do Colaborador:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleContinueLearning(enrollment) {
    setActiveCourse(enrollment.course)
    setActiveEnrollment(enrollment)
  }

  function handleClosePlayer() {
    setActiveCourse(null)
    setActiveEnrollment(null)
  }

  function handleDownloadCertificate(cert) {
    // TODO: Download do PDF
    console.log('Baixar certificado:', cert.certificate_code)
  }

  function handleNavigate(tab) {
    if (tab === 'settings') {
      // Navegar para página de configurações
      if (onShowSettings) {
        onShowSettings()
      }
    } else {
      setCurrentTab(tab)
    }
  }

  if (activeCourse) {
    return <CoursePlayer course={activeCourse} enrollment={activeEnrollment} onBack={handleClosePlayer} />
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

  return (
    <div className="min-h-screen bg-surface">
      {/* Navbar do Dashboard */}
      <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] px-8 h-16 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold font-headline tracking-tight text-primary">
            Occupational Excellence
          </span>
        </div>
        <div className="flex items-center gap-4 border-l border-outline-variant/20 pl-6">
          <button className="relative">
            <span className="material-symbols-outlined text-slate-900">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border border-white"></span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-sm">person</span>
            </div>
            <div className="text-right hidden lg:block">
              <p className="text-sm font-bold text-primary">{user?.full_name}</p>
              <p className="text-xs text-on-surface-variant">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-xl hover:bg-surface-container transition-colors"
              title="Sair"
            >
              <span className="material-symbols-outlined text-on-surface-variant">logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <StudentDashboardMenuSide
        onNavigate={handleNavigate}
        currentTab={currentTab}
        onBack={onBack}
      />

      {/* Main Content */}
      <main className="md:pl-64 pt-16 min-h-screen">
        <div className="w-full px-4 py-6">
          {/* Hero Section */}
          <header className="mb-12 relative overflow-hidden bg-primary-container p-10 rounded-2xl">
            <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
              <span className="material-symbols-outlined text-[200px] absolute -right-20 -top-10" style={{ fontVariationSettings: "'FILL' 1" }}>
                security
              </span>
            </div>
            <div className="relative z-10">
              <h1 className="text-4xl font-headline font-extrabold text-white mb-3 tracking-tight">
                Bem-vindo, {user?.full_name?.split(' ')[0]}!
              </h1>
              <p className="text-on-primary-container text-lg max-w-2xl">
                Você tem <span className="text-white font-bold">{stats.inProgress} cursos</span> em andamento e{' '}
                <span className="text-white font-bold">{certificates.length} certificados</span> válidos. Mantenha-se atualizado com as normas de segurança mais recentes.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-10">
            {/* Summary Cards - 3 colunas */}
            <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_4px_20px_rgba(9,20,38,0.02)] border border-outline-variant/5">
                <span className="material-symbols-outlined text-primary mb-4 block" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>
                  task_alt
                </span>
                <div className="text-3xl font-headline font-extrabold text-primary">{String(stats.completed).padStart(2, '0')}</div>
                <div className="text-sm text-on-surface-variant font-medium">Cursos Concluídos</div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_4px_20px_rgba(9,20,38,0.02)] border border-outline-variant/5">
                <span className="material-symbols-outlined text-on-secondary-container mb-4 block" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>
                  pending
                </span>
                <div className="text-3xl font-headline font-extrabold text-primary">{String(stats.inProgress).padStart(2, '0')}</div>
                <div className="text-sm text-on-surface-variant font-medium">Em Andamento</div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_4px_20px_rgba(9,20,38,0.02)] border border-outline-variant/5">
                <span className="material-symbols-outlined text-error mb-4 block" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>
                  history_toggle_off
                </span>
                <div className="text-3xl font-headline font-extrabold text-error">{String(stats.expiringSoon).padStart(2, '0')}</div>
                <div className="text-sm text-on-surface-variant font-medium">Expirando em Breve</div>
              </div>
            </div>

            {/* Learning Stats - 1 coluna */}
            <div className="xl:col-span-1 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
              <h3 className="font-extrabold text-primary mb-6">Atividade Mensal</h3>
              <div className="space-y-6">
                <div className="flex items-end gap-2 h-32 justify-between px-2">
                  {weeklyActivity.map((height, index) => (
                    <div
                      key={index}
                      className={`w-4 rounded-t-full ${index === 2 ? 'bg-primary' : 'bg-primary-fixed'}`}
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-on-surface-variant px-1 uppercase">
                  <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span>
                </div>
                <div className="pt-4 border-t border-outline-variant/5 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Tempo Investido</span>
                    <span className="font-bold text-primary">{stats.timeInvested} hrs</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Taxa de Eficiência</span>
                    <span className="font-bold text-primary">{stats.efficiencyRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* My Learning Path - 2 colunas */}
            <div className="xl:col-span-2">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-headline font-extrabold tracking-tight text-primary">Meus Treinamentos</h2>
                  {enrollments.length > 0 && (
                    <button className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                      Ver todos <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  )}
                </div>

                {enrollments.length === 0 ? (
                  <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant/10">
                    <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">school</span>
                    <p className="text-xl font-headline font-bold text-on-surface-variant mb-2">Nenhum curso encontrado</p>
                    <p className="text-sm text-on-surface-variant">
                      Entre em contato com sua empresa para ser matriculado em um curso.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {enrollments
                      .filter(e => e.status === 'in_progress' || e.status === 'active')
                      .slice(0, 2)
                      .map((enrollment) => {
                        // Calcular tempo desde o último acesso
                        const lastAccess = enrollment.last_accessed_at ? new Date(enrollment.last_accessed_at) : new Date()
                        const now = new Date()
                        const daysDiff = Math.floor((now - lastAccess) / (1000 * 60 * 60 * 24))
                        const lastAccessText = daysDiff === 0 ? 'Hoje' : daysDiff === 1 ? 'Ontem' : `${daysDiff} dias atrás`

                        return (
                          <div key={enrollment.id} className="bg-surface-container-lowest group overflow-hidden rounded-xl shadow-[0_10px_30px_rgba(9,20,38,0.04)] transition-all hover:scale-[1.02]">
                            <div className="h-40 overflow-hidden relative">
                              <img
                                alt={enrollment.course?.title}
                                className="w-full h-full object-cover"
                                src={enrollment.course?.image_url || 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80'}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
                              <span className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/30">
                                {enrollment.course?.nr_code}
                              </span>
                            </div>
                            <div className="p-6">
                              <h3 className="font-bold text-lg text-primary mb-1">{enrollment.course?.title}</h3>
                              <p className="text-xs text-on-surface-variant mb-6 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">schedule</span>
                                Último acesso: {lastAccessText}
                              </p>
                              <div className="mb-6">
                                <div className="flex justify-between text-xs font-bold mb-2">
                                  <span className="text-on-surface-variant">Progresso do Curso</span>
                                  <span className="text-primary">{enrollment.progress_percentage || 0}%</span>
                                </div>
                                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all"
                                    style={{ width: `${enrollment.progress_percentage || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleContinueLearning(enrollment)}
                                className="w-full py-3 bg-primary-container text-white text-sm font-bold rounded-lg hover:bg-primary transition-colors flex items-center justify-center gap-2"
                              >
                                Continuar Aprendendo
                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  play_circle
                                </span>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar Widgets - 1 coluna */}
            <div className="xl:col-span-1 space-y-6">
              {/* Safety Alerts Widget */}
              {stats.expiringSoon > 0 && (
                <section className="bg-error-container p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <span className="material-symbols-outlined text-[100px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-on-error-container mb-4">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                      <span className="text-sm font-bold uppercase tracking-wider">Alerta Crítico</span>
                    </div>
                    <h3 className="text-on-error-container font-extrabold text-lg mb-2">Certificação Expirando</h3>
                    <p className="text-on-error-container/80 text-sm mb-6">
                      Você tem <span className="font-bold">{stats.expiringSoon} certificação(ões)</span> expirando nos próximos 30 dias. Renove agora para manter seu status de conformidade.
                    </p>
                    <button className="w-full py-3 bg-error text-white text-sm font-bold rounded-lg shadow-lg hover:opacity-90 transition-opacity">
                      Iniciar Renovação
                    </button>
                  </div>
                </section>
              )}

              {/* Support Widget */}
              <section className="bg-primary p-6 rounded-xl text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-primary-container">Precisa de Ajuda?</p>
                    <p className="text-sm font-bold">Suporte Especializado 24/7</p>
                  </div>
                </div>
                <p className="text-xs text-on-primary-container mb-4 leading-relaxed">
                  Nossos especialistas estão disponíveis para esclarecer dúvidas sobre normas regulamentadoras.
                </p>
                <button className="w-full py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-xs font-bold">
                  Falar com Especialista
                </button>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default StudentDashboard
