import SuperAdminHeader from './SuperAdminHeader'
import SuperAdminMenuSide from './SuperAdminMenuSide'

function SuperAdminLayout({ children, currentTab, onNavigate, onBack, hideHeader = false, fullScreen = false }) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Header Fixo */}
      {!hideHeader && (
        <SuperAdminHeader onBack={onBack} />
      )}

      {/* Menu Lateral Fixo */}
      <SuperAdminMenuSide
        onNavigate={onNavigate}
        currentTab={currentTab}
        onBack={onBack}
      />

      {/* Conteúdo Dinâmico */}
      <main className={`min-h-screen ml-64 p-6`}>
        {children}
      </main>
    </div>
  )
}

export default SuperAdminLayout
