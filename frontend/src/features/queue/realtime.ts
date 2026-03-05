import { supabase } from '../../lib/supabase'

export function subscribeToClinicQueue(clinicId: string, onQueueChanged: () => void): () => void {
  const channel = supabase
    .channel(`queue-${clinicId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'queue_entries',
        filter: `clinic_id=eq.${clinicId}`,
      },
      () => {
        onQueueChanged()
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
