import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function CoursePlayer({ course, enrollment, onBack }) {
  const { user } = useAuth()
  const [currentModule, setCurrentModule] = useState(1)
  const [currentLesson, setCurrentLesson] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [updating, setUpdating] = useState(false)
  
  // Inicializar aulas concluídas baseado no progresso da matrícula
  const initialCompleted = new Set()
  if (enrollment?.progress_percentage) {
    const completedCount = Math.round((enrollment.progress_percentage / 100) * 7) // 7 aulas totais
    for (let i = 1; i <= completedCount; i++) initialCompleted.add(i)
  }
  const [completedLessons, setCompletedLessons] = useState(initialCompleted)

  // Total de aulas no curso
  const totalLessons = 7 // Fixo para este exemplo
  const progressPercent = Math.min(100, Math.round((completedLessons.size / totalLessons) * 100))

  // Dados simulados do curso (virão do Supabase futuramente)
  const courseData = {
    id: course?.id || 1,
    title: course?.title || 'NR-01 Disposições Gerais e Gerenciamento de Riscos',
    modules: [
      {
        id: 1,
        title: 'Introdução',
        lessons: [
          { id: 1, title: 'Fundamentos da NR-01', duration: '15:00', type: 'video' },
          { id: 2, title: 'Histórico da Norma', duration: '10:30', type: 'video' },
        ]
      },
      {
        id: 2,
        title: 'Avaliação de Riscos',
        lessons: [
          { id: 3, title: 'Padrões de Segurança', duration: '25:00', type: 'video' },
          { id: 4, title: 'Mitigação de Riscos', duration: '20:00', type: 'video' },
          { id: 5, title: 'Execução Prática', duration: '30:00', type: 'video' },
        ]
      },
      {
        id: 3,
        title: 'Certificação',
        lessons: [
          { id: 6, title: 'Avaliação Final', duration: '45:00', type: 'quiz' },
          { id: 7, title: 'Emissão de Certificado', duration: '05:00', type: 'certificate' },
        ]
      }
    ]
  }

  // Aula atual
  const currentLessonData = courseData.modules[currentModule - 1]?.lessons[currentLesson]
  const isLessonCompleted = completedLessons.has(currentLessonData?.id)

  // Navegação
  function goToLesson(moduleIdx, lessonIdx) {
    setCurrentModule(moduleIdx + 1)
    setCurrentLesson(lessonIdx)
    setIsPlaying(false)
  }

  async function markAsCompleted() {
    if (currentLessonData && !isLessonCompleted && !updating) {
      setUpdating(true)
      
      // Adicionar aula atual ao conjunto de concluídas
      const newCompleted = new Set(completedLessons)
      newCompleted.add(currentLessonData.id)
      setCompletedLessons(newCompleted)
      
      // Calcular novo progresso
      const newProgress = Math.min(100, Math.round((newCompleted.size / totalLessons) * 100))
      
      console.log('📊 Debug markAsCompleted:', {
        enrollmentId: enrollment?.id,
        currentLessonId: currentLessonData?.id,
        completedCount: newCompleted.size,
        totalLessons,
        newProgress
      })
      
      if (!enrollment?.id) {
        alert('Erro: Matrícula não encontrada. Por favor, recarregue a página.')
        setUpdating(false)
        return
      }
      
      try {
        // Atualizar progresso no banco de dados
        const updateData = {
          progress_percentage: newProgress,
          last_access_at: new Date().toISOString()
        }
        
        // Se completou 100%, marcar como concluído
        if (newProgress >= 100) {
          updateData.status = 'completed'
          updateData.completed_at = new Date().toISOString()
        }
        
        console.log('🔄 Enviando update para enrollment:', enrollment.id, updateData)
        
        const { data, error } = await supabase
          .from('enrollments')
          .update(updateData)
          .eq('id', enrollment.id)
          .select()
        
        if (error) {
          console.error('❌ Erro ao atualizar progresso:', error)
          throw error
        }
        
        console.log('✅ Progresso atualizado:', data)
        
        if (newProgress >= 100) {
          alert('🎉 Parabéns! Você concluiu o curso! Seu certificado será emitido em breve.')
        }
      } catch (err) {
        console.error('Erro ao atualizar progresso:', err)
        alert('Erro ao salvar progresso: ' + err.message)
      } finally {
        setUpdating(false)
      }
    }
  }

  function nextLesson() {
    const module = courseData.modules[currentModule - 1]
    if (currentLesson < module.lessons.length - 1) {
      goToLesson(currentModule - 1, currentLesson + 1)
    } else if (currentModule < courseData.modules.length) {
      goToLesson(currentModule, 0)
    }
  }

  function prevLesson() {
    if (currentLesson > 0) {
      goToLesson(currentModule - 1, currentLesson - 1)
    } else if (currentModule > 1) {
      const prevModule = courseData.modules[currentModule - 2]
      goToLesson(currentModule - 2, prevModule.lessons.length - 1)
    }
  }

  // Renderizar ícone de status da lição
  function renderLessonIcon(lesson, moduleIdx, lessonIdx) {
    const lessonId = lesson.id
    const isCompleted = completedLessons.has(lessonId)
    const isCurrent = currentModule - 1 === moduleIdx && currentLesson === lessonIdx
    const isLocked = moduleIdx > 1 && !completedLessons.has(courseData.modules[moduleIdx - 1]?.lessons[0]?.id)

    if (isCurrent) {
      return <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
    }
    if (isCompleted) {
      return <span className="material-symbols-outlined text-sm text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
    }
    if (isLocked) {
      return <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
    }
    return <span className="material-symbols-outlined text-sm text-slate-400" style={{ fontVariationSettings: "'FILL' 0" }}>circle</span>
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* TopNavBar */}
      <header className="w-full h-16 sticky top-0 z-30 flex items-center justify-between px-8 bg-slate-50/80 backdrop-blur-md font-body text-sm border-b border-outline-variant/10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-primary">shield</span>
            <span className="font-headline font-extrabold tracking-tight text-primary text-lg">NR-01 Plataforma</span>
          </button>
          <div className="h-4 w-px bg-outline-variant/30"></div>
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant font-medium">{courseData.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative flex items-center bg-surface-container-low px-3 py-1.5 rounded-lg border border-transparent focus-within:border-primary/20 transition-all">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-48 placeholder:text-on-secondary-container outline-none" placeholder="Buscar aulas..." type="text"/>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">notifications</button>
            <div className="h-8 w-8 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-sm">person</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Main Content Area */}
        <main className="flex-1 px-12 py-8 mr-80">
          {/* Breadcrumbs & Status */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-xs font-label uppercase tracking-widest text-on-surface-variant">
              <span>Módulo {currentModule}</span>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="text-primary font-bold">{currentLessonData?.title || 'Aula'}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">Tempo Gasto</span>
                <span className="font-headline font-bold text-primary">12:45 <span className="text-xs font-normal text-on-secondary-container">/ {currentLessonData?.duration || '25:00'}</span></span>
              </div>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.02)] overflow-hidden">
            {/* Video/Media Header */}
            <div className="aspect-video bg-primary relative group cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
              <img 
                className="w-full h-full object-cover opacity-60" 
                alt="Curso NR-01"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-OVfI2sBdtUZyAWy4RSgEXE2rvZGLNe-7fAUnff7gzVvihDquxAwAW_Z-Ip4uKKza3CuMGoXf-yIkt-EYxPzIdylX5gjT5xFMFgvLXtJqkKXvfL8JgUUokvkT8GT56fJgaOJ_SS6Cvg_cMYs3FZKpi7pIbVZdRtqIoieKwquNpPIdOEFe6ETpFjuMQjMh5GrGwOPCCUaH9YuzTQsZzYE-2YGVprlWipanPTeN1qrDIa4J0bAuNfxgKUpaNArarHSyfJXQMdEln-g"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20">
                  <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </div>
              </div>
              {/* Custom Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                <div className="h-full bg-linear-to-r from-primary-fixed to-primary w-1/2"></div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-8 flex items-center justify-between bg-white">
              <div>
                <h1 className="text-2xl font-headline font-extrabold text-primary mb-1">
                  NR-01 {currentModule}.{currentLesson + 1}: {currentLessonData?.title}
                </h1>
                <p className="text-on-surface-variant text-sm">Compreenda os fundamentos da norma regulamentadora e sua aplicação prática no ambiente corporativo.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={markAsCompleted}
                  disabled={isLessonCompleted || updating}
                  className={`px-6 py-3 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                    isLessonCompleted
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : updating
                        ? 'bg-primary/50 text-white cursor-wait'
                        : 'bg-primary text-white hover:opacity-90'
                  }`}
                >
                  {updating ? (
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: isLessonCompleted ? "'FILL' 1" : "'FILL' 0" }}>
                      {isLessonCompleted ? 'check_circle' : 'check_circle'}
                    </span>
                  )}
                  {isLessonCompleted ? 'Concluída' : updating ? 'Salvando...' : 'Marcar como Concluída'}
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between">
            <button 
              onClick={prevLesson}
              disabled={currentModule === 1 && currentLesson === 0}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Aula Anterior
            </button>
            <div className="flex-1 mx-12">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Progresso do Curso</span>
                <span className="text-xs font-bold text-primary">{progressPercent}%</span>
              </div>
              <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
            <button 
              onClick={nextLesson}
              disabled={currentModule === courseData.modules.length && currentLesson === courseData.modules[courseData.modules.length - 1].lessons.length - 1}
              className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity font-bold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Próxima Aula
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </main>

        {/* NavigationDrawer (Sidebar) */}
        <aside className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 z-20 bg-white border-l border-slate-200/15 flex flex-col shadow-[-10px_0_30px_rgba(9,20,38,0.02)]">
          <div className="p-6 border-b border-surface-container-low">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Progresso das Aulas</span>
            <h2 className="font-headline font-bold text-primary text-lg leading-tight">{courseData.title}</h2>
            <p className="text-xs text-on-surface-variant mt-1">{completedLessons.size} de {totalLessons} aulas concluídas</p>
            <div className="mt-3 h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
            {courseData.modules.map((module, moduleIdx) => {
              const isActive = currentModule - 1 === moduleIdx
              const isCompleted = module.lessons.every(l => completedLessons.has(l.id))
              
              return (
                <div key={module.id}>
                  <h3 className={`px-2 mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] ${isActive ? 'text-primary' : 'text-on-secondary-container'}`}>
                    Módulo {module.id}: {module.title}
                  </h3>
                  <div className="space-y-1">
                    {module.lessons.map((lesson, lessonIdx) => {
                      const isCurrent = isActive && currentLesson === lessonIdx
                      const isLessonDone = completedLessons.has(lesson.id)
                      const isLocked = moduleIdx > 0 && !completedLessons.has(courseData.modules[moduleIdx - 1]?.lessons[0]?.id) && !isLessonDone

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => !isLocked && goToLesson(moduleIdx, lessonIdx)}
                          disabled={isLocked}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all group ${
                            isCurrent 
                              ? 'bg-slate-100 text-slate-900 font-medium' 
                              : isLocked 
                                ? 'text-slate-500/50 cursor-not-allowed'
                                : 'text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {renderLessonIcon(lesson, moduleIdx, lessonIdx)}
                          <span className={`text-sm ${isCurrent ? 'font-semibold' : 'font-medium'}`}>
                            {lesson.title}
                          </span>
                          <span className="ml-auto text-[10px] text-slate-400">{lesson.duration}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-6 bg-surface-container-low border-t border-slate-200/10">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <p className="text-[10px] font-bold text-on-secondary-container uppercase tracking-widest mb-2">Precisa de Ajuda?</p>
              <button className="w-full py-2 bg-primary-fixed text-primary text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-sm">support_agent</span>
                Contatar Mentor
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default CoursePlayer
