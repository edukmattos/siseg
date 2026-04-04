# Funcionalidade: Adicionar Aluno

## Descrição
Implementação da funcionalidade "Adicionar Aluno" no painel de gestão da empresa (Company Dashboard).

**IMPORTANTE**: Ao criar um aluno, o sistema agora gera automaticamente credenciais de acesso (email + senha temporária) para que o aluno possa fazer login e participar dos cursos.

## Componentes Criados

### AddStudentModal.jsx
Componente de modal para adicionar novos alunos ao sistema.

**Localização**: `src/components/AddStudentModal.jsx`

**Funcionalidades**:
- ✅ Formulário completo com validação
- ✅ Campos: Nome, Email, Departamento, Curso
- ✅ Validação de campos obrigatórios
- ✅ Validação de formato de email
- ✅ Validação de tamanho mínimo do nome (3 caracteres)
- ✅ **Geração automática de senha temporária segura**
- ✅ **Criação do usuário no Supabase Auth** (permite login)
- ✅ **Exibição das credenciais de acesso** (email + senha)
- ✅ **Botões para copiar credenciais**
- ✅ Feedback visual de loading durante o processo
- ✅ Mensagens de sucesso e erro
- ✅ Integração com Supabase
- ✅ Design responsivo e consistente com o projeto

## Fluxo de Autenticação do Aluno

### 1. Administrador cria o aluno
- Preenche o formulário no modal "Adicionar Aluno"
- Sistema gera automaticamente uma senha temporária de 12 caracteres
- Usuário é criado no Supabase Auth com email e senha

### 2. Credenciais são exibidas
- Após criação bem-sucedida, o modal exibe:
  - Email do aluno
  - Senha temporária gerada
  - Botões para copiar cada credencial
  - Aviso sobre importância de enviar as credenciais

### 3. Aluno faz login
- Aluno acessa a plataforma usando as credenciais fornecidas
- Email: o email cadastrado
- Senha: a senha temporária gerada

### 4. Primeiro acesso (recomendação futura)
- Idealmente, o sistema deveria forçar a troca de senha no primeiro login
- Esta funcionalidade pode ser implementada posteriormente

## Integração com o Banco de Dados

### Tabelas Utilizadas

1. **auth.users** (Supabase Auth) - Credenciais de autenticação
   - `id`: UUID gerado automaticamente
   - `email`: Email do aluno (usado para login)
   - `password`: Hash da senha temporária

2. **users** (public) - Perfil do aluno
   - `user_uuid`: Referência ao auth.users.id
   - `full_name`: Nome completo
   - `email`: Email do aluno
   - `role`: 'student' (definido automaticamente)

3. **company_members** - Vincula o aluno à empresa
   - `company_id`: ID da empresa (obtido do contexto de autenticação)
   - `user_id`: ID do usuário criado
   - `department`: Departamento do aluno
   - `job_function`: Curso atribuído
   - `role`: 'employee'

## Como Usar

1. Acesse o **Company Dashboard** (Portal da Empresa)
2. Clique no botão **"Adicionar Aluno"** no canto superior direito
3. Preencha o formulário:
   - **Nome Completo**: Nome completo do aluno (mínimo 3 caracteres)
   - **Email**: Email válido do aluno (será usado como login)
   - **Departamento**: Selecione o departamento
   - **Curso**: Selecione o curso a ser atribuído
4. Clique em **"Adicionar Aluno"**
5. **COPIE AS CREDENCIAIS EXIBIDAS**:
   - Email de login
   - Senha temporária
6. **ENVIE AS CREDENCIAIS AO ALUNO** para que ele possa acessar a plataforma

## Validações

- **Nome**: Obrigatório, mínimo 3 caracteres
- **Email**: Obrigatório, formato válido de email, deve ser único no sistema
- **Departamento**: Obrigatório
- **Curso**: Obrigatório

## Senha Temporária

- **Tamanho**: 12 caracteres
- **Composição**: Letras maiúsculas, minúsculas, números e caracteres especiais (!@#$%)
- **Exemplo**: `aB3dE#fG9hI@`
- **Segurança**: Gerada aleatoriamente a cada novo aluno

## Próximos Passos (Melhorias Futuras)

- [ ] Implementar upload de foto do aluno
- [ ] Adicionar campo de telefone
- [ ] Implementar duplicidade de email (verificar se já existe) - ✅ Já implementado
- [ ] Adicionar opção de matricular em múltiplos cursos
- [ ] Implementar envio de email de boas-vindas com as credenciais
- [ ] Adicionar campo de data de nascimento
- [ ] Implementar edição de aluno existente
- [ ] Melhorar atualização da lista sem recarregar a página (usar estado local)
- [ ] **Forçar troca de senha no primeiro login**
- [ ] Adicionar opção de redefinir senha do aluno
- [ ] Implementar histórico de matrículas

## Estrutura de Arquivos

```
src/
├── components/
│   └── AddStudentModal.jsx       # Modal de adicionar aluno (ATUALIZADO)
└── pages/
    └── CompanyDashboard.jsx      # Atualizado com integração do modal
```

## Dependências

- Supabase Client (já configurado)
- Supabase Auth (já configurado)
- AuthContext (já configurado)
- Material Symbols (ícones)
- TailwindCSS (estilização)

## Segurança

### Credenciais de Acesso
- ✅ Senha temporária gerada com caracteres aleatórios
- ✅ Senha é exibida apenas uma vez (após criação)
- ✅ Administrador deve copiar e enviar ao aluno
- ⚠️ Recomenda-se implementar troca obrigatória de senha no primeiro login

### Dados do Aluno
- ✅ Email é único no sistema (não permite duplicatas)
- ✅ Vínculo com empresa é registrado
- ✅ RLS (Row Level Security) do Supabase protege os dados
