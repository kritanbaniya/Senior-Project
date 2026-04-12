import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
          {!clinicsLoading && !clinicsError && pendingInvites.length > 0 && (
            <div className="info-box quick-actions-box" style={{ marginBottom: '1rem' }}>
              <h2 className="info-box-title">Clinic invitations</h2>
              <p className="pd-card-desc" style={{ marginBottom: '0.75rem' }}>
                Accept or decline invitations from clinics. You must accept before the clinic appears in your selection above.
              </p>
              {inviteError && (
                <p className="no-queue" style={{ marginBottom: '0.75rem' }}>{inviteError}</p>
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
                      padding: '0.5rem 0',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <span style={{ flex: '1 1 200px' }}>
                      {row.clinic_name}
                      <span className="small-label" style={{ marginLeft: '0.5rem' }}>
                        ({row.city ?? 'city n/a'}, {row.state ?? 'state n/a'})
                      </span>
                    </span>
                    <button
                      type="button"
                      className="btn-small"
                      disabled={inviteBusyId === row.id}
                      onClick={() => openAcceptInvite(row)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn-small"
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

          <div className="info-box quick-actions-box">
            <h2 className="info-box-title">Quick actions</h2>
            <div className="info-box-content quick-actions">
              <Link to="/dashboard/nurse/appointments" className="action-link">
                Appointments
              </Link>
              <Link to="/dashboard/nurse/queue" className="action-link">
                Queue management
              </Link>
              <Link to="/dashboard/nurse/information" className="action-link">
                Your information
              </Link>
              <Link to="/clinic" className="action-link">
                Clinic info
              </Link>
            </div>
          </div>
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
