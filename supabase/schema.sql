-- ============================================================
-- Occupational Excellence - Plataforma de Cursos B2B
-- Estrutura Completa de Tabelas para Supabase (PostgreSQL)
-- Padrão: id SERIAL (INT incremental)
-- ============================================================

-- Habilitar extensão necessária para hashes
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- FUNÇÃO GERAL: Trigger de updated_at (deve vir primeiro)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. TABELA DE USUÁRIOS (PUBLIC USERS)
-- Substitui profiles: id SERIAL + user_uuid referencia auth.users
-- ============================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_uuid UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'employer', 'instructor', 'admin', 'super_admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX idx_users_user_uuid ON users(user_uuid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- 2. TABELA DE EMPRESAS (B2B)
-- ============================================================
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    fantasy_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    corporate_email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    website TEXT,
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(50),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    address_zip_code VARCHAR(10),
    plan_id INT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
    owner_id INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. TABELA DE VÍNCULO EMPRESA-USUÁRIO
-- ============================================================
CREATE TABLE company_members (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
    department VARCHAR(100),
    job_function VARCHAR(100),
    hired_at TIMESTAMPTZ DEFAULT NOW(),
    removed_at TIMESTAMPTZ,
    UNIQUE(company_id, user_id)
);

-- ============================================================
-- 4. TABELA DE CATEGORIAS DE CURSOS
-- ============================================================
CREATE TABLE course_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50),
    description TEXT,
    parent_id INT REFERENCES course_categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. TABELA DE CURSOS
-- ============================================================
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    nr_code VARCHAR(10) NOT NULL,
    nr_full_name VARCHAR(100),
    category_id INT REFERENCES course_categories(id),
    level VARCHAR(30) NOT NULL CHECK (level IN ('Básico', 'Intermediário', 'Avançado', 'Especialista', 'Prático', 'Reciclagem', 'Integração', 'CIPA')),
    modality VARCHAR(20) NOT NULL CHECK (modality IN ('Online', 'Híbrido', 'Presencial')),
    workload_hours INTEGER NOT NULL,
    price_cents INTEGER NOT NULL,
    image_url TEXT,
    thumbnail_url TEXT,
    is_esocial_valid BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    min_students INTEGER DEFAULT 1,
    max_students INTEGER,
    certificate_template_url TEXT,
    prerequisites TEXT[],
    objectives TEXT,
    target_audience TEXT,
    program_content TEXT,
    certification_requirements TEXT,
    instructor_id INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índice para busca rápida
CREATE INDEX idx_courses_nr_code ON courses(nr_code);
CREATE INDEX idx_courses_modality ON courses(modality);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_is_active ON courses(is_active);
CREATE INDEX idx_courses_is_featured ON courses(is_featured);

-- ============================================================
-- 6. TABELA DE MÓDULOS DO CURSO
-- ============================================================
CREATE TABLE course_modules (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_position INTEGER NOT NULL,
    estimated_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_course_modules_course_id ON course_modules(course_id);

-- ============================================================
-- 7. TABELA DE AULAS/CONTEÚDO
-- ============================================================
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    module_id INT NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'text', 'quiz', 'document', 'presentation')),
    content_url TEXT,
    duration_minutes INTEGER,
    order_position INTEGER NOT NULL,
    is_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lessons_module_id ON lessons(module_id);

-- ============================================================
-- 8. TABELA DE PLANOS CORPORATIVOS
-- ============================================================
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'semiannual', 'annual')),
    max_users INTEGER,
    max_courses INTEGER,
    max_certificates INTEGER,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. TABELA DE PEDIDOS
-- ============================================================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    company_id INT REFERENCES companies(id),
    user_id INT REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'cancelled', 'refunded')),
    total_cents INTEGER NOT NULL,
    discount_cents INTEGER DEFAULT 0,
    payment_method VARCHAR(30) CHECK (payment_method IN ('credit_card', 'boleto', 'pix', 'invoice', 'bank_transfer')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    external_payment_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_orders_company_id ON orders(company_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- ============================================================
-- 10. TABELA DE ITENS DO PEDIDO
-- ============================================================
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    license_codes TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_course_id ON order_items(course_id);

-- ============================================================
-- 11. TABELA DE LICENÇAS/CARTÕES DE ACESSO
-- ============================================================
CREATE TABLE licenses (
    id SERIAL PRIMARY KEY,
    license_code VARCHAR(50) NOT NULL UNIQUE,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    company_id INT REFERENCES companies(id),
    order_id INT REFERENCES orders(id),
    assigned_to INT REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'in_progress', 'completed', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_licenses_course_id ON licenses(course_id);
CREATE INDEX idx_licenses_company_id ON licenses(company_id);
CREATE INDEX idx_licenses_assigned_to ON licenses(assigned_to);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_code ON licenses(license_code);

-- ============================================================
-- 12. TABELA DE MATRÍCULAS
-- ============================================================
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    company_id INT REFERENCES companies(id),
    license_id INT REFERENCES licenses(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled', 'expired')),
    progress_percentage NUMERIC(5, 2) DEFAULT 0,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    last_access_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

CREATE TRIGGER update_enrollments_updated_at
    BEFORE UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_company_id ON enrollments(company_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- ============================================================
-- 13. TABELA DE PROGRESSO DAS AULAS
-- ============================================================
CREATE TABLE lesson_progress (
    id SERIAL PRIMARY KEY,
    enrollment_id INT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    time_spent_seconds INTEGER DEFAULT 0,
    last_position_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(enrollment_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_enrollment_id ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

-- ============================================================
-- 14. TABELA DE QUIZZES
-- ============================================================
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    passing_score NUMERIC(5, 2) NOT NULL DEFAULT 70,
    max_attempts INTEGER DEFAULT 3,
    time_limit_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);

-- ============================================================
-- 15. TABELA DE PERGUNTAS DO QUIZ
-- ============================================================
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank')),
    options JSONB NOT NULL,
    correct_answer VARCHAR(50) NOT NULL,
    explanation TEXT,
    points INTEGER DEFAULT 1,
    order_position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

-- ============================================================
-- 16. TABELA DE RESPOSTAS DO QUIZ
-- ============================================================
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    enrollment_id INT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    score NUMERIC(5, 2) NOT NULL,
    passed BOOLEAN,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_enrollment_id ON quiz_attempts(enrollment_id);

-- ============================================================
-- 17. TABELA DE CERTIFICADOS
-- ============================================================
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    enrollment_id INT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id),
    course_id INT NOT NULL REFERENCES courses(id),
    company_id INT REFERENCES companies(id),
    certificate_code VARCHAR(50) NOT NULL UNIQUE,
    qr_code_url TEXT,
    pdf_url TEXT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    is_valid BOOLEAN DEFAULT true,
    validation_hash VARCHAR(64) NOT NULL UNIQUE,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_certificates_company_id ON certificates(company_id);
CREATE INDEX idx_certificates_code ON certificates(certificate_code);
CREATE INDEX idx_certificates_hash ON certificates(validation_hash);

-- ============================================================
-- 18. TABELA DE AVALIAÇÕES DO CURSO
-- ============================================================
CREATE TABLE course_reviews (
    id SERIAL PRIMARY KEY,
    enrollment_id INT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id),
    course_id INT NOT NULL REFERENCES courses(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

CREATE TRIGGER update_course_reviews_updated_at
    BEFORE UPDATE ON course_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_course_reviews_course_id ON course_reviews(course_id);
CREATE INDEX idx_course_reviews_user_id ON course_reviews(user_id);

-- ============================================================
-- 19. TABELA DE CUPONS DE DESCONTO
-- ============================================================
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_purchase_cents INTEGER,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_is_active ON coupons(is_active);

-- ============================================================
-- 20. TABELA DE NOTIFICAÇÕES
-- ============================================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error', 'alert')),
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================================
-- 21. TABELA DE LOGS DE AUDITORIA
-- ============================================================
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    company_id INT REFERENCES companies(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- 22. TABELA DE CONFIGURAÇÕES DO SISTEMA
-- ============================================================
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50),
    updated_by INT REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_settings_category ON system_settings(category);

-- ============================================================
-- INSERÇÃO DE DADOS INICIAIS (SEED)
-- ============================================================

-- Categorias de Cursos
INSERT INTO course_categories (name, slug, icon, description) VALUES
('Segurança do Trabalho', 'safety', 'health_and_safety', 'Cursos relacionados às normas regulamentadoras de segurança'),
('Saúde Ocupacional', 'occupational-health', 'monitor_heart', 'Cursos focados na saúde e bem-estar do trabalhador'),
('Gestão de Riscos', 'risk-management', 'analytics', 'Identificação e gerenciamento de riscos ocupacionais'),
('eSocial', 'esocial', 'gavel', 'Conformidade com o sistema eSocial'),
('Meio Ambiente', 'environment', 'eco', 'Cursos de gestão ambiental e sustentabilidade');

-- Cursos (dados do catálogo)
INSERT INTO courses (title, description, nr_code, nr_full_name, category_id, level, modality, workload_hours, price_cents, image_url, is_esocial_valid, is_featured) VALUES
(
    'NR-10 Segurança em Instalações Elétricas',
    'Curso completo sobre segurança em instalações elétricas conforme a Norma Regulamentadora NR-10. Aborda os requisitos mínimos para garantir a segurança e saúde dos trabalhadores que interagem com instalações elétricas.',
    'NR-10',
    'Segurança em Instalações e Serviços em Eletricidade',
    (SELECT id FROM course_categories WHERE slug = 'safety'),
    'Básico',
    'Online',
    40,
    18900,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuApYdv-pXcx1aCiTXj6JYwPZGE8y0kDRpjjNUrXCA1_ke3LoPI_axhtlR6muoBmlAMIwpmQLOMAkoTRGgCVmEW8WAzgMxCWUEQl7DKeEfeojPp4HVHlex34OVSBtYcmUaZpDNpIqxgAzj-6LCg3Wai-cB27EXqfRpYjcqrmg1UtvUTnj0NKf_AmJGD9SABae4Edt9tpdvnAI5psjjxSP5fizyF322VcnDbBDDUjADE9S8q_hU47zaNVx_My3Ur7iYP2U8QQayxXCvw',
    true,
    true
),
(
    'NR-35 Trabalho em Altura',
    'Treinamento obrigatório para trabalhadores que realizam trabalho realizado acima de 2 metros do nível inferior, conforme NR-35.',
    'NR-35',
    'Trabalho em Altura',
    (SELECT id FROM course_categories WHERE slug = 'safety'),
    'Prático',
    'Híbrido',
    8,
    24500,
    'https://lh3.googleusercontent.com/AB6AXuAs-aY1JYIgqMqGaPgGLu_3fV9zAQ8H3KfwwCBw3OCwT48Gm24-0S7QxPWDOw81xR7ug4hIwY3PyraOLg7gJ3CvJgjQjZqK2y2lv-5bZoGfNdW9ts7SkcRh4Bimu4V53axPDFV91knZRsukzbOMH7Q0WU9KK69vc-MlZDe4UC6vIiiNA03T2KIDGNdbP7PpgpGkDRJDewGGn8wqfvWgdK1Dm12doSmUa1sCIO-p2-xtcBtGxhbXCq2McvjdCkIjxNPSip6Y9sBTszA',
    true,
    true
),
(
    'NR-07 Primeiros Socorros Básico',
    'Curso de reciclagem sobre primeiros socorros básicos no ambiente de trabalho, conforme NR-07.',
    'NR-07',
    'Programa de Controle Médico de Saúde Ocupacional',
    (SELECT id FROM course_categories WHERE slug = 'occupational-health'),
    'Reciclagem',
    'Online',
    4,
    9500,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBgneVYiiwNS4WuBgksZW4XKrewhzlM9RlXCBnNc6ufPnM62t7hwCQ6c61nKCmPS4x-A4810IgtGRGOItgWCxNLeUoLBbXnFxUjbGb2yRj3MqesRYVRGnKV0ndreEDkg36wwRvQWfaeIzolxdJAjLORA-XKU_uztqw85O47Fn1LHSPpX9qQC4nMJw6_UksXCFCJ10Kx5AH5E9644WpJff9gn41QoOhun1LdaEAuuaJq2UVJFjnre24fW9QC9s0bmefwsOpmR9VEniQ',
    true,
    false
),
(
    'NR-12 Segurança em Máquinas e Equipamentos',
    'Capacitação completa sobre segurança na utilização de máquinas e equipamentos conforme NR-12.',
    'NR-12',
    'Segurança no Trabalho em Máquinas e Equipamentos',
    (SELECT id FROM course_categories WHERE slug = 'safety'),
    'Especialista',
    'Híbrido',
    16,
    31200,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuACvoFNS8ooBFFvklPKDwQip_ZD95FMKjZMchIxP3U4hLDJztHoOp_RMlY1iXW9awfVEm-WDgFt4Kr0Ljgj_7zxzT_D_oFXxcsMJETIK1QYcqQUrePJjSwu-oqjV1CvOMQwmPX1eXjcWYs0_-tx-S74L9iXac7J23WzpwSd9-iC7NNbYLVBmFGE3knN8CkPVzIPf_CZKk16o4xBwJgDavIKw72SxMuGlxYjXtmTs-AqNgS8PDQc6Q9-HweXCZzNCU0gYno9hrFbKME',
    false,
    false
),
(
    'NR-18 Segurança na Indústria da Construção',
    'Curso de integração sobre segurança e saúde na indústria da construção civil conforme NR-18.',
    'NR-18',
    'Condições e Meio Ambiente de Trabalho na Indústria da Construção',
    (SELECT id FROM course_categories WHERE slug = 'safety'),
    'Integração',
    'Online',
    6,
    15600,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAR5GLsvqOxrQQtirhMX8Q-P235Jr7XwXO4ONNkeUuxcHByp4PenbOjqcFI4HBe8sv1kyUDnRFYKApEzcoq-D6HAJ2QS5_y3MiANm1Hpk_1zHPHmy2hJfHdC_03HmvWhQxhL8MnaDYKyBxrtHNiu7e0lnHLgwpNM7i9FqFNai57rVrZIakMwihQiUiruqIt_5eAGWF4YuS8I5SZPsU69KVk3UbDO9fzVQ52pqO_C-AAAAGzjjwvAMaVOeN3ACkDo83V7DgPNEVs7ec',
    false,
    false
),
(
    'NR-05 Comissão Interna de Prevenção de Acidentes',
    'Treinamento para membros da CIPA sobre prevenção de acidentes e doenças ocupacionais.',
    'NR-05',
    'Comissão Interna de Prevenção de Acidentes',
    (SELECT id FROM course_categories WHERE slug = 'safety'),
    'CIPA',
    'Online',
    20,
    21000,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAyum5nfgXFC2ZWeK27crDM4ps_ctPXko0QCggWRwXLG9406AJB9tS_yTfvZlzKFwqxV81kjOSHJQhGy_ILay_y4WnPA3gNIaiOwX-PpQhUrDE6CKzR0Hw9jruKMa9X9pu-P81R76jbgr1b8DxBVIA6YhozgMLWj96UmaMR0fONb2zijhLKzVBjxFhKRIMbksEEseekTnM12SxKvyTJJzWQyW_UAH06itkEQiGAJQa6xYjTUaDOpc4VTmfd9jIriN3bkmiD21-jh4',
    true,
    false
);

-- Planos Corporativos
INSERT INTO plans (name, description, price_cents, billing_cycle, max_users, max_courses, max_certificates, features) VALUES
(
    'Starter B2B',
    'Plano inicial para pequenas empresas',
    299000,
    'monthly',
    25,
    10,
    50,
    '{"portal_gestor": true, "suporte_email": true, "relatorios_basicos": true, "api_integracao": false}'::jsonb
),
(
    'Professional B2B',
    'Plano profissional com recursos avançados',
    799000,
    'monthly',
    100,
    50,
    200,
    '{"portal_gestor": true, "suporte_email": true, "suporte_telefone": true, "relatorios_avancados": true, "api_integracao": true, "certificados_personalizados": true}'::jsonb
),
(
    'Enterprise B2B',
    'Plano enterprise para grandes corporações',
    1999000,
    'monthly',
    500,
    -1,
    -1,
    '{"portal_gestor": true, "suporte_dedicado": true, "relatorios_customizados": true, "api_integracao": true, "certificados_personalizados": true, "sla_garantido": true, "gerente_conta": true}'::jsonb
);

-- Configurações do Sistema
INSERT INTO system_settings (setting_key, setting_value, description, category) VALUES
('platform_name', '"Occupational Excellence"', 'Nome da plataforma', 'general'),
('platform_cnpj', '"12.345.678/0001-90"', 'CNPJ da plataforma', 'general'),
('platform_mte_registro', '"99.887.766"', 'Registro MTE', 'general'),
('certificate_validity_months', '12', 'Validade padrão do certificado em meses', 'certificates'),
('max_quiz_attempts', '3', 'Número máximo de tentativas por quiz', 'courses'),
('passing_score_percentage', '70', 'Pontuação mínima para aprovação', 'courses'),
('enable_esocial_integration', 'true', 'Habilitar integração com eSocial', 'integrations');

-- ============================================================
-- POLÍTICAS DE SEGURANÇA (Row Level Security - RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de Usuários
CREATE POLICY "Usuários podem visualizar seus próprios dados"
    ON users FOR SELECT
    USING (auth.uid() = user_uuid);

CREATE POLICY "Usuários podem atualizar seus próprios dados"
    ON users FOR UPDATE
    USING (auth.uid() = user_uuid);

CREATE POLICY "Usuários são visíveis para admins"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_uuid = auth.uid() AND u.role IN ('admin', 'super_admin')
        )
    );

-- Políticas de Cursos (leitura pública para catálogos)
CREATE POLICY "Cursos ativos são visíveis publicamente"
    ON courses FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins podem gerenciar cursos"
    ON courses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_uuid = auth.uid() AND u.role IN ('admin', 'super_admin')
        )
    );

-- Políticas de Categorias
CREATE POLICY "Categorias são visíveis publicamente"
    ON course_categories FOR SELECT
    USING (true);

-- Políticas de Empresas
CREATE POLICY "Usuários podem ver empresas que participam"
    ON companies FOR SELECT
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM company_members cm
            WHERE cm.company_id = companies.id AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Empresas podem atualizar seus dados"
    ON companies FOR UPDATE
    USING (
        owner_id = (SELECT id FROM users WHERE user_uuid = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_uuid = auth.uid() AND u.role IN ('admin', 'super_admin')
        )
    );

-- Políticas de Matrículas
CREATE POLICY "Usuários podem ver suas próprias matrículas"
    ON enrollments FOR SELECT
    USING (user_id = (SELECT id FROM users WHERE user_uuid = auth.uid()));

CREATE POLICY "Empresas podem ver matrículas de seus funcionários"
    ON enrollments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM company_members cm
            WHERE cm.company_id = enrollments.company_id
            AND cm.user_id = auth.uid()
        )
    );

-- Políticas de Certificados
CREATE POLICY "Usuários podem ver seus próprios certificados"
    ON certificates FOR SELECT
    USING (user_id = (SELECT id FROM users WHERE user_uuid = auth.uid()));

CREATE POLICY "Validação pública de certificados"
    ON certificates FOR SELECT
    USING (true);

-- Políticas de Pedidos
CREATE POLICY "Usuários podem ver seus próprios pedidos"
    ON orders FOR SELECT
    USING (
        user_id = (SELECT id FROM users WHERE user_uuid = auth.uid()) OR
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = (SELECT id FROM users WHERE user_uuid = auth.uid())
        )
    );

-- Políticas de Notificações
CREATE POLICY "Usuários podem ver suas próprias notificações"
    ON notifications FOR SELECT
    USING (user_id = (SELECT id FROM users WHERE user_uuid = auth.uid()));

CREATE POLICY "Usuários podem atualizar suas notificações"
    ON notifications FOR UPDATE
    USING (user_id = (SELECT id FROM users WHERE user_uuid = auth.uid()));

-- Políticas de Configurações do Sistema
CREATE POLICY "Configurações do sistema são visíveis apenas para admins"
    ON system_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_uuid = auth.uid() AND u.role IN ('admin', 'super_admin')
        )
    );

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Função para calcular progresso do curso
CREATE OR REPLACE FUNCTION calculate_course_progress(p_enrollment_id INT)
RETURNS NUMERIC AS $$
DECLARE
    v_total_lessons INT;
    v_completed_lessons INT;
BEGIN
    SELECT COUNT(*) INTO v_total_lessons
    FROM lessons l
    JOIN course_modules cm ON l.module_id = cm.id
    WHERE cm.course_id = (SELECT course_id FROM enrollments WHERE id = p_enrollment_id);

    SELECT COUNT(*) INTO v_completed_lessons
    FROM lesson_progress lp
    JOIN lessons l ON lp.lesson_id = l.id
    JOIN course_modules cm ON l.module_id = cm.id
    WHERE lp.enrollment_id = p_enrollment_id AND lp.is_completed = true;

    IF v_total_lessons = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND((v_completed_lessons::NUMERIC / v_total_lessons::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Função para gerar código de certificado
CREATE OR REPLACE FUNCTION generate_certificate_code()
RETURNS TRIGGER AS $$
DECLARE
    v_code VARCHAR(50);
    v_exists BOOLEAN;
BEGIN
    LOOP
        v_code := 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

        SELECT EXISTS(SELECT 1 FROM certificates WHERE certificate_code = v_code) INTO v_exists;

        IF NOT v_exists THEN
            EXIT;
        END IF;
    END LOOP;

    NEW.certificate_code := v_code;
    NEW.validation_hash := ENCODE(DIGEST(NEW.certificate_code || NOW()::TEXT, 'sha256'), 'hex');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_certificate_insert
    BEFORE INSERT ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION generate_certificate_code();

-- Função para gerar código de licença
CREATE OR REPLACE FUNCTION generate_license_code()
RETURNS TRIGGER AS $$
DECLARE
    v_code VARCHAR(50);
    v_exists BOOLEAN;
BEGIN
    LOOP
        v_code := 'LIC-' || TO_CHAR(NOW(), 'YYMM') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));

        SELECT EXISTS(SELECT 1 FROM licenses WHERE license_code = v_code) INTO v_exists;

        IF NOT v_exists THEN
            EXIT;
        END IF;
    END LOOP;

    NEW.license_code := v_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_license_insert
    BEFORE INSERT ON licenses
    FOR EACH ROW
    EXECUTE FUNCTION generate_license_code();

-- ============================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================================

CREATE INDEX idx_users_user_uuid ON users(user_uuid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_companies_cnpj ON companies(cnpj);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_company_members_company ON company_members(company_id);
CREATE INDEX idx_company_members_user ON company_members(user_id);
CREATE INDEX idx_licenses_status_assigned ON licenses(status, assigned_to);
CREATE INDEX idx_enrollments_status_user ON enrollments(status, user_id);
CREATE INDEX idx_certificates_validation ON certificates(is_valid, certificate_code);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- VISÕES ÚTEIS
-- ============================================================

-- Visão para dashboard de empresa
CREATE VIEW company_dashboard_view AS
SELECT
    c.id AS company_id,
    c.fantasy_name,
    c.cnpj,
    COUNT(DISTINCT cm.user_id) AS total_employees,
    COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') AS active_enrollments,
    COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') AS completed_courses,
    COUNT(DISTINCT cert.id) AS total_certificates,
    AVG(e.progress_percentage) AS avg_progress
FROM companies c
LEFT JOIN company_members cm ON c.id = cm.company_id AND cm.removed_at IS NULL
LEFT JOIN enrollments e ON c.id = e.company_id
LEFT JOIN certificates cert ON c.id = cert.company_id
GROUP BY c.id, c.fantasy_name, c.cnpj;

-- Visão para ranking de cursos
CREATE VIEW course_ranking_view AS
SELECT
    cs.id,
    cs.title,
    cs.nr_code,
    cs.level,
    cs.modality,
    cs.price_cents,
    COUNT(DISTINCT e.id) AS total_enrollments,
    COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') AS completions,
    COALESCE(AVG(cr.rating), 0) AS avg_rating,
    COUNT(DISTINCT cr.id) AS total_reviews
FROM courses cs
LEFT JOIN enrollments e ON cs.id = e.course_id
LEFT JOIN course_reviews cr ON cs.id = cr.course_id
WHERE cs.is_active = true
GROUP BY cs.id, cs.title, cs.nr_code, cs.level, cs.modality, cs.price_cents;
