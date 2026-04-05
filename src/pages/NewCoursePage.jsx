import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STEPS = [
  { id: 'basic', label: 'Dados Básicos', icon: 'info' },
  { id: 'modules', label: 'Módulos', icon: 'account_tree' },
  { id: 'assessment', label: 'Avaliação', icon: 'fact_check' },
  { id: 'compliance', label: 'Conformidade', icon: 'gavel' },
]

function NewCoursePage({ onBack, onSuccess }) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState('basic')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Etapa 1: Dados Básicos
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    nr_code: 'NR-01',
    level: 'Basico',
    modality: 'Online',
    workload_hours: 8,
    certification_years: 2,
    price_cents: 0,
    objectives: '',
    target_audience: '',
    program_content: '',
    prerequisites: '',
  })

  // Etapa 3: Avaliação
  const [assessment, setAssessment] = useState({
    passing_grade: 7.0,
    min_watch_percentage: 85,
    block_video_skip: true,
  })

  // Etapa 2: Módulos
  const [modules, setModules] = useState([
    {
      id: 1,
      title: '',
      description: '',
      order_index: 1,
      lessons: [
        {
          id: 1,
          title: '',
          type: 'video', // video, pdf, quiz
          content_url: '',
          duration_minutes: 0,
          order_index: 1,
        }
      ]
    }
  ])

  function addModule() {
    setModules(prev => [
      ...prev,
      {
        id: Date.now(),
        title: '',
        description: '',
        order_index: prev.length + 1,
        lessons: []
      }
    ])
  }

  function removeModule(moduleId) {
    setModules(prev => prev.filter(m => m.id !== moduleId))
  }

  function updateModule(moduleId, field, value) {
    setModules(prev =>
      prev.map(m => m.id === moduleId ? { ...m, [field]: value } : m)
    )
  }

  function addLesson(moduleId) {
    setModules(prev =>
      prev.map(m => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: [
              ...m.lessons,
              {
                id: Date.now(),
                title: '',
                type: 'video',
                content_url: '',
                duration_minutes: 0,
                order_index: m.lessons.length + 1,
              }
            ]
          }
        }
        return m
      })
    )
  }

  function removeLesson(moduleId, lessonId) {
    setModules(prev =>
      prev.map(m => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.filter(l => l.id !== lessonId)
          }
        }
        return m
      })
    )
  }

  function updateLesson(moduleId, lessonId, field, value) {
    setModules(prev =>
      prev.map(m => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.map(l =>
              l.id === lessonId ? { ...l, [field]: value } : l
            )
          }
        }
        return m
      })
    )
  }

  function updateFormData(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    // Validar campos obrigatórios
    if (!formData.title?.trim()) {
      setError('O título do curso é obrigatório.')
      setLoading(false)
      return
    }

    if (!formData.level || !['Basico', 'Intermediario', 'Avancado', 'Especialista', 'Pratico', 'Reciclagem', 'Integracao', 'CIPA'].includes(formData.level)) {
      setError('Nível do curso inválido. Selecione uma opção válida.')
      setLoading(false)
      return
    }

    try {
      console.log('📤 Enviando dados do curso:', {
        title: formData.title,
        level: formData.level,
        modality: formData.modality,
        nr_code: formData.nr_code,
        instructor_id: user?.id,
        user_role: user?.role,
      })

      // Verificar se o usuário é instrutor
      if (!user?.id) {
        setError('Usuário não autenticado. Faça login novamente.')
        setLoading(false)
        return
      }

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          nr_code: formData.nr_code,
          level: formData.level,
          modality: formData.modality,
          workload_hours: parseInt(formData.workload_hours) || 8,
          price_cents: parseInt(formData.price_cents) || 0,
          objectives: formData.objectives?.trim() || null,
          target_audience: formData.target_audience?.trim() || null,
          program_content: formData.program_content?.trim() || null,
          prerequisites: formData.prerequisites ? formData.prerequisites.split(',').map(p => p.trim()).filter(Boolean) : [],
          instructor_id: user.id, // Garantir que o ID é enviado
          is_active: false,
        })
        .select()
        .single()

      if (courseError) throw courseError

      console.log('✅ Curso criado com ID:', courseData.id)

      // Salvar módulos e aulas
      if (modules.length > 0) {
        console.log('📚 Salvando módulos:', modules.length)

        for (const module of modules) {
          // Criar módulo
          const { data: moduleData, error: moduleError } = await supabase
            .from('course_modules')
            .insert({
              course_id: courseData.id,
              title: module.title || `Módulo ${module.order_index}`,
              description: module.description || null,
              order_index: module.order_index,
            })
            .select()
            .single()

          if (moduleError) {
            console.warn('⚠️ Erro ao salvar módulo:', moduleError)
            continue
          }

          console.log('✅ Módulo criado:', moduleData.id)

          // Salvar aulas do módulo
          if (module.lessons && module.lessons.length > 0) {
            for (const lesson of module.lessons) {
              const { error: lessonError } = await supabase
                .from('course_lessons')
                .insert({
                  module_id: moduleData.id,
                  title: lesson.title || `Aula ${lesson.order_index}`,
                  type: lesson.type || 'video',
                  content_url: lesson.content_url || null,
                  duration_minutes: lesson.duration_minutes || 0,
                  order_index: lesson.order_index,
                })

              if (lessonError) {
                console.warn('⚠️ Erro ao salvar aula:', lessonError)
              }
            }
          }
        }

        console.log('✅ Todos os módulos e aulas salvos!')
      }

      // Salvar configurações de conformidade na tabela course_settings (se existir)
      // ou como metadata no curso
      const { error: settingsError } = await supabase
        .from('courses')
        .update({
          metadata: {
            certification_years: parseInt(formData.certification_years),
            passing_grade: assessment.passing_grade,
            min_watch_percentage: assessment.min_watch_percentage,
            block_video_skip: assessment.block_video_skip,
          }
        })
        .eq('id', courseData.id)

      if (settingsError) {
        console.warn('Erro ao salvar configurações:', settingsError)
        // Não falha o curso todo por causa disso
      }

      setSuccess('Curso criado com sucesso! Aguardando aprovação do administrador.')
      setTimeout(() => {
        onSuccess?.(courseData)
      }, 2000)
    } catch (err) {
      console.error('Erro ao criar curso:', err)
      setError(err.message || 'Erro ao criar curso. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function renderStepIndicator() {
    return (
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                currentStep === step.id
                  ? 'bg-surface-container-low text-primary font-semibold'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{step.icon}</span>
              <span className="font-['Inter'] text-sm font-medium">{step.label}</span>
            </button>
            {index < STEPS.length - 1 && (
              <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            )}
          </div>
        ))}
      </div>
    )
  }

  function renderBasicInfo() {
    return (
      <section className="space-y-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <h3 className="font-headline font-extrabold text-primary text-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">article</span>
              Informações Estruturais
            </h3>
          </div>

          <div className="col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-primary-container">
                Título do Curso
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-lg p-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Ex: Gestão de Riscos Ocupacionais conforme NR-01"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-primary-container">
                Descrição do Programa
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-lg p-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Descreva os objetivos, público-alvo e as diretrizes normativas abordadas..."
                rows={4}
              />
            </div>
          </div>

          <div className="col-span-4 space-y-6">
            {/* Validade da Certificação */}
            <div className="bg-primary text-on-primary p-8 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60">
                  Validade da Certificação
                </label>
                <div className="flex items-end gap-2">
                  <input
                    type="number"
                    value={formData.certification_years}
                    onChange={(e) => updateFormData('certification_years', e.target.value)}
                    className="w-20 bg-white/10 border-none rounded-lg p-3 text-white font-bold text-2xl focus:ring-0"
                    min="1"
                    max="10"
                  />
                  <span className="font-headline font-bold mb-3">ANOS</span>
                </div>
                <p className="text-[10px] opacity-70 leading-relaxed">
                  Conforme diretrizes de recapacitação obrigatória.
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
              </div>
            </div>

            {/* Carga Horária */}
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-transparent hover:border-outline-variant/30 transition-all">
              <label className="text-xs font-bold uppercase tracking-wider text-on-primary-container">
                Carga Horária Total
              </label>
              <div className="mt-4 flex items-center gap-4">
                <span className="material-symbols-outlined text-primary-container text-4xl">schedule</span>
                <div>
                  <input
                    type="number"
                    value={formData.workload_hours}
                    onChange={(e) => updateFormData('workload_hours', e.target.value)}
                    className="w-24 bg-transparent border-none p-0 text-3xl font-headline font-extrabold text-primary focus:ring-0"
                    min="1"
                    max="200"
                  />
                  <p className="text-xs font-medium text-on-surface-variant">Horas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configurações adicionais */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-6 bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-6">
            <h4 className="font-headline font-bold text-primary text-lg">Detalhes do Curso</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-primary-container">
                  Código da NR
                </label>
                <select
                  value={formData.nr_code}
                  onChange={(e) => updateFormData('nr_code', e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg p-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="NR-01">NR-01 - Disposições Gerais e GRO</option>
                  <option value="NR-05">NR-05 - CIPA</option>
                  <option value="NR-06">NR-06 - EPI</option>
                  <option value="NR-07">NR-07 - PCMSO</option>
                  <option value="NR-09">NR-09 - Avaliação de Riscos</option>
                  <option value="NR-10">NR-10 - Segurança em Eletricidade</option>
                  <option value="NR-12">NR-12 - Máquinas e Equipamentos</option>
                  <option value="NR-17">NR-17 - Ergonomia</option>
                  <option value="NR-18">NR-18 - Construção Civil</option>
                  <option value="NR-33">NR-33 - Espaços Confinados</option>
                  <option value="NR-35">NR-35 - Trabalho em Altura</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-primary-container">
                  Nível
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => updateFormData('level', e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg p-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="Basico">Básico</option>
                  <option value="Intermediario">Intermediário</option>
                  <option value="Avancado">Avançado</option>
                  <option value="Especialista">Especialista</option>
                  <option value="Pratico">Prático</option>
                  <option value="Reciclagem">Reciclagem</option>
                  <option value="Integracao">Integração</option>
                  <option value="CIPA">CIPA</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-primary-container">
                  Modalidade
                </label>
                <select
                  value={formData.modality}
                  onChange={(e) => updateFormData('modality', e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg p-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="Online">Online</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="Presencial">Presencial</option>
                </select>
              </div>
            </div>
          </div>

          <div className="col-span-6 bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-6">
            <h4 className="font-headline font-bold text-primary text-lg">Conteúdo Programático</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-primary-container">
                  Objetivos
                </label>
                <textarea
                  value={formData.objectives}
                  onChange={(e) => updateFormData('objectives', e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg p-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Descreva os objetivos do curso..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-primary-container">
                  Público-Alvo
                </label>
                <textarea
                  value={formData.target_audience}
                  onChange={(e) => updateFormData('target_audience', e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg p-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Para quem é este curso..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-primary-container">
                  Pré-requisitos (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={formData.prerequisites}
                  onChange={(e) => updateFormData('prerequisites', e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg p-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Ex: NR-01 Básico, Ensino Médio"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderModules() {
    return (
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="font-headline font-extrabold text-primary text-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">account_tree</span>
              Estrutura de Módulos
            </h3>
            <p className="text-on-surface-variant text-sm mt-2">
              Organize o conteúdo do curso em módulos e aulas.
            </p>
          </div>
          <button
            onClick={addModule}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Adicionar Módulo</span>
          </button>
        </div>

        <div className="space-y-6">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
              {/* Module Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary font-bold">
                    {moduleIndex + 1}
                  </div>
                  <input
                    type="text"
                    value={module.title}
                    onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                    placeholder={`Título do Módulo ${moduleIndex + 1}`}
                    className="bg-transparent border-none text-lg font-headline font-bold text-primary focus:ring-0 w-80"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addLesson(module.id)}
                    className="p-2 hover:bg-surface-container-high rounded-lg text-outline transition-colors"
                    title="Adicionar aula"
                  >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                  </button>
                  {modules.length > 1 && (
                    <button
                      onClick={() => removeModule(module.id)}
                      className="p-2 hover:bg-error-container rounded-lg text-error transition-colors"
                      title="Remover módulo"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Module Description */}
              <div className="mb-4">
                <textarea
                  value={module.description}
                  onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                  placeholder="Descrição do módulo (opcional)"
                  className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm text-on-surface focus:ring-0 resize-none"
                  rows={2}
                />
              </div>

              {/* Lessons */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Aulas ({module.lessons.length})
                </p>
                {module.lessons.map((lesson, lessonIndex) => (
                  <div key={lesson.id} className="bg-surface-container-low rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-on-surface-variant">
                          Aula {lessonIndex + 1}
                        </span>
                        <select
                          value={lesson.type}
                          onChange={(e) => updateLesson(module.id, lesson.id, 'type', e.target.value)}
                          className="bg-surface-container-lowest border-none rounded px-2 py-1 text-xs font-medium focus:ring-0"
                        >
                          <option value="video">🎥 Vídeo</option>
                          <option value="pdf">📄 PDF</option>
                          <option value="quiz">❓ Questionário</option>
                          <option value="text">📝 Texto</option>
                        </select>
                      </div>
                      <button
                        onClick={() => removeLesson(module.id, lesson.id)}
                        className="p-1 hover:bg-error-container rounded text-error transition-colors"
                        title="Remover aula"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={lesson.title}
                      onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                      placeholder="Título da aula"
                      className="w-full bg-surface-container-lowest border-none rounded-lg p-2 text-sm text-on-surface focus:ring-0"
                    />

                    {lesson.type === 'video' && (
                      <>
                        <input
                          type="url"
                          value={lesson.content_url}
                          onChange={(e) => updateLesson(module.id, lesson.id, 'content_url', e.target.value)}
                          placeholder="URL do vídeo (YouTube, Vimeo, ou link direto)"
                          className="w-full bg-surface-container-lowest border-none rounded-lg p-2 text-sm text-on-surface focus:ring-0"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-on-surface-variant">Duração (minutos):</label>
                          <input
                            type="number"
                            value={lesson.duration_minutes || ''}
                            onChange={(e) => updateLesson(module.id, lesson.id, 'duration_minutes', parseInt(e.target.value) || 0)}
                            className="w-20 bg-surface-container-lowest border-none rounded-lg p-2 text-sm text-on-surface focus:ring-0"
                            min="0"
                          />
                        </div>
                      </>
                    )}

                    {lesson.type === 'pdf' && (
                      <input
                        type="url"
                        value={lesson.content_url}
                        onChange={(e) => updateLesson(module.id, lesson.id, 'content_url', e.target.value)}
                        placeholder="URL do PDF"
                        className="w-full bg-surface-container-lowest border-none rounded-lg p-2 text-sm text-on-surface focus:ring-0"
                      />
                    )}
                  </div>
                ))}

                {module.lessons.length === 0 && (
                  <button
                    onClick={() => addLesson(module.id)}
                    className="w-full py-8 border-2 border-dashed border-outline-variant/50 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                    <span className="text-sm font-medium">Adicionar primeira aula</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {modules.length === 0 && (
          <div className="text-center py-16 bg-surface-container-lowest rounded-xl">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">folder_open</span>
            <p className="text-xl font-headline font-bold text-on-surface-variant">Nenhum módulo criado</p>
            <p className="text-sm text-on-surface-variant mt-1">Clique em "Adicionar Módulo" para começar</p>
          </div>
        )}
      </section>
    )
  }

  function renderAssessment() {
    return (
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h3 className="font-headline font-extrabold text-primary text-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">fact_check</span>
            Configuração da Avaliação
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Card: Média de Aprovação */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-secondary-container">
            <div className="flex items-start justify-between mb-4">
              <span className="material-symbols-outlined text-primary-container text-3xl">grade</span>
              <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded">
                <span className="text-[10px] font-bold">NOTA</span>
              </div>
            </div>
            <h4 className="font-headline font-bold text-primary text-sm leading-tight">Média de Aprovação</h4>
            <p className="text-[10px] text-on-surface-variant mt-1">
              Pontuação mínima necessária na avaliação final.
            </p>
            <div className="mt-6 flex items-center justify-center">
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={assessment.passing_grade}
                onChange={(e) => setAssessment(prev => ({ ...prev, passing_grade: parseFloat(e.target.value) }))}
                className="bg-surface-container-low border-none w-20 text-center font-headline font-extrabold text-2xl text-primary rounded-lg"
              />
            </div>
          </div>

          {/* Card: Progressão Mínima */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-primary">
            <div className="flex items-start justify-between mb-4">
              <span className="material-symbols-outlined text-primary-container text-3xl">timer</span>
              <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded">
                <span className="text-[10px] font-bold">MIN</span>
              </div>
            </div>
            <h4 className="font-headline font-bold text-primary text-sm leading-tight">Tempo de Permanência</h4>
            <p className="text-[10px] text-on-surface-variant mt-1">
              Percentual mínimo assistido para liberar próximo módulo.
            </p>
            <div className="mt-6">
              <div className="flex justify-between text-xs font-bold text-primary mb-2">
                <span>Progressão</span>
                <span>{assessment.min_watch_percentage}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={assessment.min_watch_percentage}
                onChange={(e) => setAssessment(prev => ({ ...prev, min_watch_percentage: parseInt(e.target.value) }))}
                className="w-full h-2 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* Card: Bloqueio de Avanço */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-tertiary-fixed-dim">
            <div className="flex items-start justify-between mb-4">
              <span className="material-symbols-outlined text-primary-container text-3xl">security</span>
              <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded">
                <span className="text-[10px] font-bold">SEG</span>
              </div>
            </div>
            <h4 className="font-headline font-bold text-primary text-sm leading-tight">Bloqueio de Avanço</h4>
            <p className="text-[10px] text-on-surface-variant mt-1">
              Impedir usuário de pular capítulos do vídeo.
            </p>
            <div className="mt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={assessment.block_video_skip}
                  onChange={(e) => setAssessment(prev => ({ ...prev, block_video_skip: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ml-3 text-xs font-bold text-primary">
                  {assessment.block_video_skip ? 'Ativado' : 'Desativado'}
                </span>
              </label>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderCompliance() {
    return (
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h3 className="font-headline font-extrabold text-primary text-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">gavel</span>
            Regras de Conformidade
          </h3>
          <div className="bg-on-primary-fixed-variant/10 px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-[10px] font-bold text-primary uppercase">Auditável por NR-01</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-6">
          <h4 className="font-headline font-bold text-primary text-lg">Configurações de Conformidade</h4>
          <p className="text-on-surface-variant text-sm">
            Estas configurações garantem que o curso esteja em conformidade com as normas regulamentadoras
            e podem ser auditadas pelos órgãos fiscalizadores.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-primary-container">
                Requisitos de Certificação
              </label>
              <textarea
                className="w-full bg-surface-container-low border-none rounded-lg p-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Descreva os requisitos para obtenção do certificado..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-primary-container">
                Referências Normativas
              </label>
              <textarea
                className="w-full bg-surface-container-low border-none rounded-lg p-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Liste as NRs e artigos aplicáveis..."
                rows={4}
              />
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary">info</span>
            <div>
              <p className="text-sm font-semibold text-primary">Informação Importante</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Após o envio, o curso será analisado pela equipe de conformidade antes de ser disponibilizado
                aos Colaboradores. O processo de aprovação pode levar até 48 horas úteis.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderCurrentStep() {
    switch (currentStep) {
      case 'basic':
        return renderBasicInfo()
      case 'modules':
        return renderModules()
      case 'assessment':
        return renderAssessment()
      case 'compliance':
        return renderCompliance()
      default:
        return renderBasicInfo()
    }
  }

  function handleNextStep() {
    const stepIndex = STEPS.findIndex(s => s.id === currentStep)
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id)
    }
  }

  function handlePrevStep() {
    const stepIndex = STEPS.findIndex(s => s.id === currentStep)
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id)
    }
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)
  const isLastStep = currentStepIndex === STEPS.length - 1
  const isFirstStep = currentStepIndex === 0

  return (
    <div className="bg-surface font-body text-on-surface antialiased flex h-screen overflow-hidden">
      {/* SideBar - Steps */}
      <aside className="h-screen w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[20px_0_40px_rgba(9,20,38,0.02)] flex flex-col py-8 px-4 gap-2 z-20">
        <div className="px-4 mb-10">
          <h1 className="font-headline font-extrabold text-slate-900 dark:text-white text-2xl tracking-tight leading-tight">
            Occupational Excellence
          </h1>
          <p className="text-xs text-on-surface-variant font-medium mt-1">SISTEMA DE GESTÃO NR-01</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <div className="px-4 py-2 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-primary-container">
              Etapas do Criador
            </p>
          </div>
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out text-left ${
                currentStep === step.id
                  ? 'text-primary font-semibold bg-surface-container-low before:content-[\'\'] before:absolute before:left-0 before:w-1 before:h-6 before:bg-primary before:rounded-full'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{step.icon}</span>
              <span className="font-['Inter'] text-sm font-medium">{step.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto px-4 pt-8 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 bg-surface-container rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
              {user?.full_name?.charAt(0) || 'P'}
            </div>
            <div>
              <p className="text-xs font-bold text-primary">{user?.full_name || 'Professor'}</p>
              <p className="text-[10px] text-on-surface-variant">{user?.specialty || 'Instrutor'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TopBar */}
        <header className="flex justify-between items-center px-8 h-16 w-full bg-surface dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 z-10">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-on-primary-container">edit_document</span>
            <h2 className="font-['Manrope'] font-bold tracking-tight text-slate-900 dark:text-slate-50 text-lg">
              Criar Novo Curso NR-01
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.title}
              className="px-6 py-2 text-sm font-bold bg-primary text-white rounded-lg shadow-lg opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar para Aprovação'}
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-surface-container-low p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Messages */}
            {error && (
              <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}
            {success && (
              <div className="bg-primary-fixed text-on-primary-fixed-variant px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {success}
              </div>
            )}

            {renderCurrentStep()}

            {/* Footer Navigation */}
            <div className="flex justify-between items-center py-10 border-t border-slate-200">
              <button
                onClick={handlePrevStep}
                disabled={isFirstStep}
                className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                {isFirstStep ? 'Dados Básicos' : STEPS[currentStepIndex - 1]?.label}
              </button>

              <div className="flex items-center gap-2">
                {STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentStepIndex ? 'bg-primary w-6' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              {isLastStep ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.title}
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg font-bold text-sm shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Finalizar e Enviar'}
                  <span className="material-symbols-outlined">check</span>
                </button>
              ) : (
                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg font-bold text-sm shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                >
                  Próxima: {STEPS[currentStepIndex + 1]?.label}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default NewCoursePage
