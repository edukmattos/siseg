import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { createUserWithoutSession, supabaseAdmin } from '../lib/supabaseAdmin'

// Função para gerar senha temporária segura
function generateTemporaryPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function NewInstructorModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    specialty: '',
    certifications: '',
    phone: '',
    status: 'pending',
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null) // 'success' | 'error' | null
  const [createdCredentials, setCreatedCredentials] = useState(null) // { email, password }
  const [errorMessage, setErrorMessage] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  function validate() {
    const newErrors = {}
    if (!formData.full_name.trim()) newErrors.full_name = 'Nome é obrigatório'
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido'
    if (!formData.specialty.trim()) newErrors.specialty = 'Especialidade é obrigatória'

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
      // Gerar senha temporária para o instrutor
      const temporaryPassword = generateTemporaryPassword()

      // 1. Verificar se o email já existe (usando Admin API para ignorar RLS)
      const { data: existingAuthUsers } = await supabaseAdmin
        .from('users')
        .select('id, user_uuid, email')
        .eq('email', formData.email.trim())

      let userId = null
      let userUuid = null

      if (existingAuthUsers && existingAuthUsers.length > 0) {
        // Usuário já existe na tabela users, usar o ID existente
        const existingUser = existingAuthUsers[0]
        userId = existingUser.id
        userUuid = existingUser.user_uuid

        console.log('✅ Usuário já existe, usando ID:', userId)
      } else {
        // 2. Criar usuário no Supabase Auth usando Admin API (NÃO afeta a sessão atual)
        console.log('🔑 Criando instrutor via Admin API (sem afetar sessão)...')

        const { user: authUser, userId: newUserId, error: authError } = await createUserWithoutSession(
          formData.email.trim(),
          temporaryPassword,
          {
            full_name: formData.full_name.trim(),
            role: 'instructor',
            specialty: formData.specialty.trim(),
            certifications: formData.certifications || null,
            phone: formData.phone || null,
          }
        )

        if (authError) {
          console.error('Erro ao criar instrutor no Auth:', authError)
          if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
            throw new Error('Este email já está cadastrado no sistema. Por favor, use outro email ou entre em contato com o suporte.')
          }
          throw new Error(`Erro ao criar conta: ${authError.message}`)
        }

        if (!authUser) {
          throw new Error('Erro ao criar instrutor. Tente novamente.')
        }

        userUuid = authUser.id
        userId = newUserId

        console.log('✅ Instrutor criado no Auth com UUID:', userUuid)
        console.log('✅ Perfil criado/encontrado com ID:', userId)
      }

      // 3. Atualizar perfil com dados adicionais se usuário já existia
      if (existingAuthUsers && existingAuthUsers.length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            specialty: formData.specialty.trim(),
            certifications: formData.certifications || null,
            phone: formData.phone || null,
            role: 'instructor',
          })
          .eq('id', userId)

        if (updateError) {
          console.warn('⚠️ Aviso ao atualizar perfil:', updateError.message)
        }
      }

      // 4. Se o instrutor for criado como 'ATIVO', enviamos o convite de senha via RPC
      if (formData.status === 'active') {
        const { error: inviteError } = await supabase.rpc('invite_user_by_email', {
          email_address: formData.email,
          user_role: 'instructor'
        })

        if (inviteError) {
          console.warn('Perfil criado, mas erro ao enviar convite:', inviteError)
        }
      }

      // 5. Salvar credenciais para exibir
      setCreatedCredentials({
        email: formData.email.trim(),
        password: temporaryPassword,
      })

      setStatus('success')

      console.log('✅ Instrutor criado com sucesso! Aguardando usuário fechar o modal.')
    } catch (err) {
      console.error('❌ Erro ao criar instrutor:', err)
      console.error('📋 Detalhes do erro:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
      })
      setErrorMessage(err.message || 'Erro ao criar instrutor. Tente novamente.')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    // Se status for sucesso, chamar onSuccess para atualizar a lista
    if (status === 'success') {
      onSuccess?.()
    }

    setFormData({
      full_name: '',
      email: '',
      specialty: '',
      certifications: '',
      phone: '',
      status: 'pending',
    })
    setErrors({})
    setStatus(null)
    setCreatedCredentials(null)
    setErrorMessage('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant/10 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-headline font-extrabold text-primary">
              Novo Instrutor
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
                <span className="font-bold text-lg">Instrutor criado com sucesso!</span>
              </div>

              <div className="bg-white border border-green-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-bold text-green-900 mb-2">
                  📧 Credenciais de Acesso do Instrutor:
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
                    <strong>⚠️ Importante:</strong> Envie estas credenciais ao instrutor. Ele deverá fazer login e alterar a senha no primeiro acesso.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                <span className="font-bold">Erro ao criar instrutor</span>
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
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Digite o nome completo do instrutor"
              className={`w-full bg-surface-container-low border ${
                errors.full_name ? 'border-error' : 'border-outline-variant/30'
              } rounded-lg px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all`}
              disabled={loading || status === 'success'}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.full_name}
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
              placeholder="email@instrutor.com.br"
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
              <option value="">Selecione uma especialidade</option>
              <option value="NR-01 Gestão de Riscos">NR-01 Gestão de Riscos</option>
              <option value="NR-10 Eletricidade">NR-10 Eletricidade</option>
              <option value="NR-12 Máquinas e Equipamentos">NR-12 Máquinas e Equipamentos</option>
              <option value="NR-35 Trabalho em Altura">NR-35 Trabalho em Altura</option>
              <option value="Outras">Outras</option>
            </select>
            {errors.specialty && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.specialty}
              </p>
            )}
          </div>

          {/* Certificações */}
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2">
              Certificações
            </label>
            <input
              type="text"
              name="certifications"
              value={formData.certifications}
              onChange={handleChange}
              placeholder="Ex: Certificado NR-10, SEP..."
              className={`w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all`}
              disabled={loading || status === 'success'}
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2">
              Telefone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
              className={`w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all`}
              disabled={loading || status === 'success'}
            />
          </div>

          {/* Status Inicial */}
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2">
              Status Inicial
            </label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center gap-3 p-3 rounded-lg border border-outline-variant/30 cursor-pointer hover:bg-surface-container-low transition-colors">
                <input
                  type="radio"
                  name="status"
                  value="pending"
                  checked={formData.status === 'pending'}
                  onChange={handleChange}
                  className="text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-semibold text-on-surface-variant">Pendente</span>
                  <p className="text-xs text-on-surface-variant/70">Apenas cadastro</p>
                </div>
              </label>
              <label className="flex-1 flex items-center gap-3 p-3 rounded-lg border border-outline-variant/30 cursor-pointer hover:bg-surface-container-low transition-colors">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={handleChange}
                  className="text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-semibold text-on-surface-variant">Ativo</span>
                  <p className="text-xs text-on-surface-variant/70">Enviar convite agora</p>
                </div>
              </label>
            </div>
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
                      Criando Instrutor...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">person_add</span>
                      Adicionar Instrutor
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

export default NewInstructorModal
