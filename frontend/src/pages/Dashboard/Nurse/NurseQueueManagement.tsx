import { Link } from 'react-router-dom'
import { useClinicContext } from '../../../context/ClinicContext'
import ActiveQueuePanel from '../../../features/queue/components/ActiveQueuePanel'
import InProgressQueuePanel from '../../../features/queue/components/InProgressQueuePanel'
import PendingQueuePanel from '../../../features/queue/components/PendingQueuePanel'
import { useNurseQueue } from '../../../features/queue/useNurseQueue'
import NurseSideBar from './NurseSideBar'

export default function NurseQueueManagement() {
  const { selectedClinicId } = useClinicContext()
  const {
    loading,
    error,
    canManageQueue,
    pendingRows,
    activeRows,
    inProgressRows,
    approvePending,
    moveRow,
    callNextPatient,
    callSinglePatient,
    beginVisit,
    noShow,
    markCompleted,
  } = useNurseQueue(selectedClinicId)

  return (
    <div className="pd-layout">
      <NurseSideBar />

      <div className="pd-right">
        <header className="pd-header">
          <div className="pd-header-left">
            <h1 className="pd-header-title">Queue management</h1>
            <span className="pd-header-patient">Nurse dashboard</span>
          </div>
        </header>

        <main className="pd-main nurse-dashboard nurse-queue-page">
          {!selectedClinicId && (
            <div className="info-box queue-section">
              <h2 className="info-box-title">No clinic selected</h2>
              <div className="info-box-content">
                <p className="no-queue">
                  Select a clinic from the overview page before managing the queue.
                </p>
                <Link to="/dashboard/nurse" className="pd-btn pd-btn-primary">
                  Go to overview
                </Link>
              </div>
            </div>
          )}

          {selectedClinicId && !canManageQueue && (
            <div className="info-box queue-section">
              <h2 className="info-box-title">Queue access</h2>
              <div className="info-box-content">
                <p className="no-queue">
                  You do not have permission to manage the queue for this clinic.
                </p>
              </div>
            </div>
          )}

          {selectedClinicId && canManageQueue && (
            loading ? (
              <p className="no-queue">Loading queue status...</p>
            ) : (
              <>
                <PendingQueuePanel rows={pendingRows} onApprove={approvePending} />
                <ActiveQueuePanel
                  rows={activeRows}
                  onMove={moveRow}
                  onCallNext={callNextPatient}
                  onCallPatient={callSinglePatient}
                  onStartVisit={beginVisit}
                  onNoShow={noShow}
                />
                <InProgressQueuePanel rows={inProgressRows} onComplete={markCompleted} />
              </>
            )
          )}

          {error && <p className="no-queue">{error}</p>}
        </main>
      </div>
    </div>
  )
}
