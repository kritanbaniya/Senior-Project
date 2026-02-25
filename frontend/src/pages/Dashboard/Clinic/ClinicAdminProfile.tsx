// clinic admin profile setup form (state 1 of the three-state flow).
//
// this component is rendered by ClinicADashBoard when the logged-in clinic
// admin has no row in the public.clinic_admin table yet. it collects the
// admin's name, phone number, and title/position.
//
// it owns its own local form state but does NOT call supabase directly.
// on submit it passes the form data up to the orchestrator via the onSubmit
// prop, which handles the actual upsert into public.clinic_admin.
//
// once the orchestrator confirms the save succeeded, it updates its adminRow
// state which causes the dashboard to transition to state 2 (ClinicCreation).
//
// props received from ClinicADashBoard:
//   initialName - pre-filled from profile.full_name in AuthContext
//   saving      - disables the submit button while the orchestrator is writing
//   message     - success/error feedback from the orchestrator's upsert
//   onSubmit    - callback that receives the AdminFormData for the orchestrator to persist

import { useState } from 'react'
import { ADMIN_TITLES } from './ClinicADashBoard'

// shape of the form data passed to the orchestrator's handleAdminProfileSubmit.
// matches the non-id columns of public.clinic_admin (minus clinic_created which
// the orchestrator sets to false on initial profile creation).
export type AdminFormData = {
  name: string
  phone: string
  title: string
}

interface ClinicAdminProfileProps {
  initialName: string
  saving: boolean
  message: { type: 'success' | 'error'; text: string } | null
  onSubmit: (form: AdminFormData) => void
}

// renders the admin profile card with name, phone, and title fields.
// initialName is used only once to seed the form state on first render.
// the form is self-contained; changes don't propagate until the user submits.
export default function ClinicAdminProfile({ initialName, saving, message, onSubmit }: ClinicAdminProfileProps) {
  const [form, setForm] = useState<AdminFormData>({
    name: initialName,
    phone: '',
    title: '',
  })

  // prevents default form submission, then delegates to the orchestrator's
  // handleAdminProfileSubmit which handles validation and the supabase upsert.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <section className="pd-card">
      <h2 className="pd-card-title">Set up your admin profile</h2>
      <p className="pd-card-desc">Before creating a clinic you need to complete your admin profile.</p>
      <form className="pd-form" onSubmit={handleSubmit}>
        <div className="pd-form-row">
          <label htmlFor="ca-name">Name</label>
          <input
            id="ca-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Full name"
            required
          />
        </div>
        <div className="pd-form-row">
          <label htmlFor="ca-phone">Phone</label>
          <input
            id="ca-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Contact phone number"
          />
        </div>
        <div className="pd-form-row">
          <label htmlFor="ca-title">Title / Position</label>
          <select
            id="ca-title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          >
            <option value="">Select</option>
            {ADMIN_TITLES.map((t) => (
              <option key={t} value={t}>{t}</option>
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
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </form>
    </section>
  )
}
