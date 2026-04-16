// manage staff page for the clinic admin dashboard.
//
// lets the admin view nurses associated with their clinic, toggle the
// manage_queue permission, add new nurses by email, and remove nurses.
// all data comes from public.staff_permissions joined with public.profiles.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useClinicDashboard } from './ClinicADashBoard'

type InvitationStatus = 'pending' | 'accepted' | 'rejected'

type StaffMember = {
  id: string
  user_id: string
  manage_queue: boolean
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
  const [addLoading, setAddLoading] = useState(false)
  const [staffMessage, setStaffMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const clinicId = clinicRow?.clinic_id

  const fetchStaff = useCallback(async () => {
    if (!clinicId) return

    setStaffLoading(true)

    const { data: permRows, error: permErr } = await supabase
      .from('staff_permissions')
      .select('*')
      .eq('clinic_id', clinicId)

    if (permErr || !permRows || permRows.length === 0) {
      setStaffList([])
      setStaffLoading(false)
      return
    }

    const userIds = permRows.map((r) => r.user_id as string)

    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)

    if (profilesErr) {
      setStaffList([])
      setStaffLoading(false)
      return
    }

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id as string, p]),
    )

    const merged: StaffMember[] = permRows.map((r) => {
      const prof = profileMap.get(r.user_id as string)
      return {
        id: r.id as string,
        user_id: r.user_id as string,
        manage_queue: r.manage_queue as boolean,
        invitation_status: (r.invitation_status as InvitationStatus) ?? 'pending',
        full_name: (prof?.full_name as string | null) ?? null,
        email: (prof?.email as string | null) ?? null,
      }
    })

    setStaffList(merged)
    setStaffLoading(false)
  }, [clinicId])

  useEffect(() => {
    if (clinicId) {
      void fetchStaff()
    } else {
      setStaffLoading(false)
    }
  }, [clinicId, fetchStaff])

  const doAddStaff = async (email: string) => {
    if (!clinicId) return

    setAddLoading(true)

    const { data: nurse, error: lookupErr } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email)
      .eq('role', 'nurse')
      .maybeSingle()

    if (lookupErr) {
      setAddLoading(false)
      setStaffMessage({ type: 'error', text: lookupErr.message })
      return
    }

    if (!nurse) {
      setAddLoading(false)
      setStaffMessage({ type: 'error', text: 'no nurse found with that email address' })
      return
    }

    if (staffList.some((s) => s.user_id === (nurse.id as string))) {
      setAddLoading(false)
      setStaffMessage({ type: 'error', text: 'this nurse is already on your staff' })
      return
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('staff_permissions')
      .insert({
        clinic_id: clinicId,
        user_id: nurse.id,
        manage_queue: false,
        invitation_status: 'pending',
      })
      .select()
      .single()

    setAddLoading(false)

    if (insertErr) {
      setStaffMessage({ type: 'error', text: insertErr.message })
      return
    }

    setStaffList((prev) => [
      ...prev,
      {
        id: inserted.id as string,
        user_id: nurse.id as string,
        manage_queue: false,
        invitation_status: (inserted.invitation_status as InvitationStatus) ?? 'pending',
        full_name: (nurse.full_name as string | null) ?? null,
        email: (nurse.email as string | null) ?? null,
      },
    ])
    setAddEmail('')
    setStaffMessage({ type: 'success', text: 'nurse added to staff' })
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
      message: `Add nurse with email "${email}" to your staff?`,
      onConfirm: () => void doAddStaff(email),
    })
  }

  const handleToggleQueue = (member: StaffMember) => {
    if (member.invitation_status !== 'accepted') return
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

  const handleRemoveStaff = (member: StaffMember) => {
    const label = member.full_name ?? member.email ?? 'this nurse'

    setPendingAction({
      message: `Remove ${label} from your staff? This cannot be undone.`,
      onConfirm: () => void doRemoveStaff(member),
    })
  }

  const doRemoveStaff = async (member: StaffMember) => {
    setStaffMessage(null)
    const label = member.full_name ?? member.email ?? 'this nurse'

    const { error } = await supabase
      .from('staff_permissions')
      .delete()
      .eq('id', member.id)

    if (error) {
      setStaffMessage({ type: 'error', text: error.message })
      return
    }

    setStaffList((prev) => prev.filter((s) => s.id !== member.id))
    setStaffMessage({ type: 'success', text: `${label} removed` })
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
        <p className="pd-card-desc">Add nurses to your clinic and manage their permissions.</p>

        <form
          className="pd-form"
          onSubmit={handleAddStaff}
          style={{ marginBottom: '1.5rem' }}
        >
          <div className="pd-form-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="add-email">Add nurse by email</label>
              <input
                id="add-email"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="nurse@example.com"
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
        ) : staffList.length === 0 ? (
          <p className="pd-empty">No staff added yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Name</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Email</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Queue Access</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((member) => (
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
        )}
      </section>
    </>
  )
}
