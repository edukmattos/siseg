import { useState } from 'react'
import { useCart } from '../context/CartContext'

function CourseDetailsPage({ course, onBack }) {
  const { addItem, openCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)

  if (!course) return null

  const {
    nr,
    level,
    title,
    hours,
    modality,
    modalityIcon,
    priceCents,
    image,
    hasESocial,
    id,
  } = course

  const price = (priceCents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  function handleAddToCart() {
    setIsAdding(true)
    for (let i = 0; i < quantity; i++) {
      addItem({
        id,
        nr,
        title,
        priceCents,
        image,
      })
    }
    openCart()
    setTimeout(() => setIsAdding(false), 600)
  }

  function incrementQuantity() {
    setQuantity((prev) => prev + 1)
  }

  function decrementQuantity() {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))
  }

  const faqData = [
    {
      question: 'O certificado tem validade jurídica em todo o Brasil?',
      answer:
        'Sim. Nossos cursos são elaborados conforme as diretrizes da NR-01 e possuem validade em todo o território nacional, aceitos por órgãos fiscalizadores e auditorias.',
    },
    {
      question: 'Como funciona o treinamento prático?',
      answer:
        'O treinamento prático é realizado em nossa estrutura certificada, com torres de treinamento e equipamentos de proteção individual e coletiva. O Colaborador agenda a parte prática após concluir o módulo teórico online.',
    },
    {
      question: 'Posso comprar licenças para toda a minha equipe?',
      answer:
        'Sim! Oferecemos pacotes corporativos com condições especiais para treinamentos acima de 50 colaboradores, incluindo portal de gestão exclusivo e relatórios de conformidade.',
    },
  ]

  return (
    <div className="bg-surface font-body text-on-surface">
      {/* Top Navigation Bar */}
      <header className="bg-surface-container-low sticky top-0 z-50 shadow-sm">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-primary hover:text-primary-container transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-headline font-bold">Voltar ao Catálogo</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-on-surface-variant hover:opacity-90 transition-all">
              shopping_cart
            </button>
            <button className="material-symbols-outlined text-on-surface-variant hover:opacity-90 transition-all">
              account_circle
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-8 py-12 lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Content Area */}
        <div className="lg:col-span-8 space-y-12">
          {/* Hero Header Section */}
          <section className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold tracking-widest font-label uppercase">
                {nr} {level.toUpperCase()}
              </span>
              {hasESocial && (
                <span className="px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold font-label flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  CONFORMIDADE NR-01
                </span>
              )}
            </div>

            <h1 className="text-5xl font-extrabold font-headline text-primary tracking-tight leading-tight">
              {title}
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-surface-container-low rounded-xl">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant font-label uppercase tracking-wider mb-1">
                  Carga Horária
                </p>
                <p className="text-2xl font-bold font-headline text-primary">
                  {hours}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant font-label uppercase tracking-wider mb-1">
                  Modalidade
                </p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    {modalityIcon}
                  </span>
                  <p className="text-2xl font-bold font-headline text-primary">
                    {modality}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant font-label uppercase tracking-wider mb-1">
                  Nível
                </p>
                <p className="text-2xl font-bold font-headline text-primary">
                  {level}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant font-label uppercase tracking-wider mb-1">
                  Certificado
                </p>
                <p className="text-2xl font-bold font-headline text-primary">
                  Digital/Impresso
                </p>
              </div>
            </div>
          </section>

          {/* Description & Sections */}
          <section className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold font-headline text-primary">
                Descrição do Curso
              </h2>
              <p className="text-on-surface-variant leading-relaxed text-lg">
                Este treinamento estabelece os requisitos mínimos e as medidas de
                proteção para o trabalho em altura, envolvendo o planejamento, a
                organização e a execução, de forma a garantir a segurança e a
                saúde dos trabalhadores envolvidos direta ou indiretamente com
                esta atividade. Nossa metodologia foca na prevenção de quedas e
                no domínio de equipamentos de proteção individual e coletiva.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold font-headline text-primary">
                Público-alvo
              </h2>
              <div className="flex flex-wrap gap-3">
                <span className="bg-surface-container-highest px-4 py-2 rounded-lg text-on-surface font-medium border border-outline-variant/10">
                  Trabalhadores da Construção Civil
                </span>
                <span className="bg-surface-container-highest px-4 py-2 rounded-lg text-on-surface font-medium border border-outline-variant/10">
                  Técnicos de Segurança
                </span>
                <span className="bg-surface-container-highest px-4 py-2 rounded-lg text-on-surface font-medium border border-outline-variant/10">
                  Engenheiros
                </span>
                <span className="bg-surface-container-highest px-4 py-2 rounded-lg text-on-surface font-medium border border-outline-variant/10">
                  Manutenção Industrial
                </span>
                <span className="bg-surface-container-highest px-4 py-2 rounded-lg text-on-surface font-medium border border-outline-variant/10">
                  Setor Elétrico
                </span>
              </div>
            </div>

            {/* Programmatic Content - Bento Style */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold font-headline text-primary">
                Conteúdo Programático
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-primary shadow-sm space-y-2">
                  <span className="text-xs font-bold text-on-primary-container uppercase">
                    Módulo 01
                  </span>
                  <h3 className="font-bold text-lg text-primary">
                    Normas e Regulamentos
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    Análise detalhada da {nr} e legislações complementares
                    aplicadas.
                  </p>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-primary-container shadow-sm space-y-2">
                  <span className="text-xs font-bold text-on-primary-container uppercase">
                    Módulo 02
                  </span>
                  <h3 className="font-bold text-lg text-primary">
                    Análise de Risco
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    Condições impeditivas e antecipação de perigos no canteiro de
                    obras.
                  </p>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-secondary shadow-sm space-y-2">
                  <span className="text-xs font-bold text-on-primary-container uppercase">
                    Módulo 03
                  </span>
                  <h3 className="font-bold text-lg text-primary">EPI e EPC</h3>
                  <p className="text-sm text-on-surface-variant">
                    Seleção, inspeção, conservação e limitação de uso de
                    equipamentos.
                  </p>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-primary shadow-sm space-y-2">
                  <span className="text-xs font-bold text-on-primary-container uppercase">
                    Módulo 04
                  </span>
                  <h3 className="font-bold text-lg text-primary">
                    Resgate e Primeiros Socorros
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    Noções básicas, planos de emergência e condutas em
                    acidentes.
                  </p>
                </div>
              </div>
            </div>

            {/* Methodology & Transparency */}
            <div className="bg-primary p-10 rounded-2xl text-white overflow-hidden relative">
              <div className="relative z-10 space-y-4">
                <h2 className="text-3xl font-bold font-headline">
                  Metodologia Exclusiva
                </h2>
                <p className="text-on-primary-container text-lg max-w-xl">
                  Utilizamos simuladores de realidade virtual e aulas práticas em
                  torres de treinamento certificadas. Nosso método "Safety-First"
                  garante que 70% do tempo seja dedicado à aplicação prática dos
                  conceitos.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                <span
                  className="material-symbols-outlined text-[200px]"
                  style={{ fontVariationSettings: "'wght' 100" }}
                >
                  engineering
                </span>
              </div>
            </div>

            {/* FAQ */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold font-headline text-primary">
                Perguntas Frequentes
              </h2>
              <div className="divide-y divide-outline-variant/20">
                {faqData.map((faq, index) => (
                  <div key={index} className="py-4">
                    <button
                      onClick={() =>
                        setExpandedFaq(expandedFaq === index ? null : index)
                      }
                      className="flex justify-between items-center w-full text-left group"
                    >
                      <span className="font-bold text-primary group-hover:text-primary-container transition-colors">
                        {faq.question}
                      </span>
                      <span className="material-symbols-outlined text-outline">
                        {expandedFaq === index ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    {expandedFaq === index && (
                      <div className="mt-2 text-on-surface-variant text-sm">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Sticky Column */}
        <aside className="lg:col-span-4 mt-12 lg:mt-0">
          <div className="sticky top-28 space-y-6">
            <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0_20px_40px_rgba(9,20,38,0.05)] border border-outline-variant/10 space-y-8">
              <div className="space-y-2">
                <p className="text-on-surface-variant font-medium">A partir de</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold font-headline text-primary">
                    R$ {price}
                  </span>
                  <span className="text-on-surface-variant">/licença</span>
                </div>
                <p className="text-[10px] text-on-tertiary-container bg-tertiary-fixed px-2 py-1 rounded inline-block font-bold">
                  ECONOMIZE 15% EM PACOTES CORPORATIVOS
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-primary font-label">
                  Quantidade de Licenças
                </label>
                <div className="flex items-center border-2 border-surface-container-high rounded-xl overflow-hidden">
                  <button
                    onClick={decrementQuantity}
                    className="p-4 hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <input
                    className="w-full text-center border-none focus:ring-0 font-bold text-lg"
                    min="1"
                    type="number"
                    value={quantity}
                    readOnly
                  />
                  <button
                    onClick={incrementQuantity}
                    className="p-4 hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <p className="text-[10px] text-on-surface-variant text-center uppercase tracking-widest">
                  Acesso imediato após confirmação
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  className={`w-full py-5 rounded-xl font-bold font-headline text-lg shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                    isAdding
                      ? 'bg-green-600 text-white'
                      : 'bg-primary text-white'
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {isAdding ? 'check' : 'shopping_cart'}
                  </span>
                  {isAdding ? 'Adicionado!' : 'Adicionar ao Carrinho'}
                </button>
                <button className="w-full border-2 border-primary text-primary py-4 rounded-xl font-bold font-headline hover:bg-primary/5 transition-all">
                  Falar com Consultor
                </button>
              </div>

              <div className="pt-6 border-t border-outline-variant/20 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">
                    shield
                  </span>
                  <span className="text-sm font-medium">
                    Pagamento 100% Seguro
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">
                    file_download
                  </span>
                  <span className="text-sm font-medium">
                    Download imediato de material
                  </span>
                </div>
              </div>
            </div>

            {/* Side Banner */}
            <div className="bg-gradient-to-br from-primary to-primary-container p-6 rounded-2xl text-white space-y-4">
              <h4 className="font-bold text-lg font-headline">
                Precisa de Treinamento In-Company?
              </h4>
              <p className="text-sm text-on-primary-container">
                Levamos nossa estrutura até sua empresa para treinamentos
                presenciais customizados.
              </p>
              <a
                className="inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4"
                href="#"
              >
                Saiba mais{' '}
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </a>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default CourseDetailsPage
