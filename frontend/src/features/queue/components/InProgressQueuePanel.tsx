import type { QueueEntryRow } from '../types'

type InProgressQueuePanelProps = {
  rows: QueueEntryRow[]
  onComplete: (entryId: string) => void
}

export default function InProgressQueuePanel({ rows, onComplete }: InProgressQueuePanelProps) {
  return (
    <div className="info-box queue-section">
      <h2 className="info-box-title">In progress visits</h2>
      <div className="info-box-content">
        {!rows.length ? (
          <p className="no-queue">No patients in progress.</p>
        ) : (
          <ul className="appointment-list">
            {rows.map((row) => (
              <li key={row.id} className="appointment-item nurse-apt-item">
                <span className="apt-patient">{row.patient_name ?? 'patient'}</span>
                <span className="apt-type">{row.status}</span>
                <button
                  type="button"
                  className="btn-small"
                  onClick={() => onComplete(row.id)}
                >
                  mark completed
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
