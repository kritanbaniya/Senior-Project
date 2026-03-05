import { supabase } from '../../lib/supabase'
import type { ClinicListItem, QueueEntryRow, QueuePersonView, StaffPermissionRow } from './types'

const ACTIVE_QUEUE_STATUSES = ['waiting', 'called'] as const

const TODAY = () => new Date().toISOString().slice(0, 10)

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
  queueDate: string,
  entryId: string,
  newOrder: number
): Promise<void> {
  const { error } = await supabase.rpc('reorder_queue_entry', {
    p_clinic_id: clinicId,
    p_queue_date: queueDate,
    p_entry_id: entryId,
    p_new_order: newOrder,
  })
  if (error) throw error
}

export async function fetchOwnQueueRowsForClinic(clinicId: string): Promise<QueueEntryRow[]> {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('patient_id', userId)
    .eq('queue_date', TODAY())
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as QueueEntryRow[]
}

export async function fetchActiveQueueForClinic(clinicId: string): Promise<QueueEntryRow[]> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('queue_date', TODAY())
    .in('status', [...ACTIVE_QUEUE_STATUSES])
    .order('queue_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as QueueEntryRow[]
}

export async function fetchPendingQueueForClinic(clinicId: string): Promise<QueueEntryRow[]> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('queue_date', TODAY())
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
    .eq('queue_date', TODAY())
    .eq('status', 'in_progress')
    .order('started_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as QueueEntryRow[]
}

export async function fetchNurseClinicPermissions(): Promise<Array<StaffPermissionRow & ClinicListItem>> {
  const userId = await getCurrentUserId()
  const { data: perms, error: permsError } = await supabase
    .from('staff_permissions')
    .select('clinic_id, user_id, manage_queue')
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
    // fallback if clinics rls currently blocks read: still show clinic ids
    return permissionRows.map((perm) => ({
      ...perm,
      clinic_name: `Clinic ${perm.clinic_id.slice(0, 8)}`,
      address_line1: null,
      city: null,
      state: null,
    }))
  }

  const clinicMap = new Map((clinics ?? []).map((c) => [c.clinic_id, c as ClinicListItem]))
  return permissionRows
    .map((perm) => {
      const clinic = clinicMap.get(perm.clinic_id)
      if (!clinic) return null
      return { ...perm, ...clinic }
    })
    .filter((row): row is StaffPermissionRow & ClinicListItem => Boolean(row))
}

async function fetchProfileNamesByIds(userIds: string[]): Promise<Map<string, string>> {
  if (!userIds.length) return new Map()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)
  if (error) throw error
  return new Map((data ?? []).map((row) => [row.id as string, (row.full_name as string | null) ?? 'patient']))
}

export async function toQueuePersonView(rows: QueueEntryRow[]): Promise<QueuePersonView[]> {
  const names = await fetchProfileNamesByIds([...new Set(rows.map((row) => row.patient_id))])
  return rows.map((row) => ({
    ...row,
    patient_name: names.get(row.patient_id) ?? 'patient',
  }))
}

export async function startVisit(entry: QueueEntryRow): Promise<void> {
  // move selected patient to in_progress
  const { error: markError } = await supabase
    .from('queue_entries')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', entry.id)
  if (markError) throw markError

  // compact only waiting/called queue positions behind removed patient
  if (entry.queue_order == null) return
  const { data: behindRows, error: behindError } = await supabase
    .from('queue_entries')
    .select('id, queue_order, queue_date')
    .eq('clinic_id', entry.clinic_id)
    .eq('queue_date', entry.queue_date)
    .in('status', [...ACTIVE_QUEUE_STATUSES])
    .gt('queue_order', entry.queue_order)
    .order('queue_order', { ascending: true })

  if (behindError) throw behindError

  for (const row of behindRows ?? []) {
    await reorderQueueEntry(entry.clinic_id, row.queue_date as string, row.id as string, (row.queue_order as number) - 1)
  }
}

export async function completeVisit(entryId: string): Promise<void> {
  const { error } = await supabase
    .from('queue_entries')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', entryId)
  if (error) throw error
}

export function activeQueueStatuses(): readonly string[] {
  return ACTIVE_QUEUE_STATUSES
}
