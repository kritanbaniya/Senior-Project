// clinic creation form (state 2 of the three-state flow).
//
// this component is rendered by ClinicADashBoard when the admin's profile
// exists in public.clinic_admin but clinic_created is still false, meaning
// they have not yet initialized their clinic.
//
// it collects all the information needed to create a row in public.clinics:
// clinic name, specialty, phone, email, full address, website, and description.
//
// it owns its own local form state but does NOT call supabase directly.
// on submit it passes the form data up to the orchestrator via the onSubmit
// prop. the orchestrator then:
//   1. inserts a new row into public.clinics (which generates the clinic_id)
//   2. updates public.clinic_admin.clinic_created to true
//   3. transitions the dashboard to state 3 (ClinicManagement)
//
// imports SPECIALTIES from the orchestrator for the dropdown options.
//
// props received from ClinicADashBoard:
//   saving  - disables the submit button while the orchestrator is writing
//   message - success/error feedback from the orchestrator's insert
//   onSubmit - callback that receives the ClinicFormData for the orchestrator to persist

import { useState } from 'react'
import { SPECIALTIES } from './ClinicADashBoard'
import ClinicAddressAutocompleteSection from './ClinicAddressAutocompleteSection'
import type { ClinicFormData } from './clinicFormTypes'

// shape of the form data passed to the orchestrator's handleClinicCreateSubmit.
// maps to the insertable columns of public.clinics (minus admin_id, clinic_id,
// approved, and created_at which are set by the orchestrator or supabase defaults).
export type { ClinicFormData } from './clinicFormTypes'

interface ClinicCreationProps {
  saving: boolean
  message: { type: 'success' | 'error'; text: string } | null
  onSubmit: (form: ClinicFormData) => void
}

// renders the clinic creation card with fields for all clinic details.
// all fields start empty. required fields use the html required attribute
// for basic browser validation; the orchestrator does additional checks.
export default function ClinicCreation({ saving, message, onSubmit }: ClinicCreationProps) {
  const [form, setForm] = useState<ClinicFormData>({
    clinic_name: '',
    specialty: '',
    phone: '',
    email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: 'NY',
    zip_code: '',
    website: '',
    description: '',
  })

  // prevents default form submission, then delegates to the orchestrator's
  // handleClinicCreateSubmit which validates, inserts into public.clinics,
  // and flips clinic_created to true in public.clinic_admin.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <section className="pd-card">
      <h2 className="pd-card-title">Create your clinic</h2>
      <p className="pd-card-desc">Fill in the details below to initialize your clinic. You can create one clinic per account.</p>
      <form className="pd-form" onSubmit={handleSubmit}>
        <div className="pd-form-row">
          <label htmlFor="cl-name">Clinic name</label>
          <input
            id="cl-name"
            type="text"
            value={form.clinic_name}
            onChange={(e) => setForm((f) => ({ ...f, clinic_name: e.target.value }))}
            placeholder="Your clinic's name"
            required
          />
        </div>
        <div className="pd-form-row">
          <label htmlFor="cl-specialty">Specialty</label>
          <select
            id="cl-specialty"
            value={form.specialty}
            onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
            required
          >
            <option value="">Select specialty</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="pd-form-row">
          <label htmlFor="cl-phone">Clinic phone</label>
          <input
            id="cl-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Clinic phone number"
            required
          />
        </div>
        <div className="pd-form-row">
          <label htmlFor="cl-email">Clinic email</label>
          <input
            id="cl-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="contact@yourclinic.com"
          />
        </div>
        <ClinicAddressAutocompleteSection form={form} setForm={setForm} disabled={saving} />
        <div className="pd-form-row">
          <label htmlFor="cl-website">Website</label>
          <input
            id="cl-website"
            type="url"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            placeholder="https://yourclinic.com (optional)"
          />
        </div>
        <div className="pd-form-row">
          <label htmlFor="cl-desc">Description</label>
          <textarea
            id="cl-desc"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description patients will see (optional)"
            rows={3}
          />
        </div>
        {message && (
          <p className={message.type === 'error' ? 'pd-alert pd-alert-warning' : 'pd-card-desc'}>
            {message.text}
          </p>
        )}
        <div className="pd-form-actions">
          <button type="submit" className="pd-btn pd-btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create clinic'}
          </button>
        </div>
      </form>
    </section>
  )
}
