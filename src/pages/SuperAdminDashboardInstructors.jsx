import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import NewInstructorModal from '../components/NewInstructorModal'

function SuperAdminDashboardInstructors({ onBack, onNavigate }) {
  const [loading, setLoading] = useState(true)
  const [instructors, setInstructors] = useState([])
  const [stats, setStats] = useState({
    totalInstructors: 0,
    activeInstructors: 0,
    pendingApprovals: 0,
    totalCourses: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showNewInstructorModal, setShowNewInstructorModal] = useState(false)

  useEffect(() => {
    loadInstructorsData()
  }, [])

  async function loadInstructorsData() {
    try {
      let instructorsData = null
      let error = null

      // Tentar primeiro via função RPC (contorna RLS)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_instructors')

      if (!rpcError && rpcData) {
        instructorsData = rpcData
        console.log('Dados carregados via RPC:', instructorsData.length, 'instrutores')
      } else {
        console.log('RPC falhou, tentando query direta:', rpcError)
        
        // Fallback: query direta (pode falhar por RLS)
        const { data: directData, error: directError } = await supabase
          .from('users')
          .select('*')
          .or('role.eq.instructor,role.eq.teacher')
          .order('created_at', { ascending: false })

        instructorsData = directData
        error = directError
        console.log('Dados carregados via query direta:', instructorsData?.length || 0, 'instrutores')
      }

      if (!error && instructorsData) {
        setInstructors(instructorsData)
        
        // Buscar cursos por instrutor
        const { data: coursesData } = await supabase
          .from('courses')
          .select('instructor_id')

        const coursesByInstructor = coursesData?.reduce((acc, course) => {
          acc[course.instructor_id] = (acc[course.instructor_id] || 0) + 1
          return acc
        }, {}) || {}

        // Calcular estatísticas
        const activeCount = instructorsData.filter(t => t.status === 'active').length
        const pendingCount = instructorsData.filter(t => t.status === 'pending').length

        setStats({
          totalInstructors: instructorsData.length,
          activeInstructors: activeCount,
          pendingApprovals: pendingCount,
          totalCourses: Object.values(coursesByInstructor).reduce((a, b) => a + b, 0),
        })

        // Anexar contagem de cursos a cada instrutor
        const instructorsWithCourses = instructorsData.map(instructor => ({
          ...instructor,
          coursesCount: coursesByInstructor[instructor.id] || 0,
        }))
        setInstructors(instructorsWithCourses)
      }

      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar dados dos instrutores:', err)
      setLoading(false)
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'active':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Ativo' }
      case 'pending':
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendente' }
      case 'inactive':
        return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Inativo' }
      case 'suspended':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspenso' }
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-600', label: status || 'N/A' }
    }
  }

  function getInitials(name) {
    return name
      ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'PR'
  }

  const filteredInstructors = instructors.filter(instructor => {
    const matchesSearch =
      instructor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || instructor.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  console.log('Estado instructors:', instructors)
  console.log('filteredInstructors:', filteredInstructors)
  console.log('filterStatus:', filterStatus)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</span>
          <p className="mt-4 text-on-surface-variant">Carregando instrutores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary mb-1">Gestão de Instrutores</h2>
          <p className="text-on-surface-variant font-body">Gerencie instrutores, aprovações e desempenho dos cursos.</p>
        </div>
        <button 
          onClick={() => setShowNewInstructorModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg hover:shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Novo Instrutor
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total de Instrutores */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border-l-4 border-primary group transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
              <span className="material-symbols-outlined">school</span>
            </div>
            <span className="text-emerald-600 flex items-center text-sm font-bold">
              +8% <span className="material-symbols-outlined text-sm">arrow_upward</span>
            </span>
          </div>
          <h3 className="text-slate-500 font-label text-xs uppercase tracking-widest font-semibold mb-1">Total de Instrutores</h3>
          <p className="text-3xl font-extrabold text-primary font-headline tracking-tighter">{stats.totalInstructors}</p>
        </div>

        {/* Instrutores Ativos */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border-l-4 border-secondary group transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
              <span className="material-symbols-outlined">verified</span>
            </div>
          </div>
          <h3 className="text-slate-500 font-label text-xs uppercase tracking-widest font-semibold mb-1">Instrutores Ativos</h3>
          <p className="text-3xl font-extrabold text-primary font-headline tracking-tighter">{stats.activeInstructors}</p>
        </div>

        {/* Aprovações Pendentes */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border-l-4 border-amber-500 group transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            {stats.pendingApprovals > 0 && (
              <span className="text-xs font-bold text-amber-700 px-2 py-1 bg-amber-100 rounded-full">
                Novo
              </span>
            )}
          </div>
          <h3 className="text-slate-500 font-label text-xs uppercase tracking-widest font-semibold mb-1">Aprovações Pendentes</h3>
          <p className="text-3xl font-extrabold text-primary font-headline tracking-tighter">{stats.pendingApprovals}</p>
        </div>

        {/* Total de Cursos */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border-l-4 border-tertiary-container group transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed-variant">
              <span className="material-symbols-outlined">auto_stories</span>
            </div>
            <span className="text-xs font-bold text-on-tertiary-container px-2 py-1 bg-tertiary-fixed-dim rounded-full">
              Este Mês
            </span>
          </div>
          <h3 className="text-slate-500 font-label text-xs uppercase tracking-widest font-semibold mb-1">Cursos Publicados</h3>
          <p className="text-3xl font-extrabold text-primary font-headline tracking-tighter">{stats.totalCourses}</p>
        </div>
      </div>

      {/* Instructors Table Section */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-b border-slate-100">
          <h3 className="text-lg font-bold text-primary">Instrutores Cadastrados</h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Buscar instrutor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm w-full sm:w-64 focus:ring-2 focus:ring-primary"
              />
            </div>
            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-semibold bg-surface-container-low border-none rounded-lg px-3 py-2 text-on-surface-variant focus:ring-primary"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="pending">Pendentes</option>
              <option value="inactive">Inativos</option>
              <option value="suspended">Suspensos</option>
            </select>
            <button className="p-2 bg-surface-container-low rounded-lg text-slate-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-lg">filter_list</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label">Instrutor</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label">Especialidade</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label">Cursos</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label">Cadastro</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 font-label text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredInstructors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">person_off</span>
                    <p className="text-lg font-bold text-slate-500 mb-1">Nenhum instrutor encontrado</p>
                    <p className="text-sm text-slate-400">Tente ajustar os filtros de busca.</p>
                  </td>
                </tr>
              ) : (
                filteredInstructors.map((instructor) => {
                  const badge = getStatusBadge(instructor.status)
                  return (
                    <tr key={instructor.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm">
                            {getInitials(instructor.full_name)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-primary">{instructor.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-slate-500">{instructor.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm text-slate-700">{instructor.specialty || 'NR-01'}</p>
                        {instructor.certifications && (
                          <p className="text-xs text-slate-500 mt-0.5">{instructor.certifications}</p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold text-primary">{instructor.coursesCount || 0}</span>
                        <span className="text-xs text-slate-500 ml-1">cursos</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500">
                        {instructor.created_at 
                          ? new Date(instructor.created_at).toLocaleDateString('pt-BR')
                          : '--'
                        }
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          {instructor.status === 'pending' && (
                            <>
                              <button className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" title="Aprovar">
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                              </button>
                              <button className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Rejeitar">
                                <span className="material-symbols-outlined text-lg">cancel</span>
                              </button>
                            </>
                          )}
                          <button className="p-2 hover:bg-surface-container-high text-slate-400 rounded-lg transition-colors" title="Editar">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button className="p-2 hover:bg-surface-container-high text-slate-400 rounded-lg transition-colors" title="Ver Detalhes">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-50 flex justify-between items-center">
          <p className="text-sm text-slate-500">
            Mostrando <span className="font-bold text-primary">{filteredInstructors.length}</span> de{' '}
            <span className="font-bold text-primary">{instructors.length}</span> instrutores
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors border border-slate-200 rounded-lg">
              Anterior
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90 transition-opacity">
              Próximo
            </button>
          </div>
        </div>
      </div>

      {/* Performance Section */}
      <div className="grid grid-cols-12 gap-6 mt-8">
        {/* Top Performers */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-primary">Top Instrutores do Mês</h3>
            <p className="text-sm text-slate-500 mt-1">Baseado em avaliações dos Colaboradores e taxa de conclusão</p>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { name: 'Ana Silva', specialty: 'NR-35 Trabalho em Altura', rating: 4.9, students: 234, courses: 12 },
              { name: 'Carlos Mendes', specialty: 'NR-10 Eletricidade', rating: 4.8, students: 189, courses: 8 },
              { name: 'Mariana Costa', specialty: 'NR-33 Espaço Confinado', rating: 4.7, students: 156, courses: 6 },
            ].map((instructor, index) => (
              <div key={index} className="px-6 py-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-amber-100 text-amber-700' :
                  index === 1 ? 'bg-slate-200 text-slate-600' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-primary truncate">{instructor.name}</p>
                  <p className="text-xs text-slate-500 truncate">{instructor.specialty}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-primary">{instructor.rating}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Avaliação</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-primary">{instructor.students}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Colaboradores</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-primary">{instructor.courses}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Cursos</p>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-primary">Aprovações Pendentes</h3>
            <p className="text-sm text-slate-500 mt-1">{stats.pendingApprovals} aguardando revisão</p>
          </div>
          <div className="p-6 space-y-4">
            {instructors
              .filter(t => t.status === 'pending')
              .slice(0, 3)
              .map((instructor) => (
                <div key={instructor.id} className="flex gap-4 p-3 rounded-lg hover:bg-surface-container-low transition-colors">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
                    {getInitials(instructor.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary truncate">{instructor.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{instructor.specialty || 'NR-01'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {instructor.created_at 
                        ? new Date(instructor.created_at).toLocaleDateString('pt-BR')
                        : 'Recente'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded transition-colors" title="Aprovar">
                      <span className="material-symbols-outlined text-base">check</span>
                    </button>
                    <button className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors" title="Rejeitar">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                </div>
              ))}
            {stats.pendingApprovals === 0 && (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">check_circle</span>
                <p className="text-sm font-bold text-slate-500">Tudo em dia!</p>
                <p className="text-xs text-slate-400 mt-1">Nenhuma aprovação pendente</p>
              </div>
            )}
          </div>
          {stats.pendingApprovals > 3 && (
            <div className="px-6 py-4 border-t border-slate-100">
              <button className="w-full text-sm font-bold text-primary flex items-center justify-center gap-1 hover:underline">
                Ver todas as aprovações
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Instrutor */}
      <NewInstructorModal
        isOpen={showNewInstructorModal}
        onClose={() => setShowNewInstructorModal(false)}
        onSuccess={loadInstructorsData}
      />
    </div>
  )
}

export default SuperAdminDashboardInstructors
