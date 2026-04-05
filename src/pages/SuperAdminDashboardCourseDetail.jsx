import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function SuperAdminDashboardCourseDetail({ courseId, onBack, onUpdate }) {
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [updating, setUpdating] = useState(false)
  const [priceCents, setPriceCents] = useState('')
  const [instructorCommissionCents, setInstructorCommissionCents] = useState('')

  useEffect(() => {
    if (courseId) {
      loadCourseDetails()
    }
  }, [courseId])

  async function loadCourseDetails() {
    setLoading(true)
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          users!courses_instructor_id_fkey (
            full_name,
            specialty,
            certifications,
            email
          )
        `)
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError

      setCourse(courseData)
      setFeedback(courseData.feedback || '')
      setPriceCents(courseData.price_cents?.toString() || '')
      setInstructorCommissionCents(courseData.instructor_commission_cents?.toString() || '')

      const { data: modulesData } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      setModules(modulesData || [])
    } catch (err) {
      console.error('Erro ao carregar detalhes do curso:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    if (!priceCents || parseFloat(priceCents) <= 0) {
      alert('Por favor, defina o valor do curso antes de aprovar.')
      return
    }

    if (!instructorCommissionCents || parseFloat(instructorCommissionCents) <= 0) {
      alert('Por favor, defina o valor a ser repassado ao instrutor antes de aprovar.')
      return
    }

    if (parseFloat(instructorCommissionCents) > parseFloat(priceCents)) {
      alert('O valor do instrutor não pode ser maior que o valor do curso.')
      return
    }

    if (!confirm('Aprovar este curso? O curso ficará disponível para matrículas.')) return

    setUpdating(true)
    try {
      const { data, error } = await supabase
        .from('courses')
        .update({
          status: 'approved',
          is_active: true,
          approved_at: new Date().toISOString(),
          price_cents: Math.round(parseFloat(priceCents) * 100),
          instructor_commission_cents: Math.round(parseFloat(instructorCommissionCents) * 100),
        })
        .eq('id', courseId)
        .select()

      if (error) throw error

      onUpdate?.()
      alert('Curso aprovado com sucesso!')
    } catch (err) {
      console.error('Erro ao aprovar curso:', err)
      alert('Erro ao aprovar curso: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  async function handleRequestChanges() {
    if (!feedback.trim()) {
      alert('Por favor, adicione um feedback detalhado para o instrutor.')
      return
    }

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          status: 'draft',
          is_active: false,
          feedback: feedback.trim(),
        })
        .eq('id', courseId)

      if (error) throw error

      onUpdate?.()
      alert('Alterações solicitadas. O instrutor será notificado.')
    } catch (err) {
      console.error('Erro ao solicitar alterações:', err)
      alert('Erro ao solicitar alterações.')
    } finally {
      setUpdating(false)
    }
  }

  async function handleReject() {
    if (!confirm('Tem certeza que deseja rejeitar este curso?')) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          status: 'rejected',
          is_active: false,
          feedback: feedback.trim() || 'Curso rejeitado pelo Super Admin.',
        })
        .eq('id', courseId)

      if (error) throw error

      onUpdate?.()
      alert('Curso rejeitado.')
    } catch (err) {
      console.error('Erro ao rejeitar curso:', err)
      alert('Erro ao rejeitar curso.')
    } finally {
      setUpdating(false)
    }
  }

  function getStatusConfig(status) {
    const configs = {
      draft: {
        label: 'Em Rascunho',
        bg: 'bg-surface-container-low',
        text: 'text-on-surface-variant',
        icon: 'edit_note',
      },
      pending: {
        label: 'Aguardando Aprovação',
        bg: 'bg-tertiary-fixed',
        text: 'text-on-tertiary-fixed-variant',
        icon: 'pending_actions',
      },
      approved: {
        label: 'Aprovado',
        bg: 'bg-primary-fixed',
        text: 'text-on-primary-fixed-variant',
        icon: 'check_circle',
      },
      rejected: {
        label: 'Rejeitado',
        bg: 'bg-error-container',
        text: 'text-on-error-container',
        icon: 'block',
      },
    }
    return configs[status] || configs.draft
  }

  function formatDate(dateString) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading || !course) {
    return (
      <div className="w-full max-w-full overflow-hidden flex justify-center items-center py-16">
        <div className="text-center">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
          <p className="mt-4 text-on-surface-variant">Carregando detalhes do curso...</p>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(course.status)
  const modalityIcons = {
    'Online': 'devices',
    'Presencial': 'people',
    'Híbrido': 'groups',
  }

  return (
    <div className="w-full max-w-full overflow-hidden flex flex-col md:flex-row">
      <main className="flex-1 flex flex-col min-w-0">
        {/* Fluxo de Verificação - Topo */}
        <div className="w-full pb-4">
          <div className={`w-full rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm border border-outline-variant/20 ${statusConfig.bg} ${statusConfig.text}`}>
            <div className="flex items-center gap-4 flex-1">
              <span className="material-symbols-outlined text-3xl">{statusConfig.icon}</span>
              <div>
                <p className="font-extrabold font-headline text-lg">{statusConfig.label}</p>
                <p className="text-sm opacity-90 mt-1">
                  {course.status === 'pending'
                    ? 'Atualmente na fila do Super Admin para revisão final.'
                    : course.status === 'approved'
                      ? 'Curso aprovado e disponível para matrículas.'
                      : course.status === 'rejected'
                        ? 'Curso rejeitado. Requer revisão do instrutor.'
                        : 'Em rascunho. Aguardando submissão.'}
                </p>
              </div>
            </div>

            {course.status === 'pending' && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleReject}
                  disabled={updating}
                  className="py-3 px-5 text-error bg-surface/50 hover:bg-error-container/20 font-bold flex items-center gap-2 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">block</span>
                  {updating ? 'Processando...' : 'Rejeitar Curso'}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={updating}
                  className="py-3 px-8 bg-gray-900 border border-gray-800 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  <span className="material-symbols-outlined">task_alt</span>
                  {updating ? 'Processando...' : 'Aprovar Curso'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8 w-full">
          <section className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className={`inline-flex items-center px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text} text-xs font-bold mb-2`}>
                  {course.nr_code || 'NR-01'} COMPLIANCE
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-primary leading-tight">
                  {course.title}
                </h1>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-on-surface-variant text-xs font-label uppercase tracking-widest">Data de Submissão</span>
                <span className="text-primary font-semibold">{formatDate(course.created_at)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-label uppercase tracking-wider">Instrutor</p>
                  <p className="font-bold text-primary">{course.users?.full_name || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">timer</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-label uppercase tracking-wider">Carga Horária Total</p>
                  <p className="font-bold text-primary">{course.workload_hours || 0}h {course.workload_hours ? '45m' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-label uppercase tracking-wider">Nível do Curso</p>
                  <p className="font-bold text-primary">{course.level || '-'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Estrutura do Curso */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-primary tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">inventory_2</span>
              Estrutura do Curso
            </h2>

            {/* Dois cards lado a lado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card Informações Gerais */}
              <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-sm">
                <h3 className="font-bold text-lg text-primary mb-4">Informações Gerais</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-on-surface-variant font-label uppercase tracking-wider mb-1">Descrição</p>
                    <p className="text-sm text-on-surface">{course.description || 'Não fornecida'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant font-label uppercase tracking-wider mb-1">Objetivos</p>
                    <p className="text-sm text-on-surface">{course.objectives || 'Não fornecidos'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant font-label uppercase tracking-wider mb-1">Público Alvo</p>
                    <p className="text-sm text-on-surface">{course.target_audience || 'Não especificado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant font-label uppercase tracking-wider mb-1">Pré-requisitos</p>
                    <p className="text-sm text-on-surface">
                      {course.prerequisites && course.prerequisites.length > 0
                        ? course.prerequisites.join(', ')
                        : 'Nenhum'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Preview do Catálogo */}
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden ghost-border shadow-sm">
                <div className="h-48 relative overflow-hidden">
                  <img
                    alt={course.title}
                    className="w-full h-full object-cover"
                    src={course.image_url || 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80'}
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter">
                      {course.nr_code}
                    </span>
                    <span className="bg-white/90 backdrop-blur text-primary text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter">
                      {course.level}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-headline font-bold text-primary leading-tight mb-2">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-4">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {course.workload_hours || 0} Horas
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        {modalityIcons[course.modality] || 'devices'}
                      </span>
                      {course.modality || 'Online'}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-surface-container-low">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                      Preço por licença
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-primary">R$</span>
                      <span className="text-2xl font-headline font-extrabold text-primary">
                        {((course.price_cents || 0) / 100).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Módulos */}
            <div className="space-y-4">
              {modules.length > 0 ? (
                modules.map((module, index) => (
                  <div key={module.id} className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-lg text-primary">
                        Módulo {String(index + 1).padStart(2, '0')}: {module.title || 'Sem título'}
                      </h3>
                      <span className="text-xs text-on-surface-variant font-medium">{module.lessons_count || 0} Aulas</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-secondary">play_circle</span>
                          <span className="text-sm font-medium text-on-surface">Conteúdo do módulo</span>
                        </div>
                        <span className="text-xs font-label text-on-surface-variant px-2 py-1 bg-surface rounded">
                          {module.duration || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-sm">
                  <div className="flex items-center justify-center gap-3 py-8 text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl">note_stack</span>
                    <div>
                      <p className="font-semibold">Nenhum módulo cadastrado</p>
                      <p className="text-sm">O instrutor ainda não adicionou módulos ao curso.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cards em linha abaixo dos módulos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Configurações Card */}
            <div className="bg-primary text-on-primary rounded-xl p-6 shadow-xl">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed">settings_input_component</span>
                Configurações
              </h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-sm text-on-primary-container font-medium">Modalidade</span>
                  <span className="font-headline font-bold text-xl">{course.modality || '-'}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-sm text-on-primary-container font-medium">Carga Horária</span>
                  <span className="font-headline font-bold text-xl">{course.workload_hours || 0}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-primary-container font-medium">Anos Certificação</span>
                  <span className="font-headline font-bold text-xl">{course.certification_years || 2}</span>
                </div>
              </div>
            </div>

            {/* Instructor Credentials */}
            <div className="bg-surface-container-low rounded-xl p-6 ghost-border">
              <h2 className="text-md font-bold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">badge</span>
                Instrutor
              </h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-lg bg-primary-fixed flex items-center justify-center grayscale brightness-110 shadow-inner">
                  <span className="material-symbols-outlined text-primary text-2xl">person</span>
                </div>
                <div>
                  <p className="font-bold text-primary">{course.users?.full_name || '-'}</p>
                  <p className="text-xs text-on-surface-variant font-label uppercase">
                    {course.users?.specialty || 'Instrutor'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-surface-container-lowest rounded-lg flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">Certificações</span>
                  <span className="text-xs text-on-surface-variant">{course.users?.certifications || 'N/A'}</span>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded-lg flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">Email</span>
                  <span className="text-xs text-on-surface-variant">{course.users?.email || '-'}</span>
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            {course.status === 'pending' && (
              <div className="bg-primary text-on-primary rounded-xl p-6 shadow-xl">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-fixed">payments</span>
                  Precificação por Colaborador
                </h2>
                <div className="space-y-6">
                  <div className="pb-4 border-b border-white/10">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-on-primary-container font-medium">
                        Preço do Curso (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceCents}
                        onChange={(e) => setPriceCents(e.target.value)}
                        className="w-32 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-bold text-xl text-right focus:ring-2 focus:ring-white/30 focus:border-white/40 placeholder-white/50"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-on-primary-container font-medium">
                        Comissão Instrutor (R$)*
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={instructorCommissionCents}
                        onChange={(e) => setInstructorCommissionCents(e.target.value)}
                        className="w-32 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-bold text-xl text-right focus:ring-2 focus:ring-white/30 focus:border-white/40 placeholder-white/50"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-on-primary-container mt-2">
                      Valor repassado ao instrutor por matrícula
                    </p>
                    {priceCents && instructorCommissionCents && parseFloat(priceCents) > 0 && parseFloat(instructorCommissionCents) > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="text-sm text-on-primary-container font-medium">Lucro Plataforma</span>
                        <span className="font-headline font-bold text-xl">R$ {(parseFloat(priceCents) - parseFloat(instructorCommissionCents)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Feedback do Revisor e Ações */}
          <div className="mt-8">
            <h3 className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-4">Feedback do Revisor</h3>
            <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border space-y-4">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full h-32 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary text-sm p-4 placeholder:text-on-surface-variant/40 resize-none"
                placeholder="Insira feedback detalhado para o instrutor. Mencione módulos específicos ou pontos de não conformidade..."
              />

              <p className="text-[10px] text-on-surface-variant italic">
                As notas serão visíveis para o instrutor no dashboard e incluídas no relatório de conformidade automatizado.
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-6 border-t border-outline-variant/10">
            <div className="flex flex-wrap gap-4">
              {course.status === 'pending' && (
                <>
                  <button
                    onClick={handleRequestChanges}
                    disabled={updating}
                    className="flex-1 min-w-[200px] py-4 px-6 border-2 border-primary text-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-surface-container-low transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">edit_note</span>
                    {updating ? 'Processando...' : 'Solicitar Alterações'}
                  </button>
                </>
              )}

              {course.status !== 'pending' && (
                <button
                  onClick={onBack}
                  className="py-4 px-6 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Voltar ao Catálogo
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SuperAdminDashboardCourseDetail
