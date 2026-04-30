// patient profile editing page. reads from and writes to the public.patient_info
// table in supabase directly using the anon key (secured by row-level security
// so each user can only access their own row). the page is only reachable through
// DashboardGuard + RoleGuard so the user is guaranteed to be an authenticated patient.

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
//import { useAuth } from '../../../context/AuthContext'
import PatientSidebar from './components/PatientSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

type PatientInfoRow = {
  id: string
  name: string | null
  birthday: string | null
  gender: string | null
  blood_type: string | null
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function DashboardPanel({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={[
        'min-h-[400px] w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95',
        'shadow-[0px_4px_14px_rgba(15,23,42,0.08)] backdrop-blur-sm',
        'transition-all duration-300 ease-out motion-reduce:transition-none',
        'hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0px_20px_40px_rgba(15,23,42,0.14)]',
        className,
      ].join(' ')}
    >
      <div className="border-b border-slate-200/80 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      </div>

      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

// renders the sidebar, header, and a form for personal details (name, birthday,
// gender, blood type). on mount it loads existing data from patient_info;
// on submit it upserts the row keyed by the user's auth uid.
export default function PatientYourInformation() {
  /*const { profile } = useAuth()
  const displayName = profile?.full_name?.trim() || 'Patient'
  const [profileOpen, setProfileOpen] = useState(false)*/
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({
    name: '',
    birthday: '',
    gender: '',
    blood_type: '',
  })

  // on mount, fetch the patient_info row matching the logged-in user's uuid.
  // if a row exists the form is pre-filled; otherwise fields start empty.
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('patient_info')
        .select('id, name, birthday, gender, blood_type')
        .eq('id', user.id)
        .maybeSingle()

      if (!error && data) {
        const row = data as PatientInfoRow
        setForm({
          name: row.name ?? '',
          birthday: row.birthday ?? '',
          gender: row.gender ?? '',
          blood_type: row.blood_type ?? '',
        })
      } else {
        setForm({
          name: '',
          birthday: '',
          gender: '',
          blood_type: '',
        })
      }
      setLoading(false)
    }
    void load()
  }, [])

  // validates age input then upserts the form data into public.patient_info
  // using the user's auth uid as the primary key (onConflict: 'id').
  // also updates public.profiles.full_name so the header/app profile name stays in sync.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage({ type: 'error', text: 'not logged in' })
      return
    }

    const trimmedName = form.name.trim()

    setSaving(true)

    const { error: patientInfoError } = await supabase
      .from('patient_info')
      .upsert(
        {
          id: user.id,
          name: trimmedName || null,
          birthday: form.birthday || null,
          gender: form.gender.trim() || null,
          blood_type: form.blood_type.trim() || null,
        },
        { onConflict: 'id' }
      )

    if (patientInfoError) {
      setSaving(false)
      setMessage({ type: 'error', text: patientInfoError.message })
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: trimmedName || null,
      })
      .eq('id', user.id)

    setSaving(false)

    if (profileError) {
      setMessage({
        type: 'error',
        text: `patient_info saved, but profiles update failed: ${profileError.message}`,
      })
      return
    }

    setMessage({ type: 'success', text: 'saved' })

    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

 return (
  <SidebarProvider defaultOpen>
    <div className="flex min-h-[calc(100vh-96px)]">
      <PatientSidebar />

<main className="pd-main">
  <div className="grid gap-6 items-start auto-rows-max grid-cols-[repeat(auto-fill,minmax(500px,1fr))]">
    <DashboardPanel title="Personal details" className="min-h-[400px]">
      <p className="mb-4 text-sm text-slate-500">
        View and update your information. Only you can see and edit this.
      </p>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="pi-name" className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="pi-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Full name"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-indigo-400"
            />
          </div>

          <div>
            <label htmlFor="pi-birthday" className="mb-1 block text-sm font-medium text-slate-700">
              Date of Birth
            </label>
            <input
              id="pi-birthday"
              type="date"
              value={form.birthday}
              onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-indigo-400"
            />
          </div>

          <div>
            <label htmlFor="pi-gender" className="mb-1 block text-sm font-medium text-slate-700">
              Gender
            </label>
            <input
              id="pi-gender"
              type="text"
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              placeholder="Gender"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-indigo-400"
            />
          </div>

          <div>
            <label htmlFor="pi-blood_type" className="mb-1 block text-sm font-medium text-slate-700">
              Blood type
            </label>
            <select
              id="pi-blood_type"
              value={form.blood_type}
              onChange={(e) => setForm((f) => ({ ...f, blood_type: e.target.value }))}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-indigo-400"
            >
              <option value="">Select</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
          </div>

          {message && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                message.type === 'error'
                  ? 'border border-red-200 bg-red-50 text-red-700'
                  : 'border border-green-200 bg-green-50 text-green-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </DashboardPanel>
  </div>
</main>
    </div>
  </SidebarProvider>
)
}