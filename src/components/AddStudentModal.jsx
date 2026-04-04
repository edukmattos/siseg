import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { createUserWithoutSession, supabaseAdmin } from '../lib/supabaseAdmin'
import { useAuth } from '../context/AuthContext'

// Função para gerar senha temporária segura
function generateTemporaryPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function AddStudentModal({ isOpen, onClose, onSuccess }) {
  const { company } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    course: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // 'success' | 'error' | null
  const [createdCredentials, setCreatedCredentials] = useState(null) // { email, password }
  const [errorMessage, setErrorMessage] = useState('') // Mensagem de erro detalhada

  const departments = [
    'Operações Industriais',
    'Logística Central',
    'Manutenção',
    'Segurança',
    'Administrativo',
    'Tecnologia',
  ]

  const courses = [
    'NR-10 Básico',
    'NR-35 Trabalho Altura',
    'NR-06 EPI',
    'NR-12 Máquinas',
    'NR-18 Construção',
    'NR-33 Espaço Confinado',
    'NR-07 PCMSO',
    'Operador de Empilhadeira',
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

    if (!formData.department) {
      newErrors.department = 'Departamento é obrigatório'
    }

    if (!formData.course) {
      newErrors.course = 'Curso é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!validate()) return

    // Validar se a empresa está carregada
    if (!company || !company.id) {
      console.error('Empresa não carregada ou sem ID')
      setStatus('error')
      return
    }

    setLoading(true)
    setStatus(null)
    setCreatedCredentials(null)
    setErrorMessage('')

    try {
      // Gerar senha temporária para o Colaborador
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
        // Esta função já cria o perfil na tabela users e retorna o userId
        console.log('🔑 Criando usuário via Admin API (sem afetar sessão)...')
        
        const { user: authUser, userId: newUserId, error: authError } = await createUserWithoutSession(
          formData.email.trim(),
          temporaryPassword,
          {
            full_name: formData.name.trim(),
            role: 'student',
          }
        )

        if (authError) {
          console.error('Erro ao criar usuário no Auth:', authError)
          if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
            throw new Error('Este email já está cadastrado no sistema. Por favor, use outro email ou entre em contato com o suporte.')
          }
          throw new Error(`Erro ao criar conta: ${authError.message}`)
        }

        if (!authUser) {
          throw new Error('Erro ao criar usuário. Tente novamente.')
        }

        userUuid = authUser.id
        userId = newUserId
        
        console.log('✅ Usuário criado no Auth com UUID:', userUuid)
        console.log('✅ Perfil criado/encontrado com ID:', userId)
      }

      // 5. Vincular colaborador à empresa com departamento
      console.log('📌 Tentando vincular colaborador à empresa:')
      console.log('   - company.id:', company.id)
      console.log('   - userId:', userId)
      console.log('   - department:', formData.department)
      console.log('   - company data:', company)
      
      // Verificar que a sessão do dono da empresa ainda está ativa
      const { data: sessionData } = await supabase.auth.getSession()
      console.log('🔐 Sessão atual após criar Colaborador:', {
        user: sessionData?.session?.user?.email,
        userId: sessionData?.session?.user?.id,
      })

      // Tentar primeiro usando a função RPC (contorna RLS)
      const { error: rpcError } = await supabase.rpc('add_company_member', {
        p_company_id: company.id,
        p_user_id: userId,
        p_department: formData.department,
        p_job_function: formData.course,
        p_role: 'employee',
      })

      if (rpcError) {
        console.error('❌ Erro ao usar RPC add_company_member:', rpcError)
        console.error('   - Código:', rpcError.code)
        console.error('   - Mensagem:', rpcError.message)
        console.error('   - Detalhes:', rpcError.details)
        
        // Se a função RPC não existir, tentar inserção direta (fallback)
        if (rpcError.message.includes('Could not find')) {
          console.warn('⚠️ Função RPC não encontrada, tentando inserção direta...')
          
          const { error: memberError } = await supabase
            .from('company_members')
            .insert({
              company_id: company.id,
              user_id: userId,
              department: formData.department,
              job_function: formData.course,
              role: 'employee',
            })

          if (memberError) {
            console.error('❌ Erro ao vincular Colaborador à empresa (inserção direta):', memberError)
            console.error('   - Código:', memberError.code)
            console.error('   - Mensagem:', memberError.message)
            console.error('   - Detalhes:', memberError.details)

            // Se o vínculo já existir, não é um erro crítico
            if (!memberError.message.includes('duplicate') && !memberError.message.includes('unique')) {
              throw memberError
            }
          }
        } else {
          throw rpcError
        }
      } else {
        console.log('✅ Colaborador vinculado com sucesso via RPC!')
      }

      // 6. Salvar credenciais para exibir
      setCreatedCredentials({
        email: formData.email.trim(),
        password: temporaryPassword,
      })

      setStatus('success')

      // NOT calling onSuccess/onClose automatically - let user close manually
      // to give them time to copy the credentials
      console.log('✅ Colaborador criado com sucesso! Aguardando usuário fechar o modal.')
    } catch (error) {
      console.error('❌ Erro ao adicionar Colaborador:', error)
      console.error('📋 Detalhes do erro:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      setErrorMessage(error.message || 'Erro desconhecido ao adicionar Colaborador')
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
    // Se status for sucesso, chamar onSuccess para atualizar a lista
    if (status === 'success') {
      onSuccess?.()
    }
    
    setFormData({ name: '', email: '', department: '', course: '' })
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
              Adicionar Colaborador
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
                <span className="font-bold text-lg">Colaborador criado com sucesso!</span>
              </div>
              
              <div className="bg-white border border-green-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-bold text-green-900 mb-2">
                  📧 Credenciais de Acesso do Colaborador:
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
                    <strong>⚠️ Importante:</strong> Envie estas credenciais ao colaborador. Ele deverá fazer login e alterar a senha no primeiro acesso.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                <span className="font-bold">Erro ao adicionar colaborador</span>
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
              placeholder="Digite o nome completo do Colaborador"
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
              placeholder="email@empresa.com.br"
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

          {/* Departamento */}
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2">
              Departamento *
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className={`w-full bg-surface-container-low border ${
                errors.department ? 'border-error' : 'border-outline-variant/30'
              } rounded-lg px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all`}
              disabled={loading || status === 'success'}
            >
              <option value="">Selecione o departamento</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {errors.department && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.department}
              </p>
            )}
          </div>

          {/* Curso */}
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2">
              Curso *
            </label>
            <select
              name="course"
              value={formData.course}
              onChange={handleChange}
              className={`w-full bg-surface-container-low border ${
                errors.course ? 'border-error' : 'border-outline-variant/30'
              } rounded-lg px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all`}
              disabled={loading || status === 'success'}
            >
              <option value="">Selecione o curso</option>
              {courses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
            {errors.course && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.course}
              </p>
            )}
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
                      Criando Colaborador...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">person_add</span>
                      Adicionar Colaborador
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

export default AddStudentModal
