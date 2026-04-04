-- Função RPC para buscar instrutores (contornando RLS)
-- Executar no SQL Editor do Supabase

-- Criar função para buscar todos os instrutores
CREATE OR REPLACE FUNCTION public.get_instructors()
RETURNS TABLE (
  id bigint,
  user_uuid uuid,
  full_name varchar,
  email varchar,
  phone varchar,
  cpf varchar,
  role varchar,
  specialty varchar,
  certifications varchar,
  status varchar,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER -- Executa com permissões do criador (ignora RLS)
AS $$
  SELECT 
    id,
    user_uuid,
    full_name,
    email,
    phone,
    cpf,
    role,
    specialty,
    certifications,
    status,
    created_at,
    updated_at
  FROM users
  WHERE role IN ('instructor', 'teacher')
  ORDER BY created_at DESC;
$$;

-- Conceder permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION public.get_instructors() TO authenticated;

-- Testar a função
-- SELECT * FROM public.get_instructors();
