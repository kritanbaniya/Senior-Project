// overview tab for the clinic admin dashboard.
//
// shows the admin's profile info (name, phone, title) from public.clinic_admin.
// if no row exists yet (first login), shows a setup form.
// once a row exists, displays the info in view mode with an edit toggle.

import { useState, useEffect } from 'react'
import { useClinicDashboard, ADMIN_TITLES } from './ClinicADashBoard'
import type { AdminFormData } from './ClinicADashBoard'

export default function ClinicOverview() {
  const {
    adminRow,
    loading,
    saving,
    message,
    setMessage,
    handleAdminProfileSubmit,
    handleAdminProfileUpdate,
  } = useClinicDashboard()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<AdminFormData>({ name: '', phone: '', title: '' })

  // sync form state when adminRow loads or changes
  useEffect(() => {
    if (adminRow) {
      setForm({
        name: adminRow.name ?? '',
        phone: adminRow.phone ?? '',
        title: adminRow.title ?? '',
      })
    }
  }, [adminRow])

  // clear the layout-level message when navigating away from edit mode
  const cancelEdit = () => {
    setEditing(false)
    setMessage(null)
    if (adminRow) {
      setForm({
        name: adminRow.name ?? '',
        phone: adminRow.phone ?? '',
        title: adminRow.title ?? '',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (adminRow) {
      await handleAdminProfileUpdate(form)
      setEditing(false)
    } else {
      await handleAdminProfileSubmit(form)
    }
  }

  if (loading) {
    return <p className="pd-empty">Loading...</p>
  }

  // first-time setup: no clinic_admin row exists yet
  if (!adminRow) {
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

  // edit mode
  if (editing) {
    return (
      <section className="pd-card">
        <h2 className="pd-card-title">Edit your profile</h2>
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

  // view mode
  return (
    <section className="pd-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="pd-card-title">Your Profile</h2>
        <button
          type="button"
          className="pd-btn"
          onClick={() => { setMessage(null); setEditing(true) }}
        >
          Edit
        </button>
      </div>
      <div className="pd-overview-grid">
        <div className="pd-overview-item">
          <span className="pd-overview-label">Name</span>
          <span className="pd-overview-value">{adminRow.name ?? '-'}</span>
        </div>
        <div className="pd-overview-item">
          <span className="pd-overview-label">Phone</span>
          <span className="pd-overview-value">{adminRow.phone ?? '-'}</span>
        </div>
        <div className="pd-overview-item">
          <span className="pd-overview-label">Title / Position</span>
          <span className="pd-overview-value">{adminRow.title ?? '-'}</span>
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
