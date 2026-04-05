import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function AuthPasswordResetPage({ onBack }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)

  useEffect(() => {
    // Verificar se há um token de recuperação na URL
    const checkToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // Se há uma sessão com recuperação de senha, o token é válido
        if (session && session.user.aud === 'authenticated') {
          setTokenValid(true)
        } else {
          // Tentar obter usuário para verificar se o link é válido
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setTokenValid(true)
          } else {
            setError('Link de recuperação inválido ou expirado. Solicite um novo link.')
          }
        }
      } catch (err) {
        console.error('Erro ao verificar token:', err)
        setError('Link de recuperação inválido ou expirado.')
      } finally {
        setCheckingToken(false)
      }
    }

    checkToken()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Validações
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSuccess(true)

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        onBack?.()
      }, 3000)
    } catch (err) {
      setError(err.message || 'Erro ao atualizar senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Mostrar carregamento enquanto verifica o token
  if (checkingToken) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
          <p className="text-on-surface-variant">Verificando link de recuperação...</p>
        </div>
      </div>
    )
  }

  // Mostrar erro se token inválido
  if (!tokenValid && error) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full bg-linear-to-br from-primary/5 to-transparent blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-linear-to-tl from-secondary-container/20 to-transparent blur-3xl" />
        </div>

        {/* Header Brand */}
        <header className="fixed top-0 w-full px-6 py-8 flex justify-center pointer-events-none z-20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_with_heart
            </span>
            <span className="text-xl font-bold tracking-tight text-primary font-headline">
              Occupational Excellence
            </span>
          </div>
        </header>

        <main className="w-full max-w-[480px] z-10 mt-24">
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] overflow-hidden border border-outline-variant/15 p-8 text-center">
            <span className="material-symbols-outlined text-error text-6xl mb-4">error</span>
            <h1 className="text-2xl font-extrabold text-primary mb-3">Link Inválido</h1>
            <p className="text-on-surface-variant mb-6">{error}</p>
            <button
              onClick={() => onBack?.()}
              className="w-full bg-primary text-white py-4 px-6 rounded-lg font-semibold hover:opacity-95 transition-all"
            >
              Solicitar Novo Link
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Mostrar sucesso
  if (success) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full bg-linear-to-br from-primary/5 to-transparent blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-linear-to-tl from-secondary-container/20 to-transparent blur-3xl" />
        </div>

        {/* Header Brand */}
        <header className="fixed top-0 w-full px-6 py-8 flex justify-center pointer-events-none z-20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_with_heart
            </span>
            <span className="text-xl font-bold tracking-tight text-primary font-headline">
              Occupational Excellence
            </span>
          </div>
        </header>

        <main className="w-full max-w-[480px] z-10 mt-24">
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] overflow-hidden border border-outline-variant/15 p-8 text-center">
            <span className="material-symbols-outlined text-green-600 text-6xl mb-4">check_circle</span>
            <h1 className="text-2xl font-extrabold text-primary mb-3">Senha Atualizada!</h1>
            <p className="text-on-surface-variant mb-6">
              Sua senha foi atualizada com sucesso. Você será redirecionado para a página de login em instantes.
            </p>
            <button
              onClick={() => onBack?.()}
              className="w-full bg-primary text-white py-4 px-6 rounded-lg font-semibold hover:opacity-95 transition-all"
            >
              Ir para Login
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Mostrar formulário de nova senha
  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full bg-linear-to-br from-primary/5 to-transparent blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-linear-to-tl from-secondary-container/20 to-transparent blur-3xl" />
      </div>

      {/* Header Brand */}
      <header className="fixed top-0 w-full px-6 py-8 flex justify-center pointer-events-none z-20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            shield_with_heart
          </span>
          <span className="text-xl font-bold tracking-tight text-primary font-headline">
            Occupational Excellence
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[480px] z-10 mt-24">
        {/* Main Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] overflow-hidden border border-outline-variant/15">
          {/* Asymmetric Header Accent */}
          <div className="h-1.5 w-full bg-linear-to-r from-primary via-primary-container to-secondary" />

          <div className="p-8 md:p-12">
            {/* Content Header */}
            <div className="mb-10">
              <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-3">
                Nova Senha
              </h1>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Defina sua nova senha de acesso.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2"
                  htmlFor="password"
                >
                  Nova Senha
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-lg group-focus-within:text-primary transition-colors">
                      lock
                    </span>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg focus:ring-0 text-on-surface placeholder:text-outline/50 transition-all duration-200 border-b-2 border-transparent focus:border-primary"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label
                  className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2"
                  htmlFor="confirmPassword"
                >
                  Confirmar Senha
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-lg group-focus-within:text-primary transition-colors">
                      lock
                    </span>
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg focus:ring-0 text-on-surface placeholder:text-outline/50 transition-all duration-200 border-b-2 border-transparent focus:border-primary"
                    placeholder="Confirme sua nova senha"
                  />
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-surface-container-low rounded-lg p-4 space-y-2">
                <p className="text-xs font-bold text-on-surface-variant uppercase">Requisitos da Senha:</p>
                <ul className="text-xs text-on-surface-variant space-y-1">
                  <li className={`flex items-center gap-2 ${password.length >= 6 ? 'text-green-600' : ''}`}>
                    <span className="material-symbols-outlined text-sm">
                      {password.length >= 6 ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    Mínimo de 6 caracteres
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-primary to-primary-container text-on-primary py-4 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] hover:opacity-95 shadow-lg shadow-primary/10 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Atualizando...' : 'Atualizar Senha'}</span>
                {!loading && (
                  <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
                    check
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 flex justify-center gap-8 opacity-40 grayscale pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter font-label">
              NR-01 Compliant
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter font-label">
              AES-256 Encrypted
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AuthPasswordResetPage
