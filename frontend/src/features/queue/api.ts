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

export async function fetchActiveQueueForClinic(clinicId: string): Promise<QueueEntryRow[]> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
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

export function activeQueueStatuses(): readonly string[] {
  return ACTIVE_QUEUE_STATUSES
}
