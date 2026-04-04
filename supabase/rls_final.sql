-- ============================================================
-- CORREÇÃO FINAL: RLS Policies sem recursão infinita
-- Problema: políticas que fazem subquery na própria tabela
-- Solução: usar auth.jwt() ou remover dependências circulares
-- ============================================================

-- ===== USERS: Remover política que causa recursão =====
DROP POLICY IF EXISTS "users_select_admins" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Política simples: usuário vê/apenas seu próprio registro
-- O campo user_uuid já é UNIQUE, então auth.uid() = user_uuid é seguro
CREATE POLICY "users_all_own"
    ON users FOR ALL
    USING (auth.uid() = user_uuid)
    WITH CHECK (auth.uid() = user_uuid);

-- ===== COMPANIES =====
DROP POLICY IF EXISTS "companies_select_members" ON companies;
DROP POLICY IF EXISTS "companies_insert_owner" ON companies;
DROP POLICY IF EXISTS "companies_update_owner" ON companies;

-- Para companies, usamos uma função SECURITY DEFINER para evitar recursão
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1;
$$;

CREATE POLICY "companies_select_policy"
    ON companies FOR SELECT
    USING (
        owner_id = public.get_current_user_id() OR
        EXISTS (
            SELECT 1 FROM company_members cm
            WHERE cm.company_id = companies.id AND cm.user_id = public.get_current_user_id()
        )
    );

CREATE POLICY "companies_insert_policy"
    ON companies FOR INSERT
    WITH CHECK (owner_id = public.get_current_user_id());

CREATE POLICY "companies_update_policy"
    ON companies FOR UPDATE
    USING (
        owner_id = public.get_current_user_id() OR
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = public.get_current_user_id() AND u.role IN ('admin', 'super_admin')
        )
    );

-- ===== COURSE CATEGORIES =====
DROP POLICY IF EXISTS "Categorias são visíveis publicamente" ON course_categories;
DROP POLICY IF EXISTS "categories_public" ON course_categories;
CREATE POLICY "categories_public"
    ON course_categories FOR SELECT
    USING (true);

-- ===== COURSES =====
DROP POLICY IF EXISTS "Cursos ativos são visíveis publicamente" ON courses;
DROP POLICY IF EXISTS "Admins podem gerenciar cursos" ON courses;
DROP POLICY IF EXISTS "courses_select_active" ON courses;
DROP POLICY IF EXISTS "courses_all_admins" ON courses;

CREATE POLICY "courses_select_active"
    ON courses FOR SELECT
    USING (is_active = true);

CREATE POLICY "courses_all_admins"
    ON courses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = public.get_current_user_id() AND u.role IN ('admin', 'super_admin')
        )
    );

-- ===== ENROLLMENTS =====
DROP POLICY IF EXISTS "Usuários podem ver suas próprias matrículas" ON enrollments;
DROP POLICY IF EXISTS "Empresas podem ver matrículas de seus funcionários" ON enrollments;
DROP POLICY IF EXISTS "enrollments_select_own" ON enrollments;
DROP POLICY IF EXISTS "enrollments_insert_own" ON enrollments;
DROP POLICY IF EXISTS "enrollments_select_company" ON enrollments;

CREATE POLICY "enrollments_select_policy"
    ON enrollments FOR SELECT
    USING (
        user_id = public.get_current_user_id() OR
        EXISTS (
            SELECT 1 FROM company_members cm
            WHERE cm.company_id = enrollments.company_id
            AND cm.user_id = public.get_current_user_id()
        )
    );

CREATE POLICY "enrollments_insert_policy"
    ON enrollments FOR INSERT
    WITH CHECK (user_id = public.get_current_user_id());

-- ===== CERTIFICATES =====
DROP POLICY IF EXISTS "Usuários podem ver seus próprios certificados" ON certificates;
DROP POLICY IF EXISTS "Validação pública de certificados" ON certificates;
DROP POLICY IF EXISTS "certificates_select_own" ON certificates;
DROP POLICY IF EXISTS "certificates_public_validate" ON certificates;

CREATE POLICY "certificates_select_policy"
    ON certificates FOR SELECT
    USING (
        user_id = public.get_current_user_id() OR true
    );

-- ===== ORDERS =====
DROP POLICY IF EXISTS "Usuários podem ver seus próprios pedidos" ON orders;
DROP POLICY IF EXISTS "orders_select_own" ON orders;
DROP POLICY IF EXISTS "orders_insert_own" ON orders;

CREATE POLICY "orders_select_policy"
    ON orders FOR SELECT
    USING (
        user_id = public.get_current_user_id() OR
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = public.get_current_user_id()
        )
    );

CREATE POLICY "orders_insert_policy"
    ON orders FOR INSERT
    WITH CHECK (user_id = public.get_current_user_id());

-- ===== NOTIFICATIONS =====
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notificações" ON notifications;
DROP POLICY IF EXISTS "Usuários podem atualizar suas notificações" ON notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;

CREATE POLICY "notifications_all_own"
    ON notifications FOR ALL
    USING (user_id = public.get_current_user_id())
    WITH CHECK (user_id = public.get_current_user_id());

-- ===== SYSTEM SETTINGS =====
DROP POLICY IF EXISTS "Configurações do sistema são visíveis apenas para admins" ON system_settings;
DROP POLICY IF EXISTS "settings_select_admins" ON system_settings;

CREATE POLICY "settings_select_admins"
    ON system_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = public.get_current_user_id() AND u.role IN ('admin', 'super_admin')
        )
    );

-- ===== COMPANY MEMBERS =====
DROP POLICY IF EXISTS "company_members_select_policy" ON company_members;
CREATE POLICY "company_members_select_policy"
    ON company_members FOR SELECT
    USING (
        user_id = public.get_current_user_id() OR
        company_id IN (
            SELECT c.id FROM companies c WHERE c.owner_id = public.get_current_user_id()
        )
    );

-- ===== LESSON PROGRESS =====
DROP POLICY IF EXISTS "lesson_progress_select_policy" ON lesson_progress;
DROP POLICY IF EXISTS "lesson_progress_insert_policy" ON lesson_progress;
DROP POLICY IF EXISTS "lesson_progress_update_policy" ON lesson_progress;

CREATE POLICY "lesson_progress_all_own"
    ON lesson_progress FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e WHERE e.id = lesson_progress.enrollment_id AND e.user_id = public.get_current_user_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM enrollments e WHERE e.id = lesson_progress.enrollment_id AND e.user_id = public.get_current_user_id()
        )
    );

-- ===== QUIZZES / QUIZ QUESTIONS (read only for enrolled users) =====
DROP POLICY IF EXISTS "quizzes_select_policy" ON quizzes;
CREATE POLICY "quizzes_select_policy"
    ON quizzes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e 
            WHERE e.course_id = quizzes.course_id AND e.user_id = public.get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "quiz_questions_select_policy" ON quiz_questions;
CREATE POLICY "quiz_questions_select_policy"
    ON quiz_questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quizzes q 
            JOIN enrollments e ON e.course_id = q.course_id
            WHERE q.id = quiz_questions.quiz_id AND e.user_id = public.get_current_user_id()
        )
    );

-- ===== QUIZ ATTEMPTS =====
DROP POLICY IF EXISTS "quiz_attempts_all_own" ON quiz_attempts;
CREATE POLICY "quiz_attempts_all_own"
    ON quiz_attempts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e WHERE e.id = quiz_attempts.enrollment_id AND e.user_id = public.get_current_user_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM enrollments e WHERE e.id = quiz_attempts.enrollment_id AND e.user_id = public.get_current_user_id()
        )
    );

-- ===== COURSE REVIEWS =====
DROP POLICY IF EXISTS "course_reviews_all_own" ON course_reviews;
CREATE POLICY "course_reviews_all_own"
    ON course_reviews FOR ALL
    USING (user_id = public.get_current_user_id())
    WITH CHECK (user_id = public.get_current_user_id());

-- ===== COUPONS =====
DROP POLICY IF EXISTS "coupons_select_policy" ON coupons;
CREATE POLICY "coupons_select_policy"
    ON coupons FOR SELECT
    USING (is_active = true);

-- ===== LICENSES =====
DROP POLICY IF EXISTS "licenses_select_policy" ON licenses;
CREATE POLICY "licenses_select_policy"
    ON licenses FOR SELECT
    USING (
        assigned_to = public.get_current_user_id() OR
        company_id IN (
            SELECT c.id FROM companies c WHERE c.owner_id = public.get_current_user_id()
        )
    );

-- ===== AUDIT LOGS =====
DROP POLICY IF EXISTS "audit_logs_select_policy" ON audit_logs;
CREATE POLICY "audit_logs_select_policy"
    ON audit_logs FOR SELECT
    USING (
        user_id = public.get_current_user_id() OR
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = public.get_current_user_id() AND u.role IN ('admin', 'super_admin')
        )
    );

-- ===== PLANS (public read) =====
DROP POLICY IF EXISTS "plans_select_policy" ON plans;
CREATE POLICY "plans_select_policy"
    ON plans FOR SELECT
    USING (is_active = true);

-- ===== ORDER ITEMS =====
DROP POLICY IF EXISTS "order_items_select_policy" ON order_items;
CREATE POLICY "order_items_select_policy"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_items.order_id AND o.user_id = public.get_current_user_id()
        )
    );
