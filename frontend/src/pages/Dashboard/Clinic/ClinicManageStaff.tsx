// manage staff page for the clinic admin dashboard.
//
// lets the admin view nurses and doctors associated with their clinic,
// manage queue access for nurses, add staff by email, and remove staff.
// nurses come from public.staff_permissions joined with public.profiles.
// doctors come from public.Memberships joined with public.profiles.

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'
import { useClinicDashboard } from './ClinicADashBoard'

type InvitationStatus = 'pending' | 'accepted' | 'rejected'
type StaffRole = 'nurse' | 'doctor'

type StaffMember = {
  id: string
  user_id: string
  role: StaffRole
  manage_queue: boolean
  manage_appointment: boolean | null
  invitation_status: InvitationStatus
  full_name: string | null
  email: string | null
}

function formatInvitationStatus(s: InvitationStatus): string {
  if (s === 'pending') return 'Pending'
  if (s === 'accepted') return 'Accepted'
  return 'Rejected'
}

type PendingAction = {
  message: string
  onConfirm: () => void
}

export default function ClinicManageStaff() {
  const { clinicRow, loading } = useClinicDashboard()

  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [staffLoading, setStaffLoading] = useState(true)
  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState<StaffRole>('nurse')
  const [addLoading, setAddLoading] = useState(false)
  const [staffMessage, setStaffMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const clinicId = clinicRow?.clinic_id

  const sortStaff = useCallback((list: StaffMember[]) => {
    return [...list].sort((a, b) => {
      if (a.role !== b.role) return a.role === 'nurse' ? -1 : 1
      const nameA = (a.full_name ?? a.email ?? '').toLowerCase()
      const nameB = (b.full_name ?? b.email ?? '').toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }, [])

const fetchStaff = useCallback(async () => {
  if (!clinicId) return

  setStaffLoading(true)

  // Nurses come from staff_permissions
  const { data: permRows, error: permErr } = await supabase
    .from('staff_permissions')
    .select('*')
    .eq('clinic_id', clinicId)

  // Doctors come directly from Memberships
  const { data: membershipRows, error: membershipErr } = await supabase
    .from('Memberships')
    .select('clinic_id, user_id, created_at')
    .eq('clinic_id', clinicId)

  if (permErr || membershipErr) {
    setStaffList([])
    setStaffLoading(false)
    return
  }

  const nurseIds = (permRows ?? []).map((r) => r.user_id as string)
  const doctorIds = (membershipRows ?? []).map((r) => r.user_id as string)

  const allUserIds = Array.from(new Set([...nurseIds, ...doctorIds]))
  if (allUserIds.length === 0) {
    setStaffList([])
    setStaffLoading(false)
    return
  }

  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .in('id', allUserIds)
    .in('role', ['nurse', 'doctor'])

  if (profilesErr) {
    setStaffList([])
    setStaffLoading(false)
    return
  }

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id as string, p]),
  )

  const nurseRows = (permRows ?? []).map((r) => {
  const prof = profileMap.get(r.user_id as string)
  if (!prof || prof.role !== 'nurse') return null

  return {
    id: r.id as string,
    user_id: r.user_id as string,
    role: 'nurse' as const,
    manage_queue: r.manage_queue as boolean,
    manage_appointment: r.manage_appointment as boolean,
    invitation_status: (r.invitation_status as InvitationStatus) ?? 'pending',
    full_name: (prof.full_name as string | null) ?? null,
    email: (prof.email as string | null) ?? null,
  }
})

const nurses: StaffMember[] = nurseRows.filter(
  (row): row is NonNullable<typeof row> => row !== null
)

  const nurseIdSet = new Set(nurses.map((n) => n.user_id))

  const doctorRows = (membershipRows ?? []).map((r) => {
  const prof = profileMap.get(r.user_id as string)
  if (!prof || prof.role !== 'doctor') return null
  if (nurseIdSet.has(r.user_id as string)) return null

  return {
    id: r.user_id as string,
    user_id: r.user_id as string,
    role: 'doctor' as const,
    manage_queue: false,
    manage_appointment: false,
    invitation_status: 'accepted' as InvitationStatus,
    full_name: (prof.full_name as string | null) ?? null,
    email: (prof.email as string | null) ?? null,
  }
})

const doctors: StaffMember[] = doctorRows.filter(
  (row): row is NonNullable<typeof row> => row !== null
)

  setStaffList(sortStaff([...nurses, ...doctors]))
  setStaffLoading(false)
}, [clinicId, sortStaff])

  useEffect(() => {
    if (clinicId) {
      void fetchStaff()
    } else {
      setStaffLoading(false)
    }
  }, [clinicId, fetchStaff])

  const nurseList = useMemo(
    () => staffList.filter((member) => member.role === 'nurse'),
    [staffList],
  )

  const doctorList = useMemo(
    () => staffList.filter((member) => member.role === 'doctor'),
    [staffList],
  )

  const doAddStaff = async (email: string, role: StaffRole) => {
  if (!clinicId) return

  setAddLoading(true)

  const { data: staffUser, error: lookupErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('email', email)
    .eq('role', role)
    .maybeSingle()

  if (lookupErr) {
    setAddLoading(false)
    setStaffMessage({ type: 'error', text: lookupErr.message })
    return
  }

  if (!staffUser) {
    setAddLoading(false)
    setStaffMessage({ type: 'error', text: `no ${role} found with that email address` })
    return
  }

  if (staffList.some((s) => s.user_id === (staffUser.id as string))) {
    setAddLoading(false)
    setStaffMessage({ type: 'error', text: `this ${role} is already on your staff` })
    return
  }

  if (role === 'nurse') {
    const { data: inserted, error: insertErr } = await supabase
      .from('staff_permissions')
      .insert({
        clinic_id: clinicId,
        user_id: staffUser.id,
        manage_queue: false,
        manage_appointment: false,
        invitation_status: 'pending',
      })
      .select()
      .single()

    setAddLoading(false)

    if (insertErr) {
      setStaffMessage({ type: 'error', text: insertErr.message })
      return
    }

    const newMember: StaffMember = {
      id: inserted.id as string,
      user_id: staffUser.id as string,
      role: 'nurse',
      manage_queue: false,
      manage_appointment: false,
      invitation_status: (inserted.invitation_status as InvitationStatus) ?? 'pending',
      full_name: (staffUser.full_name as string | null) ?? null,
      email: (staffUser.email as string | null) ?? null,
    }

    setStaffList((prev) => sortStaff([...prev, newMember]))
    setAddEmail('')
    setAddRole('nurse')
    setStaffMessage({ type: 'success', text: 'nurse added to staff' })
    return
  }

  const { error: membershipErr } = await supabase
    .from('Memberships')
    .insert({
      clinic_id: clinicId,
      user_id: staffUser.id,
    })

  setAddLoading(false)

  if (membershipErr) {
    setStaffMessage({ type: 'error', text: membershipErr.message })
    return
  }

  const newMember: StaffMember = {
    id: staffUser.id as string,
    user_id: staffUser.id as string,
    role: 'doctor',
    manage_queue: false,
    manage_appointment: false,
    invitation_status: 'accepted',
    full_name: (staffUser.full_name as string | null) ?? null,
    email: (staffUser.email as string | null) ?? null,
  }

  setStaffList((prev) => sortStaff([...prev, newMember]))
  setAddEmail('')
  setAddRole('nurse')
  setStaffMessage({ type: 'success', text: 'doctor added to staff' })
}

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault()
    setStaffMessage(null)

    const email = addEmail.trim().toLowerCase()
    if (!email) {
      setStaffMessage({ type: 'error', text: 'please enter an email address' })
      return
    }

    setPendingAction({
      message: `Add ${addRole} with email "${email}" to your staff?`,
      onConfirm: () => void doAddStaff(email, addRole),
    })
  }

  const handleToggleQueue = (member: StaffMember) => {
    if (member.role !== 'nurse' || member.invitation_status !== 'accepted') return
    const newValue = !member.manage_queue
    const label = member.full_name ?? member.email ?? 'this nurse'
    const action = newValue ? 'Grant' : 'Revoke'

    setPendingAction({
      message: `${action} queue access for ${label}?`,
      onConfirm: () => void doToggleQueue(member, newValue),
    })
  }

  const doToggleQueue = async (member: StaffMember, newValue: boolean) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === member.id ? { ...s, manage_queue: newValue } : s)),
    )

    const { error } = await supabase
      .from('staff_permissions')
      .update({ manage_queue: newValue })
      .eq('id', member.id)

    if (error) {
      setStaffList((prev) =>
        prev.map((s) => (s.id === member.id ? { ...s, manage_queue: !newValue } : s)),
      )
      setStaffMessage({ type: 'error', text: error.message })
    }
  }

  const handleToggleAppointment = (member: StaffMember) => {
    if (member.role !== 'nurse' || member.invitation_status !== 'accepted') return

    const newValue = !member.manage_appointment

    setPendingAction({
      message: `${newValue ? 'Grant' : 'Revoke'} appointment access for ${
        member.full_name ?? member.email ?? 'this nurse'
      }?`,
      onConfirm: () => void doToggleAppointment(member, newValue),
    })
  }

  const doToggleAppointment = async (member: StaffMember, newValue: boolean) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === member.id ? { ...s, manage_appointment: newValue } : s
      )
    )

    const { error } = await supabase
      .from('staff_permissions')
      .update({ manage_appointment: newValue })
      .eq('id', member.id)

    if (error) {
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === member.id ? { ...s, manage_appointment: !newValue } : s
        )
      )
      setStaffMessage({ type: 'error', text: error.message })
    }
  }

  const handleRemoveStaff = (member: StaffMember) => {
    const fallbackLabel = member.role === 'doctor' ? 'this doctor' : 'this nurse'
    const label = member.full_name ?? member.email ?? fallbackLabel

    setPendingAction({
      message: `Remove ${label} from your staff? This cannot be undone.`,
      onConfirm: () => void doRemoveStaff(member),
    })
  }

const doRemoveStaff = async (member: StaffMember) => {
  setStaffMessage(null)
  const fallbackLabel = member.role === 'doctor' ? 'this doctor' : 'this nurse'
  const label = member.full_name ?? member.email ?? fallbackLabel

  if (member.role === 'nurse') {
    const { error } = await supabase
      .from('staff_permissions')
      .delete()
      .eq('id', member.id)

    if (error) {
      setStaffMessage({ type: 'error', text: error.message })
      return
    }
  } else {
    const { error } = await supabase
      .from('Memberships')
      .delete()
      .eq('clinic_id', clinicId)
      .eq('user_id', member.user_id)

    if (error) {
      setStaffMessage({ type: 'error', text: error.message })
      return
    }
  }

  setStaffList((prev) =>
    prev.filter(
      (s) => !(s.role === member.role && s.user_id === member.user_id)
    )
  )

  setStaffMessage({ type: 'success', text: `${label} removed` })
}

  const renderStaffTable = (members: StaffMember[], role: StaffRole) => {
    if (members.length === 0) {
      return (
        <p className="pd-empty" style={{ marginTop: '0.75rem' }}>
          No {role === 'nurse' ? 'nurses' : 'doctors'} added yet.
        </p>
      )
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: role === 'nurse' ? '620px' : '560px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
              <th style={{ padding: '0.5rem 0.75rem' }}>Name</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Email</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
              {role === 'nurse' && <th style={{ padding: '0.5rem 0.75rem' }}>Queue Access</th>}
              {role === 'nurse' && <th style={{ padding: '0.5rem 0.75rem' }}>Appointment Access</th>}
              <th style={{ padding: '0.5rem 0.75rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.id}
                style={{ borderBottom: '1px solid var(--border, #e2e8f0)' }}
              >
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  {member.full_name ?? '-'}
                </td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  {member.email ?? '-'}
                </td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <span className="pd-status-badge">{formatInvitationStatus(member.invitation_status)}</span>
                </td>
                {role === 'nurse' && (
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: member.invitation_status === 'accepted' ? 'pointer' : 'not-allowed',
                        opacity: member.invitation_status === 'accepted' ? 1 : 0.5,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={member.manage_queue}
                        disabled={member.invitation_status !== 'accepted'}
                        onChange={() => handleToggleQueue(member)}
                      />
                      {member.manage_queue ? 'Yes' : 'No'}
                    </label>
                  </td>
                )}
                {role === 'nurse' && (
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: member.invitation_status === 'accepted' ? 'pointer' : 'not-allowed',
                        opacity: member.invitation_status === 'accepted' ? 1 : 0.5,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={member.manage_appointment || !!member.manage_appointment}
                        disabled={member.invitation_status !== 'accepted'}
                        onChange={() => handleToggleAppointment(member)}
                      />
                      {member.manage_appointment ? 'Yes' : 'No'}
                    </label>
                  </td>
                )}
                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                  <button
                    type="button"
                    className="pd-btn"
                    style={{ color: 'var(--danger, #e53e3e)' }}
                    onClick={() => handleRemoveStaff(member)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (loading) {
    return <p className="pd-empty">Loading...</p>
  }

  if (!clinicRow || !clinicRow.approved) {
    return (
      <section className="pd-card">
        <h2 className="pd-card-title">Manage Staff</h2>
        <p className="pd-card-desc">
          You need to create and get your clinic approved before you can manage staff.
        </p>
      </section>
    )
  }

  return (
    <>
      {/* confirmation modal */}
      {pendingAction && (
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
          onClick={() => setPendingAction(null)}
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
              Confirm action
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', color: '#475569', lineHeight: 1.5 }}>
              {pendingAction.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="pd-btn"
                onClick={() => setPendingAction(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pd-btn pd-btn-primary"
                onClick={() => {
                  pendingAction.onConfirm()
                  setPendingAction(null)
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="pd-card" style={{ gridColumn: '1 / -1' }}>
        <h2 className="pd-card-title">Manage Staff</h2>
        <p className="pd-card-desc">Add nurses and doctors to your clinic and manage their permissions.</p>

        <form
          className="pd-form"
          onSubmit={handleAddStaff}
          style={{ marginBottom: '1.5rem' }}
        >
          <div className="pd-form-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '180px' }}>
              <label htmlFor="add-role">Staff role</label>
              <select
                id="add-role"
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as StaffRole)}
              >
                <option value="nurse">Nurse</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <label htmlFor="add-email">Add staff by email</label>
              <input
                id="add-email"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder={addRole === 'doctor' ? 'doctor@example.com' : 'nurse@example.com'}
                required
              />
            </div>
            <button
              type="submit"
              className="pd-btn pd-btn-primary"
              disabled={addLoading}
              style={{ whiteSpace: 'nowrap' }}
            >
              {addLoading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>

        {staffMessage && (
          <p
            className={staffMessage.type === 'error' ? 'pd-alert pd-alert-warning' : 'pd-card-desc'}
            style={{ marginBottom: '1rem' }}
          >
            {staffMessage.text}
          </p>
        )}

        {staffLoading ? (
          <p className="pd-empty">Loading staff...</p>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                Nurses
              </h3>
              <p className="pd-card-desc" style={{ marginBottom: '0.75rem' }}>
                Nurses can be granted queue access after they accept the clinic invitation.
              </p>
              {renderStaffTable(nurseList, 'nurse')}
            </div>

            <div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                Doctors
              </h3>
              {renderStaffTable(doctorList, 'doctor')}
            </div>
          </div>
        )}
      </section>
    </>
  )
}
