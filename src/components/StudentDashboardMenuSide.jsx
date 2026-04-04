import { useAuth } from '../context/AuthContext'

function StudentDashboardMenuSide({ onNavigate, currentTab, onBack }) {
  const { user, signOut } = useAuth()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'courses', label: 'Meus Treinamentos', icon: 'school' },
    { id: 'certificates', label: 'Certificados', icon: 'verified' },
    { id: 'progress', label: 'Progresso', icon: 'trending_up' },
    { id: 'support', label: 'Suporte', icon: 'contact_support' },
    { id: 'settings', label: 'Configurações', icon: 'settings' },
  ]

  async function handleSignOut() {
    try {
      await signOut()
      onBack?.()
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
    }
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-[60] flex flex-col h-screen w-64 bg-white border-r border-slate-200 font-headline text-sm font-medium tracking-tight">
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
            architecture
          </span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-primary leading-tight">Occupational</h1>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">NR-01 Compliance</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 space-y-1 mt-4">
        {menuItems.map((item) => {
          const isActive = currentTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left ${
                isActive
                  ? 'bg-slate-50 text-primary font-bold before:content-[""] before:absolute before:left-0 before:w-1 before:h-6 before:bg-primary before:rounded-full relative'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-200 space-y-3">
        {/* Compliance Status Widget */}
        <div className="p-4 bg-primary-container rounded-xl">
          <p className="text-[11px] text-on-primary-container mb-2 font-bold uppercase tracking-wider">Status de Conformidade</p>
          <button className="w-full py-2 bg-primary-fixed text-primary text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">
            Verificar Status
          </button>
        </div>

        {/* Suporte */}
        <button
          onClick={() => onNavigate?.('support')}
          className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-700 transition-colors w-full"
        >
          <span className="material-symbols-outlined text-lg">help</span>
          <span className="text-sm">Central de Ajuda</span>
        </button>

        {/* Voltar ao Catálogo */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-700 transition-colors w-full"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span className="text-sm">Voltar ao Catálogo</span>
          </button>
        )}

        {/* User Info */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm">person</span>
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold truncate text-primary">{user?.full_name?.split(' ')[0] || 'Colaborador'}</p>
            <p className="text-[10px] text-on-surface-variant truncate">{user?.email || 'Colaborador@empresa.com.br'}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-slate-400 hover:text-red-500 transition-colors"
            title="Sair"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default StudentDashboardMenuSide
