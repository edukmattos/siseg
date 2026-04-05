import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function LoginPage({ onSwitchToRegister, onBack, onForgotPassword }) {
  const { signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await signIn(email, password)
      // O redirecionamento é feito automaticamente pelo useEffect do App.jsx
      // baseado no role do usuário (instructor, student, super_admin, etc.)
    } catch (err) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.')
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full bg-linear-to-br from-primary/5 to-transparent blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-linear-to-tl from-secondary-container/20 to-transparent blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, #091426 1px, transparent 0)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Voltar
        </button>
      )}

      {/* Branding */}
      <div className="z-10 mb-10 text-center">
        <h1 className="font-headline font-extrabold text-3xl tracking-tight text-primary mb-2">
          Occupational Excellence
        </h1>
        <div className="h-1 w-12 bg-primary mx-auto rounded-full" />
      </div>

      {/* Login Card */}
      <div className="z-10 w-full max-w-md">
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] overflow-hidden transition-all duration-300">
          <div className="p-8 md:p-10">
            <div className="mb-8">
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-1">
                Bem-vindo de volta
              </h2>
              
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label
                  className="block font-label text-sm font-semibold text-on-surface-variant tracking-wide"
                  htmlFor="email"
                >
                  E-MAIL
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary" style={{ fontSize: 20 }}>
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg font-body text-on-surface focus:ring-0 focus:bg-white transition-all border-b-2 border-transparent focus:border-primary"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    className="block font-label text-sm font-semibold text-on-surface-variant tracking-wide"
                    htmlFor="password"
                  >
                    SENHA
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="font-label text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary" style={{ fontSize: 20 }}>
                    lock
                  </span>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg font-body text-on-surface focus:ring-0 focus:bg-white transition-all border-b-2 border-transparent focus:border-primary"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Remember */}
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 text-primary bg-surface-container-low border-none rounded focus:ring-primary focus:ring-offset-0"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 font-body text-sm text-on-surface-variant"
                >
                  Manter conectado
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-linear-to-br from-primary to-primary-container text-on-primary font-headline font-bold rounded-lg shadow-lg hover:opacity-95 transform transition-all active:scale-95 duration-200 disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>

          {/* Footer Link */}
          <div className="bg-surface-container-low p-6 text-center">
            <p className="text-sm text-on-surface-variant">
              Não possui uma conta?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-primary font-bold hover:underline"
              >
                Criar Conta
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
