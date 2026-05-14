import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { QueueEntryRow } from '../types'
import QueuePositionDots from './QueuePositionDots'

type PatientQueueCardProps = {
  clinicSelected: boolean
  clinicid: string | null
  loading: boolean
  row: QueueEntryRow | null
  activePosition: number | null
  exitState: 'left' | 'removed_from_active' | null
  rateLimitRetry: number | null
  onJoin: () => void
  onLeave: () => void
}

export default function PatientQueueCard({
  clinicSelected,
  clinicid,
  loading,
  row,
  activePosition,
  exitState,
  rateLimitRetry,
  onJoin,
  onLeave,
}: PatientQueueCardProps) {
  const hasActiveQueueEntry = row?.is_active === true

  const [notification, setNotification] = useState<string | null>(null)

  const prevPositionRef = useRef<number | null>(null)
  const prevStatusRef = useRef<string | null>(null)
  // skip triggering notifications on the initial mount
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      prevPositionRef.current = activePosition
      prevStatusRef.current = row?.status ?? null
      return
    }

    const prevPos = prevPositionRef.current
    const prevStatus = prevStatusRef.current
    const currentStatus = row?.status ?? null

    if (currentStatus === 'waiting' && activePosition === 1 && prevPos !== 1) {
      setNotification('you are next in line!')
    } else if (currentStatus === 'called' && prevStatus !== 'called') {
      setNotification('you have been called! please proceed to the front desk.')
    }

    prevPositionRef.current = activePosition
    prevStatusRef.current = currentStatus
  }, [activePosition, row?.status])

  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => setNotification(null), 3000)
    return () => clearTimeout(timer)
  }, [notification])

  return (
    <>
      {notification && (
        <div className="pd-queue-notification" role="alert" aria-live="polite">
          <span className="pd-queue-notification-text">{notification}</span>
          <button
            type="button"
            className="pd-queue-notification-close"
            onClick={() => setNotification(null)}
            aria-label="dismiss notification"
          >
            &times;
          </button>
        </div>
      )}

      <section className={`pd-card pd-card-queue${loading ? ' refreshing' : ''}`} id="queue">
        <h2 className="pd-card-title">Check-in & queue</h2>
        {hasActiveQueueEntry ? (
          <>
            {row?.status === 'pending' ? (
              <>
                <p className="pd-card-desc">Queue request submitted. Waiting for nurse approval.</p>
                <button type="button" className="pd-btn pd-btn-secondary" onClick={onLeave}>
                  leave queue
                </button>
                <Link to="/dashboard/patient/pdf-upload" state={{ clinicId: clinicid ?? '' }} className="pd-btn pd-btn-primary">
                  upload form
                </Link>
              </>
            ) : row?.status === 'waiting' ? (
              <>
                <p className="pd-card-desc">You are in active queue.</p>
                {activePosition != null && (
                  <QueuePositionDots position={activePosition} status="waiting" />
                )}
                <button type="button" className="pd-btn pd-btn-secondary" onClick={onLeave}>
                  leave queue
                </button>
                <Link to="/dashboard/patient/pdf-upload" state={{ clinicId: clinicid ?? '' }} className="pd-btn pd-btn-primary">
              upload form
              </Link>
              </>
            ) : row?.status === 'called' ? (
              <>
                <p className="pd-card-desc">You have been called! Please proceed to the front desk.</p>
                {activePosition != null && (
                  <QueuePositionDots position={activePosition} status="called" />
                )}
              </>
            ) : row?.status === 'in_progress' ? (
              <p className="pd-card-desc">Your visit is in progress.</p>
            ) : (
              <p className="pd-card-desc">You have an active queue entry.</p>
            )}
          </>
        ) : !clinicSelected ? (
          <>
            {exitState && (
              <p className="pd-card-desc">
                {exitState === 'left'
                  ? 'You have left the queue.'
                  : 'You were called and moved out of active queue.'}
              </p>
            )}
            <p className="pd-card-desc">Choose a clinic first to join a queue.</p>
          </>
        ) : (
          <>
            {exitState && (
              <p className="pd-card-desc">
                {exitState === 'left'
                  ? 'You have left the queue.'
                  : 'You were called and moved out of active queue.'}
              </p>
            )}
            <p className="pd-card-desc">Join this clinic queue to get started.</p>
            <button
              type="button"
              className="pd-btn pd-btn-primary"
              onClick={onJoin}
              disabled={!!rateLimitRetry}
            >
              join queue
            </button>
            {rateLimitRetry && (
              <p className="pd-card-desc">too many attempts. please try again later.</p>
            )}
            <Link to="/dashboard/patient/pdf-upload" state={{ clinicId: clinicid ?? '' }} className="pd-btn pd-btn-primary">
              upload form
            </Link>
          </>
        )}
      </section>
    </>
  )
}
