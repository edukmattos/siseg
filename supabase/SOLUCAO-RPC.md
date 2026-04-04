# 🚀 SOLUÇÃO RÁPIDA: Executar Função RPC

## Problema
O erro de RLS continua porque as políticas não estão funcionando como esperado.

## Solução: Função RPC com SECURITY DEFINER

Esta função ignora completamente as restrições de RLS porque executa com permissões de superusuário.

### Passo 1: Executar no Supabase

1. Acesse: https://supabase.com/dashboard/project/vbpunolnqikllwanfvxi/sql/new

2. Copie e execute **APENAS** este SQL:

```sql
-- Criar função que adiciona membro à empresa (ignora RLS)
CREATE OR REPLACE FUNCTION add_company_member(
    p_company_id INT,
    p_user_id INT,
    p_department VARCHAR(100),
    p_job_function VARCHAR(100),
    p_role VARCHAR(50)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário chamador é dono da empresa
    IF NOT EXISTS (
        SELECT 1 FROM companies c
        INNER JOIN users u ON c.owner_id = u.id
        WHERE c.id = p_company_id
        AND u.user_uuid = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Usuário não tem permissão para adicionar membros a esta empresa';
    END IF;
    
    -- Inserir o membro (ignora RLS)
    INSERT INTO company_members (company_id, user_id, department, job_function, role)
    VALUES (p_company_id, p_user_id, p_department, p_job_function, p_role)
    ON CONFLICT (company_id, user_id) DO UPDATE SET
        department = EXCLUDED.department,
        job_function = EXCLUDED.job_function,
        role = EXCLUDED.role,
        removed_at = NULL;
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION add_company_member TO authenticated;

-- Verificar
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'add_company_member';
```

3. Clique em **"Run"**

4. Deve aparecer:
```
Success. No rows returned
```

E no resultado da verificação:
| proname | prosecdef |
|---------|-----------|
| add_company_member | true |

### Passo 2: Testar no Aplicativo

1. Recarregue a página do aplicativo (F5)
2. Tente adicionar um aluno
3. Deve funcionar agora! ✅

### Como funciona

```
┌─────────────────────────────────────────────────┐
│ AddStudentModal (React)                         │
│   ↓                                              │
│ supabase.rpc('add_company_member', {...})       │
│   ↓                                              │
│ Função RPC no PostgreSQL (SECURITY DEFINER)     │
│   - Executa com permissões de superusuário      │
│   - IGNORA políticas RLS                        │
│   - Faz verificação própria de permissão        │
│   - Insere diretamente na tabela                │
│   ↓                                              │
│ company_members (inserido com sucesso!)          │
└─────────────────────────────────────────────────┘
```

### Por que isso funciona?

- `SECURITY DEFINER`: A função executa com as permissões do criador (postgres), não do usuário chamador
- Isso significa que as políticas RLS são ignoradas dentro da função
- A função faz sua própria verificação de segurança (verifica se é dono da empresa)
- É mais seguro e confiável do que depender de políticas RLS complexas
