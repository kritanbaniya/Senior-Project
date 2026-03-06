import type { QueuePersonView } from '../types'

type ActiveQueuePanelProps = {
  rows: QueuePersonView[]
  onMove: (row: QueuePersonView, direction: 'up' | 'down') => void
  onCallNext: () => void
}

export default function ActiveQueuePanel({ rows, onMove, onCallNext }: ActiveQueuePanelProps) {
  return (
    <div className="info-box queue-section">
      <h2 className="info-box-title">Live service queue</h2>
      <div className="info-box-content">
        <div className="form-actions">
          <button type="button" className="btn-primary" onClick={onCallNext} disabled={!rows.length}>
            call next patient
          </button>
        </div>
        {!rows.length ? (
          <p className="no-queue">No patients waiting in active queue.</p>
        ) : (
          <ol className="nurse-queue-list">
            {rows.map((row, index) => (
              <li key={row.id} className={`nurse-queue-item stage-${row.status}`}>
                <span className="queue-order">#{index + 1}</span>
                <div className="queue-patient-info">
                  <span className="queue-patient-name">{row.patient_name}</span>
                  <span className="queue-apt-type">{row.status}</span>
                </div>
                <div className="queue-actions">
                  <button
                    type="button"
                    className="btn-small"
                    disabled={index === 0}
                    onClick={() => onMove(row, 'up')}
                  >
                    up
                  </button>
                  <button
                    type="button"
                    className="btn-small"
                    disabled={index === rows.length - 1}
                    onClick={() => onMove(row, 'down')}
                  >
                    down
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
