import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  acceptPendingQueueEntry,
  callPatient,
  completeVisit,
  fetchActiveQueueForClinic,
  fetchInProgressQueueForClinic,
  fetchNurseClinicPermissions,
  fetchPendingQueueForClinic,
  markNoShow,
  reorderQueueEntry,
  startVisit,
} from './api'
import { subscribeToClinicQueue } from './realtime'
import type { ClinicListItem, QueueEntryRow } from './types'

type NurseClinicPermission = ClinicListItem & { manage_queue: boolean; user_id: string }

export function useNurseQueue(selectedClinicId: string | null) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clinics, setClinics] = useState<NurseClinicPermission[]>([])
  const [pendingRows, setPendingRows] = useState<QueueEntryRow[]>([])
  const [activeRows, setActiveRows] = useState<QueueEntryRow[]>([])
  const [inProgressRows, setInProgressRows] = useState<QueueEntryRow[]>([])

  const selectedClinicPermission = useMemo(
    () => clinics.find((c) => c.clinic_id === selectedClinicId) ?? null,
    [clinics, selectedClinicId]
  )
  const canManageQueue = Boolean(selectedClinicPermission?.manage_queue)

  const refreshClinics = useCallback(async () => {
    try {
      const data = await fetchNurseClinicPermissions()
      setClinics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load clinic permissions')
    }
  }, [])

  const refreshQueue = useCallback(async () => {
    if (!selectedClinicId || !canManageQueue) {
      setPendingRows([])
      setActiveRows([])
      setInProgressRows([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [pending, active, inProgress] = await Promise.all([
        fetchPendingQueueForClinic(selectedClinicId),
        fetchActiveQueueForClinic(selectedClinicId),
        fetchInProgressQueueForClinic(selectedClinicId),
      ])
      setPendingRows(pending)
      setActiveRows(active)
      setInProgressRows(inProgress)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load queue')
    } finally {
      setLoading(false)
    }
  }, [canManageQueue, selectedClinicId])

  useEffect(() => {
    void refreshClinics()
  }, [refreshClinics])

  useEffect(() => {
    void refreshQueue()
  }, [refreshQueue])

  useEffect(() => {
    if (!selectedClinicId || !canManageQueue) return
    const unsubscribe = subscribeToClinicQueue(selectedClinicId, () => {
      void refreshQueue()
    })
    return unsubscribe
  }, [canManageQueue, refreshQueue, selectedClinicId])

  const approvePending = useCallback(
    async (entryId: string) => {
      try {
        await acceptPendingQueueEntry(entryId)
        await refreshQueue()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'failed to approve patient')
      }
    },
    [refreshQueue]
  )

  const moveRow = useCallback(
    async (entry: QueueEntryRow, direction: 'up' | 'down') => {
      if (!selectedClinicId || entry.queue_order == null) return
      const newOrder = direction === 'up' ? entry.queue_order - 1 : entry.queue_order + 1
      if (newOrder < 1) return
      try {
        await reorderQueueEntry(selectedClinicId, entry.id, newOrder)
        await refreshQueue()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'failed to reorder queue')
      }
    },
    [refreshQueue, selectedClinicId]
  )

  const callNextPatient = useCallback(async () => {
    const firstWaiting = activeRows.find((row) => row.status === 'waiting')
    if (!firstWaiting) return
    try {
      await callPatient(firstWaiting.id)
      await refreshQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to call patient')
    }
  }, [activeRows, refreshQueue])

  const callSinglePatient = useCallback(
    async (entryId: string) => {
      try {
        await callPatient(entryId)
        await refreshQueue()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'failed to call patient')
      }
    },
    [refreshQueue]
  )

  const beginVisit = useCallback(
    async (entryId: string) => {
      try {
        await startVisit(entryId)
        await refreshQueue()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'failed to start visit')
      }
    },
    [refreshQueue]
  )

  const noShow = useCallback(
    async (entryId: string) => {
      try {
        await markNoShow(entryId)
        await refreshQueue()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'failed to mark no-show')
      }
    },
    [refreshQueue]
  )

  const markCompleted = useCallback(
    async (entryId: string) => {
      try {
        await completeVisit(entryId)
        await refreshQueue()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'failed to complete visit')
      }
    },
    [refreshQueue]
  )

  return {
    loading,
    error,
    clinics,
    selectedClinicPermission,
    canManageQueue,
    pendingRows,
    activeRows,
    inProgressRows,
    refreshClinics,
    refreshQueue,
    approvePending,
    moveRow,
    callNextPatient,
    callSinglePatient,
    beginVisit,
    noShow,
    markCompleted,
  }
}
