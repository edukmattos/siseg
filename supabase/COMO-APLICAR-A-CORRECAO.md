# 🚨 URGENTE: Como Resolver o Erro ao Adicionar Aluno

## O Problema

Você está vendo este erro:
```
new row violates row-level security policy for table "company_members"
```

Isso acontece porque o Supabase está bloqueando a inserção de novos alunos na tabela `company_members`.

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### Passo 1: Abrir o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto `siseg` (ou o nome do seu projeto)

### Passo 2: Ir para o SQL Editor

No menu lateral esquerdo, clique em:
```
📝 SQL Editor
```

### Passo 3: Executar o Script de Correção

1. No seu computador, abra o arquivo:
   ```
   d:\AG\siseg\course\supabase\EXECUTAR-URGENTE-RLS-FIX.sql
   ```

2. **Copie TODO o conteúdo** do arquivo (Ctrl+A, Ctrl+C)

3. **Cole no SQL Editor** do Supabase (Ctrl+V)

4. Clique no botão **"Run"** (ou pressione Ctrl+Enter)

### Passo 4: Verificar o Resultado

Após executar, você deve ver uma tabela com 4 linhas:

| policyname | cmd | qual | with_check |
|------------|-----|------|------------|
| company_members_delete_policy | DELETE | ... | null |
| company_members_insert_policy | INSERT | null | ... |
| company_members_select_policy | SELECT | true | null |
| company_members_update_policy | UPDATE | ... | ... |

✅ **Se apareceram as 4 políticas**, a correção funcionou!

### Passo 5: Testar no Aplicativo

1. Volte para o seu aplicativo (localhost)
2. Recarregue a página (F5)
3. Tente adicionar um aluno novamente
4. **Deve funcionar agora!** 🎉

## 🔍 O que este script faz?

O script:
1. **Remove** todas as políticas antigas que estavam bloqueando
2. **Cria** novas políticas que permitem que o dono da empresa adicione alunos
3. **Verifica** se as políticas foram criadas corretamente

## ⚠️ Se ainda der erro

### Verifique se o script executou sem erros:
- Olhe a seção de "Result" no SQL Editor
- Deve mostrar "Success" ou listar as 4 políticas

### Verifique no console do navegador (F12):
Deve aparecer:
```
📌 Tentando vincular aluno à empresa:
   - company.id: 123
   - userId: 456
✅ Aluno vinculado com sucesso!
```

### Se ainda der erro:
1. Tire um print do erro
2. Verifique o console do navegador (F12 → Console)
3. Veja se aparece o log com `company.id` e `userId`

## 📞 Precisa de ajuda?

Se o problema persistir após executar o script:
1. Abra o console do navegador (F12)
2. Copie os logs que aparecem ao tentar adicionar um aluno
3. Envie os logs para análise

## 🎯 Resumo

- **Arquivo para executar**: `EXECUTAR-URGENTE-RLS-FIX.sql`
- **Onde executar**: Supabase Dashboard → SQL Editor
- **Tempo estimado**: 2-5 minutos
- **Resultado esperado**: Funcionar ao adicionar alunos

---

**IMPORTANTE**: Este script precisa ser executado **APENAS UMA VEZ** no banco de dados do Supabase.
