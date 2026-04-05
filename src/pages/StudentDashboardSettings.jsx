import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import StudentDashboardMenuSide from '../components/StudentDashboardMenuSide'
import ChangePasswordModal from '../components/ChangePasswordModal'

function StudentDashboardSettings({ onBack }) {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentTab, setCurrentTab] = useState('settings')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    cpf: '',
  })
  const [professionalData, setProfessionalData] = useState({
    company: '',
    department: '',
    role: '',
    admissionDate: '',
  })
  const [notifications, setNotifications] = useState({
    courseExpiration: { email: true, sms: false, app: true },
    newCertificates: { email: true, sms: true, app: true },
  })
  const [loginHistory, setLoginHistory] = useState([])
  const [complianceScore, setComplianceScore] = useState(94)

  useEffect(() => {
    loadUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadUserData() {
    if (!user?.id) return

    try {
      // Carregar perfil do usuário (tabela users)
      let userData = null
      try {
        const { data, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!userError) {
          userData = data
        }
      } catch (err) {
        console.warn('Erro ao carregar da tabela users, usando dados do auth')
      }

      if (userData) {
        setProfile({
          fullName: userData.full_name || user.user_metadata?.full_name || '',
          email: userData.email || user.email || '',
          phone: userData.phone || '',
          cpf: userData.cpf || '',
        })
        setProfessionalData({
          company: userData.company || '',
          department: userData.department || '',
          role: userData.role || '',
          admissionDate: userData.admission_date || '',
        })
      } else {
        // Fallback para dados do Supabase Auth
        setProfile({
          fullName: user.user_metadata?.full_name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          cpf: '',
        })
      }

      // Carregar histórico de login (simulado)
      setLoginHistory([
        { device: 'laptop', location: 'São Paulo, BR', browser: 'Chrome', ip: '189.122.45.21', time: 'Hoje, 09:42' },
        { device: 'smartphone', location: 'São Paulo, BR', browser: 'App', ip: '189.122.45.21', time: 'Ontem, 14:15' },
      ])
    } catch (err) {
      console.error('Erro ao carregar dados do usuário:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile() {
    if (!user?.id) return
    setSaving(true)

    try {
      // Tentar salvar na tabela profiles (se existir)
      // Se a tabela não existir, salvar apenas no user_metadata do Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.fullName,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        }
      })

      if (authError) throw authError

      // Salvar na tabela users
      try {
        await supabase
          .from('users')
          .upsert({
            id: user.id,
            full_name: profile.fullName,
            email: profile.email,
            phone: profile.phone,
            company: professionalData.company,
            department: professionalData.department,
            role: professionalData.role,
            admission_date: professionalData.admissionDate,
            updated_at: new Date().toISOString(),
          })
      } catch (userErr) {
        // Tabela users pode ter erro, salvar apenas no auth
        console.warn('Erro ao salvar na tabela users, salvando apenas no auth:', userErr)
      }

      alert('Perfil atualizado com sucesso!')
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      alert('Erro ao salvar perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  function handleNotificationChange(category, channel) {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</span>
          <p className="mt-4 text-on-surface-variant">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] px-8 h-16 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold font-headline tracking-tight text-primary">
            Occupational Excellence
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-500 hover:bg-slate-200/50 rounded-full transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-200/50 rounded-full transition-colors">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-sm">person</span>
            </div>
            <div className="text-right hidden lg:block">
              <p className="text-sm font-bold text-primary">{user?.full_name}</p>
              <p className="text-xs text-on-surface-variant">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-xl hover:bg-surface-container transition-colors"
              title="Sair"
            >
              <span className="material-symbols-outlined text-on-surface-variant">logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <StudentDashboardMenuSide
        onNavigate={setCurrentTab}
        currentTab={currentTab}
        onBack={onBack}
      />

      {/* Main Content */}
      <main className="md:pl-64 pt-16 min-h-screen">
        <div className="w-full p-6">
          {/* Header */}
          <header className="mb-10">
            <h1 className="text-4xl font-headline font-extrabold tracking-tight text-primary mb-2">
              Minha Conta e Configurações
            </h1>
            <p className="text-on-surface-variant font-medium">
              Gerencie suas informações pessoais, segurança e preferências de notificação.
            </p>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Column 1: Personal & Professional (Asymmetric Bento) */}
            <div className="xl:col-span-8 space-y-8">
              {/* Section 1: Personal Information */}
              <section className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_20px_40px_rgba(9,20,38,0.05)] border border-outline-variant/15">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-surface-container-low border-2 border-primary-fixed flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-primary">person</span>
                    </div>
                    <button className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-lg shadow-lg hover:bg-primary-container transition-colors">
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                    </button>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Nome Completo</label>
                      <input
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary transition-all font-semibold text-primary"
                        type="text"
                        value={profile.fullName}
                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Email</label>
                      <input
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary transition-all"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Telefone</label>
                      <input
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary transition-all"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+55 11 98765-4321"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">CPF</label>
                      <div className="relative">
                        <input
                          className="w-full bg-surface-container-low/50 border-none rounded-lg px-4 py-3 text-on-surface-variant font-mono cursor-not-allowed"
                          readOnly
                          type="text"
                          value={profile.cpf ? profile.cpf.replace(/(\d{3})\.?(\d{3})\.?(\d{3})-?(\d{2})/, '***.***.***-**') : '***.***.***-**'}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">lock</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Professional Data (Read-only Compliance) */}
              <section className="bg-surface-container-low/40 rounded-xl p-8 border border-outline-variant/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="text-[10px] font-bold uppercase text-primary-container bg-primary-fixed px-3 py-1 rounded-full">Dados da Empresa</span>
                </div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary">business_center</span>
                  <h3 className="text-xl font-bold text-primary">Dados Profissionais</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Empresa</p>
                    <p className="font-bold text-primary">{professionalData.company || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Departamento</p>
                    <p className="font-bold text-primary">{professionalData.department || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Cargo</p>
                    <p className="font-bold text-primary">{professionalData.role || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Data de Admissão</p>
                    <p className="font-bold text-primary">
                      {professionalData.admissionDate 
                        ? new Date(professionalData.admissionDate).toLocaleDateString('pt-BR')
                        : 'Não informado'}
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-outline-variant/10 flex items-center gap-2 text-on-surface-variant text-sm italic">
                  <span className="material-symbols-outlined text-sm">info</span>
                  <span>Esta informação é somente leitura para integridade de conformidade NR-01. Contate o RH para solicitar atualizações.</span>
                </div>
              </section>

              {/* Section 4: Notification Preferences */}
              <section className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_20px_40px_rgba(9,20,38,0.05)] border border-outline-variant/15">
                <div className="flex items-center gap-2 mb-8">
                  <span className="material-symbols-outlined text-primary">notifications_active</span>
                  <h3 className="text-xl font-bold text-primary">Preferências de Notificação</h3>
                </div>
                <div className="space-y-6">
                  {/* Course Expiration */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-lg bg-surface-container-low/30">
                    <div className="md:col-span-6">
                      <h4 className="font-bold text-primary">Expiração de Cursos</h4>
                      <p className="text-sm text-on-surface-variant">Alertas quando suas certificações obrigatórias estiverem prestes a expirar.</p>
                    </div>
                    <div className="md:col-span-6 flex justify-end gap-6">
                      {['email', 'sms', 'app'].map((channel) => (
                        <label key={channel} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="hidden peer"
                            checked={notifications.courseExpiration[channel]}
                            onChange={() => handleNotificationChange('courseExpiration', channel)}
                          />
                          <div className="w-10 h-5 bg-slate-300 rounded-full relative peer-checked:bg-primary transition-colors">
                            <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${notifications.courseExpiration[channel] ? 'translate-x-5' : ''}`}></div>
                          </div>
                          <span className="text-xs font-bold text-on-surface-variant group-hover:text-primary transition-colors uppercase">{channel}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* New Certificates */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-lg bg-surface-container-low/30">
                    <div className="md:col-span-6">
                      <h4 className="font-bold text-primary">Novos Certificados</h4>
                      <p className="text-sm text-on-surface-variant">Confirmação instantânea quando seu progresso de treinamento for validado.</p>
                    </div>
                    <div className="md:col-span-6 flex justify-end gap-6">
                      {['email', 'sms', 'app'].map((channel) => (
                        <label key={channel} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="hidden peer"
                            checked={notifications.newCertificates[channel]}
                            onChange={() => handleNotificationChange('newCertificates', channel)}
                          />
                          <div className="w-10 h-5 bg-slate-300 rounded-full relative peer-checked:bg-primary transition-colors">
                            <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${notifications.newCertificates[channel] ? 'translate-x-5' : ''}`}></div>
                          </div>
                          <span className="text-xs font-bold text-on-surface-variant group-hover:text-primary transition-colors uppercase">{channel}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Column 2: Security & Privacy (Stacked High-Authority) */}
            <div className="xl:col-span-4 space-y-8">
              {/* Section 3: Security & Privacy */}
              <section className="bg-primary text-white rounded-xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-3 mb-8 relative z-10">
                  <span className="material-symbols-outlined">security</span>
                  <h3 className="text-xl font-bold">Segurança</h3>
                </div>
                <div className="space-y-6 relative z-10">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-primary-container hover:bg-slate-800 transition-colors group"
                  >
                    <div className="text-left">
                      <p className="font-bold">Alterar Senha</p>
                      <p className="text-xs text-on-primary-container">Atualize suas credenciais</p>
                    </div>
                    <span className="material-symbols-outlined text-on-primary-container group-hover:text-white transition-colors">chevron_right</span>
                  </button>
                  <div className="p-4 rounded-lg bg-primary-container flex items-center justify-between">
                    <div>
                      <p className="font-bold">Autenticação 2FA</p>
                      <p className="text-xs text-on-primary-container">Proteção adicional da conta</p>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase rounded">ATIVO</span>
                  </div>
                </div>
                <div className="mt-10 pt-8 border-t border-primary-container">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-sm">history</span>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-primary-container">Histórico de Login Recente</p>
                  </div>
                  <ul className="space-y-4">
                    {loginHistory.map((login, index) => (
                      <li key={index} className={`flex items-center gap-4 ${index > 0 ? 'opacity-70' : ''}`}>
                        <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm">{login.device}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">{login.location} • {login.browser}</p>
                          <p className="text-[10px] text-on-primary-container">{login.ip} • {login.time}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button className="w-full mt-6 text-center text-xs font-bold text-on-primary-container hover:text-white transition-colors">
                    VER LOG COMPLETO DE ATIVIDADE
                  </button>
                </div>
              </section>

              {/* Status Card (Bento Sidebar) */}
              <section className="bg-surface-container-high rounded-xl p-6 border border-outline-variant/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-primary">Pontuação de Conformidade</h4>
                  <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full mb-3 overflow-hidden">
                  <div className="bg-linear-to-r from-primary to-primary-container h-full rounded-full transition-all" style={{ width: `${complianceScore}%` }}></div>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  Seu perfil está {complianceScore}% em conformidade com a política da empresa. Certifique-se de que sua autenticação de dois fatores está regularmente auditada.
                </p>
              </section>
            </div>
          </div>

          {/* Footer Actions */}
          <footer className="mt-12 flex flex-col md:flex-row gap-4 items-center justify-between pt-8 border-t border-outline-variant/15">
            <p className="text-sm text-on-surface-variant font-medium">
              Última atualização do perfil: Hoje às 08:30
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => loadUserData()}
                className="px-6 py-2.5 text-sm font-bold text-secondary hover:bg-surface-container transition-colors rounded-lg"
              >
                Descartar Alterações
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-8 py-2.5 text-sm font-bold text-white bg-primary hover:opacity-90 active:scale-95 transition-all rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Salvando...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </button>
            </div>
          </footer>
        </div>
      </main>

      {/* Modal de Alteração de Senha */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  )
}

export default StudentDashboardSettings
