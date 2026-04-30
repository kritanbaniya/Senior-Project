import type { QueueEntryRow } from '../types'

type ActiveQueuePanelProps = {
  rows: QueueEntryRow[]
  doctors: any[]
  onAssignDoctor: (entryId: string, doctorId: string) => void
  onMove: (row: QueueEntryRow, direction: 'up' | 'down') => void
  onCallNext: () => void
  onCallPatient: (entryId: string) => void
  onStartVisit: (entryId: string) => void
  onNoShow: (entryId: string) => void
}

export default function ActiveQueuePanel({
  rows,
  doctors,
  onAssignDoctor,
  onMove,
  onCallNext,
  onCallPatient,
  onStartVisit,
  onNoShow,
}: ActiveQueuePanelProps) {
  return (
    <div className="info-box queue-section">
      <h2 className="info-box-title">Live service queue</h2>

      <div className="info-box-content">
        <div className="form-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={onCallNext}
            disabled={!rows.some((r) => r.status === 'waiting')}
          >
            call next patient
          </button>
        </div>

        {!rows.length ? (
          <p className="no-queue">No patients waiting in active queue.</p>
        ) : (
          <ol className="nurse-queue-list">
            {rows.map((row, index) => (
              <li
                key={row.id}
                className={`nurse-queue-item stage-${row.status}`}
              >
                <span className="queue-order">#{index + 1}</span>

                <div className="queue-patient-info">
                  <span className="queue-patient-name">
                    {row.patient_name ?? 'patient'}
                  </span>

                  <span className="queue-apt-type">
                    {row.status}
                  </span>

                  <span className="queue-doctor">
                    Doctor:{' '}
                    {row.appointment?.clinician_role === 'doctor'
                      ? row.appointment.clinician_name ?? 'Assigned doctor'
                      : 'Assignment required'}
                  </span>

                  {row.status === 'called' && (
                    <select
                      value={
                        row.appointment?.clinician_role === 'doctor'
                          ? row.appointment.clinician_id ?? ''
                          : ''
                      }
                      onChange={(e) => {
                        const doctorId = e.target.value
                        console.log('selected doctor:', doctorId)

                        if (!doctorId) {
                          alert('Please select a doctor to assign.')
                          return
                        }

                        onAssignDoctor(row.id, doctorId)
                      }}
                    >
                      <option value="" disabled>
                        Select a doctor
                      </option>

                      {doctors.map((doc) => (
                        <option key={doc.user_id} value={doc.user_id}>
                          {doc.full_name}
                        </option>
                      ))}
                    </select>
                  )}
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

                  {row.status === 'waiting' && (
                    <button
                      type="button"
                      className="btn-small"
                      onClick={() => onCallPatient(row.id)}
                    >
                      call
                    </button>
                  )}

                  {row.status === 'called' && (
                    <>
                      <button
                        type="button"
                        className="btn-small"
                        onClick={() => {
                          if (row.appointment?.clinician_role !== 'doctor') {
                            alert('Please assign a doctor before starting the visit.')
                            return
                          }

                          onStartVisit(row.id)
                        }}
                      >
                        start visit
                      </button>

                      <button
                        type="button"
                        className="btn-small"
                        onClick={() => onNoShow(row.id)}
                      >
                        no show
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}