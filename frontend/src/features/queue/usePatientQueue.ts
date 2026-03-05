import { useCallback, useEffect, useState } from 'react'
import { fetchOwnQueueRowsForClinic, joinQueue, leaveQueue } from './api'
import { subscribeToClinicQueue } from './realtime'
import type { QueueEntryRow } from './types'

type ExitState = 'left' | 'removed_from_active' | null

export function usePatientQueue(clinicId: string | null) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentRow, setCurrentRow] = useState<QueueEntryRow | null>(null)
  const [exitState, setExitState] = useState<ExitState>(null)

  const loadSnapshot = useCallback(async () => {
    if (!clinicId) {
      setCurrentRow(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const ownRows = await fetchOwnQueueRowsForClinic(clinicId)
      const latest = ownRows[0] ?? null

      if (!latest) {
        setCurrentRow(null)
        setExitState(null)
        setLoading(false)
        return
      }

      if (latest.status === 'left' || latest.status === 'cancelled' || latest.status === 'completed') {
        setExitState('left')
        // allow patient to join again after a terminal visit status
        setCurrentRow(null)
      } else if (latest.status === 'in_progress') {
        setExitState('removed_from_active')
        // once visit started, patient is out of active queue and can rejoin later if needed
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
  }, [clinicId])

  useEffect(() => {
    void loadSnapshot()
  }, [loadSnapshot])

  useEffect(() => {
    if (!clinicId) return
    const unsubscribe = subscribeToClinicQueue(clinicId, () => {
      void loadSnapshot()
    })
    return unsubscribe
  }, [clinicId, loadSnapshot])

  const join = useCallback(async () => {
    if (!clinicId) return
    setError(null)
    try {
      await joinQueue(clinicId)
      setExitState(null)
      await loadSnapshot()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to join queue')
    }
  }, [clinicId, loadSnapshot])

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
    leave,
    refresh: loadSnapshot,
  }
}
