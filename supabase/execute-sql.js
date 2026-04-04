import { createClient } from '@supabase/supabase-js';

// Credenciais do .env
const supabaseUrl = 'https://vbpunolnqikllwanfvxi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicHVub2xucWlrbGx3YW5mdnhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE4MTQyNCwiZXhwIjoyMDkwNzU3NDI0fQ.K8HvVQU5a7Flkt1KdFP3SW9GtdtadDRP_92fcR8bDfw';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Queries SQL para executar
const queries = [
  // 1. Remover políticas antigas
  `DROP POLICY IF EXISTS "company_members_insert_policy" ON company_members;`,
  `DROP POLICY IF EXISTS "company_members_update_policy" ON company_members;`,
  `DROP POLICY IF EXISTS "company_members_delete_policy" ON company_members;`,
  `DROP POLICY IF EXISTS "company_members_select_policy" ON company_members;`,
  `DROP POLICY IF EXISTS "Empresa pode ver membros" ON company_members;`,
  `DROP POLICY IF EXISTS "Dono pode inserir membros" ON company_members;`,
  
  // 2. Criar nova política de INSERT
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
  
  // 3. Criar nova política de SELECT
  `CREATE POLICY "company_members_select_policy"
    ON company_members FOR SELECT
    USING (true);`,
  
  // 4. Criar nova política de UPDATE
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
  
  // 5. Criar nova política de DELETE
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
  
  // 6. Verificar políticas criadas
  `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'company_members' ORDER BY policyname;`
];

async function executeSQL() {
  console.log('🚀 Executando queries SQL no Supabase...\n');
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`📝 Query ${i + 1}/${queries.length}:`);
    console.log(query.substring(0, 100) + '...\n');
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query });
      
      if (error) {
        console.error(`❌ Erro na query ${i + 1}:`, error.message);
        if (error.message.includes('function does not exist')) {
          console.log('⚠️  RPC exec_sql não existe, tentando alternativa...');
          // Alternativa: usar a API REST diretamente
          break;
        }
        return;
      }
      
      console.log('✅ Sucesso!\n');
      if (data) {
        console.log('Resultado:', JSON.stringify(data, null, 2));
      }
      console.log('---\n');
    } catch (err) {
      console.error(`❌ Erro na query ${i + 1}:`, err.message);
      if (err.message.includes('exec_sql')) {
        console.log('\n💡 A função exec_sql não existe no banco.');
        console.log('📋 Por favor, execute manualmente os scripts SQL no Supabase Dashboard:\n');
        console.log('   1. Acesse: https://supabase.com/dashboard/project/vbpunolnqikllwanfvxi/sql');
        console.log('   2. Execute o arquivo: supabase/EXECUTAR-URGENTE-RLS-FIX.sql\n');
      }
      break;
    }
  }
  
  console.log('✅ Execução concluída!');
}

executeSQL();
