import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import InviteTeacherModal from '../components/InviteTeacherModal'

function TeacherManagement({ onBack }) {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    avgRating: 0,
    activeCourses: 0,
  })
  const [filters, setFilters] = useState({
    status: '',
    specialty: '',
    search: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    loadTeachers()
  }, [currentPage, filters])

  async function loadTeachers() {
    try {
      // Buscar usuários com role de instrutor/professor
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .in('role', ['instructor', 'teacher'])

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.search) {
        query = query.ilike('full_name', `%${filters.search}%`)
      }

      const { data, count, error } = await query

      if (error) {
        console.error('Erro na query de professores:', error)
        throw error
      }

      setTeachers(data || [])

      // Calcular estatísticas
      setStats({
        total: count || 0,
        pending: data?.filter(t => t.status === 'pending').length || 0,
        avgRating: 4.8, // TODO: Calcular média real
        activeCourses: 315, // TODO: Buscar do banco
      })

      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar professores:', err)
      setLoading(false)
    }
  }

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  function handleTeacherInvited() {
    console.log('✅ Professor convidado, recarregando lista...')
    loadTeachers()
    setShowInviteModal(false)
  }

  function handleApproveTeacher(teacherId) {
    console.log('Aprovar professor:', teacherId)
    // TODO: Implementar aprovação
  }

  function handleRejectTeacher(teacherId) {
    console.log('Rejeitar professor:', teacherId)
    // TODO: Implementar rejeição
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-primary-fixed',
          text: 'text-on-primary-fixed-variant',
          dot: 'bg-primary',
          label: 'Ativo',
        }
      case 'pending':
        return {
          bg: 'bg-tertiary-fixed',
          text: 'text-on-tertiary-fixed-variant',
          dot: 'bg-on-tertiary-fixed-variant',
          label: 'Pendente',
        }
      case 'rejected':
        return {
          bg: 'bg-error-container',
          text: 'text-on-error-container',
          dot: 'bg-error',
          label: 'Rejeitado',
        }
      default:
        return {
          bg: 'bg-surface-container-high',
          text: 'text-on-surface-variant',
          dot: 'bg-slate-400',
          label: status || 'Desconhecido',
        }
    }
  }

  function getInitials(name) {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="ml-64 mt-16 p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</span>
          <p className="mt-4 text-on-surface-variant">Carregando professores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-50/60 dark:bg-slate-950/60 backdrop-blur-xl flex justify-between items-center px-8 py-4 shadow-[0_20px_40px_rgba(9,20,38,0.05)]">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tighter text-slate-900 dark:text-slate-50 font-headline">
            Occupational Excellence
          </span>
          <div className="hidden md:flex gap-6">
            <button
              onClick={onBack}
              className="text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-50 transition-opacity duration-200"
            >
              Dashboard
            </button>
            <a className="text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-50 transition-opacity duration-200" href="#">
              Compliance
            </a>
            <a className="text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-50 transition-opacity duration-200" href="#">
              Reports
            </a>
            <a className="text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-50 transition-opacity duration-200" href="#">
              Directory
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-slate-500 hover:text-slate-900">notifications</button>
          <button className="material-symbols-outlined text-slate-500 hover:text-slate-900">settings</button>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm">admin_panel_settings</span>
          </div>
        </div>
      </nav>

      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 pt-20 border-r border-slate-200/15 dark:border-slate-800/15 bg-white dark:bg-slate-900 flex flex-col py-6">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-white font-bold">OC</div>
            <div>
              <h2 className="font-headline font-extrabold text-slate-900 dark:text-slate-50 leading-tight">Admin Console</h2>
              <p className="text-xs text-slate-500">Corporate Training</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <button
            onClick={onBack}
            className="w-full flex items-center gap-3 px-6 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 font-body text-sm font-medium transition-all duration-200 text-left"
          >
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </button>
          <a className="flex items-center gap-3 px-6 py-3 text-slate-900 dark:text-white border-l-4 border-slate-900 dark:border-slate-50 bg-slate-50 dark:bg-slate-800/50 font-body text-sm font-medium transition-all duration-200" href="#">
            <span className="material-symbols-outlined">school</span>
            Professor Management
          </a>
          <a className="flex items-center gap-3 px-6 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 font-body text-sm font-medium transition-all duration-200" href="#">
            <span className="material-symbols-outlined">library_books</span>
            Course Catalog
          </a>
          <a className="flex items-center gap-3 px-6 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 font-body text-sm font-medium transition-all duration-200" href="#">
            <span className="material-symbols-outlined">verified_user</span>
            Compliance Audits
          </a>
          <a className="flex items-center gap-3 px-6 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 font-body text-sm font-medium transition-all duration-200" href="#">
            <span className="material-symbols-outlined">leaderboard</span>
            Analytics
          </a>
          <a className="flex items-center gap-3 px-6 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 font-body text-sm font-medium transition-all duration-200" href="#">
            <span className="material-symbols-outlined">admin_panel_settings</span>
            System Settings
          </a>
        </nav>
        <div className="mt-auto border-t border-slate-100 pt-4">
          <a className="flex items-center gap-3 px-6 py-3 text-slate-500 hover:bg-slate-50 transition-colors" href="#">
            <span className="material-symbols-outlined">help_outline</span>
            <span className="text-sm font-medium">Support</span>
          </a>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-6 py-3 text-error hover:bg-error/5 transition-colors w-full"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 pt-24 p-8 bg-surface">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-1">Gestão de Professores</h1>
            <p className="text-on-surface-variant max-w-2xl">
              Administre o corpo docente, monitore homologações pendentes e garanta a excelência pedagógica da plataforma.
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-primary text-white px-6 py-3 rounded shadow-lg flex items-center gap-2 hover:bg-primary-container transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span className="font-semibold tracking-wide">Convidar Professor</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
            <p className="text-on-surface-variant text-sm font-medium mb-2">Total de Professores</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold font-headline">{stats.total.toLocaleString('pt-BR')}</span>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-semibold">+12%</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
            <p className="text-on-surface-variant text-sm font-medium mb-2">Aguardando Homologação</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold font-headline">{stats.pending}</span>
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-semibold">Urgente</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
            <p className="text-on-surface-variant text-sm font-medium mb-2">Média de Avaliação</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold font-headline">{stats.avgRating}</span>
              <div className="flex gap-1 text-amber-400">
                {[1, 2, 3, 4].map(i => (
                  <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
            <p className="text-on-surface-variant text-sm font-medium mb-2">Cursos Ativos</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold font-headline">{stats.activeCourses}</span>
              <span className="material-symbols-outlined text-on-primary-container">menu_book</span>
            </div>
          </div>
        </div>

        {/* Content Area: Filters and Table */}
        <div className="bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden">
          {/* Filters Bar */}
          <div className="px-8 py-6 flex items-center justify-between bg-surface-container-low/50">
            <div className="flex gap-4">
              <div className="relative group">
                <select
                  className="appearance-none bg-white border border-outline-variant/30 rounded px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Todos os Status</option>
                  <option value="active">Ativo</option>
                  <option value="pending">Pendente</option>
                  <option value="rejected">Rejeitado</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
              <div className="relative group">
                <select
                  className="appearance-none bg-white border border-outline-variant/30 rounded px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  value={filters.specialty}
                  onChange={(e) => handleFilterChange('specialty', e.target.value)}
                >
                  <option value="">Todas as Especialidades</option>
                  <option value="NR-01">NR-01</option>
                  <option value="Gestão de Risco">Gestão de Risco</option>
                  <option value="Segurança Elétrica">Segurança Elétrica</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white border border-outline-variant/30 px-3 py-2 rounded max-w-xs w-full">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">search</span>
              <input
                className="bg-transparent border-none text-sm w-full focus:ring-0 focus:outline-none"
                placeholder="Buscar professor..."
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          {teachers.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">school</span>
              <p className="text-xl font-headline font-bold text-on-surface-variant mb-2">Nenhum professor encontrado</p>
              <p className="text-sm text-on-surface-variant">Convide novos professores usando o botão acima.</p>
            </div>
          ) : (
            <>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-left">
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Professor</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Especialidades</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Colaboradores</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Rating</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {teachers.map((teacher) => {
                    const badge = getStatusBadge(teacher.status || 'active')
                    return (
                      <tr key={teacher.id} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs">
                              {getInitials(teacher.full_name)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{teacher.full_name}</div>
                              <div className="text-xs text-on-surface-variant">{teacher.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                              {teacher.role || 'Instructor'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-8 py-6 font-medium text-slate-900">
                          {teacher.student_count || '--'}
                        </td>
                        <td className="px-8 py-6">
                          {teacher.rating ? (
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-900">{teacher.rating}</span>
                              <span className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          {teacher.status === 'pending' ? (
                            <div className="flex justify-end gap-4 items-center">
                              <button
                                onClick={() => handleApproveTeacher(teacher.id)}
                                className="bg-primary-container text-white px-3 py-1 rounded text-xs font-bold uppercase hover:bg-primary transition-colors"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => handleRejectTeacher(teacher.id)}
                                className="text-error text-xs font-bold uppercase hover:underline"
                              >
                                Rejeitar
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-3">
                              <button className="text-primary hover:text-on-primary-container text-sm font-semibold transition-colors">
                                Ver Perfil
                              </button>
                              <button className="text-on-surface-variant hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">edit</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Pagination/Footer */}
              <div className="px-8 py-4 bg-surface-container-low/50 flex justify-between items-center text-xs font-medium text-on-surface-variant border-t border-outline-variant/10">
                <span>Exibindo {teachers.length} de {stats.total} professores</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-surface-container transition-colors disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <div className="flex gap-1">
                    <button className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center">{currentPage}</button>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage * itemsPerPage >= stats.total}
                      className="w-6 h-6 rounded hover:bg-surface-container flex items-center justify-center disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal de Convidar Professor */}
      <InviteTeacherModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleTeacherInvited}
      />
    </div>
  )
}

export default TeacherManagement
