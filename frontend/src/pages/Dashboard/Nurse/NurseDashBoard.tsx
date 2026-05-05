import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useClinicContext } from '../../../context/ClinicContext'
import ClinicSelector from '../../../features/queue/components/ClinicSelector'
import { fetchNurseClinicPermissions, updateNurseInvitationStatus } from '../../../features/queue/api'
import type { ClinicListItem, StaffPermissionRow } from '../../../features/queue/types'
import NurseSideBar from './NurseSideBar'
import { SidebarProvider } from "@/components/ui/sidebar"

type NurseClinicPermission = ClinicListItem & StaffPermissionRow

type PendingInviteAction = {
  message: string
  onConfirm: () => void
}

export default function NurseDashBoard() {
  const { profile } = useAuth()
  const nurseName = profile?.full_name?.split(' ')[0] ?? 'there'
  const { selectedClinicId, setSelectedClinicId, setSelectedClinicName } = useClinicContext()
  const [permissions, setPermissions] = useState<NurseClinicPermission[]>([])
  const [clinicsLoading, setClinicsLoading] = useState(true)
  const [clinicsError, setClinicsError] = useState<string | null>(null)
  const [inviteBusyId, setInviteBusyId] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [pendingInviteAction, setPendingInviteAction] = useState<PendingInviteAction | null>(null)

  const acceptedClinics = useMemo(
    () => permissions.filter((p) => p.invitation_status === 'accepted'),
    [permissions],
  )
  const pendingInvites = useMemo(
    () => permissions.filter((p) => p.invitation_status === 'pending'),
    [permissions],
  )

  const loadClinicPermissions = useCallback(async () => {
    setClinicsLoading(true)
    setClinicsError(null)
    try {
      const data = await fetchNurseClinicPermissions()
      setPermissions(data)
    } catch (err) {
      setClinicsError(err instanceof Error ? err.message : 'failed to load clinic permissions')
    } finally {
      setClinicsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadClinicPermissions()
  }, [loadClinicPermissions])

  useEffect(() => {
    if (!selectedClinicId) return
    if (acceptedClinics.length === 0) {
      setSelectedClinicId(null)
      setSelectedClinicName(null)
      return
    }
    const stillValid = acceptedClinics.some((c) => c.clinic_id === selectedClinicId)
    if (!stillValid) {
      setSelectedClinicId(null)
      setSelectedClinicName(null)
    }
  }, [acceptedClinics, selectedClinicId, setSelectedClinicId, setSelectedClinicName])

  const runInviteUpdate = async (permissionId: string, status: 'accepted' | 'rejected') => {
    setInviteBusyId(permissionId)
    setInviteError(null)
    try {
      await updateNurseInvitationStatus(permissionId, status)
      await loadClinicPermissions()
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'failed to update invitation')
    } finally {
      setInviteBusyId(null)
    }
  }

  const openAcceptInvite = (row: NurseClinicPermission) => {
    setPendingInviteAction({
      message: `Accept invitation to join ${row.clinic_name}?`,
      onConfirm: () => void runInviteUpdate(row.id, 'accepted'),
    })
  }

  const openDeclineInvite = (row: NurseClinicPermission) => {
    setPendingInviteAction({
      message: `Decline invitation to join ${row.clinic_name}?`,
      onConfirm: () => void runInviteUpdate(row.id, 'rejected'),
    })
  }

  return (
    <SidebarProvider defaultOpen
      style={
        {
          "--sidebar-width": "15rem",
          "--sidebar-width-mobile": "10rem",
    } as React.CSSProperties
      }
    
    >
      <NurseSideBar />

      <div className="pd-right">
        <header className="pd-header">
          <div className="pd-header-left">
            <h1 className="pd-header-title">Nurse dashboard</h1>
            <span className="pd-header-patient">Overview</span>
          </div>

          <div className="pd-header-actions nurse-overview-header-actions">
            <section className="nurse-overview-clinic-box">
              <h2 className="nurse-overview-clinic-title">Clinic selection</h2>
              {clinicsLoading && <p className="no-queue">Loading clinics...</p>}
              {!clinicsLoading && clinicsError && <p className="no-queue">{clinicsError}</p>}
              {!clinicsLoading && !clinicsError && (
                <ClinicSelector
                  clinics={acceptedClinics}
                  selectedClinicId={selectedClinicId}
                  onSelect={(clinicId) => setSelectedClinicId(clinicId)}
                />
              )}
            </section>
          </div>
        </header>

        <main className="pd-main nurse-dashboard nurse-overview-main">
          {/* Stat cards */}
          <div className="stat-grid">
            <div className="stat-card">
              <p className="stat-label">Accepted Clinics</p>
              <p className="stat-value">{clinicsLoading ? '—' : acceptedClinics.length}</p>
              <p className="stat-sub">clinics with access</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Pending Invites</p>
              <p className="stat-value">{clinicsLoading ? '—' : pendingInvites.length}</p>
              <p className="stat-sub">awaiting response</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Total Clinics</p>
              <p className="stat-value">{clinicsLoading ? '—' : permissions.length}</p>
              <p className="stat-sub">all memberships</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Selected Clinic</p>
              <p className="stat-value" style={{ fontSize: '16px', marginTop: '6px' }}>
                {selectedClinicId
                  ? (acceptedClinics.find(c => c.clinic_id === selectedClinicId)?.clinic_name ?? '—')
                  : '—'}
              </p>
              <p className="stat-sub">active context</p>
            </div>
          </div>

          {/* Dashboard hero */}
          <div className="dashboard-hero">
            <div className="dashboard-hero-content">
              <p style={{ fontSize: 13, color: 'var(--brand-text)', fontWeight: 500, margin: 0, marginBottom: 4 }}>
                Good morning
              </p>
              <h2 style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-1)', margin: 0, lineHeight: 1.2 }}>
                {nurseName}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, marginBottom: 0 }}>
                {acceptedClinics.length > 0
                  ? `You have access to ${acceptedClinics.length} clinic${acceptedClinics.length !== 1 ? 's' : ''}.`
                  : 'Select a clinic to get started.'}
              </p>
            </div>
          </div>

          {/* Clinic invitations */}
          {!clinicsLoading && !clinicsError && pendingInvites.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 500, color: 'var(--text-1)' }}>
                Clinic invitations
              </h2>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-2)' }}>
                Accept or decline invitations from clinics. You must accept before the clinic appears in your selection above.
              </p>
              {inviteError && (
                <p style={{ marginBottom: '0.75rem', fontSize: '13px', color: 'var(--danger-text)' }}>{inviteError}</p>
              )}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {pendingInvites.map((row) => (
                  <li
                    key={row.id}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '10px 0',
                      borderBottom: '0.5px solid var(--border)',
                    }}
                  >
                    <div style={{ flex: '1 1 200px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)' }}>
                        {row.clinic_name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)', marginLeft: '0.5rem' }}>
                        {row.city ?? 'city n/a'}, {row.state ?? 'state n/a'}
                      </span>
                    </div>
                    <span className="badge badge-warning">pending</span>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                      disabled={inviteBusyId === row.id}
                      onClick={() => openAcceptInvite(row)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                      disabled={inviteBusyId === row.id}
                      onClick={() => openDeclineInvite(row)}
                    >
                      Decline
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>

      {pendingInviteAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.4)',
          }}
          onClick={() => setPendingInviteAction(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '1.5rem 2rem',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>
              Confirm
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', color: '#475569', lineHeight: 1.5 }}>
              {pendingInviteAction.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="pd-btn"
                onClick={() => setPendingInviteAction(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pd-btn pd-btn-primary"
                onClick={() => {
                  pendingInviteAction.onConfirm()
                  setPendingInviteAction(null)
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      </SidebarProvider>
  )
}
