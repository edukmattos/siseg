import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vbpunolnqikllwanfvxi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicHVub2xucWlrbGx3YW5mdnhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE4MTQyNCwiZXhwIjoyMDkwNzU3NDI0fQ.K8HvVQU5a7Flkt1KdFP3SW9GtdtadDRP_92fcR8bDfw';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Criar função exec_sql temporariamente
async function createExecSQLFunction() {
  console.log('🔧 Criando função exec_sql...\n');
  
  const createFunctionSQL = `
CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;
  `;
  
  // Usar a API REST para criar a função
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'params=single-object'
    },
    body: JSON.stringify({ query: createFunctionSQL })
  });
  
  if (response.ok) {
    console.log('✅ Função criada com sucesso!\n');
  } else {
    console.log('⚠️ Não foi possível criar a função automaticamente\n');
  }
}

async function main() {
  console.log('🚀 Iniciando execução das correções RLS\n');
  console.log('==========================================\n');
  
  // Lista de queries SQL
  const sqlQueries = [
    // Remover políticas antigas
    `DROP POLICY IF EXISTS "company_members_insert_policy" ON company_members;`,
    `DROP POLICY IF EXISTS "company_members_update_policy" ON company_members;`,
    `DROP POLICY IF EXISTS "company_members_delete_policy" ON company_members;`,
    `DROP POLICY IF EXISTS "company_members_select_policy" ON company_members;`,
    `DROP POLICY IF EXISTS "Empresa pode ver membros" ON company_members;`,
    `DROP POLICY IF EXISTS "Dono pode inserir membros" ON company_members;`,
    `DROP POLICY IF EXISTS "users_all_own" ON users;`,
    
    // Criar políticas para users
    `CREATE POLICY "users_select_own"
      ON users FOR SELECT
      USING (auth.uid() = user_uuid);`,
      
    `CREATE POLICY "users_insert_any_authenticated"
      ON users FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);`,
      
    `CREATE POLICY "users_update_own"
      ON users FOR UPDATE
      USING (auth.uid() = user_uuid)
      WITH CHECK (auth.uid() = user_uuid);`,
    
    // Criar novas políticas para company_members
    `CREATE POLICY "company_members_insert_policy"
      ON company_members FOR INSERT
      WITH CHECK (
          company_id IN (
              SELECT c.id
              FROM companies c
              WHERE c.owner_id IN (
                  SELECT u.id
                  FROM users u
                  WHERE u.user_uuid = auth.uid()
              )
          )
      );`,
    
    `CREATE POLICY "company_members_select_policy"
      ON company_members FOR SELECT
      USING (true);`,
    
    `CREATE POLICY "company_members_update_policy"
      ON company_members FOR UPDATE
      USING (
          company_id IN (
              SELECT c.id
              FROM companies c
              WHERE c.owner_id IN (
                  SELECT u.id
                  FROM users u
                  WHERE u.user_uuid = auth.uid()
              )
          )
      );`,
    
    `CREATE POLICY "company_members_delete_policy"
      ON company_members FOR DELETE
      USING (
          company_id IN (
              SELECT c.id
              FROM companies c
              WHERE c.owner_id IN (
                  SELECT u.id
                  FROM users u
                  WHERE u.user_uuid = auth.uid()
              )
          )
      );`,
  ];
  
  console.log(`📋 Total de queries a executar: ${sqlQueries.length}\n`);
  
  // Tentar criar a função exec_sql primeiro
  await createExecSQLFunction();
  
  console.log('⚠️  Execução automática não disponível via MCP.');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📌 INSTRUÇÕES PARA EXECUTAR MANUALMENTE:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('1. Acesse o Supabase Dashboard:');
  console.log('   🔗 https://supabase.com/dashboard/project/vbpunolnqikllwanfvxi/sql');
  console.log('');
  console.log('2. Clique em "New Query"');
  console.log('');
  console.log('3. Copie e cole TODAS as queries abaixo:');
  console.log('');
  console.log('─────────────────────────────────────────────────────');
  console.log('SQL QUERIES PARA EXECUTAR:');
  console.log('─────────────────────────────────────────────────────');
  console.log('');
  
  sqlQueries.forEach((query, index) => {
    console.log(`-- Query ${index + 1}`);
    console.log(query);
    console.log('');
  });
  
  console.log('─────────────────────────────────────────────────────');
  console.log('');
  console.log('4. Clique em "Run" ou pressione Ctrl+Enter');
  console.log('');
  console.log('5. Verifique se apareceu "Success. No rows returned"');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('✅ Após executar, teste adicionar um aluno novamente!');
  console.log('');
}

main();
