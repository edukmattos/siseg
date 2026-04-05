// Script para adicionar a coluna instructor_commission_cents
// Executar com: node scripts/add-instructor-commission.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.error('Configure SUPABASE_SERVICE_ROLE_KEY e VITE_SUPABASE_URL no arquivo .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addInstructorCommissionColumn() {
  console.log('🔧 Adicionando coluna instructor_commission_cents...')
  
  const sql = `
    ALTER TABLE courses 
    ADD COLUMN IF NOT EXISTS instructor_commission_cents INTEGER;
    
    COMMENT ON COLUMN courses.instructor_commission_cents IS 'Valor em centavos a ser repassado ao instrutor por matrícula';
  `

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      // Se o RPC não existir, tentar via REST API
      console.log('ℹ️  RPC exec_sql não encontrado, tentando método alternativo...')
      
      // Método alternativo: usar a API do Supabase diretamente
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'params=single-object'
        },
        body: JSON.stringify({ sql })
      })
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
      }
    }
    
    console.log('✅ Coluna instructor_commission_cents adicionada com sucesso!')
  } catch (err) {
    console.error('❌ Erro ao adicionar coluna:', err.message)
    console.log('\n📋 Execute manualmente no Supabase SQL Editor:')
    console.log(sql)
  }
}

addInstructorCommissionColumn()
