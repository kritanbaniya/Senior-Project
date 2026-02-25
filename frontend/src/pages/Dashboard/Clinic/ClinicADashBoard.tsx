// clinic admin dashboard orchestrator.
//
// this is the top-level page component for the /dashboard/clinic route.
// it is rendered inside DashboardGuard + RoleGuard (allowedRole="clinic")
// in App.tsx, so the user is guaranteed to be an authenticated clinic admin
// by the time this mounts.
//
// responsibilities:
//   - fetches the user's clinic_admin row and clinics row from supabase on mount
//   - owns all shared state (loading, saving, message, adminRow, clinicRow)
//   - contains the two supabase mutation handlers (profile upsert, clinic insert)
//   - renders the shared sidebar + header layout used across all states
//   - determines which child component to render based on the three-state flow:
//       state 1 (no admin profile)  -> ClinicAdminProfile
//       state 2 (no clinic yet)     -> ClinicCreation
//       state 3 (clinic exists)     -> ClinicManagement
//
// child components never call supabase directly; they receive callbacks via props
// so all database logic stays centralized here.
//
// exports shared types (ClinicAdminRow, ClinicRow) and constants (SPECIALTIES,
// ADMIN_TITLES, US_STATES) that the child components import.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import ClinicAdminProfile from './ClinicAdminProfile'
import ClinicCreation from './ClinicCreation'
import ClinicManagement from './ClinicManagement'
import type { AdminFormData } from './ClinicAdminProfile'
import type { ClinicFormData } from './ClinicCreation'

// mirrors the public.clinic_admin table schema. the id column is the user's
// auth.users uuid. clinic_created flips to true after the admin creates a clinic.
export type ClinicAdminRow = {
  id: string
  name: string | null
  phone: string | null
  title: string | null
  clinic_created: boolean
}

// mirrors the public.clinics table schema. clinic_id is the auto-generated uuid
// primary key. admin_id references auth.users and has a unique constraint so each
// admin can only own one clinic. approved defaults to false and is flipped by a
// system admin (or manually in supabase for now).
export type ClinicRow = {
  clinic_id: string
  admin_id: string
  clinic_name: string
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  phone: string | null
  email: string | null
  website: string | null
  specialty: string | null
  description: string | null
  approved: boolean
  created_at: string
}

// dropdown options shared with child components via named exports.
// ClinicCreation imports SPECIALTIES and US_STATES; ClinicAdminProfile imports ADMIN_TITLES.
export const SPECIALTIES = [
  'General Practice',
  'Pediatrics',
  'Dermatology',
  'Orthopedics',
  'Cardiology',
  'Dentistry',
  'Ophthalmology',
  'Psychiatry',
  'Urgent Care',
  'Other',
]

export const ADMIN_TITLES = [
  'Owner',
  'Administrator',
  'Office Manager',
  'Practice Manager',
  'Other',
]

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

// main orchestrator component. mounted at /dashboard/clinic by App.tsx via
// <RoleGuard allowedRole="clinic">. reads auth profile from AuthContext for
// the display name, then manages all data loading, mutations, and state routing.
export default function ClinicADashBoard() {
  const { profile } = useAuth()
  const displayName = profile?.full_name?.trim() || 'Admin'

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // core data rows fetched from supabase. null means the row doesn't exist yet.
  // adminRow drives state 1 vs 2; clinicRow + approved drives state 3a vs 3b.
  const [adminRow, setAdminRow] = useState<ClinicAdminRow | null>(null)
  const [clinicRow, setClinicRow] = useState<ClinicRow | null>(null)

  // runs once on mount. fires two parallel queries against supabase using the
  // anon key (secured by rls so each user can only see their own rows).
  // maybeSingle() returns null instead of erroring when no row exists.
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const [adminRes, clinicRes] = await Promise.all([
        supabase
          .from('clinic_admin')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('clinics')
          .select('*')
          .eq('admin_id', user.id)
          .maybeSingle(),
      ])

      if (!adminRes.error && adminRes.data) {
        setAdminRow(adminRes.data as ClinicAdminRow)
      }
      if (!clinicRes.error && clinicRes.data) {
        setClinicRow(clinicRes.data as ClinicRow)
      }

      setLoading(false)
    }
    void load()
  }, [])

  // callback passed to ClinicAdminProfile as onSubmit. receives the admin's
  // form data, validates it, and upserts a row into public.clinic_admin with
  // clinic_created = false. on success it updates adminRow locally which causes
  // renderContent to switch from state 1 (profile form) to state 2 (clinic form).
  const handleAdminProfileSubmit = async (form: AdminFormData) => {
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage({ type: 'error', text: 'not logged in' })
      return
    }

    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'name is required' })
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('clinic_admin')
      .upsert(
        {
          id: user.id,
          name: form.name.trim() || null,
          phone: form.phone.trim() || null,
          title: form.title || null,
          clinic_created: false,
        },
        { onConflict: 'id' },
      )

    setSaving(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    const newRow: ClinicAdminRow = {
      id: user.id,
      name: form.name.trim() || null,
      phone: form.phone.trim() || null,
      title: form.title || null,
      clinic_created: false,
    }
    setAdminRow(newRow)
    setMessage({ type: 'success', text: 'profile saved' })
  }

  // callback passed to ClinicCreation as onSubmit. receives the clinic form data,
  // validates required fields, then performs two sequential supabase calls:
  //   1. insert into public.clinics -> returns the new row with clinic_id
  //   2. update public.clinic_admin set clinic_created = true
  // on success it updates both clinicRow and adminRow locally which causes
  // renderContent to switch from state 2 (clinic form) to state 3 (management).
  const handleClinicCreateSubmit = async (form: ClinicFormData) => {
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage({ type: 'error', text: 'not logged in' })
      return
    }

    if (!form.clinic_name.trim()) {
      setMessage({ type: 'error', text: 'clinic name is required' })
      return
    }
    if (!form.specialty) {
      setMessage({ type: 'error', text: 'specialty is required' })
      return
    }
    if (!form.phone.trim()) {
      setMessage({ type: 'error', text: 'clinic phone is required' })
      return
    }
    if (!form.address_line1.trim()) {
      setMessage({ type: 'error', text: 'address is required' })
      return
    }
    if (!form.city.trim()) {
      setMessage({ type: 'error', text: 'city is required' })
      return
    }
    if (!form.state) {
      setMessage({ type: 'error', text: 'state is required' })
      return
    }
    if (!form.zip_code.trim()) {
      setMessage({ type: 'error', text: 'zip code is required' })
      return
    }

    setSaving(true)

    const { data: insertedClinic, error: insertError } = await supabase
      .from('clinics')
      .insert({
        admin_id: user.id,
        clinic_name: form.clinic_name.trim(),
        specialty: form.specialty,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address_line1: form.address_line1.trim() || null,
        address_line2: form.address_line2.trim() || null,
        city: form.city.trim() || null,
        state: form.state || null,
        zip_code: form.zip_code.trim() || null,
        website: form.website.trim() || null,
        description: form.description.trim() || null,
      })
      .select()
      .single()

    if (insertError) {
      setSaving(false)
      setMessage({ type: 'error', text: insertError.message })
      return
    }

    const { error: updateError } = await supabase
      .from('clinic_admin')
      .update({ clinic_created: true })
      .eq('id', user.id)

    setSaving(false)

    if (updateError) {
      setMessage({ type: 'error', text: updateError.message })
      return
    }

    setClinicRow(insertedClinic as ClinicRow)
    setAdminRow((prev) => prev ? { ...prev, clinic_created: true } : prev)
    setMessage({ type: 'success', text: 'clinic created successfully' })
  }

  // state router. checks adminRow and clinicRow to decide which child to render.
  // the order of checks mirrors the three-state flow:
  //   no adminRow          -> ClinicAdminProfile (state 1)
  //   clinic_created=false -> ClinicCreation (state 2)
  //   clinicRow exists     -> ClinicManagement (state 3, handles 3a/3b internally)
  const renderContent = () => {
    if (loading) {
      return <p className="pd-empty">Loading...</p>
    }
    if (!adminRow) {
      return (
        <ClinicAdminProfile
          initialName={profile?.full_name?.trim() || ''}
          saving={saving}
          message={message}
          onSubmit={handleAdminProfileSubmit}
        />
      )
    }
    if (!adminRow.clinic_created) {
      return (
        <ClinicCreation
          saving={saving}
          message={message}
          onSubmit={handleClinicCreateSubmit}
        />
      )
    }
    if (clinicRow) {
      return <ClinicManagement clinicRow={clinicRow} />
    }
    return <p className="pd-empty">Loading clinic data...</p>
  }

  return (
    <div className="pd-layout">
      <aside className={`pd-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="pd-sidebar-header">
          <Link to="/" className="pd-sidebar-logo"><span>ClinicIQ</span></Link>
          <button type="button" className="pd-sidebar-toggle" onClick={() => setSidebarCollapsed((c) => !c)} aria-label="Toggle sidebar">
            {sidebarCollapsed ? '->' : '<-'}
          </button>
        </div>
        <nav className="pd-nav">
          <Link to="/dashboard/clinic" className="pd-nav-item active">Overview</Link>
          <span className="pd-nav-item" style={{ opacity: adminRow?.clinic_created ? 1 : 0.4 }}>Queue Management</span>
          <span className="pd-nav-item" style={{ opacity: adminRow?.clinic_created ? 1 : 0.4 }}>Staff</span>
          <span className="pd-nav-item" style={{ opacity: adminRow?.clinic_created ? 1 : 0.4 }}>Settings</span>
        </nav>
      </aside>

      <div className="pd-right">
        <header className="pd-header">
          <div className="pd-header-left">
            <h1 className="pd-header-title">Clinic Admin Dashboard</h1>
            <span className="pd-header-patient">{displayName}</span>
          </div>
          <div className="pd-header-actions">
            <div className="pd-profile-wrap">
              <button type="button" className="pd-profile-btn" onClick={() => setProfileOpen((o) => !o)} aria-expanded={profileOpen} aria-haspopup="true">
                <span className="pd-avatar">{displayName.slice(0, 2).toUpperCase()}</span>
                <span className="pd-profile-name">{displayName}</span>
                <span className="pd-chevron">v</span>
              </button>
              {profileOpen && (
                <div className="pd-dropdown" role="menu">
                  <Link to="/" className="pd-dropdown-item">Home</Link>
                  <Link to="/dashboard/clinic" className="pd-dropdown-item">Dashboard</Link>
                  <button type="button" className="pd-dropdown-item" onClick={() => setProfileOpen(false)}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="pd-main">
          <div className="pd-grid">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}
