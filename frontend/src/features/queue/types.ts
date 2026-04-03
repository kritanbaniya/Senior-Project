export type QueueStatus =
  | 'pending'
  | 'waiting'
  | 'called'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'left'
  | 'no_show'

export type QueueEntryRow = {
  id: string
  clinic_id: string
  patient_id: string
  queue_date: string
  checked_in_at: string
  status: QueueStatus
  notes: string | null
  queue_order: number | null
  called_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  is_active: boolean
  patient_name: string | null
}

export type ClinicListItem = {
  clinic_id: string
  clinic_name: string
  address_line1: string | null
  city: string | null
  state: string | null
}

export type InvitationStatus = 'pending' | 'accepted' | 'rejected'

export type StaffPermissionRow = {
  id: string
  clinic_id: string
  user_id: string
  manage_queue: boolean
  invitation_status: InvitationStatus
}

