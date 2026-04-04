# Correção do Erro ao Adicionar Alunos

## Problema Identificado

1. **Erro 406**: Falha ao inserir na tabela `users` devido à política RLS restritiva
2. **Erro 42501**: Violação de política RLS na tabela `company_members`
3. **Causa Raiz**: 
   - A política `users_all_own` impedia que usuários criassem perfis de terceiros
   - A política `company_members` dependia da função `get_current_user_id()` que falhava

## Soluções Aplicadas no Código

### 1. AddStudentModal.jsx
- ✅ Removida tentativa desnecessária de login com senha temporária
- ✅ Melhorada a verificação se usuário já existe
- ✅ Adicionado delay para aguardar criação automática do perfil
- ✅ Adicionado fallback para criação manual do perfil se a trigger falhar
- ✅ Melhorada a captura e logging de erros
- ✅ Exibição de mensagens de erro detalhadas ao usuário

### 2. Arquivos SQL Criados

#### `create_user_profile_trigger.sql`
Cria uma trigger automática que cria o perfil na tabela `public.users` quando um novo usuário é registrado no `auth.users`.

#### `fix_users_rls_for_student_creation.sql`
Corrige as políticas RLS da tabela `users` para permitir que empregadores criem perfis de alunos.

#### `fix_company_members_rls_final.sql` ⭐ NOVO
Corrige as políticas RLS da tabela `company_members` para permitir que donos de empresas vinculem alunos.

## Como Aplicar as Correções

### Passo 1: Aplicar a Trigger de Criação Automática de Perfis

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Vá para **SQL Editor**
3. Execute o script: `supabase/create_user_profile_trigger.sql`

Este script criará:
- Função `handle_new_user()` que cria perfis automaticamente
- Trigger `on_auth_user_created` que dispara a função

### Passo 2: Corrigir as Políticas RLS da tabela `users`

1. Ainda no **SQL Editor** do Supabase
2. Execute o script: `supabase/fix_users_rls_for_student_creation.sql`

Este script:
- Remove a política restritiva `users_all_own`
- Cria política de SELECT que permite ver próprios dados
- Cria política de INSERT que permite usuários autenticados criarem perfis
- Cria política de UPDATE restrita ao próprio usuário

### Passo 3: Corrigir as Políticas RLS da tabela `company_members` ⭐ IMPORTANTE

1. No **SQL Editor** do Supabase
2. Execute o script: `supabase/fix_company_members_rls_final.sql`

Este script:
- Remove todas as políticas antigas de `company_members`
- Cria política de INSERT usando JOIN direto (não depende de funções)
- Cria política de UPDATE para donos de empresas
- Cria política de DELETE para donos de empresas
- Cria política de SELECT para membros e donos

**Por que esta correção é importante?**
- A política antiga usava `get_current_user_id()` que falhava
- A nova política faz JOIN direto entre `companies` e `users`
- Usa `auth.uid()` diretamente, que é mais confiável

### Passo 4: Testar a Funcionalidade

1. Faça login como dono da empresa
2. Tente adicionar um novo aluno
3. Verifique o console para logs detalhados
4. O aluno deve ser criado com sucesso e as credenciais exibidas

## Verificação de Sucesso

Após aplicar as correções, você deve ver:

✅ No Console do Navegador:
```
🔍 loadUserProfile chamado com UUID: xxx
userData: {...}
userError: null
✅ User set: Nome do Usuário
Usuário já existe, vinculado à empresa (ID: 123)
```

✅ No Supabase:
- Novo registro em `auth.users`
- Novo registro em `public.users` (automático pela trigger)
- Novo registro em `company_members` vinculando o aluno à empresa

## Troubleshooting

### Se ainda der erro 406 (users):
Verifique se a trigger foi criada:
```sql
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
```

Verifique as políticas RLS:
```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

Deve haver 3 políticas:
- `users_select_own` (SELECT)
- `users_insert_any_authenticated` (INSERT)
- `users_update_own` (UPDATE)

### Se ainda der erro 42501 (company_members):
Verifique as políticas RLS:
```sql
SELECT * FROM pg_policies WHERE tablename = 'company_members';
```

Deve haver 4 políticas:
- `company_members_delete_policy` (DELETE)
- `company_members_insert_policy` (INSERT)
- `company_members_select_policy` (SELECT)
- `company_members_update_policy` (UPDATE)

### Se o perfil não for criado automaticamente:
Verifique se a função existe:
```sql
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

### Teste rápido para verificar o usuário e empresa:
```sql
-- Verificar se o usuário logado tem perfil e empresa
SELECT 
    u.id as user_id,
    u.full_name,
    u.email,
    u.role,
    c.id as company_id,
    c.fantasy_name as company_name
FROM users u
LEFT JOIN companies c ON c.owner_id = u.id
WHERE u.user_uuid = auth.uid();
```

Se retornar NULL em `company_id`, o usuário não tem empresa cadastrada.

## Fluxo de Criação de Alunos (Atualizado)

1. **Usuário preenche o formulário** → AddStudentModal
2. **Verifica se email já existe** na tabela `users`
3. **Se não existe:**
   - Cria no `auth.users` via `signUp()`
   - Aguarda 1 segundo para a trigger criar o perfil
   - Verifica se o perfil foi criado em `public.users`
   - Se não foi criado, cria manualmente
4. **Vincula aluno à empresa** na tabela `company_members` (usa nova política RLS)
5. **Exibe credenciais** (email + senha temporária)

## Notas de Segurança

- ✅ A política de INSERT permite criação de perfis por qualquer usuário autenticado
- ✅ A política de UPDATE restringe alterações ao próprio usuário
- ✅ O `user_uuid` é UNIQUE e referenciado ao `auth.users`
- ✅ As políticas de `company_members` verificam ownership via JOIN direto
- ✅ Senhas temporárias são geradas com 12 caracteres aleatórios
- ⚠️ Recomenda-se implementar expiração de senha temporária no futuro

## Resumo dos Arquivos SQL

| Arquivo | Tabela | Ação |
|---------|--------|------|
| `create_user_profile_trigger.sql` | users (trigger) | Cria perfil automático |
| `fix_users_rls_for_student_creation.sql` | users (RLS) | Permite criação de alunos |
| `fix_company_members_rls_final.sql` | company_members (RLS) | Permite vincular alunos |

**IMPORTANTE:** Execute os 3 scripts na ordem acima para garantir o funcionamento correto!
