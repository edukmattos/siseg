import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

/* eslint-disable react-refresh/only-export-components */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  // Carregar sessão ao iniciar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setUser(null)
        setCompany(null)
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadUserProfile(session.user.id)
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadUserProfile(userUuid) {
    console.log('🔍 loadUserProfile chamado com UUID:', userUuid)
    try {
      // Tentativa 1: Query normal (pode falhar com erro 500 devido a RLS)
      let userDataArray = null
      let userError = null
      
      try {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('user_uuid', userUuid)
        
        userDataArray = result.data
        userError = result.error
      } catch (queryError) {
        // Erro 500 ou outro erro de servidor
        console.warn('⚠️ Query falhou (erro de servidor), tentando alternativa...', queryError.message)
        userError = queryError
      }

      // Se falhou na tentativa 1, tentar usar RPC como alternativa
      if (userError || !userDataArray || userDataArray.length === 0) {
        console.warn('⚠️ Tentativa 1 falhou, usando fallback via RPC...')
        
        try {
          // Tentar buscar via função RPC que faz bypass do RLS
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_by_uuid', {
            target_uuid: userUuid
          })
          
          if (!rpcError && rpcData) {
            userDataArray = Array.isArray(rpcData) ? rpcData : [rpcData]
            console.log('✅ Dados obtidos via RPC:', userDataArray)
          } else {
            console.warn('⚠️ RPC também falhou:', rpcError?.message)
          }
        } catch (rpcError) {
          console.warn('⚠️ RPC não disponível:', rpcError.message)
        }
      }

      // Se ainda assim não encontrou dados, usar fallback do Auth
      if (!userDataArray || userDataArray.length === 0) {
        console.warn('⚠️ Usuário auth existe mas não tem perfil em public.users')
        // Buscar apenas no Supabase Auth
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          // Criar objeto user básico com dados do Auth
          const basicUser = {
            id: authUser.id,
            user_uuid: authUser.id,
            full_name: authUser.user_metadata?.full_name || 'Usuário',
            email: authUser.email,
            role: authUser.user_metadata?.role || 'employer',
          }
          setUser(basicUser)
          console.log('✅ User set (do Auth):', basicUser.full_name, '| Role:', basicUser.role)
        } else {
          setUser(null)
        }
        setCompany(null)
        return
      }

      const userData = userDataArray[0]
      setUser(userData)
      console.log('✅ User set:', userData.full_name, '| Role:', userData.role)

      // Buscar empresa onde este usuário é owner usando RPC (evita recursão infinita)
      let companyData = null
      try {
        const companyResult = await supabase.rpc('get_company_by_owner_id', {
          p_owner_id: userData.id
        })

        if (companyResult.error) {
          console.warn('⚠️ RPC para buscar empresa falhou:', companyResult.error.message)
        } else if (companyResult.data && companyResult.data.length > 0) {
          companyData = companyResult.data[0]
        }
      } catch (rpcError) {
        console.warn('⚠️ Falha ao buscar empresa via RPC:', rpcError.message)
        
        // Fallback: tentar query direta (pode falhar com recursão)
        try {
          const fallbackResult = await supabase
            .from('companies')
            .select('*')
            .eq('owner_id', userData.id)
            .maybeSingle()
          
          companyData = fallbackResult?.data || null
          if (fallbackResult?.error) {
            console.warn('⚠️ Fallback também falhou:', fallbackResult.error.message)
          }
        } catch (fallbackError) {
          console.warn('⚠️ Fallback falhou:', fallbackError.message)
        }
      }

      console.log('companyData:', companyData)

      setCompany(companyData || null)

      // Determinar se é student baseado no role
      const isStudent = userData.role === 'student'
      console.log(' Tipo de usuário:', isStudent ? 'STUDENT' : 'EMPLOYER')
    } catch (err) {
      console.error('❌ Erro ao carregar perfil:', err)
    } finally {
      setLoading(false)
    }
  }

  // Login com email/senha
  const signIn = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Mensagens amigáveis
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos')
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Email não confirmado. Verifique sua caixa de entrada.')
        }
        throw new Error(error.message)
      }

      await loadUserProfile(data.user.id)
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Registro de novo usuário (apenas auth)
  const signUp = useCallback(async (name, email, password) => {
    setLoading(true)
    try {
      // 1. Criar no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      // 2. Inserir na tabela public.users
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          user_uuid: authData.user.id,
          full_name: name,
          email,
          role: 'employer',
        })
        .select()
        .single()

      if (userError) throw userError

      setUser(newUser)
      setCompany(null) // Ainda sem empresa
    } catch (error) {
      console.error('Erro no cadastro:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Registro de empresa + usuário responsável (fluxo completo)
  const registerCompany = useCallback(async (companyData, userData) => {
    setLoading(true)
    try {
      let authData, authError
      
      // 1. Tentar criar usuário no Supabase Auth
      const result = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      })
      
      authData = result.data
      authError = result.error

      let newUser = null

      if (authError) {
        // Se o usuário já existe no Auth, fazer login e verificar perfil
        if (authError.message.includes('User already registered') || authError.code === '422') {
          console.log('Usuário já existe no Auth, tentando login...')
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: userData.password,
          })

          if (loginError) {
            throw new Error('Este email já está registrado. Tente fazer login.')
          }

          authData = loginData

          // Verificar se já tem perfil na tabela users
          const { data: existingUserArray } = await supabase
            .from('users')
            .select('*')
            .eq('user_uuid', authData.user.id)

          if (existingUserArray && existingUserArray.length > 0) {
            // Já tem perfil na tabela users
            newUser = existingUserArray[0]
            console.log('Usuário existente encontrado:', newUser.full_name, '| Role:', newUser.role)

            // Verificar se já possui empresa
            const { data: existingCompany } = await supabase
              .from('companies')
              .select('*')
              .eq('owner_id', newUser.id)
              .single()

            if (existingCompany) {
              // Já tem empresa cadastrada
              setUser(newUser)
              setCompany(existingCompany)
              throw new Error('Você já possui uma empresa cadastrada. Faça login para acessar seu dashboard.')
            }

            // Atualizar role para employer se for student
            if (newUser.role === 'student') {
              console.log('Atualizando role de student para employer...')
              await supabase
                .from('users')
                .update({ role: 'employer' })
                .eq('id', newUser.id)
              
              newUser.role = 'employer'
            }
          } else {
            // Usuário existe no Auth mas não na tabela users - criar perfil agora
            console.log('Criando perfil na tabela users para usuário existente no Auth...')
            const { data: createdUser, error: createUserError } = await supabase
              .from('users')
              .insert({
                user_uuid: authData.user.id,
                full_name: userData.name,
                email: userData.email,
                phone: userData.phone,
                role: 'employer',
              })
              .select()
              .single()

            if (createUserError) {
              console.error('Erro ao criar perfil:', createUserError)
              throw new Error('Erro ao criar perfil do usuário.')
            }
            newUser = createdUser
          }
        } else {
          throw authError
        }
      } else {
        // Novo usuário criado com sucesso - criar perfil na tabela users
        const { data: createdUser, error: createUserError } = await supabase
          .from('users')
          .insert({
            user_uuid: authData.user.id,
            full_name: userData.name,
            email: userData.email,
            phone: userData.phone,
            role: 'employer',
          })
          .select()
          .single()

        if (createUserError) {
          console.error('Erro ao criar perfil:', createUserError)
          throw new Error('Erro ao criar perfil do usuário.')
        }
        newUser = createdUser
      }

      // Se chegou aqui, temos newUser válido
      if (!newUser) {
        throw new Error('Erro ao obter dados do usuário.')
      }

      // 2. Inserir empresa com owner_id = newUser.id
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          fantasy_name: companyData.fantasy_name,
          legal_name: companyData.legal_name || companyData.fantasy_name,
          cnpj: companyData.cnpj,
          corporate_email: userData.email,
          phone: userData.phone,
          address_street: companyData.address_street,
          address_number: companyData.address_number,
          address_complement: companyData.address_complement,
          address_neighborhood: companyData.address_neighborhood,
          address_city: companyData.address_city,
          address_state: companyData.address_state,
          address_zip_code: companyData.address_zip_code,
          owner_id: newUser.id,
          status: 'active',
        })
        .select()
        .single()

      if (companyError) {
        console.error('Erro ao criar empresa:', companyError)
        throw new Error(companyError.message || 'Erro ao criar empresa.')
      }

      setUser(newUser)
      setCompany(newCompany)
    } catch (error) {
      console.error('Erro ao registrar empresa:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCompany(null)
  }, [])

  const value = {
    user,
    company,
    loading,
    isAuthenticated: !!user,
    hasCompany: !!company,
    isStudent: user?.role === 'student',
    isEmployer: user?.role === 'employer' || user?.role === 'admin',
    isSuperAdmin: user?.role === 'super_admin',
    isInstructor: user?.role === 'instructor',
    userRole: user?.role,
    signIn,
    signUp,
    registerCompany,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
