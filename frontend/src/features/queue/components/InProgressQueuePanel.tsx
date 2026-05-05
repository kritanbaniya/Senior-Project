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
          <ol className="nurse-queue-list">
            {rows.map((row, index) => (
              <li key={row.id} className="nurse-queue-item stage-in_progress">
                <span className="queue-order">#{index + 1}</span>
                <div className="queue-patient-info">
                  <span className="queue-patient-name">{row.patient_name ?? 'patient'}</span>
                  <span className="queue-apt-type">{row.status}</span>
                  {row.appointment?.clinician_name && (
                    <span className="queue-doctor">
                      {row.appointment.clinician_name}
                    </span>
                  )}
                </div>
                <div className="queue-actions">
                  <button
                    type="button"
                    className="btn-small"
                    onClick={() => onComplete(row.id)}
                  >
                    mark completed
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
