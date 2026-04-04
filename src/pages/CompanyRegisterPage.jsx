import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function CompanyRegisterPage({ onBack }) {
  const { registerCompany, loading } = useAuth()
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  })
  const [companyForm, setCompanyForm] = useState({
    fantasy_name: '',
    legal_name: '',
    cnpj: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_zip_code: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const avatars = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAT4gsTg6mvgl8tTyp8czPJabRgaJZQKAeHMssa5cDJMxpYE3EcgDch2Uklr8xkMuGOG1acMVuV8VhE_2ztBVWk55iHqUMC_MrbYxyamo6FwHHKsyD1D9-qrRIypzAQRT8Fwveov4MSXF0280ptKfc99vTWU8Ha_7dXSByD1iIL3TPKkDcfUfXvWtbStm7HvKyGgUCdY69rUXobAAZqiR6EyWpFicausE6e-txLJSlGWkg2iMo7VM8yuwEGJl6BLx6bDZS_3X1zYDQ',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCp8JmjJpW5Q9pWGtTEC39UPDUHQpIqX6CShgW8TjeHbrHT0lPIHtSU34xRlvvuGRrqlOpoO5z5om8gBDh8v_9iJaAwZJxttyuJ1-bXM1aL9tHf8UIk-vgKmIM-AjgsHWvzCswKBdDh9BmbUwmIHT6dX5_SQMp1YCl0RIdig-JTE8oKeUiP2lNtrm78d781N3J3dRsF8r4rIi10q8jrFMXYx3zugGOAZe2hxODHumePFylttHopGBX9vkBuAJXY5oxP9ntDXtkqkY4',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBKpdPijV-nB12kR6Plzgxnp2T-2bQeJ7j2El8XJJAoecLk2awAkhfwr960tbi1uemCDaeWLoXtJRtfH7Oz2ufidZUJQv8nGvXUMWgI-c39y7VU0JxKboG7xXbf-wtq7fuIojMu07XC3fn5eczSilGCMxewIbRDQQXF8lZ8Jdcb74YG9boke9s3UCCiJyZFPohF81GconqyUBOFJajW68G-PS8FdJyIRalQA6BrY-5fCkp_KQDolvThNvT0RdNfkzyAPLQrBcnRJxM',
  ]

  function formatCNPJ(value) {
    const v = value.replace(/\D/g, '').slice(0, 14)
    if (v.length > 12) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`
    if (v.length > 8) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`
    if (v.length > 5) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`
    if (v.length > 2) return `${v.slice(0, 2)}.${v.slice(2)}`
    return v
  }

  function formatPhone(value) {
    const v = value.replace(/\D/g, '').slice(0, 11)
    if (v.length > 6) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
    if (v.length > 2) return `(${v.slice(0, 2)}) ${v.slice(2)}`
    if (v.length > 0) return `(${v}`
    return v
  }

  function formatCEP(value) {
    const v = value.replace(/\D/g, '').slice(0, 8)
    if (v.length > 5) return `${v.slice(0, 5)}-${v.slice(5)}`
    return v
  }

  function handleUserChange(field, value) {
    if (field === 'phone') value = formatPhone(value)
    setUserData({ ...userData, [field]: value })
  }

  function handleCompanyChange(field, value) {
    if (field === 'cnpj') value = formatCNPJ(value)
    if (field === 'address_zip_code') value = formatCEP(value)
    if (field === 'address_state') value = value.toUpperCase().slice(0, 2)
    setCompanyForm({ ...companyForm, [field]: value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setPasswordError('')

    if (userData.password !== userData.confirm_password) {
      setPasswordError('As senhas não coincidem')
      return
    }
    if (userData.password.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    await registerCompany(companyForm, userData)
    if (onBack) onBack()
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-grow flex items-stretch">
        {/* Left Side: Branding */}
        <div className="hidden lg:flex w-1/2 bg-primary p-16 flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <span className="font-headline text-2xl font-bold tracking-tight text-white">
              Occupational Excellence
            </span>
          </div>
          <div className="z-10 space-y-6">
            <h1 className="text-5xl font-extrabold text-white leading-tight">
              Compliance <br />
              Arquitetural <br />
              <span className="text-primary-fixed">NR-01</span>
            </h1>
            <p className="text-on-primary-container text-lg max-w-md">
              Junte-se à plataforma líder em mitigação de riscos e gestão de
              excelência ocupacional. Segurança baseada em dados e autoridade
              técnica.
            </p>
            <div className="flex items-center space-x-4 pt-8">
              <div className="flex -space-x-2">
                {avatars.map((src, i) => (
                  <img
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-primary object-cover"
                    src={src}
                    alt=""
                  />
                ))}
              </div>
              <span className="text-sm text-on-primary-container font-medium">
                +500 empresas certificadas este mês
              </span>
            </div>
          </div>

          {/* Architectural Background */}
          <div className="absolute bottom-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <svg
              className="w-full h-full"
              viewBox="0 0 400 400"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 400L400 0V400H0Z" fill="white" />
              <path d="M50 400L400 50V400H50Z" fill="white" opacity="0.5" />
            </svg>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 bg-surface flex flex-col items-center justify-center p-8 md:p-16 overflow-y-auto">
          <div className="w-full max-w-md space-y-8">
            {/* Stepper */}
            <nav className="flex items-center justify-between w-full mb-8">
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm mb-2 shadow-lg">
                  <span className="material-symbols-outlined text-sm">check</span>
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-primary">
                  Cadastro
                </span>
              </div>
              <div className="h-px bg-surface-container-highest flex-grow mx-4 -mt-6" />
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm mb-2 shadow-lg">
                  2
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-primary">
                  Plano
                </span>
              </div>
              <div className="h-px bg-surface-container-highest flex-grow mx-4 -mt-6" />
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-bold text-sm mb-2">
                  3
                </div>
                <span className="text-[10px] uppercase tracking-widest font-medium text-on-surface-variant">
                  Pagamento
                </span>
              </div>
            </nav>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-primary">
                Configuração da Conta
              </h2>
              <p className="text-on-surface-variant">
                Preencha seus dados e os da empresa para começar.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ===== SEÇÃO 1: DADOS DO RESPONSÁVEL ===== */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                  <h3 className="text-sm font-headline font-bold text-primary uppercase tracking-wider">
                    Dados do Responsável
                  </h3>
                </div>

                {/* Nome */}
                <div className="group">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-lg">person</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={userData.name}
                      onChange={(e) => handleUserChange('name', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-outline-variant rounded-t-xl"
                      placeholder="Nome completo"
                    />
                  </div>
                </div>

                {/* E-mail */}
                <div className="group">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-lg">mail</span>
                    </div>
                    <input
                      type="email"
                      required
                      value={userData.email}
                      onChange={(e) => handleUserChange('email', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-outline-variant rounded-t-xl"
                      placeholder="email@empresa.com"
                    />
                  </div>
                </div>

                {/* Telefone + Senha */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-outline text-lg">phone</span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={userData.phone}
                        onChange={(e) => handleUserChange('phone', e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-outline-variant rounded-t-xl"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-outline text-lg">lock</span>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={userData.password}
                        onChange={(e) => handleUserChange('password', e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-outline-variant rounded-t-xl"
                        placeholder="Senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        <span className="material-symbols-outlined text-outline text-lg">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div className="group">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-lg">lock_reset</span>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={userData.confirm_password}
                      onChange={(e) => handleUserChange('confirm_password', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-outline-variant rounded-t-xl"
                      placeholder="Confirmar senha"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-xs text-error mt-2 ml-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {passwordError}
                    </p>
                  )}
                </div>
              </div>

              {/* Divisor */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant opacity-30" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-surface text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Dados da Empresa
                  </span>
                </div>
              </div>

              {/* ===== SEÇÃO 2: DADOS DA EMPRESA ===== */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                  <h3 className="text-sm font-headline font-bold text-primary uppercase tracking-wider">
                    Configuração da Empresa
                  </h3>
                </div>

                {/* Nome da Empresa */}
                <div className="group">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-lg">business</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={companyForm.fantasy_name}
                      onChange={(e) => handleCompanyChange('fantasy_name', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-outline-variant rounded-t-xl"
                      placeholder="Razão Social ou Nome Fantasia"
                    />
                  </div>
                </div>

                {/* CNPJ */}
                <div className="group">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-lg">fact_check</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={companyForm.cnpj}
                      onChange={(e) => handleCompanyChange('cnpj', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-outline-variant rounded-t-xl"
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div className="grid grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    value={companyForm.address_zip_code}
                    onChange={(e) => handleCompanyChange('address_zip_code', e.target.value)}
                    className="col-span-1 pl-4 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-outline-variant rounded-t-xl text-sm"
                    placeholder="CEP"
                    maxLength={9}
                  />
                  <input
                    type="text"
                    required
                    value={companyForm.address_street}
                    onChange={(e) => handleCompanyChange('address_street', e.target.value)}
                    className="col-span-2 pl-4 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-outline-variant rounded-t-xl text-sm"
                    placeholder="Rua / Avenida"
                  />
                  <input
                    type="text"
                    required
                    value={companyForm.address_number}
                    onChange={(e) => handleCompanyChange('address_number', e.target.value)}
                    className="pl-4 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-outline-variant rounded-t-xl text-sm"
                    placeholder="Nº"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={companyForm.address_neighborhood}
                    onChange={(e) => handleCompanyChange('address_neighborhood', e.target.value)}
                    className="pl-4 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-outline-variant rounded-t-xl text-sm"
                    placeholder="Bairro"
                  />
                  <input
                    type="text"
                    required
                    value={companyForm.address_city}
                    onChange={(e) => handleCompanyChange('address_city', e.target.value)}
                    className="pl-4 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-outline-variant rounded-t-xl text-sm"
                    placeholder="Cidade"
                  />
                  <input
                    type="text"
                    required
                    value={companyForm.address_state}
                    onChange={(e) => handleCompanyChange('address_state', e.target.value)}
                    className="pl-4 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-outline-variant rounded-t-xl text-sm"
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="pt-4 flex flex-col space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:opacity-90 text-white font-bold py-5 rounded-xl transition-all shadow-[0_20px_40px_rgba(9,20,38,0.1)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>Continuar para Planos</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
                <p className="text-center text-xs text-outline font-medium">
                  Ao continuar, você concorda com nossos{' '}
                  <a className="text-primary underline decoration-primary/20 hover:decoration-primary" href="#">
                    Termos de Serviço
                  </a>{' '}
                  e{' '}
                  <a className="text-primary underline decoration-primary/20 hover:decoration-primary" href="#">
                    Política de Privacidade
                  </a>
                  .
                </p>
              </div>
            </form>

            <div className="flex items-center justify-center pt-6 border-t border-surface-container-high">
              <p className="text-on-surface-variant text-sm">
                Já possui uma conta?{' '}
                <button
                  onClick={onBack}
                  className="text-primary font-bold hover:underline"
                >
                  Fazer Login
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-slate-950 w-full py-12 flex flex-col items-center justify-center space-y-6 px-4">
        <div className="flex flex-wrap justify-center gap-8 text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-widest">
          <a className="hover:text-slate-900 transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-slate-900 transition-colors" href="#">Terms of Service</a>
          <a className="hover:text-slate-900 transition-colors" href="#">Security Audit</a>
          <a className="hover:text-slate-900 transition-colors" href="#">Contact Support</a>
        </div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider text-center">
          © 2024 Occupational Excellence. NR-01 Architectural Compliance.
        </p>
      </footer>
    </div>
  )
}

export default CompanyRegisterPage
