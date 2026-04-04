import { useAuth } from '../context/AuthContext'

function CompanyDashboardHeader({ onBack }) {
  const { user, signOut } = useAuth()

  async function handleSignOut() {
    try {
      await signOut()
      onBack?.()
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="px-6 h-16 flex items-center justify-between">
        {/* Left section - Logo e Navegação */}
        <div className="flex items-center gap-6">
          <h1 className="font-headline font-extrabold text-slate-900 text-sm tracking-widest uppercase">
            Occupational Excellence
          </h1>
          
          {/* Menu Items */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#analytics" className="text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium">
              Analytics
            </a>
            <a href="#certifications" className="text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium">
              Certifications
            </a>
            <a href="#logs" className="text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium">
              Logs
            </a>
          </nav>
        </div>

        {/* Right section - Busca, Notificações, Configurações e Usuário */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search records..."
              className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </button>

          {/* Settings */}
          <button className="p-2 text-slate-500 hover:text-slate-700 transition-colors">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
              {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-700 hidden lg:block">
              {user?.full_name || 'Usuário'}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors ml-2"
            title="Sair"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default CompanyDashboardHeader
