import { useCallback, useEffect, useState } from 'react'
import { fetchOwnActiveQueueRows, joinQueue, joinQueueForAppointment, leaveQueue } from './api'
import { subscribeToClinicQueue } from './realtime'
import type { QueueEntryRow } from './types'

type ExitState = 'left' | 'removed_from_active' | null

export function usePatientQueue(clinicId: string | null) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentRow, setCurrentRow] = useState<QueueEntryRow | null>(null)
  const [exitState, setExitState] = useState<ExitState>(null)

  const loadSnapshot = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const ownRows = await fetchOwnActiveQueueRows()
      const latest = ownRows[0] ?? null

      if (!latest) {
        setCurrentRow(null)
        return
      }

      if (latest.status === 'left' || latest.status === 'cancelled' || latest.status === 'completed' || latest.status === 'no_show') {
        setExitState('left')
        setCurrentRow(null)
      } else {
        setExitState(null)
        setCurrentRow(latest)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSnapshot()
  }, [loadSnapshot])

  useEffect(() => {
    const subscriptionClinicId = currentRow?.clinic_id ?? clinicId
    if (!subscriptionClinicId) return
    const unsubscribe = subscribeToClinicQueue(subscriptionClinicId, () => {
      void loadSnapshot()
    })
    return unsubscribe
  }, [clinicId, currentRow?.clinic_id, loadSnapshot])

  const join = useCallback(async () => {
    if (currentRow?.is_active) {
      setError('you already have an active queue entry')
      return
    }
    if (!clinicId) {
      setError('select a clinic before joining queue')
      return
    }
    setError(null)
    try {
      await joinQueue(clinicId)
      setExitState(null)
      await loadSnapshot()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to join queue')
    }
  }, [clinicId, currentRow?.is_active, loadSnapshot])

  const leave = useCallback(async () => {
    if (!currentRow) return
    setError(null)
    try {
      await leaveQueue(currentRow.id)
      setExitState('left')
      await loadSnapshot()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to leave queue')
    }
  }, [currentRow, loadSnapshot])

  const joinForAppointment = useCallback(async (appointmentId: string) => {
    if (currentRow?.is_active) {
      setError('you already have an active queue entry')
      return
    }
    setError(null)
    try {
      await joinQueueForAppointment(appointmentId)
      setExitState(null)
      await loadSnapshot()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to check in')
    }
  }, [currentRow?.is_active, loadSnapshot])

  // use queue_order from own row; patients cannot see other rows (RLS) so we cannot derive position from active list
  const activePosition =
    currentRow && (currentRow.status === 'waiting' || currentRow.status === 'called')
      ? currentRow.queue_order ?? null
      : null
  const peopleAhead = activePosition != null ? Math.max(0, activePosition - 1) : null

  return {
    loading,
    error,
    row: currentRow,
    exitState,
    activePosition,
    peopleAhead,
    join,
    joinForAppointment,
    leave,
    refresh: loadSnapshot,
  }
}
