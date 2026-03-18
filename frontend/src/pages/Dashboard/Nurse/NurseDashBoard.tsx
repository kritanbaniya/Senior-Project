import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useClinicContext } from '../../../context/ClinicContext'
import ActiveQueuePanel from '../../../features/queue/components/ActiveQueuePanel'
import ClinicSelector from '../../../features/queue/components/ClinicSelector'
import InProgressQueuePanel from '../../../features/queue/components/InProgressQueuePanel'
import PendingQueuePanel from '../../../features/queue/components/PendingQueuePanel'
import { useNurseQueue } from '../../../features/queue/useNurseQueue'
import NurseAppointmentManager from './NurseAppointmentManager'
import AppointmentSwitch from '@/features/appointment/AppointmentSwitch'


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
    callSinglePatient,
    beginVisit,
    noShow,
    markCompleted,
  } = useNurseQueue(selectedClinicId)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)


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
      )}

      {loading && <p className="no-queue">Loading queue...</p>}
      {error && <p className="no-queue">{error}</p>}







      <div className = "pd-layout">
        {/* Left sidebar */}
        <aside className={`pd-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="pd-sidebar-header">
            <Link to="/" className="pd-sidebar-logo"><span>ClinicIQ</span></Link>
            <button type="button" className="pd-sidebar-toggle" onClick={() => setSidebarCollapsed((c) => !c)} aria-label="Toggle sidebar">
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
          <nav className="pd-nav">
            <a href="#overview" className="pd-nav-item active">Overview</a>
            <a href="#appointments" className="pd-nav-item">Appointments</a>
            <a href="#records" className="pd-nav-item">Records</a>
            <a href="#medications" className="pd-nav-item">Medications</a>
            <a href="#vitals" className="pd-nav-item">Vitals</a>
            <a href="#lab" className="pd-nav-item">Lab results</a>
            <Link to="/dashboard/patient/information" className="pd-nav-item">Your information</Link>
            <Link to="/clinic" className="pd-nav-item">Clinic info</Link>
          </nav>
        </aside>
        <div className = "pd-right">
          <AppointmentSwitch/>
          <NurseAppointmentManager /></div>
          
      </div>











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
