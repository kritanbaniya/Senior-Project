// clinic admin dashboard layout.
//
// this is the layout route component for /dashboard/clinic. it wraps the
// sidebar, header, and an <Outlet /> that renders the active tab component
// (ClinicOverview or ClinicMyClinic).
//
// responsibilities:
//   - fetches the user's clinic_admin row and clinics row from supabase on mount
//   - owns all shared state (loading, saving, message, adminRow, clinicRow)
//   - contains all supabase mutation handlers (profile upsert/update, clinic insert/update)
//   - passes state and handlers to child routes via outlet context
//
// child components consume context via the exported useClinicDashboard() hook.

import { useState, useEffect } from 'react'
import { Link, Outlet, useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { fetchGooglePlaceAddressDetails } from '../../../lib/googlePlaces'
import { useAuth } from '../../../context/AuthContext'
import ClinicSideBar from './ClinicSideBar'
import type { ClinicFormData } from './clinicFormTypes'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export type AdminFormData = {
  name: string
  phone: string
  title: string
}

export type ClinicAdminRow = {
  id: string
  name: string | null
  phone: string | null
  title: string | null
  clinic_created: boolean
}

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
  google_place_id: string | null
  latitude: number | null
  longitude: number | null
  geocode_status: string | null
}

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

export type ClinicDashboardContext = {
  adminRow: ClinicAdminRow | null
  clinicRow: ClinicRow | null
  loading: boolean
  saving: boolean
  message: { type: 'success' | 'error'; text: string } | null
  setMessage: (m: { type: 'success' | 'error'; text: string } | null) => void
  handleAdminProfileSubmit: (form: AdminFormData) => Promise<void>
  handleAdminProfileUpdate: (form: AdminFormData) => Promise<void>
  handleClinicCreateSubmit: (form: ClinicFormData) => Promise<boolean>
  handleClinicUpdate: (form: ClinicFormData) => Promise<boolean>
}

export function useClinicDashboard() {
  return useOutletContext<ClinicDashboardContext>()
}

function clinicAddressMatchesForm(row: ClinicRow, form: ClinicFormData): boolean {
  return (
    (form.address_line1.trim() || '') === (row.address_line1?.trim() ?? '') &&
    (form.address_line2.trim() || '') === (row.address_line2?.trim() ?? '') &&
    (form.city.trim() || '') === (row.city?.trim() ?? '') &&
    (form.state || '') === (row.state ?? '') &&
    (form.zip_code.trim() || '') === (row.zip_code?.trim() ?? '')
  )
}

function coordsGeocodedOk(row: ClinicRow): boolean {
  return (
    row.latitude != null &&
    row.longitude != null &&
    row.geocode_status === 'ok' &&
    !!row.google_place_id?.trim()
  )
}

export default function ClinicADashBoard() {
  const { profile, logout } = useAuth()
  const displayName = profile?.full_name?.trim() || 'Admin'

  const [profileOpen, setProfileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [adminRow, setAdminRow] = useState<ClinicAdminRow | null>(null)
  const [clinicRow, setClinicRow] = useState<ClinicRow | null>(null)

  const resolveGooglePlaceCoords = async (placeId: string) => {
    try {
      return await fetchGooglePlaceAddressDetails(placeId)
    } catch (e) {
      const text = e instanceof Error ? e.message : ''
      if (text.includes('within new york city')) {
        throw new Error('currently only serving nyc area only')
      }
      if (text.includes('full new york city street address')) {
        throw new Error('entered address is invalid. please select a full street address from suggestions.')
      }
      throw new Error('entered address is invalid. please select a full street address from suggestions.')
    }
  }

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

  const handleAdminProfileUpdate = async (form: AdminFormData) => {
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
      .update({
        name: form.name.trim() || null,
        phone: form.phone.trim() || null,
        title: form.title || null,
      })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    setAdminRow((prev) =>
      prev
        ? {
            ...prev,
            name: form.name.trim() || null,
            phone: form.phone.trim() || null,
            title: form.title || null,
          }
        : prev,
    )

    setMessage({ type: 'success', text: 'profile updated' })
  }

  const handleClinicCreateSubmit = async (form: ClinicFormData): Promise<boolean> => {
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage({ type: 'error', text: 'not logged in' })
      return false
    }

    if (!form.clinic_name.trim()) {
      setMessage({ type: 'error', text: 'clinic name is required' })
      return false
    }
    if (!form.specialty) {
      setMessage({ type: 'error', text: 'specialty is required' })
      return false
    }
    if (!form.phone.trim()) {
      setMessage({ type: 'error', text: 'clinic phone is required' })
      return false
    }
    if (!form.address_line1.trim()) {
      setMessage({ type: 'error', text: 'address is required' })
      return false
    }
    if (!form.city.trim()) {
      setMessage({ type: 'error', text: 'city is required' })
      return false
    }
    if (!form.state) {
      setMessage({ type: 'error', text: 'state is required' })
      return false
    }
    if (!form.zip_code.trim()) {
      setMessage({ type: 'error', text: 'zip code is required' })
      return false
    }
    if (!form.google_place_id.trim()) {
      setMessage({ type: 'error', text: 'please choose an address from the dropdown suggestions.' })
      return false
    }

    setSaving(true)

    let details: Awaited<ReturnType<typeof fetchGooglePlaceAddressDetails>>
    try {
      details = await resolveGooglePlaceCoords(form.google_place_id)
    } catch (e) {
      setSaving(false)
      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'could not verify address',
      })
      return false
    }

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
        google_place_id: details.placeId,
        website: form.website.trim() || null,
        description: form.description.trim() || null,
        latitude: details.latitude,
        longitude: details.longitude,
        geocode_status: 'ok',
      })
      .select()
      .single()

    if (insertError) {
      setSaving(false)
      setMessage({ type: 'error', text: insertError.message })
      return false
    }

    const { error: updateError } = await supabase
      .from('clinic_admin')
      .update({ clinic_created: true })
      .eq('id', user.id)

    setSaving(false)

    if (updateError) {
      setMessage({ type: 'error', text: updateError.message })
      return false
    }

    setClinicRow(insertedClinic as ClinicRow)
    setAdminRow((prev) => (prev ? { ...prev, clinic_created: true } : prev))
    setMessage({ type: 'success', text: 'clinic created successfully' })
    return true
  }

  const handleClinicUpdate = async (form: ClinicFormData): Promise<boolean> => {
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage({ type: 'error', text: 'not logged in' })
      return false
    }

    if (!form.clinic_name.trim()) {
      setMessage({ type: 'error', text: 'clinic name is required' })
      return false
    }

    if (!clinicRow) {
      setMessage({ type: 'error', text: 'no clinic loaded' })
      return false
    }

    const needGeocode = !clinicAddressMatchesForm(clinicRow, form) || !coordsGeocodedOk(clinicRow)

    if (needGeocode) {
      if (!form.address_line1.trim()) {
        setMessage({ type: 'error', text: 'address is required' })
        return false
      }
      if (!form.city.trim()) {
        setMessage({ type: 'error', text: 'city is required' })
        return false
      }
      if (!form.state) {
        setMessage({ type: 'error', text: 'state is required' })
        return false
      }
      if (!form.zip_code.trim()) {
        setMessage({ type: 'error', text: 'zip code is required' })
        return false
      }
    }
    if (!form.google_place_id.trim()) {
      setMessage({ type: 'error', text: 'please choose an address from the dropdown suggestions.' })
      return false
    }

    setSaving(true)

    let details: Awaited<ReturnType<typeof fetchGooglePlaceAddressDetails>>
    try {
      details = await resolveGooglePlaceCoords(form.google_place_id)
    } catch (e) {
      setSaving(false)
      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'could not verify address',
      })
      return false
    }

    const payload = {
      clinic_name: form.clinic_name.trim(),
      specialty: form.specialty || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address_line1: form.address_line1.trim() || null,
      address_line2: form.address_line2.trim() || null,
      city: form.city.trim() || null,
      state: form.state || null,
      zip_code: form.zip_code.trim() || null,
      google_place_id: details.placeId,
      website: form.website.trim() || null,
      description: form.description.trim() || null,
      latitude: details.latitude,
      longitude: details.longitude,
      geocode_status: 'ok',
    }

    const { data: updatedClinic, error } = await supabase
      .from('clinics')
      .update(payload)
      .eq('admin_id', user.id)
      .select()
      .single()

    setSaving(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return false
    }

    setClinicRow(updatedClinic as ClinicRow)
    setMessage({ type: 'success', text: 'clinic updated' })
    return true
  }

  const ctx: ClinicDashboardContext = {
    adminRow,
    clinicRow,
    loading,
    saving,
    message,
    setMessage,
    handleAdminProfileSubmit,
    handleAdminProfileUpdate,
    handleClinicCreateSubmit,
    handleClinicUpdate,
  }

  return (
    <SidebarProvider  defaultOpen
      style={
        {
          "--sidebar-width": "15rem",
          "--sidebar-width-mobile": "10rem",
        } as React.CSSProperties
      }
    >
      <ClinicSideBar />

      <SidebarInset className="min-h-[calc(100vh-60px)]">
        <div className="flex min-h-[calc(100vh-60px)] flex-col">
          <header className="pd-header">
            <div className="pd-header-left">
              <h1 className="pd-header-title">Clinic Admin Dashboard</h1>
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
                  <span className="pd-avatar">
                    {displayName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="pd-profile-name">{displayName}</span>
                  <span className="pd-chevron">v</span>
                </button>

                {profileOpen && (
                  <div className="pd-dropdown" role="menu">
                    <Link
                      to="/"
                      className="pd-dropdown-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      Home
                    </Link>

                    <Link
                      to="/dashboard/clinic"
                      className="pd-dropdown-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      Dashboard
                    </Link>

                    <button
                      type="button"
                      className="pd-dropdown-item"
                      onClick={() => {
                        setProfileOpen(false)
                        void logout()
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="pd-main">
            {/* Stat cards — values shown in child route pages; here we show layout placeholders */}
            <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <p className="stat-label">Total Staff</p>
                <p className="stat-value">—</p>
                <p className="stat-sub">clinic members</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Active Appointments</p>
                <p className="stat-value">—</p>
                <p className="stat-sub">today</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Queue Size</p>
                <p className="stat-value">—</p>
                <p className="stat-sub">patients waiting</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Clinic Status</p>
                <div style={{ marginTop: '6px' }}>
                  {clinicRow?.approved
                    ? <span className="badge badge-success">Approved</span>
                    : <span className="badge badge-warning">Pending</span>
                  }
                </div>
                <p className="stat-sub" style={{ marginTop: '6px' }}>operational</p>
              </div>
            </div>
            <div className="pd-grid">
              <Outlet context={ctx} />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
