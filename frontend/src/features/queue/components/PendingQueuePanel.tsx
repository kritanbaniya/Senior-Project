import type { QueuePersonView } from '../types'

type PendingQueuePanelProps = {
  rows: QueuePersonView[]
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
          <ul className="appointment-list">
            {rows.map((row) => (
              <li key={row.id} className="appointment-item nurse-apt-item">
                <span className="apt-patient">{row.patient_name}</span>
                <span className="apt-type">{row.status}</span>
                <button type="button" className="btn-small" onClick={() => onApprove(row.id)}>
                  approve to waiting
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
