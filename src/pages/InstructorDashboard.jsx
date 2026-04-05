import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function InstructorDashboard({ onBack, onNewCourse }) {
  const { user, signOut } = useAuth()

  async function handleSignOut() {
    try {
      await signOut()
      // Após logout, voltar para a página inicial (catálogo)
      onBack?.()
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
    }
  }
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    totalEarnings: 0,
  })
  const [courses, setCourses] = useState([])
  const [webinars, setWebinars] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [user])

  async function loadDashboardData() {
    try {
      if (!user?.id) return

      // Buscar cursos do instrutor
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user.id)

      if (!coursesError) {
        setCourses(coursesData || [])
        setStats(prev => ({
          ...prev,
          activeCourses: coursesData?.length || 0,
        }))
      }

      // Buscar estatísticas simplificadas
      setStats({
        totalStudents: 1284, // TODO: Calcular do banco
        activeCourses: coursesData?.length || 14,
        totalEarnings: 42850, // TODO: Calcular do banco
      })

      // Webinars simulados
      setWebinars([
        { date: '12 Abr', title: 'Segurança em Altura', time: '14:00 - 15:30' },
        { date: '15 Abr', title: 'Riscos Elétricos BT/AT', time: '09:00 - 11:00' },
      ])

      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar dados do instrutor:', err)
      setLoading(false)
    }
  }

  function getLevelLabel(level) {
    const labels = {
      'Basico': 'Básico',
      'Intermediario': 'Intermediário',
      'Avancado': 'Avançado',
      'Especialista': 'Especialista',
      'Pratico': 'Prático',
      'Reciclagem': 'Reciclagem',
      'Integracao': 'Integração',
      'CIPA': 'CIPA',
    }
    return labels[level] || level
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'approved':
        return { bg: 'bg-primary-fixed', text: 'text-on-primary-fixed-variant', label: 'Aprovado' }
      case 'pending':
        return { bg: 'bg-tertiary-fixed', text: 'text-on-tertiary-container', label: 'Pendente' }
      case 'draft':
        return { bg: 'bg-surface-container-high', text: 'text-on-secondary-container', label: 'Rascunho' }
      case 'critical':
        return { bg: 'bg-error-container', text: 'text-on-error-container', label: 'Crítico' }
      default:
        return { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', label: status }
    }
  }

  if (loading) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</span>
          <p className="mt-4 text-on-surface-variant">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface font-body text-on-surface flex min-h-screen">
      {/* SideBar */}
      <aside className="hidden md:flex flex-col h-screen w-64 border-r border-slate-200/15 dark:border-slate-800/15 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50 py-8 px-4 shadow-[0_20px_40px_rgba(9,20,38,0.05)]">
        <div className="mb-10 px-4">
          <span className="text-lg font-bold text-slate-900 dark:text-slate-50 font-headline tracking-tighter">Occupational Excellence</span>
        </div>
        <nav className="flex-1 space-y-2">
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg relative text-slate-900 dark:text-slate-50 before:absolute before:left-0 before:w-1 before:h-6 before:bg-slate-900 dark:before:bg-slate-50 before:rounded-full font-headline font-semibold tracking-tight transition-all opacity-90" href="#">
            <span className="material-symbols-outlined">school</span>
            <span>Cursos</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-headline font-semibold tracking-tight hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors opacity-90" href="#">
            <span className="material-symbols-outlined">group</span>
            <span>Colaboradores</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-headline font-semibold tracking-tight hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors opacity-90" href="#">
            <span className="material-symbols-outlined">payments</span>
            <span>Ganhos</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-headline font-semibold tracking-tight hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors opacity-90" href="#">
            <span className="material-symbols-outlined">account_circle</span>
            <span>Perfil</span>
          </a>
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 px-4">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-primary text-sm">person</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{user?.full_name || 'Professor'}</p>
            <p className="text-xs text-slate-500">{user?.specialty || 'Instrutor'}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* TopBar */}
        <header className="flex justify-between items-center px-8 w-full sticky top-0 z-40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md w-full h-16">
          <div className="flex items-center gap-8">
            <button
              onClick={onBack}
              className="font-headline font-extrabold tracking-tighter text-slate-900 dark:text-slate-50 text-xl hover:text-primary transition-colors"
            >
              Occupational Excellence
            </button>
            <div className="relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input
                className="bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary"
                placeholder="Buscar cursos ou relatórios..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:text-slate-900 transition-opacity">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-slate-500 hover:text-slate-900 transition-opacity">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 text-slate-500 hover:text-error transition-opacity"
              title="Sair"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 lg:p-12 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-10 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-headline font-extrabold text-primary tracking-tight mb-2">Visão Geral do Instrutor</h2>
              <p className="text-on-surface-variant max-w-2xl">Monitore o desempenho de seus treinamentos de NR-01 e gerencie o progresso dos seus Colaboradores com precisão arquitetônica.</p>
            </div>
            <button
              onClick={onNewCourse}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-headline font-bold text-sm hover:opacity-90 transition-all shadow-lg hover:shadow-primary/20"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Novo Curso
            </button>
          </div>

          {/* Bento Grid Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border-l-4 border-primary group transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-primary-container p-2 bg-primary-fixed rounded-lg">group</span>
                <span className="text-xs font-bold text-primary px-2 py-1 bg-surface-container-high rounded-full">+12%</span>
              </div>
              <p className="text-label-md font-medium text-on-surface-variant uppercase tracking-widest text-[10px] mb-1">Total de Colaboradores</p>
              <h3 className="text-3xl font-headline font-extrabold text-primary">{stats.totalStudents.toLocaleString('pt-BR')}</h3>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border-l-4 border-secondary group transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-secondary p-2 bg-secondary-fixed rounded-lg">auto_stories</span>
              </div>
              <p className="text-label-md font-medium text-on-surface-variant uppercase tracking-widest text-[10px] mb-1">Cursos Ativos</p>
              <h3 className="text-3xl font-headline font-extrabold text-primary">{stats.activeCourses}</h3>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border-l-4 border-tertiary-container group transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-on-tertiary-fixed-variant p-2 bg-tertiary-fixed rounded-lg">payments</span>
                <span className="text-xs font-bold text-on-tertiary-container px-2 py-1 bg-tertiary-fixed-dim rounded-full">Este Mês</span>
              </div>
              <p className="text-label-md font-medium text-on-surface-variant uppercase tracking-widest text-[10px] mb-1">Ganhos Totais</p>
              <h3 className="text-3xl font-headline font-extrabold text-primary">R$ {stats.totalEarnings.toLocaleString('pt-BR')}</h3>
            </div>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Chart Section */}
            <div className="lg:col-span-8 bg-surface-container-low rounded-xl p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h4 className="text-lg font-headline font-bold text-primary">Desempenho de Vendas</h4>
                  <p className="text-sm text-on-surface-variant">Tendência de inscrições nos últimos 6 meses</p>
                </div>
                <select className="bg-surface-container-lowest border-none rounded-lg text-xs font-bold px-4 py-2 focus:ring-primary shadow-sm">
                  <option>Últimos 6 meses</option>
                  <option>Este ano</option>
                </select>
              </div>
              {/* Chart Bars */}
              <div className="h-64 w-full relative flex items-end justify-between gap-2 px-2">
                <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                  <div className="border-t border-outline-variant/10 w-full"></div>
                  <div className="border-t border-outline-variant/10 w-full"></div>
                  <div className="border-t border-outline-variant/10 w-full"></div>
                  <div className="border-t border-outline-variant/10 w-full"></div>
                </div>
                {[40, 65, 50, 85, 70, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-linear-to-t from-primary/20 to-primary rounded-t-lg transition-all hover:opacity-80" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">
                {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map(m => <span key={m}>{m}</span>)}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Alert Card */}
              <div className="bg-primary p-8 rounded-xl text-on-primary shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-xl font-headline font-bold mb-2">Novo Relatório NR-01</h4>
                  <p className="text-on-primary-container text-sm mb-6 leading-relaxed">Você tem 4 novos cursos aguardando revisão final de conformidade antes da publicação.</p>
                  <button className="bg-surface-container-lowest text-primary px-6 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2">
                    Revisar Agora
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
              </div>

              {/* Webinars */}
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border border-outline-variant/10">
                <h4 className="text-sm font-headline font-bold text-primary mb-4">Próximos Webinars</h4>
                <div className="space-y-4">
                  {webinars.map((w, i) => (
                    <div key={i} className="flex gap-4 items-center p-3 rounded-lg hover:bg-surface-container-low transition-colors group">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-lg text-xs font-bold ${i === 0 ? 'bg-secondary-fixed text-secondary' : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'}`}>
                        {w.date}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{w.title}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{w.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Course Approval Table */}
            <div className="lg:col-span-12 mt-4">
              <div className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] overflow-hidden">
                <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center">
                  <h4 className="text-lg font-headline font-bold text-primary">Status de Aprovação dos Cursos</h4>
                  <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                    Ver todos <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
                {courses.length === 0 ? (
                  <div className="p-12 text-center">
                    <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">menu_book</span>
                    <p className="text-xl font-headline font-bold text-on-surface-variant mb-2">Nenhum curso encontrado</p>
                    <p className="text-sm text-on-surface-variant mb-6">Crie seu primeiro curso ou aguarde a atribuição pelo administrador.</p>
                    <button
                      onClick={onNewCourse}
                      className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-lg"
                    >
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Criar Novo Curso
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface-container-low">
                        <tr>
                          <th className="px-8 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nome do Curso</th>
                          <th className="px-8 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Categoria</th>
                          <th className="px-8 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Última Edição</th>
                          <th className="px-8 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Status</th>
                          <th className="px-8 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {courses.map((course) => {
                          const badge = getStatusBadge(course.status || 'pending')
                          return (
                            <tr key={course.id} className="hover:bg-surface-container-low transition-colors">
                              <td className="px-8 py-5 font-semibold text-primary">{course.title}</td>
                              <td className="px-8 py-5 text-sm text-on-surface-variant">{course.nr_code || 'NR-01'}</td>
                              <td className="px-8 py-5 text-sm text-on-surface-variant">
                                {course.updated_at ? new Date(course.updated_at).toLocaleDateString('pt-BR') : '--'}
                              </td>
                              <td className="px-8 py-5">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="px-8 py-5">
                                <button className="text-on-surface-variant hover:text-primary transition-colors">
                                  <span className="material-symbols-outlined">more_horiz</span>
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default InstructorDashboard
