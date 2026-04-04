import { createClient } from '@supabase/supabase-js'

// Cliente normal (anon) - para uso no frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vbpunolnqikllwanfvxi.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin (service_role) - APENAS para operações administrativas
// Este cliente ignora RLS e não afeta a sessão do usuário atual
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''

export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Função auxiliar para criar usuário sem afetar a sessão atual
// Também cria o perfil na tabela public.users usando a Admin API
export async function createUserWithoutSession(email, password, metadata = {}) {
  if (!supabaseAdmin) {
    throw new Error('Service role key não configurada. Adicione VITE_SUPABASE_SERVICE_ROLE_KEY ao .env')
  }

  // 1. Criar usuário no Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Pula a confirmação de email
    user_metadata: metadata,
  })

  if (authError) {
    throw authError
  }

  if (!authData.user) {
    throw new Error('Usuário retornado é null')
  }

  // 2. Criar perfil na tabela public.users (Admin API ignora RLS!)
  const { error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      user_uuid: authData.user.id,
      full_name: metadata.full_name || email.split('@')[0],
      email: email,
      role: metadata.role || 'student',
    })

  if (profileError) {
    console.error('Erro ao criar perfil do usuário:', profileError)
    // Se o perfil já existir (conflito de unique), não é um erro fatal
    if (!profileError.message.includes('duplicate') && !profileError.message.includes('unique')) {
      throw new Error(`Não foi possível criar o perfil do usuário: ${profileError.message}`)
    }
    // Perfil já existe, vamos buscar o ID existente
    console.log('⚠️ Perfil já existe, buscando ID existente...')
  }

  // 3. Buscar o perfil criado ou existente (usando Admin API para ignorar RLS)
  const { data: userData, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('id, user_uuid')
    .eq('user_uuid', authData.user.id)
    .single()

  if (fetchError || !userData) {
    console.error('Erro ao buscar perfil após criação:', fetchError)
    throw new Error(`Não foi possível encontrar o perfil do usuário: ${fetchError?.message}`)
  }

  console.log('✅ Perfil encontrado/buscado com ID:', userData.id)

  return { user: authData.user, userId: userData.id }
}
