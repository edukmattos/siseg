import { useAuth } from '../context/AuthContext'

function SuperAdminMenuSide({ onNavigate, currentTab, onBack }) {
  const { user, signOut } = useAuth()

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'dashboard' },
    { id: 'courses', label: 'Cursos', icon: 'menu_book' },
    { id: 'companies', label: 'Empresas', icon: 'domain' },
    { id: 'instructors', label: 'Instrutores', icon: 'school' },
    { id: 'finance', label: 'Financeiro', icon: 'payments' },
    { id: 'audit', label: 'Auditoria', icon: 'assignment_turned_in' },
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
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
          <span className="material-symbols-outlined">security</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 leading-tight">NR-01 Admin</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Gestão de Conformidade</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 space-y-1 mt-4">
        {menuItems.map((item) => {
          const isActive = currentTab === item.id
          return (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onNavigate?.(item.id)
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-slate-100 text-slate-900 border-l-4 border-slate-900'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-200 space-y-3">
        {/* Novo Relatório Button */}
        <button className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined text-sm">add</span>
          Novo Relatório
        </button>

        {/* Suporte */}
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">help</span>
          <span className="text-sm">Suporte</span>
        </a>

        {/* User Info */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-700 text-sm">admin_panel_settings</span>
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold truncate text-slate-900">{user?.full_name || 'SuperAdmin'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@nr01.com.br'}</p>
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

export default SuperAdminMenuSide
