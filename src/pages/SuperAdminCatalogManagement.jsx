import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function SuperAdminCatalogManagement({ onShowCourseDetails }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterInstructor, setFilterInstructor] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [stats, setStats] = useState({
    drafts: 0,
    pending: 0,
    published: 0,
    rejected: 0,
  })

  const ITEMS_PER_PAGE = 10

  // Carregar cursos
  useEffect(() => {
    loadCourses()
  }, [])

  async function loadCourses() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          users!courses_instructor_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCourses(data || [])

      // Calcular estatísticas
      const drafts = data?.filter(c => !c.is_active && c.status === 'draft').length || 0
      const pending = data?.filter(c => c.status === 'pending').length || 0
      const published = data?.filter(c => c.is_active && c.status === 'approved').length || 0
      const rejected = data?.filter(c => c.status === 'rejected').length || 0

      setStats({ drafts, pending, published, rejected })
    } catch (err) {
      console.error('Erro ao carregar cursos:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateCourseStatus(courseId, newStatus) {
    try {
      console.log('🔵 Atualizando status do curso:', courseId, 'para:', newStatus)

      const { data, error } = await supabase
        .from('courses')
        .update({
          status: newStatus,
          is_active: newStatus === 'approved',
        })
        .eq('id', courseId)
        .select()

      console.log('🟢 Resposta do Supabase:', { data, error })

      if (error) {
        console.error('❌ Erro ao atualizar:', error)
        throw error
      }

      console.log('✅ Status atualizado com sucesso!')
      await loadCourses()
    } catch (err) {
      console.error('❌ Erro ao atualizar status do curso:', err)
      alert('Erro ao atualizar status do curso: ' + err.message)
    }
  }

  async function deleteCourse(courseId) {
    if (!confirm('Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error

      await loadCourses()
    } catch (err) {
      console.error('Erro ao excluir curso:', err)
      alert('Erro ao excluir curso.')
    }
  }

  // Filtrar cursos
  const filteredCourses = courses.filter(course => {
    if (searchTerm && !course.title?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !course.nr_code?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (filterInstructor && course.users?.full_name !== filterInstructor) {
      return false
    }
    if (filterStatus && course.status !== filterStatus) {
      return false
    }
    if (filterCategory && course.nr_code !== filterCategory) {
      return false
    }
    return true
  })

  // Paginação
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE)
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Instrutores únicos para filtro
  const instructors = [...new Set(courses.map(c => c.users?.full_name).filter(Boolean))]
  const nrCodes = [...new Set(courses.map(c => c.nr_code).filter(Boolean))]

  function getStatusBadge(status, isActive) {
    const statusConfig = {
      draft: {
        label: 'Em Rascunho',
        bg: 'bg-surface-container-low',
        text: 'text-on-surface-variant',
      },
      pending: {
        label: 'Aguardando Aprovação',
        bg: 'bg-tertiary-fixed',
        text: 'text-on-tertiary-fixed-variant',
      },
      approved: {
        label: 'Publicado',
        bg: 'bg-primary-fixed',
        text: 'text-on-primary-fixed-variant',
      },
      rejected: {
        label: 'Rejeitado',
        bg: 'bg-error-container',
        text: 'text-on-error-container',
      },
    }

    const config = statusConfig[status] || statusConfig.draft
    
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  function formatDate(dateString) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Header */}
      <header className="mb-12 flex justify-between items-end">
        <div>
          <p className="text-on-surface-variant font-label text-sm tracking-widest uppercase mb-2">
            Corporate Training Ecosystem
          </p>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">
            Gestão de Catálogo Global
          </h1>
          <p className="text-on-surface-variant mt-2 max-w-lg">
            Super Admin interface for NR-01 compliance monitoring and multi-regional training curriculum validation.
          </p>
        </div>
      </header>

      {/* Summary Cards: Bento Style */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {/* Drafts */}
        <div className="bg-surface-container-low p-6 rounded-xl transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-secondary p-2 bg-secondary-fixed rounded-lg">
              edit_note
            </span>
            <span className="text-xs font-bold text-on-surface-variant bg-surface-variant px-2 py-1 rounded">
              {stats.drafts}
            </span>
          </div>
          <h3 className="font-label text-on-surface-variant text-sm font-medium">Em Rascunho</h3>
          <p className="font-headline text-3xl font-extrabold text-primary mt-1">{stats.drafts}</p>
        </div>

        {/* Pending */}
        <div className="bg-tertiary-fixed p-6 rounded-xl transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-on-tertiary-fixed-variant p-2 bg-tertiary-fixed-dim rounded-lg">
              pending
            </span>
            <span className="text-xs font-bold text-on-tertiary-fixed-variant bg-tertiary-fixed-dim px-2 py-1 rounded">
              PRIORITY
            </span>
          </div>
          <h3 className="font-label text-on-tertiary-fixed-variant text-sm font-medium">Aguardando Aprovação</h3>
          <p className="font-headline text-3xl font-extrabold text-primary-container mt-1">{stats.pending}</p>
        </div>

        {/* Published */}
        <div className="bg-primary-fixed p-6 rounded-xl transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-on-primary-fixed-variant p-2 bg-primary-fixed-dim rounded-lg">
              verified
            </span>
            <span className="text-xs font-bold text-on-primary-fixed-variant bg-primary-fixed-dim px-2 py-1 rounded">
              GLOBAL
            </span>
          </div>
          <h3 className="font-label text-on-primary-fixed-variant text-sm font-medium">Publicados</h3>
          <p className="font-headline text-3xl font-extrabold text-primary mt-1">{stats.published}</p>
        </div>

        {/* Rejected */}
        <div className="bg-error-container p-6 rounded-xl transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-on-error-container p-2 bg-white/50 rounded-lg">
              report
            </span>
            <span className="text-xs font-bold text-on-error-container bg-white/40 px-2 py-1 rounded">
              {stats.rejected}
            </span>
          </div>
          <h3 className="font-label text-on-error-container text-sm font-medium">Rejeitados</h3>
          <p className="font-headline text-3xl font-extrabold text-on-error-container mt-1">{stats.rejected}</p>
        </div>
      </section>

      {/* Advanced Filter Bar */}
      <section className="bg-surface-container-low rounded-xl p-4 mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Título ou ID do curso..."
            className="w-full bg-surface-container-lowest border-none rounded-lg pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterInstructor}
            onChange={(e) => setFilterInstructor(e.target.value)}
            className="bg-surface-container-lowest border-none rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-fixed min-w-[140px]"
          >
            <option value="">Instrutor</option>
            {instructors.map(instructor => (
              <option key={instructor} value={instructor}>{instructor}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-surface-container-lowest border-none rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-fixed min-w-[140px]"
          >
            <option value="">Categoria</option>
            {nrCodes.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-surface-container-lowest border-none rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-fixed min-w-[140px]"
          >
            <option value="">Status</option>
            <option value="draft">Rascunho</option>
            <option value="pending">Aguardando Aprovação</option>
            <option value="approved">Publicado</option>
            <option value="rejected">Rejeitado</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterInstructor('')
              setFilterCategory('')
              setFilterStatus('')
              setCurrentPage(1)
            }}
            className="bg-primary-container text-on-primary-container p-3 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
          >
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
      </section>

      {/* Course Management Table */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(9,20,38,0.02)]">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b-0">
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">ID</th>
                  <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Título do Curso</th>
                  <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Instrutor</th>
                  <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Data de Submissão</th>
                  <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y-0">
                {paginatedCourses.map((course, index) => (
                  <tr
                    key={course.id}
                    className={`${index % 2 === 0 ? 'bg-surface-container-low/20' : ''} hover:bg-surface-container-low/50 transition-colors`}
                  >
                    <td className="px-6 py-6 font-headline text-sm font-bold text-on-surface-variant">
                      #{course.nr_code || 'NR01'}-{course.id}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-fixed overflow-hidden shrink-0">
                          <div className="w-full h-full bg-primary-fixed flex items-center justify-center text-primary text-xs font-bold">
                            {course.nr_code?.replace('NR-', '') || 'NR'}
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-primary">{course.title}</p>
                          <p className="text-xs text-on-surface-variant">{course.level}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-sm text-on-surface font-medium">
                      {course.users?.full_name || '-'}
                    </td>
                    <td className="px-6 py-6 text-sm text-on-surface-variant">
                      {formatDate(course.created_at)}
                    </td>
                    <td className="px-6 py-6 text-center">
                      {getStatusBadge(course.status, course.is_active)}
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Ver detalhes */}
                        <button
                          onClick={() => onShowCourseDetails?.(course)}
                          className="p-2 hover:bg-surface-container-high rounded-lg text-outline transition-colors"
                          title="Ver detalhes"
                        >
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </button>

                        {/* Aprovar/Rejeitar */}
                        {course.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateCourseStatus(course.id, 'approved')}
                              className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                              title="Aprovar"
                            >
                              <span className="material-symbols-outlined text-xl">check_circle</span>
                            </button>
                            <button
                              onClick={() => updateCourseStatus(course.id, 'rejected')}
                              className="p-2 hover:bg-error-container rounded-lg text-error transition-colors"
                              title="Rejeitar"
                            >
                              <span className="material-symbols-outlined text-xl">cancel</span>
                            </button>
                          </>
                        )}

                        {/* Editar */}
                        <button
                          className="p-2 hover:bg-surface-container-high rounded-lg text-outline transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-xl">edit_square</span>
                        </button>

                        {/* Deletar */}
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="p-2 hover:bg-error-container rounded-lg text-error transition-colors"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedCourses.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
                      <p className="font-semibold">Nenhum curso encontrado</p>
                      <p className="text-sm">Tente ajustar os filtros de busca</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center">
              <span className="text-xs font-medium text-on-surface-variant">
                Exibindo {filteredCourses.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}-
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredCourses.length)} de {filteredCourses.length} cursos
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-xs font-bold rounded ${
                      currentPage === page
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 rounded hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SuperAdminCatalogManagement
