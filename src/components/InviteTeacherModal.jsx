import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { createUserWithoutSession } from '../lib/supabaseAdmin'

// Função para gerar senha temporária segura
function generateTemporaryPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function InviteTeacherModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: '',
    bio: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // 'success' | 'error' | null
  const [createdCredentials, setCreatedCredentials] = useState(null) // { email, password }
  const [errorMessage, setErrorMessage] = useState('')

  const specialties = [
    'NR-01 - Gestão de Riscos',
    'NR-10 - Segurança em Eletricidade',
    'NR-12 - Máquinas e Equipamentos',
    'NR-18 - Construção Civil',
    'NR-33 - Espaço Confinado',
    'NR-35 - Trabalho em Altura',
    'Primeiros Socorros',
    'Segurança do Trabalho',
    'Engenharia de Segurança',
    'Medicina do Trabalho',
    'Psicologia Organizacional',
    'Gestão Ambiental',
  ]

  function validate() {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.specialty) {
      newErrors.specialty = 'Especialidade é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    setStatus(null)
    setCreatedCredentials(null)
    setErrorMessage('')

    try {
      // Gerar senha temporária para o professor
      const temporaryPassword = generateTemporaryPassword()

      // Verificar se o email já existe
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', formData.email.trim())

      if (existingUsers && existingUsers.length > 0) {
        throw new Error('Este email já está cadastrado no sistema')
      }

      // Criar usuário no Supabase Auth usando Admin API
      console.log('🔑 Criando professor via Admin API...')

      const { user: authUser, error: authError } = await createUserWithoutSession(
        formData.email.trim(),
        temporaryPassword,
        {
          full_name: formData.name.trim(),
          role: 'instructor',
          specialty: formData.specialty,
        }
      )

      if (authError) {
        console.error('Erro ao criar professor no Auth:', authError)
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          throw new Error('Este email já está cadastrado no sistema. Por favor, use outro email.')
        }
        throw new Error(`Erro ao criar conta: ${authError.message}`)
      }

      if (!authUser) {
        throw new Error('Erro ao criar professor. Tente novamente.')
      }

      console.log('✅ Professor criado no Auth com UUID:', authUser.id)

      // Atualizar perfil com informações adicionais
      await supabase
        .from('users')
        .update({
          bio: formData.bio || null,
          specialty: formData.specialty,
          status: 'pending', // Pendente de homologação
        })
        .eq('user_uuid', authUser.id)

      // Salvar credenciais para exibir
      setCreatedCredentials({
        email: formData.email.trim(),
        password: temporaryPassword,
      })

      setStatus('success')

      // Chamar onSuccess após 5 segundos
      setTimeout(() => {
        onSuccess?.()
      }, 5000)
    } catch (error) {
      console.error('❌ Erro ao convidar professor:', error)
      console.error('📋 Detalhes do erro:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      setErrorMessage(error.message || 'Erro desconhecido ao convidar professor')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Limpar erro do campo ao digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  function handleClose() {
    setFormData({ name: '', email: '', specialty: '', bio: '' })
    setErrors({})
    setStatus(null)
    setCreatedCredentials(null)
    setErrorMessage('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant/10 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-headline font-extrabold text-primary">
              Convidar Professor
            </h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status Messages */}
          {status === 'success' && createdCredentials && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-800">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
                <span className="font-bold text-lg">Professor convidado com sucesso!</span>
              </div>

              <div className="bg-white border border-green-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-bold text-green-900 mb-2">
                  📧 Credenciais de Acesso do Professor:
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-bold text-green-700 uppercase">Email:</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm font-mono text-green-900">
                        {createdCredentials.email}
                      </code>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(createdCredentials.email)}
                        className="p-2 bg-green-100 hover:bg-green-200 rounded transition-colors"
                        title="Copiar email"
                      >
                        <span className="material-symbols-outlined text-green-700 text-sm">content_copy</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-green-700 uppercase">Senha Temporária:</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm font-mono text-green-900">
                        {createdCredentials.password}
                      </code>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(createdCredentials.password)}
                        className="p-2 bg-green-100 hover:bg-green-200 rounded transition-colors"
                        title="Copiar senha"
                      >
                        <span className="material-symbols-outlined text-green-700 text-sm">content_copy</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>⚠️ Importante:</strong> Envie estas credenciais ao professor. O status ficará como "Pendente" até a homologação.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                <span className="font-bold">Erro ao convidar professor</span>
              </div>
              <p className="text-sm ml-6">{errorMessage}</p>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Digite o nome completo do professor"
              className={`w-full bg-surface-container-low border ${
                errors.name ? 'border-error' : 'border-outline-variant/30'
              } rounded-lg px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all`}
              disabled={loading || status === 'success'}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="professor@instituicao.com.br"
              className={`w-full bg-surface-container-low border ${
                errors.email ? 'border-error' : 'border-outline-variant/30'
              } rounded-lg px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all`}
              disabled={loading || status === 'success'}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Especialidade */}
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2">
              Especialidade *
            </label>
            <select
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              className={`w-full bg-surface-container-low border ${
                errors.specialty ? 'border-error' : 'border-outline-variant/30'
              } rounded-lg px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all`}
              disabled={loading || status === 'success'}
            >
              <option value="">Selecione a especialidade</option>
              {specialties.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            {errors.specialty && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.specialty}
              </p>
            )}
          </div>

          {/* Bio (opcional) */}
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2">
              Biografia <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Breve descrição da experiência do professor..."
              rows={3}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all resize-none"
              disabled={loading || status === 'success'}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {status === 'success' ? (
              <button
                type="button"
                onClick={handleClose}
                className="w-full px-4 py-3 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">check</span>
                Fechar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-surface-container-lowest text-primary border border-outline-variant/20 rounded-lg font-bold hover:bg-surface-container-low transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Convidando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">person_add</span>
                      Convidar Professor
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default InviteTeacherModal
