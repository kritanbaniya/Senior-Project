import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'

type DoctorInfoRow = {
  id: string
  name: string | null
  birthday: string | null
  license_num: number | null
  phone: number | null
  specialization: string | null
  npi_number: string | null
}

export default function DoctorInformation() {
  const { profile } = useAuth()
  const displayName = profile?.full_name?.trim() || 'Doctor'
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({
    name: '',
    birthday: '',
    license_num: '',
    phone: '',
    specialization: '',
    npi_number: '',
  })

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('doctor_info')
        .select('id, name, birthday, license_num, phone, specialization, npi_number')
        .eq('id', user.id)
        .maybeSingle()

      if (!error && data) {
        const row = data as DoctorInfoRow
        setForm({
          name: row.name ?? '',
          birthday: row.birthday ?? '',
          license_num: row.license_num != null ? String(row.license_num) : '',
          phone: row.phone != null ? String(row.phone) : '',
          specialization: row.specialization ?? '',
          npi_number: row.npi_number ?? '',
        })
      } else {
        setForm({
          name: '',
          birthday: '',
          license_num: '',
          phone: '',
          specialization: '',
          npi_number: '',
        })
      }
      setLoading(false)
    }
    void load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setMessage({ type: 'error', text: 'not logged in' })
      return
    }
    setSaving(true)

    const licenseRaw = form.license_num.trim()
    const phoneRaw = form.phone.trim()
    const npiRaw = form.npi_number.trim()

    if (licenseRaw === '') {
      setMessage({ type: 'error', text: 'medical license number is required' })
      setSaving(false)
      return
    }

    if (!/^\d+$/.test(licenseRaw)) {
      setMessage({ type: 'error', text: 'license number must contain digits only' })
      setSaving(false)
      return
    }

    if (phoneRaw === '' || !/^\d{7,15}$/.test(phoneRaw)) {
      setMessage({ type: 'error', text: 'phone must be 7–15 digits' })
      setSaving(false)
      return
    }

    if (npiRaw !== '' && !/^\d{10}$/.test(npiRaw)) {
      setMessage({ type: 'error', text: 'NPI number must be exactly 10 digits' })
      setSaving(false)
      return
    }

    const licenseNum = parseInt(licenseRaw, 10)
    const phoneNum = parseInt(phoneRaw, 10)

    const { error } = await supabase
      .from('doctor_info')
      .upsert(
        {
          id: user.id,
          name: form.name.trim() || null,
          birthday: form.birthday || null,
          license_num: licenseNum,
          phone: phoneNum,
          specialization: form.specialization.trim() || null,
          npi_number: npiRaw || null,
        },
        { onConflict: 'id' }
      )

    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }
    setMessage({ type: 'success', text: 'saved' })
  }

  return (
    <div className="pd-layout">
      <aside className={`pd-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="pd-sidebar-header">
          <Link to="/" className="pd-sidebar-logo">
            <span>ClinicIQ</span>
          </Link>
          <button
            type="button"
            className="pd-sidebar-toggle"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? '->' : '<-'}
          </button>
        </div>
        <nav className="pd-nav">
          <Link to="/dashboard/doctor" className="pd-nav-item">
            Overview
          </Link>
          <Link to="/dashboard/doctor/information" className="pd-nav-item active">
            Your information
          </Link>
          <Link to="/clinic" className="pd-nav-item">
            Clinic info
          </Link>
        </nav>
      </aside>

      <div className="pd-right">
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
                  <Link to="/" className="pd-dropdown-item">
                    Home
                  </Link>
                  <Link to="/dashboard/doctor" className="pd-dropdown-item">
                    Dashboard
                  </Link>
                  <button type="button" className="pd-dropdown-item" onClick={() => setProfileOpen(false)}>
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
              <p className="pd-card-desc">View and update your information. Only you can see and edit this.</p>
              {loading ? (
                <p className="pd-empty">Loading...</p>
              ) : (
                <form className="pd-form" onSubmit={handleSubmit}>
                  <div className="pd-form-row">
                    <label htmlFor="di-name">Name</label>
                    <input
                      id="di-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="pd-form-row">
                    <label htmlFor="di-birthday">Birthday</label>
                    <input
                      id="di-birthday"
                      type="date"
                      value={form.birthday}
                      onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
                    />
                  </div>
                  <div className="pd-form-row">
                    <label htmlFor="di-license_num">Medical license number</label>
                    <input
                      id="di-license_num"
                      type="text"
                      inputMode="numeric"
                      value={form.license_num}
                      onChange={(e) => setForm((f) => ({ ...f, license_num: e.target.value }))}
                      placeholder="Medical license number"
                    />
                  </div>
                  <div className="pd-form-row">
                    <label htmlFor="di-npi_number">NPI number (optional)</label>
                    <input
                      id="di-npi_number"
                      type="text"
                      inputMode="numeric"
                      value={form.npi_number}
                      onChange={(e) => setForm((f) => ({ ...f, npi_number: e.target.value }))}
                      placeholder="10-digit NPI number"
                    />
                  </div>
                  <div className="pd-form-row">
                    <label htmlFor="di-specialization">Specialization</label>
                    <input
                      id="di-specialization"
                      type="text"
                      value={form.specialization}
                      onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
                      placeholder="e.g., Family Medicine, Cardiology"
                    />
                  </div>
                  <div className="pd-form-row">
                    <label htmlFor="di-phone">Phone</label>
                    <input
                      id="di-phone"
                      type="text"
                      inputMode="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="7–15 digits"
                    />
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
  )
}