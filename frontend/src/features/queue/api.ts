import { supabase } from '../../lib/supabase'
import type { ClinicListItem, QueueEntryRow, StaffPermissionRow } from './types'

const ACTIVE_QUEUE_STATUSES = ['waiting', 'called'] as const

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    throw new Error('not authenticated')
  }
  return data.user.id
}

export async function joinQueue(clinicId: string, notes?: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_queue', {
    p_clinic_id: clinicId,
    p_notes: notes ?? null,
  })
  if (error) throw error
  return data as string
}

export async function leaveQueue(entryId: string): Promise<void> {
  const { error } = await supabase.rpc('leave_queue', { p_entry_id: entryId })
  if (error) throw error
}

export async function acceptPendingQueueEntry(entryId: string): Promise<void> {
  const { error } = await supabase.rpc('accept_pending_queue_entry', { p_entry_id: entryId })
  if (error) throw error
}

export async function reorderQueueEntry(
  clinicId: string,
  entryId: string,
  newOrder: number
): Promise<void> {
  const { error } = await supabase.rpc('reorder_queue_entry', {
    p_clinic_id: clinicId,
    p_entry_id: entryId,
    p_new_order: newOrder,
  })
  if (error) throw error
}

export async function fetchDoctorsForClinic(clinicId: string) {
  const { data, error } = await supabase
    .from('membernamerole')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('role', 'doctor')

  if (error) throw error
  return data ?? []
}

//Must replace with RPC function later
export async function assignDoctorToAppointment(
  appointmentId: string,
  doctorId: string
) {
  const { error } = await supabase
    .from('Appointments')
    .update({ clinician_id: doctorId })
    .eq('Appointment_id', appointmentId)

  if (error) throw error
}

export async function fetchOwnQueueRowsForClinic(clinicId: string): Promise<QueueEntryRow[]> {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('patient_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as QueueEntryRow[]
}

export async function fetchOwnActiveQueueRows(): Promise<QueueEntryRow[]> {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('patient_id', userId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as QueueEntryRow[]
}

export async function fetchActiveQueueForClinic(clinicId: string): Promise<QueueEntryRow[]> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .in('status', [...ACTIVE_QUEUE_STATUSES])
    .order('queue_order', { ascending: true })

  if (error) throw error

  const rows = data ?? []

  const appointmentIds = rows
    .map((r) => r.appointment_id)
    .filter(Boolean)

  if (appointmentIds.length === 0) {
    return rows as QueueEntryRow[]
  }

  const { data: appointments, error: apptError } = await supabase
    .from('Appointments')
    .select('Appointment_id, clinician_id')
    .in('Appointment_id', appointmentIds)

  if (apptError) throw apptError

  const clinicianIds = appointments
    ?.map((a) => a.clinician_id)
    .filter(Boolean)

  const { data: clinicians, error: clinicianError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('id', clinicianIds ?? [])

  if (clinicianError) throw clinicianError

  const clinicianMap = new Map(
    (clinicians ?? []).map((c) => [c.id, c])
  )

  const appointmentMap = new Map(
    (appointments ?? []).map((a) => [
      a.Appointment_id,
      {
        clinician_id: a.clinician_id,
        clinician: clinicianMap.get(a.clinician_id),
      },
    ])
  )

  return rows.map((row) => {
    const appt = row.appointment_id
      ? appointmentMap.get(row.appointment_id)
      : null

    return {
      ...row,
      appointment: appt
        ? {
            Appointment_id: row.appointment_id!,
            clinician_id: appt.clinician_id,
            clinician_name: appt.clinician?.full_name ?? null,
            clinician_role: appt.clinician?.role ?? null,
          }
        : null,
    }
  }) as QueueEntryRow[]
}

export async function fetchPendingQueueForClinic(clinicId: string): Promise<QueueEntryRow[]> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as QueueEntryRow[]
}

export async function fetchInProgressQueueForClinic(clinicId: string): Promise<QueueEntryRow[]> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as QueueEntryRow[]
}

function mergePermWithClinic(
  perm: StaffPermissionRow,
  clinicMap: Map<string, ClinicListItem>,
): StaffPermissionRow & ClinicListItem {
  const clinic = clinicMap.get(perm.clinic_id)
  if (!clinic) {
    return {
      ...perm,
      clinic_name: `Clinic ${perm.clinic_id.slice(0, 8)}`,
      address_line1: null,
      city: null,
      state: null,
    }
  }
  return { ...perm, ...clinic }
}

export async function fetchNurseClinicPermissions(): Promise<Array<StaffPermissionRow & ClinicListItem>> {
  const userId = await getCurrentUserId()
  const { data: perms, error: permsError } = await supabase
    .from('staff_permissions')
    .select('id, clinic_id, user_id, manage_queue, invitation_status')
    .eq('user_id', userId)

  if (permsError) throw permsError
  const permissionRows = (perms ?? []) as StaffPermissionRow[]
  if (!permissionRows.length) return []

  const clinicIds = permissionRows.map((p) => p.clinic_id)
  const { data: clinics, error: clinicsError } = await supabase
    .from('clinics')
    .select('clinic_id, clinic_name, address_line1, city, state')
    .in('clinic_id', clinicIds)

  if (clinicsError) {
    return permissionRows.map((perm) => mergePermWithClinic(perm, new Map()))
  }

  const clinicMap = new Map((clinics ?? []).map((c) => [c.clinic_id, c as ClinicListItem]))
  return permissionRows.map((perm) => mergePermWithClinic(perm, clinicMap))
}

export async function updateNurseInvitationStatus(
  permissionId: string,
  status: 'accepted' | 'rejected',
): Promise<void> {
  const { error } = await supabase
    .from('staff_permissions')
    .update({ invitation_status: status })
    .eq('id', permissionId)

  if (error) throw error
}

export async function callPatient(entryId: string): Promise<void> {
  const { error } = await supabase.rpc('call_patient', { p_entry_id: entryId })
  if (error) throw error
}

export async function startVisit(entryId: string): Promise<void> {
  const { error } = await supabase.rpc('start_visit', { p_entry_id: entryId })
  if (error) throw error
}

export async function markNoShow(entryId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_no_show', { p_entry_id: entryId })
  if (error) throw error
}

export async function completeVisit(entryId: string): Promise<void> {
  const { error } = await supabase.rpc('complete_visit', { p_entry_id: entryId })
  if (error) throw error
}

export async function joinQueueForAppointment(
  appointmentId: string,
  notes?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('join_queue_for_appointment', {
    p_appointment_id: appointmentId,
    p_notes: notes ?? null,
  })
  if (error) throw error
  return data as string
}

export function activeQueueStatuses(): readonly string[] {
  return ACTIVE_QUEUE_STATUSES
}
