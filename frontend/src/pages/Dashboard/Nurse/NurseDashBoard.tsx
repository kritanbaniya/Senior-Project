import { Link } from 'react-router-dom'
import { useClinicContext } from '../../../context/ClinicContext'
import ActiveQueuePanel from '../../../features/queue/components/ActiveQueuePanel'
import ClinicSelector from '../../../features/queue/components/ClinicSelector'
import InProgressQueuePanel from '../../../features/queue/components/InProgressQueuePanel'
import PendingQueuePanel from '../../../features/queue/components/PendingQueuePanel'
import { useNurseQueue } from '../../../features/queue/useNurseQueue'
import NurseAppointmentManager from './NurseAppointmentManager'

export default function NurseDashBoard() {
  const { selectedClinicId, setSelectedClinicId } = useClinicContext()
  const {
    loading,
    error,
    clinics,
    canManageQueue,
    pendingRows,
    activeRows,
    inProgressRows,
    approvePending,
    moveRow,
    callNextPatient,
    markCompleted,
  } = useNurseQueue(selectedClinicId)

  return (
    <div className="nurse-dashboard">
      <h1 className="page-title">Nurse Dashboard</h1>

      <div className="info-box queue-section">
        <h2 className="info-box-title">Clinic selection</h2>
        <div className="info-box-content">
          <ClinicSelector
            clinics={clinics}
            selectedClinicId={selectedClinicId}
            onSelect={(clinicId) => setSelectedClinicId(clinicId)}
          />
        </div>
      </div>

      {selectedClinicId && !canManageQueue && (
        <div className="info-box queue-section">
          <h2 className="info-box-title">Queue access</h2>
          <div className="info-box-content">
            <p className="no-queue">You do not have permission to manage the queue for this clinic.</p>
          </div>
        </div>
      )}

      {selectedClinicId && canManageQueue && (
        <>
          <PendingQueuePanel rows={pendingRows} onApprove={approvePending} />
          <ActiveQueuePanel rows={activeRows} onMove={moveRow} onCallNext={callNextPatient} />
          <InProgressQueuePanel rows={inProgressRows} onComplete={markCompleted} />
        </>
      )}

      {loading && <p className="no-queue">Loading queue...</p>}
      {error && <p className="no-queue">{error}</p>}

      <NurseAppointmentManager />

      <div className="info-box quick-actions-box">
        <h2 className="info-box-title">Quick actions</h2>
        <div className="info-box-content quick-actions">
          <Link to="/dashboard/nurse/information" className="action-link">
            Your information
          </Link>
          <Link to="/dashboard/patient" className="action-link">
            Patient portal
          </Link>
          <Link to="/clinic" className="action-link">
            Clinic info
          </Link>
          <Link to="/" className="action-link">
            Home
          </Link>
        </div>
      </div>

      <Link to="/" className="back-link">
        ← Back to Home
      </Link>
    </div>
  )
}
