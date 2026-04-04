import CompanyDashboardHeader from './CompanyDashboardHeader'
import CompanyDashboardMenuSide from './CompanyDashboardMenuSide'

function CompanyDashboardLayout({ children, currentTab, onNavigate, onBack, hideHeader = false }) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Header Fixo */}
      {!hideHeader && (
        <CompanyDashboardHeader onBack={onBack} />
      )}

      {/* Menu Lateral Fixo */}
      <CompanyDashboardMenuSide
        onNavigate={onNavigate}
        currentTab={currentTab}
        onBack={onBack}
      />

      {/* Conteúdo Dinâmico */}
      <main className={`min-h-screen ml-64 ${hideHeader ? 'pt-0' : 'pt-0'}`}>
        <div className="w-full px-2 py-4">
          {children}
        </div>
      </main>
    </div>
  )
}

export default CompanyDashboardLayout
