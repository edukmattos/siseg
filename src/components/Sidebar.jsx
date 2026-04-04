function Sidebar({ filters, onFilterChange }) {
  const { category, modalities, level } = filters

  const categories = [
    { key: 'all', icon: 'security', label: 'Todos os Cursos' },
    { key: 'safety', icon: 'health_and_safety', label: 'Segurança do Trabalho' },
    { key: 'health', icon: 'assessment', label: 'Saúde Ocupacional' },
    { key: 'risk', icon: 'gavel', label: 'Gestão de Riscos' },
    { key: 'esocial', icon: 'analytics', label: 'E-social' },
  ]

  const modalityOptions = ['Online', 'Híbrido', 'Presencial']
  const levelOptions = ['Básico', 'Intermediário', 'Avançado', 'Especialista', 'Prático', 'Reciclagem', 'Integração', 'CIPA']

  function toggleModality(modality) {
    const current = modalities || []
    const next = current.includes(modality)
      ? current.filter(m => m !== modality)
      : [...current, modality]
    onFilterChange({ modalities: next.length > 0 ? next : null })
  }

  function setLevel(lvl) {
    onFilterChange({ level: level === lvl ? null : lvl })
  }

  function clearFilters() {
    onFilterChange({ category: null, modalities: null, level: null })
  }

  const hasActiveFilters = category || (modalities && modalities.length > 0) || level

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-20 left-0 border-r border-outline-variant/15 bg-white/60 dark:bg-primary-container/60 backdrop-blur-xl py-8 gap-2 overflow-y-auto">
      <div className="px-8 mb-6">
        <h3 className="font-headline font-extrabold text-primary dark:text-surface-container-low text-lg uppercase tracking-wider">
          Filtros Especializados
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          Refine sua busca por conformidade
        </p>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-1">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onFilterChange({ category: category === cat.key ? null : cat.key })}
            className={`flex items-center gap-4 border-l-4 text-left pl-4 py-3 transition-colors ${
              category === cat.key
                ? 'border-primary text-primary dark:text-white font-bold bg-surface-container-low dark:bg-primary/30'
                : 'border-transparent text-on-surface-variant dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <span className="material-symbols-outlined">{cat.icon}</span>
            <span className="font-medium text-sm">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Modalidade */}
      <div className="mt-8 px-8 space-y-6">
        <div>
          <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
            Modalidade
          </h4>
          <div className="space-y-3">
            {modalityOptions.map((mod) => {
              const isActive = (modalities || []).includes(mod)
              return (
                <label key={mod} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => toggleModality(mod)}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-primary border-primary'
                        : 'border-outline group-hover:border-primary'
                    }`}
                  >
                    {isActive && (
                      <span className="material-symbols-outlined text-xs text-white">check</span>
                    )}
                  </div>
                  <span className={`text-sm ${isActive ? 'text-primary font-medium' : 'text-on-surface-variant'}`}>
                    {mod}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Nível */}
        <div>
          <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
            Nível
          </h4>
          <div className="space-y-3">
            {levelOptions.map((lvl) => (
              <label key={lvl} className="flex items-center gap-3 cursor-pointer group">
                <input
                  className="text-primary focus:ring-primary h-4 w-4"
                  name="level"
                  type="radio"
                  checked={level === lvl}
                  onChange={() => setLevel(lvl)}
                />
                <span className={`text-sm ${level === lvl ? 'text-primary font-medium' : 'text-on-surface-variant'}`}>
                  {lvl}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto p-8 space-y-3">
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full border border-outline-variant text-on-surface-variant py-3 rounded-xl font-headline font-bold text-sm hover:bg-surface-container transition-all"
          >
            Limpar Filtros
          </button>
        )}
        <button
          onClick={() => onFilterChange({ category: null, modalities: null, level: null })}
          className="w-full bg-primary text-white py-3 rounded-xl font-headline font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98]"
        >
          Ver Todos os Cursos
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
