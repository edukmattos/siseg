/* eslint-disable no-undef, no-unused-vars */
// Script para executar SQL diretamente no Supabase usando Service Role Key
// Execute com: node supabase/execute-fix-rls.js

const fs = require('fs');
const path = require('path');

// Ler variáveis de ambiente do arquivo .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Extrair URL e SERVICE KEY do .env
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Erro: Não foi possível encontrar VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

// Ler o script SQL
const sqlScriptPath = path.join(__dirname, 'fix_company_members_rls.sql');
let sqlScript = fs.readFileSync(sqlScriptPath, 'utf-8');

// Remover comentários e queries de verificação (manter apenas as políticas)
const policySQL = `
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
`;

async function executeSQL() {
  console.log('🔧 Conectando ao Supabase...');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log('🔑 Usando Service Role Key\n');

  // Executar cada statement separadamente
  const statements = policySQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Executando ${statements.length} statements SQL...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const statementNum = i + 1;
    
    try {
      // Usar o endpoint RPC do Supabase para executar SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({})
      });

      // Como não temos uma função RPC, vamos mostrar o SQL para execução manual
      console.log(`Statement ${statementNum}:`);
      console.log(statement + ';');
      console.log('');
      
    } catch (error) {
      console.error(`❌ Erro no statement ${statementNum}:`, error.message);
    }
  }

  console.log('\n⚠️  Como o Supabase não permite executar DDL diretamente via API REST,');
  console.log('📋 você precisa executar o SQL manualmente no Supabase Dashboard.\n');
  console.log('📖 Siga as instruções em: supabase/INSTRUCOES-RLS.md\n');
}

executeSQL();
