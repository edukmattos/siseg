import { useState, Fragment, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import AddStudentModal from '../components/AddStudentModal'
import CompanyDashboardLayout from '../components/CompanyDashboardLayout'
import CompanyDashboardOrders from './CompanyDashboardOrders'
import CompanyDashboardCourses from './CompanyDashboardCourses'

const departments = ['Todos', 'Operações Industriais', 'Logística Central', 'Manutenção', 'Segurança']
const certStatuses = ['Todos', 'Válido', 'Expirado', 'Pendente']

function CompanyDashboard({ onBack }) {
  const { company } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('Todos')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [currentTab, setCurrentTab] = useState('students')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 5

  // Carregar Colaboradores da empresa
  useEffect(() => {
    if (company?.id && currentTab === 'students') {
      loadStudents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, currentTab])

  async function loadStudents() {
    if (!company?.id) return

    setLoading(true)
    try {
      // Usar função RPC para buscar membros com dados do usuário (contorna RLS)
      const { data: membersData, error: rpcError } = await supabase
        .rpc('get_company_members_with_users', { p_company_id: company.id })

      if (rpcError) {
        console.error('❌ Erro na RPC get_company_members_with_users:', rpcError)
        throw rpcError
      }
      
      console.log('📋 Members via RPC:', membersData)
      
      if (!membersData || membersData.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      const userIds = membersData.map(m => m.user_id)
      console.log('🆔 User IDs:', userIds)

      // Buscar matrículas dos usuários nesta empresa
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('user_id, status, course:courses(title, nr_code)')
        .eq('company_id', company.id)
        .in('user_id', userIds)

      if (enrollmentsError) {
        console.error('Erro ao buscar matrículas:', enrollmentsError)
      }

      console.log('📚 Enrollments:', enrollmentsData)

      // Buscar certificados dos usuários nesta empresa
      const { data: certificatesData, error: certificatesError } = await supabase
        .from('certificates')
        .select('user_id, is_valid, expiry_date, issue_date')
        .eq('company_id', company.id)
        .in('user_id', userIds)

      if (certificatesError) {
        console.error('Erro ao buscar certificados:', certificatesError)
      }

      console.log('📜 Certificates:', certificatesData)

      // Transformar dados para o formato da UI
      const enrollmentsMap = new Map()
      ;(enrollmentsData || []).forEach(e => {
        if (!enrollmentsMap.has(e.user_id)) {
          enrollmentsMap.set(e.user_id, e)
        }
      })
      const certificatesMap = new Map()
      ;(certificatesData || []).forEach(c => {
        if (!certificatesMap.has(c.user_id)) {
          certificatesMap.set(c.user_id, c)
        }
      })

      const transformedStudents = membersData.map(member => {
        const enrollment = enrollmentsMap.get(member.user_id)
        const certificate = certificatesMap.get(member.user_id)

        console.log('🔄 Transformando membro:', { 
          memberId: member.member_id, 
          userId: member.user_id, 
          name: member.user_full_name,
          email: member.user_email,
          enrollment, 
          certificate 
        })

        // Determinar status de certificação
        let certStatus = 'pending'
        let certExpiry = '-'

        if (certificate) {
          const now = new Date()
          const expiryDate = new Date(certificate.expiry_date)

          if (certificate.is_valid && expiryDate >= now) {
            certStatus = 'valid'
            certExpiry = expiryDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
          } else if (expiryDate < now) {
            certStatus = 'expired'
          }
        } else if (enrollment?.status === 'completed') {
          certStatus = 'pending'
        }

        return {
          id: member.member_id,
          name: member.user_full_name || 'Sem nome',
          email: member.user_email || 'Sem email',
          department: member.department || 'Não informado',
          course: enrollment?.course?.title || member.job_function || 'Não matriculado',
          courseId: enrollment?.course?.nr_code || '-',
          certStatus,
          certExpiry,
        }
      })

      console.log('✅ Colaboradores transformados:', transformedStudents)
      setStudents(transformedStudents)
    } catch (err) {
      console.error('❌ Erro ao carregar Colaboradores:', err)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  function handleAddStudentSuccess() {
    // Recarregar lista de Colaboradores após adicionar
    loadStudents()
  }

  // Calcular estatísticas
  const stats = {
    total: students.length,
    certified: students.length > 0 ? Math.round((students.filter(s => s.certStatus === 'valid').length / students.length) * 100) : 0,
    pending: students.filter(s => s.certStatus === 'pending').length,
    growth: '+12%',
  }

  // Filtrar Colaboradores
  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchDept = deptFilter === 'Todos' || s.department === deptFilter
    const matchStatus = statusFilter === 'Todos' ||
      (statusFilter === 'Válido' && s.certStatus === 'valid') ||
      (statusFilter === 'Expirado' && s.certStatus === 'expired') ||
      (statusFilter === 'Pendente' && s.certStatus === 'pending')
    return matchSearch && matchDept && matchStatus
  })

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  function getStatusBadge(status, expiry) {
    switch (status) {
      case 'valid':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary-fixed text-on-primary-fixed-variant">Válido até {expiry}</span>
      case 'expired':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-error-container text-on-error-container">Expirado</span>
      case 'pending':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-tertiary-fixed text-on-tertiary-fixed-variant">Pendente de Avaliação</span>
      default:
        return null
    }
  }

  function getAvatarColor(index) {
    const colors = ['bg-primary-fixed text-primary', 'bg-tertiary-fixed text-tertiary', 'bg-secondary-fixed text-secondary']
    return colors[index % colors.length]
  }

  return (
    <CompanyDashboardLayout
      currentTab={currentTab}
      onNavigate={setCurrentTab}
      onBack={onBack}
      hideHeader={true}
    >
      {currentTab === 'orders' && <CompanyDashboardOrders onBack={onBack} useLayout={false} />}
      {currentTab === 'dashboard' && (
        <div className="w-full overflow-hidden space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-extrabold text-primary tracking-tight font-headline">Dashboard</h1>
              <p className="text-on-surface-variant max-w-lg">
                Visão geral do seu portal corporativo. Acompanhe métricas e indicadores importantes.
              </p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-12 rounded-xl border border-outline-variant/10 text-center">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">dashboard</span>
            <p className="text-xl font-headline font-bold text-on-surface-variant mb-2">Dashboard em Desenvolvimento</p>
            <p className="text-sm text-on-surface-variant">Esta seção será implementada em breve.</p>
          </div>
        </div>
      )}
      {currentTab === 'students' && (
        <div className="w-full overflow-hidden space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-extrabold text-primary tracking-tight font-headline">Gestão de Colaboradores</h1>
              <p className="text-on-surface-variant max-w-lg">
                Gerencie os registros de colaboradores corporativos, acompanhe certificações de conformidade e faça uploads em lote.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="px-5 py-2.5 bg-surface-container-lowest text-primary border border-outline-variant/20 rounded-xl font-bold flex items-center gap-2 hover:bg-surface-container-low transition-all shadow-sm">
                <span className="material-symbols-outlined">upload_file</span>
                Importar CSV
              </button>
              <button 
                onClick={() => setShowAddStudentModal(true)}
                className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/10"
              >
                <span className="material-symbols-outlined">person_add</span>
                Adicionar Colaborador
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
            <div className="md:col-span-2 bg-primary-container p-8 rounded-xl text-white relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-on-primary-container font-medium mb-1">Total de Colaboradores Ativos</p>
                <h3 className="text-5xl font-extrabold mb-4 font-headline">{stats.total}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">{stats.growth}</span>
                  <span className="text-on-primary-container">desde o mês passado</span>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined" style={{ fontSize: '160px' }}>group</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 shadow-sm">
              <p className="text-on-surface-variant font-medium mb-1">Certificados</p>
              <h3 className="text-4xl font-extrabold text-primary font-headline">{stats.certified}%</h3>
              <div className="mt-4 w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="bg-linear-to-r from-primary to-primary-container h-full rounded-full" style={{ width: `${stats.certified}%` }}></div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 shadow-sm">
              <p className="text-on-surface-variant font-medium mb-1">Pendentes</p>
              <h3 className="text-4xl font-extrabold text-primary font-headline">{stats.pending}</h3>
              <div className="mt-4 flex items-center gap-2 text-error text-sm font-bold">
                <span className="material-symbols-outlined text-sm">warning</span>
                Ação Necessária
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-[0_4px_20px_rgba(9,20,38,0.02)] overflow-hidden w-full">
            <div className="p-6 border-b border-outline-variant/10 flex flex-col lg:flex-row gap-4 justify-between items-center bg-surface-container-low/30">
              <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                <div className="relative min-w-[300px]">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input
                    className="w-full bg-white border border-outline-variant/30 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 ring-primary/10 transition-all outline-none"
                    placeholder="Filtrar por nome ou email..."
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                  />
                </div>
                <select
                  className="bg-white border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 ring-primary/10 outline-none min-w-[160px]"
                  value={deptFilter}
                  onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1) }}
                >
                  {departments.map(d => <option key={d} value={d}>{d === 'Todos' ? 'Departamento' : d}</option>)}
                </select>
                <select
                  className="bg-white border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 ring-primary/10 outline-none min-w-[180px]"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                >
                  {certStatuses.map(s => <option key={s} value={s}>{s === 'Todos' ? 'Status de Certificação' : s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant font-medium">
                Mostrando {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredStudents.length)} de {filteredStudents.length}
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 hover:bg-surface-container rounded transition-colors disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 hover:bg-surface-container rounded transition-colors disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 uppercase tracking-wider text-[10px] font-bold text-slate-500">Colaborador</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[10px] font-bold text-slate-500">Departamento</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[10px] font-bold text-slate-500">Curso / Matrícula</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[10px] font-bold text-slate-500">Certificação</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[10px] font-bold text-slate-500 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">progress_activity</span>
                          <p className="text-sm text-slate-500">Carregando Colaboradores...</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedStudents.length > 0 ? (
                    paginatedStudents.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getAvatarColor(idx)}`}>
                              {getInitials(student.name)}
                            </div>
                            <div>
                              <p className="font-bold text-primary text-sm font-headline">{student.name}</p>
                              <p className="text-xs text-on-surface-variant">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-medium text-secondary">{student.department}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-primary">{student.course}</span>
                            <span className="text-[10px] text-on-surface-variant">ID: {student.courseId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {getStatusBadge(student.certStatus, student.certExpiry)}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button className="text-slate-400 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">more_vert</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-4xl text-outline-variant">search_off</span>
                          <p className="text-sm text-on-surface-variant">Nenhum Colaborador encontrado</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            <div className="bg-surface-container-low p-10 rounded-xl border-2 border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
              </div>
              <h3 className="text-xl font-bold text-primary font-headline">Importação em Lote</h3>
              <p className="text-sm text-on-surface-variant max-w-sm">
                Arraste seu arquivo CSV aqui ou clique para selecionar. Ideal para atualizações mensais de funcionários.
              </p>
              <button className="mt-4 px-8 py-3 bg-white border border-outline-variant text-primary font-bold rounded-lg hover:bg-surface-container transition-colors">
                Selecionar Arquivo
              </button>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10">
              <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 font-headline">Instruções para o CSV</h4>
              <ul className="space-y-4">
                {[
                  { num: 1, title: 'Colunas Obrigatórias', desc: 'O arquivo deve conter: nome, email, departamento.' },
                  { num: 2, title: 'Formatos Suportados', desc: 'Utilize codificação UTF-8 para evitar erros em caracteres especiais.' },
                  { num: 3, title: 'Validação de E-mail', desc: 'E-mails duplicados serão ignorados pelo sistema automaticamente.' },
                ].map(item => (
                  <li key={item.num} className="flex gap-4">
                    <span className="w-6 h-6 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-xs font-bold shrink-0">{item.num}</span>
                    <div>
                      <p className="text-sm font-bold text-primary">{item.title}</p>
                      <p className="text-xs text-on-surface-variant">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8 p-4 bg-surface-container-low rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <span className="text-xs font-bold text-primary">exemplo_importacao_Colaboradores.csv</span>
                </div>
                <button className="text-primary hover:underline text-xs font-bold">Baixar Modelo</button>
              </div>
            </div>
          </div>
      </div>
      )}
      {currentTab === 'courses' && (
        <CompanyDashboardCourses onBack={onBack} useLayout={false} />
      )}
      {currentTab === 'certificates' && (
        <div className="w-full overflow-hidden space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-extrabold text-primary tracking-tight font-headline">Certificados</h1>
              <p className="text-on-surface-variant max-w-lg">
                Gerencie as certificações e validade dos treinamentos.
              </p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-12 rounded-xl border border-outline-variant/10 text-center">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">workspace_premium</span>
            <p className="text-xl font-headline font-bold text-on-surface-variant mb-2">Certificados em Desenvolvimento</p>
            <p className="text-sm text-on-surface-variant">Esta seção será implementada em breve.</p>
          </div>
        </div>
      )}
      {currentTab === 'compliance' && (
        <div className="w-full overflow-hidden space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-extrabold text-primary tracking-tight font-headline">Conformidade</h1>
              <p className="text-on-surface-variant max-w-lg">
                Acompanhe a conformidade legal e regulatória da empresa.
              </p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-12 rounded-xl border border-outline-variant/10 text-center">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">security</span>
            <p className="text-xl font-headline font-bold text-on-surface-variant mb-2">Conformidade em Desenvolvimento</p>
            <p className="text-sm text-on-surface-variant">Esta seção será implementada em breve.</p>
          </div>
        </div>
      )}
      {currentTab === 'reports' && (
        <div className="w-full overflow-hidden space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-extrabold text-primary tracking-tight font-headline">Relatórios</h1>
              <p className="text-on-surface-variant max-w-lg">
                Acesse relatórios detalhados de desempenho e conformidade.
              </p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-12 rounded-xl border border-outline-variant/10 text-center">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">assessment</span>
            <p className="text-xl font-headline font-bold text-on-surface-variant mb-2">Relatórios em Desenvolvimento</p>
            <p className="text-sm text-on-surface-variant">Esta seção será implementada em breve.</p>
          </div>
        </div>
      )}
      {currentTab === 'settings' && (
        <div className="w-full overflow-hidden space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-extrabold text-primary tracking-tight font-headline">Configurações</h1>
              <p className="text-on-surface-variant max-w-lg">
                Configure as preferências do seu portal corporativo.
              </p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-12 rounded-xl border border-outline-variant/10 text-center">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">settings</span>
            <p className="text-xl font-headline font-bold text-on-surface-variant mb-2">Configurações em Desenvolvimento</p>
            <p className="text-sm text-on-surface-variant">Esta seção será implementada em breve.</p>
          </div>
        </div>
      )}

      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={handleAddStudentSuccess}
      />
    </CompanyDashboardLayout>
  )
}

export default CompanyDashboard
