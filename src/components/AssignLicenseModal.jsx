import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function AssignLicenseModal({ isOpen, onClose, course, onSuccess }) {
  const { company } = useAuth()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [licenses, setLicenses] = useState([])
  const [students, setStudents] = useState([])
  
  const [selectedLicenseId, setSelectedLicenseId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  
  useEffect(() => {
    if (isOpen && company?.id && course?.id) {
      loadData()
    }
  }, [isOpen, company, course])

  async function loadData() {
    setLoading(true)
    try {
      // 1. Buscar licenças disponíveis para o curso
      const { data: licData, error: licError } = await supabase.rpc('get_available_licenses', {
        p_company_id: company.id,
        p_course_id: course.id,
        p_limit: 100
      })
      
      if (licError) throw licError
      setLicenses(licData || [])

      // 2. Buscar membros da empresa
      const { data: membersData, error: membersError } = await supabase.rpc('get_company_members_with_users', {
        p_company_id: company.id
      })

      if (membersError) throw membersError
      
      // Filtrar membros que já têm user_id válido
      setStudents(membersData?.filter(m => m.user_id) || [])
    } catch (err) {
      console.error('Erro ao carregar dados do modal:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!selectedLicenseId || !selectedStudentId) {
      alert('Selecione uma licença e um colaborador.')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase.rpc('assign_license_to_user', {
        p_license_id: parseInt(selectedLicenseId),
        p_user_id: parseInt(selectedStudentId)
      })

      if (error) throw error

      if (data?.success) {
        alert('Colaborador vinculado com sucesso!')
        onSuccess?.()
        onClose()
      } else {
        alert('Erro: ' + (data?.error || 'Falha ao vincular.'))
      }
    } catch (err) {
      console.error('Erro ao vincular:', err)
      alert('Erro ao processar: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary-container px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white font-headline">
            Vincular Colaborador: {course?.nr_code}
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
            </div>
          ) : (
            <>
              {/* Select Licença */}
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Licença Disponível</label>
                <select
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  value={selectedLicenseId}
                  onChange={(e) => setSelectedLicenseId(e.target.value)}
                >
                  <option value="">Selecione uma licença...</option>
                  {licenses.map((lic) => (
                    <option key={lic.license_id} value={lic.license_id}>
                      {lic.license_code} - Vence em: {new Date(lic.expires_at).toLocaleDateString('pt-BR')}
                    </option>
                  ))}
                </select>
                {licenses.length === 0 && (
                  <p className="text-xs text-error mt-1">Nenhuma licença disponível para este curso.</p>
                )}
              </div>

              {/* Select Colaborador */}
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Colaborador</label>
                <select
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">Selecione um colaborador...</option>
                  {students.map((stu) => (
                    <option key={stu.user_id} value={stu.user_id}>
                      {stu.user_full_name || stu.user?.full_name || 'N/A'} ({stu.user_email || stu.user?.email || 'N/A'})
                    </option>
                  ))}
                </select>
                {students.length === 0 && (
                  <p className="text-xs text-error mt-1">Nenhum colaborador cadastrado na empresa.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-surface-container-low px-6 py-4 flex justify-end gap-3 border-t border-outline-variant/10">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container hover:rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedLicenseId || !selectedStudentId || submitting || licenses.length === 0}
            className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Vinculando...
              </>
            ) : (
              'Vincular Agora'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssignLicenseModal
