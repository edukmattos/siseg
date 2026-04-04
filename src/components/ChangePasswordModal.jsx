import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function ChangePasswordModal({ onClose, onSave }) {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  // Calcular força da senha
  function getPasswordStrength(password) {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
    if (password.match(/\d/)) strength++
    if (password.match(/[^a-zA-Z\d]/)) strength++
    return strength
  }

  const strength = getPasswordStrength(newPassword)
  const strengthLabels = ['Muito Fraca', 'Fraca', 'Média', 'Forte', 'Muito Forte']
  const strengthLabel = newPassword.length === 0 ? '' : strengthLabels[strength] || 'Muito Fraca'

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (newPassword.length < 8) {
      alert('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    
    if (newPassword !== confirmPassword) {
      alert('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      // Verificar senha atual tentando fazer sign-in com as credenciais atuais
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email,
        password: currentPassword,
      })

      if (signInError || !signInData) {
        throw new Error('Senha atual incorreta.')
      }

      // Se a senha atual está correta, atualizar para a nova senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      alert('Senha alterada com sucesso!')
      onClose()
    } catch (err) {
      console.error('Erro ao alterar senha:', err)
      alert(err.message || 'Erro ao alterar senha. Verifique a senha atual e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      {/* Modal Container */}
      <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-[0_20px_40px_rgba(9,20,38,0.15)] flex flex-col overflow-hidden relative">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors z-10"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Modal Header */}
        <div className="p-8 pb-0">
          <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock
            </span>
          </div>
          <h2 className="font-headline font-extrabold text-2xl text-primary tracking-tight">Alterar Senha</h2>
          <p className="text-on-surface-variant font-body text-sm mt-1 leading-relaxed">
            Para sua segurança, escolha uma senha forte.
          </p>
        </div>

        {/* Modal Content (Form) */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Senha Atual */}
          <div className="space-y-2">
            <label className="font-label font-semibold text-xs text-on-surface-variant uppercase tracking-wider">
              Senha Atual
            </label>
            <div className="relative">
              <input
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-outline-variant"
                placeholder="••••••••"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showCurrent ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-[1px] w-full bg-outline-variant/15"></div>

          {/* Nova Senha */}
          <div className="space-y-2">
            <label className="font-label font-semibold text-xs text-on-surface-variant uppercase tracking-wider">
              Nova Senha
            </label>
            <div className="relative">
              <input
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-outline-variant"
                placeholder="Mínimo 8 caracteres"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                type="button"
                onClick={() => setShowNew(!showNew)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showNew ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>

            {/* Strength Indicator */}
            {newPassword.length > 0 && (
              <div className="space-y-1.5 mt-3">
                <div className="flex justify-between items-center text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
                  <span>Força da senha</span>
                  <span className={`transition-colors ${
                    strength >= 3 ? 'text-primary' : strength >= 2 ? 'text-secondary' : 'text-error'
                  }`}>
                    {strengthLabel}
                  </span>
                </div>
                <div className="flex gap-1.5 h-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`rounded-full flex-1 transition-colors ${
                        level <= strength
                          ? strength >= 3
                            ? 'bg-primary'
                            : strength >= 2
                            ? 'bg-secondary'
                            : 'bg-error'
                          : 'bg-surface-container-high'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirmar Nova Senha */}
          <div className="space-y-2">
            <label className="font-label font-semibold text-xs text-on-surface-variant uppercase tracking-wider">
              Confirmar Nova Senha
            </label>
            <input
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-outline-variant"
              placeholder="••••••••"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3.5 text-sm font-semibold text-on-surface-variant bg-transparent hover:bg-surface-container-low rounded-xl transition-all active:scale-95"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
              className="flex-1 px-4 py-3.5 text-sm font-semibold text-white bg-primary hover:opacity-90 rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Salvando...
                </>
              ) : (
                'Salvar Nova Senha'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordModal
