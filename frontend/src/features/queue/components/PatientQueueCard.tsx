import { Link } from 'react-router-dom'
import type { QueueEntryRow } from '../types'

type PatientQueueCardProps = {
  clinicSelected: boolean
  loading: boolean
  row: QueueEntryRow | null
  activePosition: number | null
  peopleAhead: number | null
  exitState: 'left' | 'removed_from_active' | null
  onJoin: () => void
  onLeave: () => void
}

export default function PatientQueueCard({
  clinicSelected,
  loading,
  row,
  activePosition,
  peopleAhead,
  exitState,
  onJoin,
  onLeave,
}: PatientQueueCardProps) {
  return (
    <section className="pd-card pd-card-queue" id="queue">
      <h2 className="pd-card-title">Check-in & queue</h2>
      {!clinicSelected ? (
        <>
          <p className="pd-card-desc">Choose a clinic first to join queue.</p>
          <Link to="/clinic-nearby" className="pd-btn pd-btn-secondary">
            browse clinics
          </Link>
        </>
      ) : loading ? (
        <p className="pd-card-desc">Loading queue status...</p>
      ) : exitState ? (
        <>
          <p className="pd-card-desc">
            {exitState === 'left'
              ? 'You have left the queue.'
              : 'You were called and moved out of active queue.'}
          </p>
          <div className="pd-checkin-buttons">
            <button type="button" className="pd-btn pd-btn-primary" onClick={onJoin}>
              join queue again
            </button>
            <Link to="/dashboard/patient" className="pd-btn pd-btn-secondary">
              back to dashboard
            </Link>
          </div>
        </>
      ) : row?.status === 'pending' ? (
        <>
          <p className="pd-card-desc">Queue request submitted. Waiting for nurse approval.</p>
          <button type="button" className="pd-btn pd-btn-secondary" onClick={onLeave}>
            leave queue
          </button>
        </>
      ) : row?.status === 'waiting' ? (
        <>
          <p className="pd-card-desc">You are in active queue.</p>
          <div className="pd-queue-stats">
            <div className="pd-queue-stat">
              <span className="pd-queue-label">Position</span>
              <span className="pd-queue-value">{activePosition ?? '-'}</span>
            </div>
            <div className="pd-queue-stat">
              <span className="pd-queue-label">People ahead</span>
              <span className="pd-queue-value">{peopleAhead ?? '-'}</span>
            </div>
          </div>
          <button type="button" className="pd-btn pd-btn-secondary" onClick={onLeave}>
            leave queue
          </button>
        </>
      ) : row?.status === 'called' ? (
        <>
          <p className="pd-card-desc">You have been called! Please proceed to the front desk.</p>
          <div className="pd-queue-stats">
            <div className="pd-queue-stat">
              <span className="pd-queue-label">Position</span>
              <span className="pd-queue-value">{activePosition ?? '-'}</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="pd-card-desc">Join this clinic queue to get started.</p>
          <button type="button" className="pd-btn pd-btn-primary" onClick={onJoin}>
            join queue
          </button>
        </>
      )}
    </section>
  )
}
