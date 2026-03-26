// "my clinic" tab for the clinic admin dashboard.
//
// three sub-states:
//   1. no clinics row         -> renders ClinicCreation form
//   2. clinic exists, pending -> read-only summary with pending badge
//   3. clinic exists, approved -> view mode with edit toggle

import { useState, useEffect } from 'react'
import { useClinicDashboard, SPECIALTIES, US_STATES } from './ClinicADashBoard'
import ClinicCreation from './ClinicCreation'
import type { ClinicFormData } from './ClinicCreation'

export default function ClinicMyClinic() {
  const {
    clinicRow,
    loading,
    saving,
    message,
    setMessage,
    handleClinicCreateSubmit,
    handleClinicUpdate,
  } = useClinicDashboard()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ClinicFormData>({
    clinic_name: '',
    specialty: '',
    phone: '',
    email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    website: '',
    description: '',
  })

  // sync form when clinicRow loads or changes
  useEffect(() => {
    if (clinicRow) {
      setForm({
        clinic_name: clinicRow.clinic_name,
        specialty: clinicRow.specialty ?? '',
        phone: clinicRow.phone ?? '',
        email: clinicRow.email ?? '',
        address_line1: clinicRow.address_line1 ?? '',
        address_line2: clinicRow.address_line2 ?? '',
        city: clinicRow.city ?? '',
        state: clinicRow.state ?? '',
        zip_code: clinicRow.zip_code ?? '',
        website: clinicRow.website ?? '',
        description: clinicRow.description ?? '',
      })
    }
  }, [clinicRow])

  const cancelEdit = () => {
    setEditing(false)
    setMessage(null)
    if (clinicRow) {
      setForm({
        clinic_name: clinicRow.clinic_name,
        specialty: clinicRow.specialty ?? '',
        phone: clinicRow.phone ?? '',
        email: clinicRow.email ?? '',
        address_line1: clinicRow.address_line1 ?? '',
        address_line2: clinicRow.address_line2 ?? '',
        city: clinicRow.city ?? '',
        state: clinicRow.state ?? '',
        zip_code: clinicRow.zip_code ?? '',
        website: clinicRow.website ?? '',
        description: clinicRow.description ?? '',
      })
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleClinicUpdate(form)
    setEditing(false)
  }

  if (loading) {
    return <p className="pd-empty">Loading...</p>
  }

  // sub-state 1: no clinic row -- show creation form
  if (!clinicRow) {
    return (
      <ClinicCreation
        saving={saving}
        message={message}
        onSubmit={handleClinicCreateSubmit}
      />
    )
  }

  // sub-state 2: clinic exists but not approved
  if (!clinicRow.approved) {
    return (
      <section className="pd-card">
        <h2 className="pd-card-title">{clinicRow.clinic_name}</h2>
        <div className="pd-alert pd-alert-info" style={{ marginBottom: '1rem' }}>
          Your clinic is pending approval. A system administrator will review and approve it.
        </div>
        <p className="pd-card-desc">Here is what you submitted:</p>
        <div className="pd-overview-grid">
          <div className="pd-overview-item">
            <span className="pd-overview-label">Specialty</span>
            <span className="pd-overview-value">{clinicRow.specialty ?? '-'}</span>
          </div>
          <div className="pd-overview-item">
            <span className="pd-overview-label">Phone</span>
            <span className="pd-overview-value">{clinicRow.phone ?? '-'}</span>
          </div>
          <div className="pd-overview-item">
            <span className="pd-overview-label">Email</span>
            <span className="pd-overview-value">{clinicRow.email ?? '-'}</span>
          </div>
          <div className="pd-overview-item">
            <span className="pd-overview-label">Address</span>
            <span className="pd-overview-value">
              {[clinicRow.address_line1, clinicRow.address_line2].filter(Boolean).join(', ')}
            </span>
          </div>
          <div className="pd-overview-item">
            <span className="pd-overview-label">City / State / Zip</span>
            <span className="pd-overview-value">
              {[clinicRow.city, clinicRow.state, clinicRow.zip_code].filter(Boolean).join(', ')}
            </span>
          </div>
          {clinicRow.website && (
            <div className="pd-overview-item">
              <span className="pd-overview-label">Website</span>
              <span className="pd-overview-value">{clinicRow.website}</span>
            </div>
          )}
          {clinicRow.description && (
            <div className="pd-overview-item">
              <span className="pd-overview-label">Description</span>
              <span className="pd-overview-value">{clinicRow.description}</span>
            </div>
          )}
        </div>
      </section>
    )
  }

  // sub-state 3: clinic is approved -- edit mode
  if (editing) {
    return (
      <section className="pd-card">
        <h2 className="pd-card-title">Edit clinic details</h2>
        <form className="pd-form" onSubmit={handleUpdateSubmit}>
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
          <div className="pd-form-row">
            <label htmlFor="cl-addr1">Address line 1</label>
            <input
              id="cl-addr1"
              type="text"
              value={form.address_line1}
              onChange={(e) => setForm((f) => ({ ...f, address_line1: e.target.value }))}
              placeholder="Street address"
              required
            />
          </div>
          <div className="pd-form-row">
            <label htmlFor="cl-addr2">Address line 2</label>
            <input
              id="cl-addr2"
              type="text"
              value={form.address_line2}
              onChange={(e) => setForm((f) => ({ ...f, address_line2: e.target.value }))}
              placeholder="Suite, floor, unit (optional)"
            />
          </div>
          <div className="pd-form-row">
            <label htmlFor="cl-city">City</label>
            <input
              id="cl-city"
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="City"
              required
            />
          </div>
          <div className="pd-form-row">
            <label htmlFor="cl-state">State</label>
            <select
              id="cl-state"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              required
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="pd-form-row">
            <label htmlFor="cl-zip">Zip code</label>
            <input
              id="cl-zip"
              type="text"
              value={form.zip_code}
              onChange={(e) => setForm((f) => ({ ...f, zip_code: e.target.value }))}
              placeholder="Zip code"
              required
            />
          </div>
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
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" className="pd-btn" onClick={cancelEdit} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    )
  }

  // sub-state 3: clinic is approved -- view mode
  return (
    <section className="pd-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="pd-card-title">{clinicRow.clinic_name}</h2>
        <button
          type="button"
          className="pd-btn"
          onClick={() => { setMessage(null); setEditing(true) }}
        >
          Edit
        </button>
      </div>
      <p className="pd-card-desc">Your clinic is approved and active.</p>
      <div className="pd-overview-grid">
        <div className="pd-overview-item">
          <span className="pd-overview-label">Clinic ID</span>
          <span className="pd-overview-value pd-mono">{clinicRow.clinic_id}</span>
        </div>
        <div className="pd-overview-item">
          <span className="pd-overview-label">Specialty</span>
          <span className="pd-overview-value">{clinicRow.specialty ?? '-'}</span>
        </div>
        <div className="pd-overview-item">
          <span className="pd-overview-label">Phone</span>
          <span className="pd-overview-value">{clinicRow.phone ?? '-'}</span>
        </div>
        <div className="pd-overview-item">
          <span className="pd-overview-label">Email</span>
          <span className="pd-overview-value">{clinicRow.email ?? '-'}</span>
        </div>
        <div className="pd-overview-item">
          <span className="pd-overview-label">Address</span>
          <span className="pd-overview-value">
            {[clinicRow.address_line1, clinicRow.address_line2].filter(Boolean).join(', ') || '-'}
          </span>
        </div>
        <div className="pd-overview-item">
          <span className="pd-overview-label">City / State / Zip</span>
          <span className="pd-overview-value">
            {[clinicRow.city, clinicRow.state, clinicRow.zip_code].filter(Boolean).join(', ') || '-'}
          </span>
        </div>
        {clinicRow.website && (
          <div className="pd-overview-item">
            <span className="pd-overview-label">Website</span>
            <span className="pd-overview-value">{clinicRow.website}</span>
          </div>
        )}
        {clinicRow.description && (
          <div className="pd-overview-item">
            <span className="pd-overview-label">Description</span>
            <span className="pd-overview-value">{clinicRow.description}</span>
          </div>
        )}
        <div className="pd-overview-item">
          <span className="pd-overview-label">Status</span>
          <span className="pd-overview-value pd-status-badge">Approved</span>
        </div>
      </div>
      {message && (
        <p className={message.type === 'error' ? 'pd-alert pd-alert-warning' : 'pd-card-desc'} style={{ marginTop: '1rem' }}>
          {message.text}
        </p>
      )}
    </section>
  )
}
