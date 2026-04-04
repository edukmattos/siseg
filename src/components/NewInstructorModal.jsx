import { useState } from 'react'
import { supabase } from '../lib/supabase'

function NewInstructorModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    specialty: '',
    certifications: '',
    phone: '',
    status: 'pending',
  })
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  function validate() {
    const newErrors = {}
    if (!formData.full_name.trim()) newErrors.full_name = 'Nome é obrigatório'
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido'
    if (!formData.specialty.trim()) newErrors.specialty = 'Especialidade é obrigatória'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    try {
      // Gerar UUID para o instrutor
      const newId = crypto.randomUUID()

      // Criar registro na tabela users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: newId,
          full_name: formData.full_name,
          email: formData.email,
          role: 'instructor',
          specialty: formData.specialty,
          certifications: formData.certifications || null,
          phone: formData.phone || null,
          status: formData.status,
        })

      if (userError) {
        // Se o erro for de chave duplicada (email já existe)
        if (userError.code === '23505') {
          throw new Error('Este email já está cadastrado no sistema')
        }
        throw userError
      }

      onSuccess?.()
      onClose()
      
      // Reset form
      setFormData({
        full_name: '',
        email: '',
        specialty: '',
        certifications: '',
        phone: '',
        status: 'pending',
      })
    } catch (err) {
      console.error('Erro ao criar instrutor:', err)
      setErrors({ submit: err.message || 'Erro ao criar instrutor. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-primary font-headline">Novo Instrutor</h2>
            <p className="text-sm text-slate-500 mt-1">Preencha os dados para cadastrar um novo instrutor</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Message */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 text-lg">error</span>
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Ex: João Silva"
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.full_name ? 'border-red-500' : 'border-slate-200'
              } focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all`}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ex: joao@empresa.com"
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.email ? 'border-red-500' : 'border-slate-200'
              } focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Especialidade */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Especialidade <span className="text-red-500">*</span>
            </label>
            <select
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.specialty ? 'border-red-500' : 'border-slate-200'
              } focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white`}
            >
              <option value="">Selecione uma especialidade</option>
              <option value="NR-01 Gestão de Riscos">NR-01 Gestão de Riscos</option>
              <option value="NR-10 Eletricidade">NR-10 Eletricidade</option>
              <option value="NR-12 Máquinas e Equipamentos">NR-12 Máquinas e Equipamentos</option>
              <option value="NR-33 Espaço Confinado">NR-33 Espaço Confinado</option>
              <option value="NR-35 Trabalho em Altura">NR-35 Trabalho em Altura</option>
              <option value="NR-37 Plataformas de Petróleo">NR-37 Plataformas de Petróleo</option>
              <option value="CIPA">CIPA</option>
              <option value="Outras">Outras</option>
            </select>
            {errors.specialty && (
              <p className="mt-1 text-xs text-red-500">{errors.specialty}</p>
            )}
          </div>

          {/* Certificações */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Certificações Adicionais
            </label>
            <textarea
              name="certifications"
              value={formData.certifications}
              onChange={handleChange}
              placeholder="Ex: Engenheiro de Segurança do Trabalho, Técnico em Segurança..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Status Inicial
            </label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="status"
                  value="pending"
                  checked={formData.status === 'pending'}
                  onChange={handleChange}
                  className="text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-700">Pendente</span>
                  <p className="text-xs text-slate-500">Aguardando ativação</p>
                </div>
              </label>
              <label className="flex-1 flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={handleChange}
                  className="text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-700">Ativo</span>
                  <p className="text-xs text-slate-500">Imediatamente ativo</p>
                </div>
              </label>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-500 text-lg shrink-0">info</span>
            <p className="text-sm text-blue-700">
              O instrutor será cadastrado com status "{formData.status === 'active' ? 'Ativo' : 'Pendente'}" e receberá um email de boas-vindas.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                  Cadastrando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Cadastrar Instrutor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewInstructorModal
