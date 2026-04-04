# 🔧 Instruções para Corrigir o Erro de RLS

## Problema
A tabela `company_members` não tem políticas de INSERT/UPDATE/DELETE, apenas SELECT. Isso impede que o dono da empresa adicione alunos.

## Solução

Você precisa executar o seguinte SQL no **Supabase Dashboard**:

### Passo 1: Acessar o SQL Editor

1. Acesse: https://supabase.com/dashboard/project/vbpunolnqikllwanfvxi
2. No menu lateral, clique em **SQL Editor**
3. Clique em **New Query**

### Passo 2: Executar o Script SQL

Copie e cole este SQL:

```sql
-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "company_members_insert_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_update_policy" ON company_members;
DROP POLICY IF EXISTS "company_members_delete_policy" ON company_members;

-- Política de INSERT: Dono da empresa pode adicionar membros
CREATE POLICY "company_members_insert_policy"
    ON company_members FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT c.id FROM companies c WHERE c.owner_id = public.get_current_user_id()
        )
    );

-- Política de UPDATE: Dono da empresa pode atualizar membros
CREATE POLICY "company_members_update_policy"
    ON company_members FOR UPDATE
    USING (
        company_id IN (
            SELECT c.id FROM companies c WHERE c.owner_id = public.get_current_user_id()
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT c.id FROM companies c WHERE c.owner_id = public.get_current_user_id()
        )
    );

-- Política de DELETE: Dono da empresa pode remover membros
CREATE POLICY "company_members_delete_policy"
    ON company_members FOR DELETE
    USING (
        company_id IN (
            SELECT c.id FROM companies c WHERE c.owner_id = public.get_current_user_id()
        )
    );
```

### Passo 3: Executar

Clique no botão **Run** ou pressione `Ctrl+Enter`

### Passo 4: Verificar

Você deve ver uma mensagem de sucesso. Para confirmar, execute:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'company_members'
ORDER BY policyname;
```

Você deve ver as políticas:
- ✅ company_members_delete_policy (DELETE)
- ✅ company_members_insert_policy (INSERT)
- ✅ company_members_select_policy (SELECT)
- ✅ company_members_update_policy (UPDATE)

### Passo 5: Testar

1. Volte para sua aplicação
2. Atualize a página (F5)
3. Tente adicionar um aluno novamente
4. ✅ Agora deve funcionar!

## Nota

O arquivo SQL completo está em: `d:\AG\siseg\course\supabase\fix_company_members_rls.sql`
