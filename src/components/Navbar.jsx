import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

function Navbar({ onShowLogin, onShowDashboard, onShowStudentDashboard, onShowSuperAdminDashboard, onShowInstructorDashboard }) {
  const { itemCount, openCart } = useCart()
  const { isAuthenticated, user, signOut, hasCompany, isStudent, isSuperAdmin, isInstructor } = useAuth()

  return (
    <nav className="bg-surface-bright dark:bg-primary flex justify-between items-center w-full px-8 py-4 max-w-[1920px] mx-auto top-0 sticky z-40 bg-surface-container-low dark:bg-primary-container tonal-shift-bottom shadow-[0_20px_40px_rgba(9,20,38,0.05)]">
      <div className="flex items-center gap-8 flex-1">
        <span className="text-xl font-extrabold text-primary dark:text-white tracking-tighter font-headline">
          Occupational Excellence
        </span>
        <div className="hidden md:flex relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="w-full bg-surface-container-low border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary transition-all"
            placeholder="Buscar normas, cursos ou certificados..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-6 font-headline font-bold tracking-tight">
          <a className="text-primary dark:text-white border-b-2 border-primary dark:border-surface-container-low pb-1" href="#cursos">
            Cursos
          </a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-primary-container dark:hover:text-white transition-colors" href="#certificacoes">
            Certificações
          </a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-primary-container dark:hover:text-white transition-colors" href="#empresas">
            Empresas
          </a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-primary-container dark:hover:text-white transition-colors" href="#suporte">
            Suporte
          </a>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={openCart}
            className="relative hover:opacity-90 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-primary dark:text-surface-container-low">
              shopping_cart
            </span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-error text-white text-[10px] min-w-[16px] h-4 flex items-center justify-center rounded-full font-bold animate-pulse">
                {itemCount}
              </span>
            )}
          </button>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {isSuperAdmin && (
                <button
                  onClick={onShowSuperAdminDashboard}
                  className="hidden sm:flex items-center gap-2 bg-surface-container-low text-primary px-4 py-2 rounded-xl text-sm font-headline font-bold hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                  Super Admin
                </button>
              )}
              {isInstructor && (
                <button
                  onClick={onShowInstructorDashboard}
                  className="hidden sm:flex items-center gap-2 bg-surface-container-low text-primary px-4 py-2 rounded-xl text-sm font-headline font-bold hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">menu_book</span>
                  Meu Painel
                </button>
              )}
              {isStudent && (
                <button
                  onClick={onShowStudentDashboard}
                  className="hidden sm:flex items-center gap-2 bg-surface-container-low text-primary px-4 py-2 rounded-xl text-sm font-headline font-bold hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">school</span>
                  Meus Treinamentos
                </button>
              )}
              {hasCompany && !isStudent && !isSuperAdmin && (
                <button
                  onClick={onShowDashboard}
                  className="hidden sm:flex items-center gap-2 bg-surface-container-low text-primary px-4 py-2 rounded-xl text-sm font-headline font-bold hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">business</span>
                  Portal da Empresa
                </button>
              )}
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-primary">{user?.full_name}</p>
                <p className="text-xs text-on-surface-variant">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 rounded-xl hover:bg-surface-container transition-colors"
                title="Sair"
              >
                <span className="material-symbols-outlined text-on-surface-variant">
                  logout
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={onShowLogin}
              className="bg-primary text-white px-5 py-2 rounded-xl font-headline font-bold text-sm hover:opacity-90 transition-all"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
