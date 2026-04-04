import { useState, useEffect } from 'react'
import { CartProvider } from './context/CartContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import CourseCard from './components/CourseCard'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import LoginPage from './pages/LoginPage'
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

const courses = [
  {
    id: 1,
    nr: 'NR-10',
    level: 'Básico',
    title: 'NR-10 Segurança em Instalações Elétricas',
    hours: '40 Horas',
    modality: 'Online',
    modalityIcon: 'devices',
    priceCents: 18900,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApYdv-pXcx1aCiTXj6JYwPZGE8y0kDRpjjNUrXCA1_ke3LoPI_axhtlR6muoBmlAMIwpmQLOMAkoTRGgCVmEW8WAzgMxCWUEQl7DKeEfeojPp4HVHlex34OVSBtYcmUaZpDNpIqxgAzj-6LCg3Wai-cB27EXqfRpYjcqrmg1UtvUTnj0NKf_AmJGD9SABae4Edt9tpdvnAI5psjjxSP5fizyF322VcnDbBDDUjADE9S8q_hU47zaNVx_My3Ur7iYP2U8QQayxXCvw',
    hasESocial: true,
  },
  {
    id: 2,
    nr: 'NR-35',
    level: 'Prático',
    title: 'NR-35 Trabalho em Altura',
    hours: '08 Horas',
    modality: 'Híbrido',
    modalityIcon: 'groups',
    priceCents: 24500,
    image: 'https://lh3.googleusercontent.com/AB6AXuAs-aY1JYIgqMqGaPgGLu_3fV9zAQ8H3KfwwCBw3OCwT48Gm24-0S7QxPWDOw81xR7ug4hIwY3PyraOLg7gJ3CvJgjQjZqK2y2lv-5bZoGfNdW9ts7SkcRh4Bimu4V53axPDFV91knZRsukzbOMH7Q0WU9KK69vc-MlZDe4UC6vIiiNA03T2KIDGNdbP7PpgpGkDRJDewGGn8wqfvWgdK1Dm12doSmUa1sCIO-p2-xtcBtGxhbXCq2McvjdCkIjxNPSip6Y9sBTszA',
    hasESocial: true,
  },
  {
    id: 3,
    nr: 'NR-07',
    level: 'Reciclagem',
    title: 'NR-07 Primeiros Socorros Básico',
    hours: '04 Horas',
    modality: 'Online',
    modalityIcon: 'devices',
    priceCents: 9500,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgneVYiiwNS4WuBgksZW4XKrewhzlM9RlXCBnNc6ufPnM62t7hwCQ6c61nKCmPS4x-A4810IgtGRGOItgWCxNLeUoLBbXnFxUjbGb2yRj3MqesRYVRGnKV0ndreEDkg36wwRvQWfaeIzolxdJAjLORA-XKU_uztqw85O47Fn1LHSPpX9qQC4nMJw6_UksXCFCJ10Kx5AH5E9644WpJff9gn41QoOhun1LdaEAuuaJq2UVJFjnre24fW9QC9s0bmefwsOpmR9VEniQ',
    hasESocial: true,
  },
  {
    id: 4,
    nr: 'NR-12',
    level: 'Especialista',
    title: 'NR-12 Segurança em Máquinas e Equipamentos',
    hours: '16 Horas',
    modality: 'Híbrido',
    modalityIcon: 'groups',
    priceCents: 31200,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACvoFNS8ooBFFvklPKDwQip_ZD95FMKjZMchIxP3U4hLDJztHoOp_RMlY1iXW9awfVEm-WDgFt4Kr0Ljgj_7zxzT_D_oFXxcsMJETIK1QYcqQUrePJjSwu-oqjV1CvOMQwmPX1eXjcWYs0_-tx-S74L9iXac7J23WzpwSd9-iC7NNbYLVBmFGE3knN8CkPVzIPf_CZKk16o4xBwJgDavIKw72SxMuGlxYjXtmTs-AqNgS8PDQc6Q9-HweXCZzNCU0gYno9hrFbKME',
    hasESocial: false,
  },
  {
    id: 5,
    nr: 'NR-18',
    level: 'Integração',
    title: 'NR-18 Segurança na Indústria da Construção',
    hours: '06 Horas',
    modality: 'Online',
    modalityIcon: 'devices',
    priceCents: 15600,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAR5GLsvqOxrQQtirhMX8Q-P235Jr7XwXO4ONNkeUuxcHByp4PenbOjqcFI4HBe8sv1kyUDnRFYKApEzcoq-D6HAJ2QS5_y3MiANm1Hpk_1zHPHmy2hJfHdC_03HmvWhQxhL8MnaDYKyBxrtHNiu7e0lnHLgwpNM7i9FqFNai57rVrZIakMwihQiUiruqIt_5eAGWF4YuS8I5SZPsU69KVk3UbDO9fzVQ52pqO_C-AAAAGzjjwvAMaVOeN3ACkDo83V7DgPNEVs7ec',
    hasESocial: false,
  },
  {
    id: 6,
    nr: 'NR-05',
    level: 'CIPA',
    title: 'Comissão Interna de Prevenção de Acidentes',
    hours: '20 Horas',
    modality: 'Online',
    modalityIcon: 'devices',
    priceCents: 21000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyum5nfgXFC2ZWeK27crDM4ps_ctPXko0QCggWRwXLG9406AJB9tS_yTfvZlzKFwqxV81kjOSHJQhGy_ILay_y4WnPA3gNIaiOwX-PpQhUrDE6CKzR0Hw9jruKMa9X9pu-P81R76jbgr1b8DxBVIA6YhozgMLWj96UmaMR0fONb2zijhLKzVBjxFhKRIMbksEEseekTnM12SxKvyTJJzWQyW_UAH06itkEQiGAJQa6xYjTUaDOpc4VTmfd9jIriN3bkmiD21-jh4',
    hasESocial: true,
  },
]

function AppContent() {
  const { isAuthenticated, isStudent, isSuperAdmin, isInstructor, user } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
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

  // Redirecionar para dashboard correto após login
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
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

  function handleViewDetails(course) {
    setSelectedCourse(course)
  }

  // Show course details page
  if (selectedCourse) {
    return <CourseDetailsPage course={selectedCourse} onBack={handleBackToCatalog} />
  }

  // Show login page
  if (showLogin) {
    return (
      <LoginPage
        onSwitchToRegister={handleSwitchToRegister}
        onBack={handleBackToCatalog}
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
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent"></div>
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
                Exibindo {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} encontrado{filteredCourses.length !== 1 ? 's' : ''}
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} onViewDetails={handleViewDetails} />
            ))}
          </div>

          {filteredCourses.length === 0 && (
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
