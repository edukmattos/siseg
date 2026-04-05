import { useState } from 'react'
import { supabase } from '../lib/supabase'

function AuthPasswordForgotPage({ onBack }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${window.location.pathname}#type=recovery`,
      })

      if (resetError) {
        throw new Error(resetError.message)
      }

      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Erro ao enviar email de recuperação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #091426 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Background Gradient Orbs */}
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
                Reset sua senha
              </h1>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Informe seu email corporativo e enviaremos um link de recuperação.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Error Message */}
              {error && (
                <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-primary-container/10 text-primary px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Link de recuperação enviado! Verifique sua caixa de entrada.
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label
                  className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2"
                  htmlFor="email"
                >
                  Email Corporativo
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-lg group-focus-within:text-primary transition-colors">
                      alternate_email
                    </span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={success}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg focus:ring-0 text-on-surface placeholder:text-outline/50 transition-all duration-200 border-b-2 border-transparent focus:border-primary disabled:opacity-50"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-linear-to-r from-primary to-primary-container text-on-primary py-4 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] hover:opacity-95 shadow-lg shadow-primary/10 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Enviando...' : 'Enviar Link de Recuperação'}</span>
                {!loading && (
                  <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-12 pt-8 border-t border-outline-variant/10 flex flex-col items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary transition-colors group"
                >
                  <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">
                    keyboard_backspace
                  </span>
                  Voltar ao Login
                </button>
              )}
            </div>
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

      {/* Background Decorative Element */}
      <div className="fixed bottom-0 right-0 p-12 opacity-5 hidden lg:block pointer-events-none">
        <span className="material-symbols-outlined text-[320px] leading-none select-none" style={{ fontVariationSettings: "'wght' 100" }}>
          policy
        </span>
      </div>
    </div>
  )
}

export default AuthPasswordForgotPage
