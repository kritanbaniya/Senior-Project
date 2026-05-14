import type { QueueEntryRow } from '../types'

type PendingQueuePanelProps = {
  rows: QueueEntryRow[]
  onApprove: (entryId: string) => void
}

export default function PendingQueuePanel({ rows, onApprove }: PendingQueuePanelProps) {
  return (
    <div className="info-box queue-section">
      <h2 className="info-box-title">Pending queue requests</h2>
      <div className="info-box-content">
        {!rows.length ? (
          <p className="no-queue">No pending patients.</p>
        ) : (
          <ol className="nurse-queue-list">
            {rows.map((row, index) => (
              <li key={row.id} className="nurse-queue-item stage-pending">
                <span className="queue-order">#{index + 1}</span>
                <div className="queue-patient-info">
                  <span className="queue-patient-name">{row.patient_name ?? 'patient'}</span>
                </div>
                <div className="queue-actions">
                  <button
                    type="button"
                    className="btn-small"
                    onClick={() => onApprove(row.id)}
                  >
                    approve to waiting
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
