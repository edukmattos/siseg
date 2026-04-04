import { useAuth } from '../context/AuthContext'

function SuperAdminHeader({ onBack }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="px-6 h-16 flex items-center justify-between">
        {/* Left section */}
        <div>
          <h1 className="font-headline font-extrabold text-slate-900 text-sm tracking-widest uppercase">
            Occupational Excellence
          </h1>
        </div>

        {/* Right section */}
        <div className="flex items-center">
          {/* Notifications */}
          <button className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default SuperAdminHeader
