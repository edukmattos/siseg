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
      <main className="min-h-screen ml-64 p-6">
        {children}
      </main>
    </div>
  )
}

export default CompanyDashboardLayout
