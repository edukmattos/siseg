import { useState, useEffect } from 'react'
import { CartProvider } from './context/CartContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { supabase } from './lib/supabase'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import CourseCard from './components/CourseCard'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import LoginPage from './pages/LoginPage'
import AuthPasswordForgotPage from './pages/AuthPasswordForgotPage'
import AuthPasswordResetPage from './pages/AuthPasswordResetPage'
import CompanyRegisterPage from './pages/CompanyRegisterPage'
import CompanyDashboard from './pages/CompanyDashboard'
import CompanyDashboardOrders from './pages/CompanyDashboardOrders'
import StudentDashboard from './pages/StudentDashboard'
import StudentDashboardSettings from './pages/StudentDashboardSettings'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import SuperAdminDashboardAudit from './pages/SuperAdminDashboardAudit'
import TeacherManagement from './pages/TeacherManagement'
import InstructorDashboard from './pages/InstructorDashboard'
import NewCoursePage from './pages/NewCoursePage'
import CourseDetailsPage from './pages/CourseDetailsPage'
import './App.css'

function AppContent() {
  const { isAuthenticated, isStudent, isSuperAdmin, isInstructor, user } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showPasswordForgot, setShowPasswordForgot] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [showCompanyRegister, setShowCompanyRegister] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [showStudentDashboard, setShowStudentDashboard] = useState(false)
  const [showStudentSettings, setShowStudentSettings] = useState(false)
  const [showSuperAdminDashboard, setShowSuperAdminDashboard] = useState(false)
  const [showInstructorDashboard, setShowInstructorDashboard] = useState(false)
  const [showNewCourse, setShowNewCourse] = useState(false)
  const [showAuditDashboard, setShowAuditDashboard] = useState(false)
  const [showTeacherManagement, setShowTeacherManagement] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [filters, setFilters] = useState({ category: null, modalities: null, level: null })
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(true)

  // Redirecionar para dashboard correto após login
  // Detectar recuperação de senha via hash na URL
  useEffect(() => {
    const hash = window.location.hash

    // Verificar se é uma rota de curso (#/course/ID)
    const courseMatch = hash.match(/^#\/course\/(.+)$/)
    if (courseMatch) {
      const courseId = courseMatch[1]
      console.log('📚 Curso selecionado via URL:', courseId)
      setSelectedCourse({ id: courseId })
      setShowLogin(false)
      setShowDashboard(false)
      setShowStudentDashboard(false)
      setShowSuperAdminDashboard(false)
      setShowInstructorDashboard(false)
      return
    }

    if (hash && (hash.includes('access_token') || hash.includes('type=recovery'))) {
      console.log('🔑 Detectado hash de recuperação de senha')
      setShowPasswordReset(true)
      setShowLogin(false)
      setShowSuperAdminDashboard(false)
      setShowInstructorDashboard(false)
      setShowStudentDashboard(false)
      setShowDashboard(false)
      return
    }
  }, [window.location.hash])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Não redirecionar se estiver no modo de reset de senha
    if (showPasswordReset) {
      console.log('   ⏭️ Modo de reset de senha ativo, pulando redirecionamento...')
      return
    }

    console.log('🔄 App.jsx useEffect - Verificando redirecionamento:')
    console.log('   isAuthenticated:', isAuthenticated)
    console.log('   user:', user)
    console.log('   user?.role:', user?.role)
    console.log('   isSuperAdmin:', isSuperAdmin)
    console.log('   isInstructor:', isInstructor)
    console.log('   isStudent:', isStudent)

    if (!isAuthenticated || !user) {
      console.log('   ⏭️ Não autenticado ou sem user, pulando...')
      return
    }

    const role = user?.role
    console.log('   📋 Role detectado:', role)

    if (role === 'super_admin') {
      console.log('   ✅ Redirecionando para SuperAdminDashboard!')
      setShowSuperAdminDashboard(true)
      setShowLogin(false)
      setShowInstructorDashboard(false)
      setShowStudentDashboard(false)
      setShowDashboard(false)
    } else if (role === 'instructor' || role === 'teacher') {
      console.log('   ✅ Redirecionando para InstructorDashboard!')
      setShowInstructorDashboard(true)
      setShowLogin(false)
      setShowSuperAdminDashboard(false)
      setShowStudentDashboard(false)
      setShowDashboard(false)
    } else if (role === 'student') {
      console.log('   ✅ Redirecionando para StudentDashboard!')
      setShowStudentDashboard(true)
      setShowLogin(false)
      setShowSuperAdminDashboard(false)
      setShowInstructorDashboard(false)
      setShowStudentSettings(false)
      setShowDashboard(false)
    } else {
      console.log('   ℹ️ Usuário é employer/admin, permanece no catálogo')
      setShowLogin(false)
      setShowSuperAdminDashboard(false)
      setShowInstructorDashboard(false)
      setShowStudentDashboard(false)
    }
  }, [isAuthenticated, user, isStudent, isSuperAdmin, isInstructor])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Buscar cursos do Supabase
  useEffect(() => {
    async function loadCourses() {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('is_active', true)

        if (error) {
          console.error('Erro ao buscar cursos:', error)
        } else {
          // Transformar dados do banco para o formato esperado pelo CourseCard
          const modalityIcons = {
            'Online': 'devices',
            'Presencial': 'people',
            'Híbrido': 'groups',
          }

          const transformedCourses = (data || []).map(course => ({
            id: course.id,
            nr: course.nr_code || 'NR',
            level: course.level || '',
            title: course.title,
            hours: `${course.workload_hours || 0} Horas`,
            modality: course.modality || 'Online',
            modalityIcon: modalityIcons[course.modality] || 'devices',
            priceCents: course.price_cents || 0,
            image: course.image_url || 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80',
            hasESocial: course.has_esocial || false,
          }))

          setCourses(transformedCourses)
        }
      } catch (err) {
        console.error('Erro ao carregar cursos:', err)
      } finally {
        setLoadingCourses(false)
      }
    }

    loadCourses()
  }, [])

  function handleFilterChange(newFilters) {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  // Category to NR code mapping
  const categoryToNR = {
    safety: ['NR-10', 'NR-35', 'NR-12', 'NR-18', 'NR-05', 'NR-06', 'NR-09', 'NR-15', 'NR-17', 'NR-23', 'NR-26', 'NR-33'],
    health: ['NR-07'],
    risk: ['NR-01', 'NR-04'],
    esocial: ['NR-01'],
  }

  // Filter courses
  const filteredCourses = courses.filter(course => {
    // Category filter
    if (filters.category && filters.category !== 'all') {
      const nrCodes = categoryToNR[filters.category] || []
      if (!nrCodes.includes(course.nr)) return false
    }

    // Modality filter
    if (filters.modalities && filters.modalities.length > 0) {
      if (!filters.modalities.includes(course.modality)) return false
    }

    // Level filter
    if (filters.level) {
      if (course.level !== filters.level) return false
    }

    return true
  })

  function handleSwitchToRegister() {
    setShowLogin(false)
    setShowCompanyRegister(true)
  }

  function handleBackToCatalog() {
    setShowLogin(false)
    setShowPasswordForgot(false)
    setShowPasswordReset(false)
    setShowCompanyRegister(false)
    setShowDashboard(false)
    setShowStudentDashboard(false)
    setShowStudentSettings(false)
    setShowSuperAdminDashboard(false)
    setShowInstructorDashboard(false)
    setShowNewCourse(false)
    setShowAuditDashboard(false)
    setShowTeacherManagement(false)
    setSelectedCourse(null)
    // Limpar hash da URL
    window.location.hash = ''
    // Se ainda estiver autenticado como student, redireciona de volta para o dashboard
    if (isAuthenticated && isStudent) {
      setShowStudentDashboard(true)
    }
    // Se ainda estiver autenticado como super_admin, redireciona de volta para o dashboard
    if (isAuthenticated && isSuperAdmin) {
      setShowSuperAdminDashboard(true)
    }
    // Se ainda estiver autenticado como instructor, redireciona de volta para o dashboard
    if (isAuthenticated && isInstructor) {
      setShowInstructorDashboard(true)
    }
  }

  // Mostrar página de detalhes do curso (busca dados do banco)
  if (selectedCourse && selectedCourse.id) {
    return <CourseDetailsPage courseId={selectedCourse.id} onBack={handleBackToCatalog} />
  }

  // Atualizar URL quando seleciona um curso
  function handleViewDetails(course) {
    setSelectedCourse({ id: course.id })
    window.location.hash = `#/course/${course.id}`
  }

  // Show login page
  if (showLogin) {
    return (
      <LoginPage
        onSwitchToRegister={handleSwitchToRegister}
        onBack={handleBackToCatalog}
        onForgotPassword={() => { setShowLogin(false); setShowPasswordForgot(true) }}
      />
    )
  }

  // Show password forgot page
  if (showPasswordForgot) {
    return (
      <AuthPasswordForgotPage
        onBack={() => { setShowPasswordForgot(false); setShowLogin(true) }}
      />
    )
  }

  // Show password reset page
  if (showPasswordReset) {
    return (
      <AuthPasswordResetPage
        onBack={() => {
          setShowPasswordReset(false)
          setShowLogin(true)
          // Limpar o hash da URL
          window.history.replaceState(null, '', window.location.pathname)
        }}
      />
    )
  }

  // Show company register page
  if (showCompanyRegister) {
    return <CompanyRegisterPage onBack={handleBackToCatalog} />
  }

  // Show company dashboard
  if (showDashboard) {
    return <CompanyDashboard onBack={handleBackToCatalog} />
  }

  // Show audit page (deve vir ANTES do super admin dashboard!)
  if (showAuditDashboard) {
    return <SuperAdminDashboardAudit onBack={() => { setShowAuditDashboard(false); setShowSuperAdminDashboard(true) }} />
  }

  // Show super admin dashboard
  if (showSuperAdminDashboard) {
    return <SuperAdminDashboard onBack={handleBackToCatalog} onShowAudit={() => { setShowSuperAdminDashboard(false); setShowAuditDashboard(true) }} onShowTeachers={() => { setShowSuperAdminDashboard(false); setShowTeacherManagement(true) }} />
  }

  // Show new course page (deve vir ANTES do instructor dashboard!)
  if (showNewCourse) {
    return <NewCoursePage onBack={() => { setShowNewCourse(false); setShowInstructorDashboard(true) }} onSuccess={() => { setShowNewCourse(false); setShowInstructorDashboard(true) }} />
  }

  // Show instructor dashboard
  if (showInstructorDashboard) {
    return <InstructorDashboard onBack={handleBackToCatalog} onNewCourse={() => setShowNewCourse(true)} />
  }

  // Show teacher management
  if (showTeacherManagement) {
    return <TeacherManagement onBack={() => { setShowTeacherManagement(false); setShowSuperAdminDashboard(true) }} />
  }

  // Show student dashboard
  if (showStudentDashboard) {
    return <StudentDashboard onBack={handleBackToCatalog} onShowSettings={() => { setShowStudentDashboard(false); setShowStudentSettings(true) }} />
  }

  // Show student settings
  if (showStudentSettings) {
    return <StudentDashboardSettings onBack={() => { setShowStudentSettings(false); setShowStudentDashboard(true) }} />
  }

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <Navbar
        onShowLogin={() => setShowLogin(true)}
        onShowDashboard={() => setShowDashboard(true)}
        onShowStudentDashboard={() => setShowStudentDashboard(true)}
        onShowSuperAdminDashboard={() => setShowSuperAdminDashboard(true)}
        onShowInstructorDashboard={() => setShowInstructorDashboard(true)}
      />
      <div className="flex max-w-[1920px] mx-auto min-h-screen">
        <Sidebar filters={filters} onFilterChange={handleFilterChange} />
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Header & Bento Hero */}
          <section className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 relative h-80 rounded-xl overflow-hidden bg-primary p-12 flex flex-col justify-center">
                <div
                  className="absolute inset-0 opacity-40 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80')",
                  }}
                ></div>
                <div className="absolute inset-0 bg-linear-to-r from-primary via-primary/80 to-transparent"></div>
                <div className="relative z-10">
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4 inline-block">
                    Destaque do Mês
                  </span>
                  <h1 className="text-white text-4xl lg:text-5xl font-headline font-extrabold mb-4 leading-tight tracking-tighter">
                    Conformidade Legal em
                    <br />
                    Escala Corporativa.
                  </h1>
                  <p className="text-on-primary-container text-lg max-w-md">
                    Capacite sua equipe com treinamentos certificados pelas NRs
                    vigentes e garanta a segurança jurídica da sua empresa.
                  </p>
                </div>
              </div>
              <div className="bg-surface-container-highest rounded-xl p-8 flex flex-col justify-between border-b-4 border-primary">
                <div>
                  <span
                    className="material-symbols-outlined text-primary text-4xl mb-4"
                    data-weight="fill"
                  >
                    workspace_premium
                  </span>
                  <h2 className="text-2xl font-headline font-extrabold text-primary mb-2">
                    Validade Nacional
                  </h2>
                  <p className="text-on-surface-variant text-sm">
                    Nossos certificados possuem QR Code de autenticação e são
                    aceitos por todos os órgãos fiscalizadores do Brasil.
                  </p>
                </div>
                <div className="pt-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-primary rounded-full"></span>
                    <span className="text-xs font-bold text-primary tracking-widest uppercase">
                      MEP Approved
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Grid de Cursos */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-headline font-extrabold text-primary tracking-tighter">
                Catálogo de Treinamentos
              </h2>
              <p className="text-on-surface-variant">
                {loadingCourses
                  ? 'Carregando cursos...'
                  : `Exibindo ${filteredCourses.length} curso${filteredCourses.length !== 1 ? 's' : ''} encontrado${filteredCourses.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-outline-variant text-sm font-medium">
                <span className="material-symbols-outlined text-lg">
                  swap_vert
                </span>
                Ordenar por: Popularidade
              </button>
            </div>
          </div>

          {loadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-surface-container-lowest rounded-xl overflow-hidden h-96 animate-pulse">
                  <div className="h-48 bg-surface-container-high" />
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-surface-container-high rounded w-3/4" />
                    <div className="h-4 bg-surface-container-high rounded w-1/2" />
                    <div className="h-10 bg-surface-container-high rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} onViewDetails={handleViewDetails} />
              ))}
            </div>
          )}

          {!loadingCourses && filteredCourses.length === 0 && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">search_off</span>
              <p className="text-xl font-headline font-bold text-on-surface-variant">Nenhum curso encontrado</p>
              <p className="text-sm text-on-surface-variant mt-1">Tente ajustar os filtros</p>
            </div>
          )}

          {/* CTA Section */}
          <section className="mt-16 bg-surface-container-low rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-headline font-extrabold text-primary mb-4 tracking-tighter">
              Precisa de um pacote corporativo personalizado?
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto mb-8 text-lg">
              Oferecemos condições especiais para treinamentos acima de 50
              colaboradores com portal de gestão exclusivo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary text-white px-8 py-4 rounded-xl font-headline font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2">
                Falar com Consultor B2B
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </button>
              <button className="bg-white border border-primary text-primary px-8 py-4 rounded-xl font-headline font-bold hover:bg-primary/5 transition-all">
                Baixar Portfólio PDF
              </button>
            </div>
          </section>
        </main>
      </div>
      <Footer />
      <CartDrawer
        onShowLogin={() => { setShowLogin(true) }}
        onShowCompanyRegister={() => { setShowCompanyRegister(true) }}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  )
}

export default App
