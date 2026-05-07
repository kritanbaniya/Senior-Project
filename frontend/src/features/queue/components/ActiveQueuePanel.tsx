import { useState } from 'react'
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
  onCheckForm: (entryId: QueueEntryRow) => void
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
  onCheckForm,
}: ActiveQueuePanelProps) {
  const [uiError, setUiError] = useState<string | null>(null)

  // Fix: Added 'null' to the doctorId type to match Supabase/Database response types
  const handleActionWithValidation = (doctorId: string | null | undefined, action: () => void) => {
    if (!doctorId) {
      setUiError("Please assign a doctor first.")
      return
    }
    setUiError(null)
    action()
  }

  return (
    <div className="info-box queue-section">
      <h2 className="info-box-title">Live service queue</h2>

      <div className="info-box-content">
        {uiError && (
          <div className="ui-error-notice" style={{ 
            color: '#d93025', 
            backgroundColor: '#fdecea', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px', 
            border: '1px solid #d93025' 
          }}>
            <strong>Error:</strong> {uiError}
          </div>
        )}

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
            {rows.map((row, index) => {
              const currentDoctorId = row.appointment?.clinician_id
              // Fix: Removed the unused 'isAssigned' variable to clear the TS warning

              return (
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

                    <select
                      className="queue-doctor-select"
                      value={currentDoctorId ?? ""}
                      onChange={(e) => {
                        setUiError(null)
                        onAssignDoctor(row.id, e.target.value)
                      }}
                    >
                      <option value="" disabled>
                        Select a doctor
                      </option>
                      {doctors.map((doc) => (
                        <option key={doc.user_id} value={doc.user_id}>
                          {doc.full_name ?? 'Doctor'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="queue-actions">
                    <button
                    type="button"
                    className="btn-small"
                    onClick={() => onCheckForm(row)}
                  >
                    Check form
                  </button>
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
                        onClick={() => handleActionWithValidation(currentDoctorId, () => onCallPatient(row.id))}
                      >
                        call
                      </button>
                    )}

                    {row.status === 'called' && (
                      <>
                        <button
                          type="button"
                          className="btn-small"
                          onClick={() => handleActionWithValidation(currentDoctorId, () => onStartVisit(row.id))}
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
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}