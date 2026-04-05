import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

function CourseDetailsPage({ courseId, onBack }) {
  const { addItem, openCart } = useCart()
  const [courseData, setCourseData] = useState(null)
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)

  // Buscar dados completos do curso no banco
  useEffect(() => {
    async function loadCourseDetails() {
      setLoading(true)
      setError(null)

      try {
        console.log('🔍 Buscando curso com ID:', courseId)

        // 1. Buscar curso
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single()

        if (courseError) {
          console.error('❌ Erro ao buscar curso:', courseError)
          setError(courseError.message || 'Erro ao carregar o curso')
          setCourseData(null)
          return
        }

        console.log('✅ Curso encontrado:', course.title)
        setCourseData(course)

        // 2. Buscar módulos do curso
        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true })

        console.log('📦 Módulos encontrados:', modulesData?.length || 0, modulesData)

        if (modulesError) {
          console.error('❌ Erro ao buscar módulos:', modulesError)
          setModules([])
        } else {
          // 3. Buscar aulas dos módulos
          if (modulesData && modulesData.length > 0) {
            const moduleIds = modulesData.map(m => m.id)
            const { data: lessonsData, error: lessonsError } = await supabase
              .from('course_lessons')
              .select('*')
              .in('module_id', moduleIds)
              .order('order_index', { ascending: true })

            console.log('📚 Aulas encontradas:', lessonsData?.length || 0, lessonsData)

            if (lessonsError) {
              console.error('❌ Erro ao buscar aulas:', lessonsError)
            }

            // 4. Agrupar aulas por módulo
            const lessonsByModule = {}
            if (lessonsData) {
              lessonsData.forEach(lesson => {
                if (!lessonsByModule[lesson.module_id]) {
                  lessonsByModule[lesson.module_id] = []
                }
                lessonsByModule[lesson.module_id].push(lesson)
              })
            }

            // 5. Montar estrutura de módulos com aulas
            const modulesWithLessons = modulesData.map(module => ({
              ...module,
              lessons: lessonsByModule[module.id] || []
            }))

            setModules(modulesWithLessons)
          } else {
            setModules([])
          }
        }
      } catch (err) {
        console.error('❌ Erro inesperado:', err)
        setError(err.message || 'Erro inesperado ao carregar o curso')
        setCourseData(null)
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      loadCourseDetails()
    }
  }, [courseId])

  if (loading) {
    return (
      <div className="bg-surface font-body text-on-surface min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="material-symbols-outlined text-6xl text-primary animate-spin mb-4">
            progress_activity
          </div>
          <p className="text-xl font-headline font-bold text-on-surface-variant">
            Carregando curso...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-surface font-body text-on-surface min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <span className="material-symbols-outlined text-6xl text-error mb-4">
            error_outline
          </span>
          <p className="text-xl font-headline font-bold text-on-surface-variant mb-2">
            Erro ao carregar curso
          </p>
          <p className="text-sm text-on-surface-variant mb-6">
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all"
            >
              Tentar novamente
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-surface-container-high text-on-surface-variant rounded-xl font-bold hover:opacity-90 transition-all border border-outline-variant"
            >
              Voltar ao Catálogo
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!courseData) {
    return (
      <div className="bg-surface font-body text-on-surface min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">
            search_off
          </span>
          <p className="text-xl font-headline font-bold text-on-surface-variant mb-2">
            Curso não encontrado
          </p>
          <p className="text-sm text-on-surface-variant mb-6">
            O curso que você procura não está disponível ou foi removido.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all"
          >
            Voltar ao Catálogo
          </button>
        </div>
      </div>
    )
  }

  const {
    nr_code: nr,
    level,
    title,
    workload_hours: hours,
    modality,
    price_cents: priceCents,
    image_url: image,
    has_esocial: hasESocial,
    description,
    target_audience: targetAudience,
    id,
  } = courseData

  const modalityIcons = {
    'Online': 'devices',
    'Presencial': 'people',
    'Híbrido': 'groups',
  }

  const modalityIcon = modalityIcons[modality] || 'devices'

  const price = (priceCents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  function handleAddToCart() {
    setIsAdding(true)
    for (let i = 0; i < quantity; i++) {
      addItem({
        id,
        nr,
        title,
        priceCents,
        image,
      })
    }
    openCart()
    setTimeout(() => setIsAdding(false), 600)
  }

  function incrementQuantity() {
    setQuantity((prev) => prev + 1)
  }

  function decrementQuantity() {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))
  }

  const faqData = [
    {
      question: 'O certificado tem validade jurídica em todo o Brasil?',
      answer:
        'Sim. Nossos cursos são elaborados conforme as diretrizes da NR-01 e possuem validade em todo o território nacional, aceitos por órgãos fiscalizadores e auditorias.',
    },
    {
      question: 'Como funciona o treinamento prático?',
      answer:
        'O treinamento prático é realizado em nossa estrutura certificada, com torres de treinamento e equipamentos de proteção individual e coletiva. O Colaborador agenda a parte prática após concluir o módulo teórico online.',
    },
    {
      question: 'Posso comprar licenças para toda a minha equipe?',
      answer:
        'Sim! Oferecemos pacotes corporativos com condições especiais para treinamentos acima de 50 colaboradores, incluindo portal de gestão exclusivo e relatórios de conformidade.',
    },
  ]

  return (
    <div className="bg-surface font-body text-on-surface">
      {/* Top Navigation Bar */}
      <header className="bg-surface-container-low sticky top-0 z-50 shadow-sm">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-primary hover:text-primary-container transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-headline font-bold">Voltar ao Catálogo</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-on-surface-variant hover:opacity-90 transition-all">
              shopping_cart
            </button>
            <button className="material-symbols-outlined text-on-surface-variant hover:opacity-90 transition-all">
              account_circle
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-8 py-12 lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Content Area */}
        <div className="lg:col-span-8 space-y-12">
          {/* Hero Header Section */}
          <section className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <span className="bg-primary-container text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {nr} {level}
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-headline font-extrabold text-primary tracking-tighter">
              {title}
            </h1>
            <div className="bg-surface-container-low p-6 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Carga Horária
                </p>
                <p className="text-xl font-bold text-primary font-headline">
                  {hours} Horas
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Modalidade
                </p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    {modalityIcon}
                  </span>
                  <p className="text-xl font-bold text-primary font-headline">
                    {modality}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Nível
                </p>
                <p className="text-xl font-bold text-primary font-headline">
                  {level}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Certificado
                </p>
                <p className="text-xl font-bold text-primary font-headline">
                  Digital/Impresso
                </p>
              </div>
            </div>
          </section>

          {/* Description & Sections */}
          <section className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold font-headline text-primary">
                Descrição do Curso
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <p className="text-on-surface-variant leading-relaxed text-lg">
                    {description || 'Este treinamento estabelece os requisitos mínimos e as medidas de proteção conforme as normas regulamentadoras vigentes, focando na prevenção de acidentes e na capacitação completa dos trabalhadores.'}
                  </p>
                </div>
                <div className="md:col-span-1">
                  <div className="rounded-xl overflow-hidden shadow-lg border border-outline-variant/10">
                    <img
                      src={image || 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80'}
                      alt={title}
                      className="w-full h-full object-cover aspect-square"
                    />
                  </div>
                </div>
              </div>
            </div>

            {targetAudience && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline text-primary">
                  Público-alvo
                </h2>
                <div className="flex flex-wrap gap-3">
                  {targetAudience.split(',').map((audience, index) => (
                    <span key={index} className="bg-surface-container-highest px-4 py-2 rounded-lg text-on-surface font-medium border border-outline-variant/10">
                      {audience.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Módulos e Aulas */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold font-headline text-primary">
                Módulos e Aulas
              </h2>
              {modules && modules.length > 0 ? (
                <>
                  <p className="text-sm text-on-surface-variant">
                    ({modules.length} módulo{modules.length !== 1 ? 's' : ''} encontrado{modules.length !== 1 ? 's' : ''})
                  </p>
                  <div className="space-y-4">
                    {modules.map((module, moduleIndex) => (
                      <div key={module.id} className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10">
                        {/* Header do Módulo */}
                        <div className="bg-primary/5 p-6 border-b border-outline-variant/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-headline">
                                {moduleIndex + 1}
                              </span>
                              <div>
                                <h3 className="text-lg font-bold font-headline text-primary">
                                  {module.title}
                                </h3>
                                {module.estimated_minutes && (
                                  <p className="text-xs text-on-surface-variant">
                                    Duração estimada: {module.estimated_minutes} min
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="bg-surface-container-highest px-3 py-1 rounded-lg text-xs font-bold text-on-surface-variant">
                              {module.lessons?.length || 0} {module.lessons?.length === 1 ? 'aula' : 'aulas'}
                            </span>
                          </div>
                          {module.description && (
                            <p className="text-sm text-on-surface-variant mt-3">
                              {module.description}
                            </p>
                          )}
                        </div>

                        {/* Lista de Aulas */}
                        <div className="divide-y divide-outline-variant/10">
                          {module.lessons && module.lessons.length > 0 ? (
                            module.lessons.map((lesson, lessonIndex) => (
                              <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                                <div className="flex items-center gap-4">
                                  <span className="text-sm font-bold text-on-surface-variant w-6">
                                    {lessonIndex + 1}
                                  </span>
                                  <div>
                                    <p className="font-medium text-on-surface">
                                      {lesson.title}
                                    </p>
                                    {lesson.description && (
                                      <p className="text-xs text-on-surface-variant mt-1">
                                        {lesson.description}
                                      </p>
                                    )}
                                  </div>
                                  {lesson.is_preview && (
                                    <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                      Preview
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="material-symbols-outlined text-lg text-outline">
                                    {lesson.content_type === 'video' ? 'play_circle' :
                                      lesson.content_type === 'quiz' ? 'quiz' :
                                        lesson.content_type === 'document' ? 'description' :
                                          lesson.content_type === 'presentation' ? 'slideshow' :
                                            'article'}
                                  </span>
                                  {lesson.duration_minutes && (
                                    <span className="text-xs text-on-surface-variant">
                                      {lesson.duration_minutes} min
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center text-on-surface-variant text-sm">
                              Nenhuma aula cadastrada neste módulo
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-surface-container-low rounded-xl p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">
                    inventory_2
                  </span>
                  <p className="text-on-surface-variant font-medium">
                    Nenhum módulo cadastrado para este curso
                  </p>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Os módulos e aulas serão adicionados em breve
                  </p>
                </div>
              )}
            </div>

            {/* Methodology & Transparency */}
            <div className="bg-primary p-10 rounded-2xl text-white overflow-hidden relative">
              <div className="relative z-10 space-y-4">
                <h2 className="text-3xl font-bold font-headline">
                  Metodologia Exclusiva
                </h2>
                <p className="text-on-primary-container text-lg max-w-xl">
                  Utilizamos simuladores de realidade virtual e aulas práticas em
                  torres de treinamento certificadas. Nosso método "Safety-First"
                  garante que 70% do tempo seja dedicado à aplicação prática dos
                  conceitos.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                <span
                  className="material-symbols-outlined text-[200px]"
                  style={{ fontVariationSettings: "'wght' 100" }}
                >
                  engineering
                </span>
              </div>
            </div>

            {/* FAQ */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold font-headline text-primary">
                Perguntas Frequentes
              </h2>
              <div className="divide-y divide-outline-variant/20">
                {faqData.map((faq, index) => (
                  <div key={index} className="py-4">
                    <button
                      onClick={() =>
                        setExpandedFaq(expandedFaq === index ? null : index)
                      }
                      className="flex justify-between items-center w-full text-left group"
                    >
                      <span className="font-bold text-primary group-hover:text-primary-container transition-colors">
                        {faq.question}
                      </span>
                      <span className="material-symbols-outlined text-outline">
                        {expandedFaq === index ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    {expandedFaq === index && (
                      <div className="mt-2 text-on-surface-variant text-sm">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Sticky Column */}
        <aside className="lg:col-span-4 mt-12 lg:mt-0">
          <div className="sticky top-28 space-y-6">
            <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border border-outline-variant/10 space-y-8">
              <div className="space-y-2">
                <p className="text-on-surface-variant font-medium">A partir de</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-primary">R$</span>
                  <span className="text-4xl font-headline font-extrabold text-primary">
                    {price}
                  </span>
                  <span className="text-sm text-on-surface-variant">/licença</span>
                </div>
                <div className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">
                    savings
                  </span>
                  Economize 15% em pacotes corporativos
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Quantidade de Licenças
                </p>
                <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
                  <button
                    onClick={decrementQuantity}
                    className="w-10 h-10 bg-white border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-all flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <span className="flex-1 text-center text-xl font-bold font-headline">
                    {quantity}
                  </span>
                  <button
                    onClick={incrementQuantity}
                    className="w-10 h-10 bg-white border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-all flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <p className="text-[10px] text-on-surface-variant text-center font-bold uppercase tracking-widest">
                  Acesso imediato após confirmação
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  className={`w-full py-4 rounded-xl font-headline font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isAdding
                    ? 'bg-green-600 text-white scale-105'
                    : 'bg-primary text-white hover:opacity-90'
                    }`}
                >
                  <span className="material-symbols-outlined">
                    {isAdding ? 'check' : 'shopping_cart'}
                  </span>
                  {isAdding ? 'Adicionado!' : 'Adicionar ao Carrinho'}
                </button>
                <button className="w-full py-4 rounded-xl font-headline font-bold border-2 border-primary text-primary hover:bg-primary/5 transition-all">
                  Falar com Consultor
                </button>
              </div>

              <div className="divide-y divide-outline-variant/10 space-y-4 pt-2">
                <div className="flex items-center gap-3 text-sm text-on-surface-variant pt-4">
                  <span className="material-symbols-outlined text-primary">
                    security
                  </span>
                  Pagamento 100% Seguro
                </div>
                <div className="flex items-center gap-3 text-sm text-on-surface-variant pt-4">
                  <span className="material-symbols-outlined text-primary">
                    download
                  </span>
                  Download imediato de material
                </div>
              </div>
            </div>

            {/* In-Company Training Banner */}
            <div className="bg-surface-container-highest p-6 rounded-2xl space-y-4 border border-outline-variant/10">
              <h3 className="text-xl font-bold font-headline text-primary">
                Precisa de Treinamento In-Company?
              </h3>
              <p className="text-sm text-on-surface-variant">
                Levamos nossa estrutura até sua empresa para treinamentos presenciais
                customizados.
              </p>
              <button className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all group">
                Saiba mais
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low mt-20 border-t border-outline-variant/10">
        <div className="max-w-[1440px] mx-auto px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg font-headline">S</span>
              </div>
              <span className="font-headline font-bold text-xl text-primary">
                SISEG
              </span>
            </div>
            <div className="text-sm text-on-surface-variant">
              © 2026 SISEG Treinamentos. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default CourseDetailsPage
