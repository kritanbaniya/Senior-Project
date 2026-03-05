import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  acceptPendingQueueEntry,
  completeVisit,
  fetchActiveQueueForClinic,
  fetchInProgressQueueForClinic,
  fetchNurseClinicPermissions,
  fetchPendingQueueForClinic,
  reorderQueueEntry,
  startVisit,
  toQueuePersonView,
} from './api'
import { subscribeToClinicQueue } from './realtime'
import type { ClinicListItem, QueueEntryRow, QueuePersonView } from './types'

type NurseClinicPermission = ClinicListItem & { manage_queue: boolean; user_id: string }

export function useNurseQueue(selectedClinicId: string | null) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clinics, setClinics] = useState<NurseClinicPermission[]>([])
  const [pendingRows, setPendingRows] = useState<QueuePersonView[]>([])
  const [activeRows, setActiveRows] = useState<QueuePersonView[]>([])
  const [inProgressRows, setInProgressRows] = useState<QueuePersonView[]>([])

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
      const [pendingWithNames, activeWithNames, inProgressWithNames] = await Promise.all([
        toQueuePersonView(pending),
        toQueuePersonView(active),
        toQueuePersonView(inProgress),
      ])
      setPendingRows(pendingWithNames)
      setActiveRows(activeWithNames)
      setInProgressRows(inProgressWithNames)
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
        await reorderQueueEntry(selectedClinicId, entry.queue_date, entry.id, newOrder)
        await refreshQueue()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'failed to reorder queue')
      }
    },
    [refreshQueue, selectedClinicId]
  )

  const callNextPatient = useCallback(async () => {
    const firstWaiting = activeRows.find((row) => row.status === 'waiting') ?? activeRows[0]
    if (!firstWaiting) return
    try {
      await startVisit(firstWaiting)
      await refreshQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to start visit')
    }
  }, [activeRows, refreshQueue])

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
    markCompleted,
  }
}
