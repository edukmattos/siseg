# 🎯 SOLUÇÃO FINAL: Erro ao Adicionar Aluno

## Problema Identificado

O erro **"Usuário não tem permissão para adicionar membros a esta empresa"** acontecia porque:

1. **`supabase.auth.signUp()` fazia login automático** do novo aluno
2. Isso **trocava a sessão** do dono da empresa para o aluno
3. Quando a função RPC verificava `auth.uid()`, recebia o UUID do **aluno**, não do dono
4. A verificação falhava porque o aluno não é dono da empresa

## Solução Implementada

### 1. Criar `supabaseAdmin.js`

Arquivo: `src/lib/supabaseAdmin.js`

- ✅ Cria cliente Supabase com **service_role key**
- ✅ Usa **Admin API** para criar usuários sem afetar a sessão atual
- ✅ Exporta função `createUserWithoutSession()`

### 2. Atualizar `.env`

Adicionada variável:
```
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 3. Atualizar `AddStudentModal.jsx`

**Mudança principal:**
```javascript
// ANTES (causava o problema):
const { data: authData } = await supabase.auth.signUp({...})

// DEPOIS (não afeta sessão):
const { user: authUser } = await createUserWithoutSession(...)
```

**Novos logs adicionados:**
- 🔑 Mostra quando está criando via Admin API
- 🔐 Verifica que a sessão do dono permanece ativa
- ✅ Confirma UUID do usuário criado

### 4. Função RPC no Supabase

Arquivo: `supabase/EXECUTAR-ESTE-RPC.sql`

Esta função ainda é necessária e deve ser executada no Supabase!

## Como Testar

### Passo 1: Executar SQL no Supabase (se ainda não fez)

1. Acesse: https://supabase.com/dashboard/project/vbpunolnqikllwanfvxi/sql/new
2. Execute: `supabase/EXECUTAR-ESTE-RPC.sql`

### Passo 2: Reiniciar o Servidor de Desenvolvimento

A variável `.env` foi alterada, então **REINICIE** o servidor:

```bash
# Pare o servidor atual (Ctrl+C)
# E inicie novamente:
npm run dev
```

### Passo 3: Testar

1. Acesse o aplicativo
2. Faça login como dono da empresa
3. Tente adicionar um aluno
4. Verifique o console (F12) - deve mostrar:

```
🔑 Criando usuário via Admin API (sem afetar sessão)...
✅ Usuário criado no Auth com UUID: xxx-xxx-xxx
🔐 Sessão atual após criar aluno: { user: "dono@empresa.com", userId: "..." }
📌 Tentando vincular aluno à empresa:
✅ Aluno vinculado com sucesso via RPC!
```

## Verificação de Sucesso

✅ **No console do navegador:**
- A sessão deve mostrar o email do **dono da empresa**, não do aluno
- Deve aparecer "Aluno vinculado com sucesso via RPC!"

✅ **No Supabase:**
- Novo registro em `auth.users` (o aluno)
- Novo registro em `public.users` (pela trigger)
- Novo registro em `company_members` vinculando o aluno à empresa

## Troubleshooting

### Se ainda der erro de permissão:

1. **Verifique o console** - a sessão está mostrando o email correto?
2. **Reinicie o servidor** - a variável `.env` precisa ser recarregada
3. **Verifique o .env** - `VITE_SUPABASE_SERVICE_ROLE_KEY` está presente?

### Se der erro "Service role key não configurada":

Verifique se a linha abaixo está no `.env`:
```
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Se der erro "Could not find function":

Execute no Supabase SQL Editor:
```sql
-- Arquivo: supabase/EXECUTAR-ESTE-RPC.sql
```

## Resumo Técnico

```
Fluxo Antigo (PROBLEMÁTICO):
signUp() → Troca sessão → auth.uid() = UUID do aluno → ❌ Falha verificação

Fluxo Novo (CORRETO):
createUserWithoutSession() → Sessão intacta → auth.uid() = UUID do dono → ✅ Sucesso
```
