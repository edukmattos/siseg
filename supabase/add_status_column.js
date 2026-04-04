// Script para adicionar coluna status na tabela courses
// Execute com: node supabase/add_status_column.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addStatusColumn() {
  console.log('🔄 Adicionando coluna status na tabela courses...')

  // 1. Adicionar coluna status
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected', 'draft', 'archived'))
    `
  })

  if (alterError && !alterError.message.includes('already exists')) {
    console.error('❌ Erro ao adicionar coluna:', alterError)
    
    // Tentar via query direta
    console.log('⚠️ Tentando método alternativo...')
    
    const { error: directError } = await supabase.from('courses').select('status').limit(1)
    
    if (directError?.message?.includes('status')) {
      console.log('ℹ️ Coluna status ainda não existe. Execute manualmente no SQL Editor:')
      console.log('\n--- SQL para copiar ---')
      console.log(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft', 'archived'));`)
      console.log(`UPDATE courses SET status = 'approved' WHERE is_active = true;`)
      console.log(`UPDATE courses SET status = 'draft' WHERE is_active = false;`)
      console.log(`CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);`)
      console.log('----------------------\n')
    }
    
    return
  }

  // 2. Atualizar cursos existentes
  await supabase
    .from('courses')
    .update({ status: 'approved' })
    .eq('is_active', true)

  await supabase
    .from('courses')
    .update({ status: 'draft' })
    .eq('is_active', false)

  console.log('✅ Coluna status adicionada com sucesso!')
  console.log('   - Cursos ativos → status: approved')
  console.log('   - Cursos inativos → status: draft')
}

addStatusColumn()
