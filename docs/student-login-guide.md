# Guia Rápido: Como o Aluno Faz Login

## Fluxo Completo de Cadastro e Acesso

### 📝 Passo 1: Administrador Cadastra o Aluno
1. Acessa o **Company Dashboard**
2. Clica em **"Adicionar Aluno"**
3. Preenche o formulário com:
   - Nome completo
   - Email (será o login)
   - Departamento
   - Curso
4. Clica em **"Adicionar Aluno"**

### 🔑 Passo 2: Sistema Gera Credenciais
Após criar o aluno, o sistema exibe automaticamente:
- **Email de Login**: o email cadastrado
- **Senha Temporária**: senha aleatória de 12 caracteres

**Exemplo de credenciais geradas:**
```
Email: joao.silva@empresa.com.br
Senha: aB3dE#fG9hI@
```

### 📋 Passo 3: Administrador Copia e Envia as Credenciais
1. Clica nos botões de **copiar** ao lado de cada credencial
2. Envia ao aluno por email, WhatsApp ou outro meio de comunicação

**Modelo de mensagem:**
```
Olá [Nome do Aluno],

Seu acesso à plataforma de cursos foi criado!

📧 Email de login: [email]
🔑 Senha temporária: [senha]

Acesse: [URL da plataforma]

IMPORTANTE: Altere sua senha no primeiro acesso por segurança.

Qualquer dúvida, entre em contato.
```

### 🎓 Passo 4: Aluno Faz Login
1. Acessa a plataforma
2. Clica em **"Login"**
3. Digita:
   - **Email**: o email fornecido
   - **Senha**: a senha temporária fornecida
4. Clica em **"Entrar"**
5. ✅ **Acesso concedido!** Agora pode visualizar e fazer os cursos

### 🔒 Passo 5: Aluno Altera a Senha (Recomendado)
**Funcionalidade futura**: O sistema deveria forçar a troca de senha no primeiro login.

Por enquanto, o aluno pode alterar a senha manualmente nas configurações de perfil (quando implementado).

---

## ❓ Perguntas Frequentes

### O que acontece se o email já estiver cadastrado?
O sistema exibe um erro: **"Este email já está cadastrado no sistema"** e impede a criação duplicada.

### Posso criar vários alunos com o mesmo email?
Não. O email deve ser único no sistema (usado como identificador de login).

### A senha temporária expira?
Atualmente não. A senha permanece válida até que o aluno ou administrador a altere.

### O aluno recebe email automático?
Não ainda. O administrador deve enviar as credenciais manualmente.
**Melhoria futura**: Implementar envio automático de email com as credenciais.

### Posso redefinir a senha de um aluno?
Não ainda. Esta funcionalidade será implementada futuramente.

---

## 🎯 Resumo Visual

```
ADMINISTRADOR                           ALUNO
    │                                     │
    ├─ Cria aluno no sistema              │
    │                                     │
    ├─ Sistema gera:                      │
    │   • Email: joao@empresa.com         │
    │   • Senha: aB3dE#fG9hI@            │
    │                                     │
    ├─ Copia credenciais ────────────────>│
    │                                     │
    │                          ┌──────────
    │                          │
    │                          ├─ Acessa plataforma
    │                          │
    │                          ├─ Faz login com:
    │                          │   • Email: joao@empresa.com
    │                          │   • Senha: aB3dE#fG9hI@
    │                          │
    │                          └─ ✅ Acessa cursos!
```

---

## 📞 Suporte

Em caso de problemas:
- Verifique se o email está correto
- Confirme se a senha foi copiada integralmente (12 caracteres)
- Verifique maiúsculas/minúsculas na senha
- Tente criar um novo aluno se persistir o erro
