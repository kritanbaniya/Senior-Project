// patient profile editing page. reads from and writes to the public.patient_info
// table in supabase directly using the anon key (secured by row-level security
// so each user can only access their own row). the page is only reachable through
// DashboardGuard + RoleGuard so the user is guaranteed to be an authenticated patient.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import PatientSidebar from './components/PatientSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

type PatientInfoRow = {
  id: string
  name: string | null
  birthday: string | null
  gender: string | null
  age: number | null
  blood_type: string | null
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

// renders the sidebar, header, and a form for personal details (name, birthday,
// gender, age, blood type). on mount it loads existing data from patient_info;
// on submit it upserts the row keyed by the user's auth uid.
export default function PatientYourInformation() {
  const { profile } = useAuth()
  const displayName = profile?.full_name?.trim() || 'Patient'
  const [profileOpen, setProfileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({
    name: '',
    birthday: '',
    gender: '',
    age: '',
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
        .select('id, name, birthday, gender, age, blood_type')
        .eq('id', user.id)
        .maybeSingle()

      if (!error && data) {
        const row = data as PatientInfoRow
        setForm({
          name: row.name ?? '',
          birthday: row.birthday ?? '',
          gender: row.gender ?? '',
          age: row.age != null ? String(row.age) : '',
          blood_type: row.blood_type ?? '',
        })
      } else {
        setForm({
          name: '',
          birthday: '',
          gender: '',
          age: '',
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
    const ageNum = form.age.trim() === '' ? null : parseInt(form.age, 10)

    if (form.age.trim() !== '' && (ageNum === null || Number.isNaN(ageNum) || ageNum < 0 || ageNum > 150)) {
      setMessage({ type: 'error', text: 'age must be a number between 0 and 150' })
      return
    }

    setSaving(true)

    const { error: patientInfoError } = await supabase
      .from('patient_info')
      .upsert(
        {
          id: user.id,
          name: trimmedName || null,
          birthday: form.birthday || null,
          gender: form.gender.trim() || null,
          age: ageNum,
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

      <div className="flex-1 min-w-0">
        <header className="pd-header">
          <div className="pd-header-left">
            <h1 className="pd-header-title">Your information</h1>
            <span className="pd-header-patient">{displayName}</span>
          </div>

          <div className="pd-header-actions">
            <div className="pd-profile-wrap">
              <button
                type="button"
                className="pd-profile-btn"
                onClick={() => setProfileOpen((o) => !o)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <span className="pd-avatar">{displayName.slice(0, 2).toUpperCase()}</span>
                <span className="pd-profile-name">{displayName}</span>
                <span className="pd-chevron">v</span>
              </button>

              {profileOpen && (
                <div className="pd-dropdown" role="menu">
                  <Link to="/" className="pd-dropdown-item">Home</Link>
                  <Link to="/dashboard/patient" className="pd-dropdown-item">Dashboard</Link>
                  <button
                    type="button"
                    className="pd-dropdown-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="pd-main">
          <div className="pd-grid">
            <section className="pd-card">
              <h2 className="pd-card-title">Personal details</h2>
              <p className="pd-card-desc">
                View and update your information. Only you can see and edit this.
              </p>

              {loading ? (
                <p className="pd-empty">Loading...</p>
              ) : (
                <form className="pd-form" onSubmit={handleSubmit}>
                  <div className="pd-form-row">
                    <label htmlFor="pi-name">Name</label>
                    <input
                      id="pi-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>

                  <div className="pd-form-row">
                    <label htmlFor="pi-birthday">Birthday</label>
                    <input
                      id="pi-birthday"
                      type="date"
                      value={form.birthday}
                      onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
                    />
                  </div>

                  <div className="pd-form-row">
                    <label htmlFor="pi-gender">Gender</label>
                    <input
                      id="pi-gender"
                      type="text"
                      value={form.gender}
                      onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                      placeholder="Gender"
                    />
                  </div>

                  <div className="pd-form-row">
                    <label htmlFor="pi-age">Age</label>
                    <input
                      id="pi-age"
                      type="number"
                      min={0}
                      max={150}
                      value={form.age}
                      onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                      placeholder="Age"
                    />
                  </div>

                  <div className="pd-form-row">
                    <label htmlFor="pi-blood_type">Blood type</label>
                    <select
                      id="pi-blood_type"
                      value={form.blood_type}
                      onChange={(e) => setForm((f) => ({ ...f, blood_type: e.target.value }))}
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
                    <p className={message.type === 'error' ? 'pd-alert pd-alert-warning' : 'pd-card-desc'}>
                      {message.text}
                    </p>
                  )}

                  <div className="pd-form-actions">
                    <button type="submit" className="pd-btn pd-btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  </SidebarProvider>
)
}