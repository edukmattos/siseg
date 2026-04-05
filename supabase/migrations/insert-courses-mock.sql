-- ============================================================================
-- Inserir cursos mock na tabela courses
-- Para popular o catálogo com os cursos originais que foram removidos do App.jsx
-- ============================================================================

-- Primeiro, atualizar o constraint para aceitar valores com acentos
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_level_check;
ALTER TABLE public.courses ADD CONSTRAINT courses_level_check 
    CHECK (level IN ('Básico', 'Intermediário', 'Avançado', 'Especialista', 'Prático', 'Reciclagem', 'Integração', 'CIPA', 'Basico', 'Intermediario', 'Avancado', 'Especialista', 'Pratico', 'Integracao'));

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_modality_check;
ALTER TABLE public.courses ADD CONSTRAINT courses_modality_check 
    CHECK (modality IN ('Online', 'Híbrido', 'Presencial', 'Hibrido'));

INSERT INTO public.courses (
    title,
    description,
    nr_code,
    nr_full_name,
    level,
    modality,
    workload_hours,
    price_cents,
    image_url,
    is_esocial_valid,
    is_featured,
    is_active,
    prerequisites,
    objectives,
    target_audience,
    program_content
) VALUES
(
    'NR-10 Segurança em Instalações Elétricas',
    'Curso completo sobre segurança em instalações elétricas conforme a Norma Regulamentadora 10. Abrange todos os aspectos de segurança no trabalho com eletricidade, desde o planejamento até a execução de atividades com instalações elétricas.',
    'NR-10',
    'Segurança em Instalações Elétricas',
    'Básico',
    'Online',
    40,
    18900,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuApYdv-pXcx1aCiTXj6JYwPZGE8y0kDRpjjNUrXCA1_ke3LoPI_axhtlR6muoBmlAMIwpmQLOMAkoTRGgCVmEW8WAzgMxCWUEQl7DKeEfeojPp4HVHlex34OVSBtYcmUaZpDNpIqxgAzj-6LCg3Wai-cB27EXqfRpYjcqrmg1UtvUTnj0NKf_AmJGD9SABae4Edt9tpdvnAI5psjjxSP5fizyF322VcnDbBDDUjADE9S8q_hU47zaNVx_My3Ur7iYP2U8QQayxXCvw',
    true,
    true,
    true,
    ARRAY['Não possuir restrição médica para trabalho com eletricidade'],
    'Capacitar trabalhadores para atuar com segurança em instalações elétricas, conforme NR-10.',
    'Eletricistas, técnicos e engenheiros que atuam em instalações elétricas',
    'Introdução à eletricidade; Riscos em instalações elétricas; Técnicas de análise de risco; Medidas de controle; Normas técnicas brasileiras; Equipamentos de proteção individual e coletiva; Prevenção de acidentes.'
),
(
    'NR-35 Trabalho em Altura',
    'Treinamento completo para trabalho seguro em alturas superiores a 2 metros do nível inferior. Aborda técnicas de proteção contra quedas, uso de EPIs e procedimentos de emergência.',
    'NR-35',
    'Trabalho em Altura',
    'Prático',
    'Híbrido',
    8,
    24500,
    'https://lh3.googleusercontent.com/AB6AXuAs-aY1JYIgqMqGaPgGLu_3fV9zAQ8H3KfwwCBw3OCwT48Gm24-0S7QxPWDOw81xR7ug4hIwY3PyraOLg7gJ3CvJgjQjZqK2y2lv-5bZoGfNdW9ts7SkcRh4Bimu4V53axPDFV91knZRsukzbOMH7Q0WU9KK69vc-MlZDe4UC6vIiiNA03T2KIDGNdbP7PpgpGkDRJDewGGn8wqfvWgdK1Dm12doSmUa1sCIO-p2-xtcBtGxhbXCq2McvjdCkIjxNPSip6Y9sBTszA',
    true,
    true,
    true,
    ARRAY['Ter idade mínima de 18 anos', 'Apto para trabalho em altura'],
    'Capacitar trabalhadores para realizar trabalho em altura com segurança, conforme NR-35.',
    'Trabalhadores que realizam atividades em altura superior a 2 metros',
    'Normas e regulamentos; Riscos em trabalho em altura; Equipamentos de proteção contra quedas; Procedimentos de emergência e salvamento; Prática de uso de EPIs.'
),
(
    'NR-07 Primeiros Socorros Básico',
    'Curso de primeiros socorros básico voltado para atendimento de emergências médicas no ambiente de trabalho. Fundamenta técnicas de suporte básico à vida.',
    'NR-07',
    'Primeiros Socorros',
    'Reciclagem',
    'Online',
    4,
    9500,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBgneVYiiwNS4WuBgksZW4XKrewhzlM9RlXCBnNc6ufPnM62t7hwCQ6c61nKCmPS4x-A4810IgtGRGOItgWCxNLeUoLBbXnFxUjbGb2yRj3MqesRYVRGnKV0ndreEDkg36wwRvQWfaeIzolxdJAjLORA-XKU_uztqw85O47Fn1LHSPpX9qQC4nMJw6_UksXCFCJ10Kx5AH5E9644WpJff9gn41QoOhun1LdaEAuuaJq2UVJFjnre24fW9QC9s0bmefwsOpmR9VEniQ',
    true,
    false,
    true,
    ARRAY['Nenhum'],
    'Capacitar os trabalhadores a prestar primeiros socorros em caso de acidentes de trabalho.',
    'Todos os trabalhadores que possam atuar como primeiros respondentes',
    'Avaliação de cena; Suporte básico à vida; Hemorragias e choque; Fraturas e imobilização; Queimaduras; Intoxicações; Transporte de acidentados.'
),
(
    'NR-12 Segurança em Máquinas e Equipamentos',
    'Capacitação completa sobre segurança na utilização de máquinas e equipamentos, conforme a NR-12. Abrange dispositivos de segurança, proteção e prevenção de acidentes.',
    'NR-12',
    'Segurança em Máquinas e Equipamentos',
    'Especialista',
    'Híbrido',
    16,
    31200,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuACvoFNS8ooBFFvklPKDwQip_ZD95FMKjZMchIxP3U4hLDJztHoOp_RMlY1iXW9awfVEm-WDgFt4Kr0Ljgj_7zxzT_D_oFXxcsMJETIK1QYcqQUrePJjSwu-oqjV1CvOMQwmPX1eXjcWYs0_-tx-S74L9iXac7J23WzpwSd9-iC7NNbYLVBmFGE3knN8CkPVzIPf_CZKk16o4xBwJgDavIKw72SxMuGlxYjXtmTs-AqNgS8PDQc6Q9-HweXCZzNCU0gYno9hrFbKME',
    false,
    false,
    true,
    ARRAY['Conhecimento básico em mecânica'],
    'Capacitar profissionais para operar máquinas e equipamentos com segurança, conforme NR-12.',
    'Operadores de máquinas, mecânicos e técnicos de manutenção',
    'Dispositivos de segurança; Proteções fixas e móveis; Sinais de segurança; Procedimentos de bloqueio; Riscos mecânicos; Inspeção e manutenção preventiva.'
),
(
    'NR-18 Segurança na Indústria da Construção',
    'Curso de integração sobre segurança na indústria da construção civil. Aborda as condições e meio ambiente de trabalho conforme a NR-18.',
    'NR-18',
    'Condições e Meio Ambiente de Trabalho na Indústria da Construção',
    'Integração',
    'Online',
    6,
    15600,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAR5GLsvqOxrQQtirhMX8Q-P235Jr7XwXO4ONNkeUuxcHByp4PenbOjqcFI4HBe8sv1kyUDnRFYKApEzcoq-D6HAJ2QS5_y3MiANm1Hpk_1zHPHmy2hJfHdC_03HmvWhQxhL8MnaDYKyBxrtHNiu7e0lnHLgwpNM7i9FqFNai57rVrZIakMwihQiUiruqIt_5eAGWF4YuS8I5SZPsU69KVk3UbDO9fzVQ52pqO_C-AAAAGzjjwvAMaVOeN3ACkDo83V7DgPNEVs7ec',
    false,
    false,
    true,
    ARRAY['Nenhum'],
    'Capacitar trabalhadores da construção civil sobre segurança e condições de trabalho.',
    'Trabalhadores da indústria da construção',
    'Proteções contra quedas; Escavações; Andaimes e plataformas; Guindastes e transporte de materiais; Eletricidade no canteiro; Prevenção de incêndios; Sinalização de segurança.'
),
(
    'Comissão Interna de Prevenção de Acidentes - NR-05',
    'Formação completa para membros da CIPA, abordando prevenção de acidentes, saúde ocupacional e legislação vigente conforme a NR-05.',
    'NR-05',
    'Comissão Interna de Prevenção de Acidentes',
    'CIPA',
    'Online',
    20,
    21000,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAyum5nfgXFC2ZWeK27crDM4ps_ctPXko0QCggWRwXLG9406AJB9tS_yTfvZlzKFwqxV81kjOSHJQhGy_ILay_y4WnPA3gNIaiOwX-PpQhUrDE6CKzR0Hw9jruKMa9X9pu-P81R76jbgr1b8DxBVIA6YhozgMLWj96UmaMR0fONb2zijhLKzVBjxFhKRIMbksEEseekTnM12SxKvyTJJzWQyW_UAH06itkEQiGAJQa6xYjTUaDOpc4VTmfd9jIriN3bkmiD21-jh4',
    true,
    false,
    true,
    ARRAY['Ser indicado ou eleito para a CIPA'],
    'Capacitar membros da CIPA para atuarem na prevenção de acidentes e doenças ocupacionais.',
    'Membros titulares e suplentes da CIPA',
    'Estudo do acidente; Prevenção de acidentes; Legislação; Organização da CIPA; Mapa de risco; SIPAT; Saúde ocupacional.'
);

-- Verificar inserção
SELECT id, nr_code, title, level, modality, workload_hours, price_cents, is_active
FROM public.courses
WHERE is_active = true
ORDER BY nr_code;
