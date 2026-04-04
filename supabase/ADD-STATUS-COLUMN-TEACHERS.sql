-- ============================================================
-- ADICIONAR COLUNA STATUS NA TABELA USERS (para professores)
-- ============================================================

-- Verificar se a coluna já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'status'
  ) THEN
    -- Adicionar coluna status
    ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    
    -- Adicionar constraint de check
    ALTER TABLE users ADD CONSTRAINT users_status_check 
      CHECK (status IN ('active', 'pending', 'rejected', 'inactive'));
      
    RAISE NOTICE 'Coluna status adicionada à tabela users';
  ELSE
    RAISE NOTICE 'Coluna status já existe na tabela users';
  END IF;
END $$;

-- Atualizar usuários existentes com role instructor para status 'active'
UPDATE users 
SET status = 'active' 
WHERE role IN ('instructor', 'teacher') AND status IS NULL;

-- Verificar resultado
SELECT id, full_name, email, role, status 
FROM users 
WHERE role IN ('instructor', 'teacher')
LIMIT 10;

-- ============================================================
-- INSTRUÇÕES:
-- 1. Execute este script no Supabase SQL Editor
-- 2. A coluna 'status' será adicionada à tabela users
-- 3. Valores possíveis: 'active', 'pending', 'rejected', 'inactive'
-- 4. Novos professores serão criados com status = 'pending'
-- ============================================================
