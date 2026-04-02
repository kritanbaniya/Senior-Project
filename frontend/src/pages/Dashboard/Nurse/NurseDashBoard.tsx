import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useClinicContext } from '../../../context/ClinicContext'
import ClinicSelector from '../../../features/queue/components/ClinicSelector'
import { fetchNurseClinicPermissions } from '../../../features/queue/api'
import type { ClinicListItem, StaffPermissionRow } from '../../../features/queue/types'
import NurseSideBar from './NurseSideBar'

type NurseClinicPermission = ClinicListItem & StaffPermissionRow

export default function NurseDashBoard() {
  const { selectedClinicId, setSelectedClinicId } = useClinicContext()
  const [clinics, setClinics] = useState<NurseClinicPermission[]>([])
  const [clinicsLoading, setClinicsLoading] = useState(true)
  const [clinicsError, setClinicsError] = useState<string | null>(null)

  useEffect(() => {
    const loadClinicPermissions = async () => {
      setClinicsLoading(true)
      setClinicsError(null)
      try {
        const data = await fetchNurseClinicPermissions()
        setClinics(data)
      } catch (err) {
        setClinicsError(err instanceof Error ? err.message : 'failed to load clinic permissions')
      } finally {
        setClinicsLoading(false)
      }
    }

    void loadClinicPermissions()
  }, [])

  return (
    <div className="pd-layout">
      <NurseSideBar />

      <div className="pd-right">
        <header className="pd-header">
          <div className="pd-header-left">
            <h1 className="pd-header-title">Nurse dashboard</h1>
            <span className="pd-header-patient">Overview</span>
          </div>

          <div className="pd-header-actions nurse-overview-header-actions">
            <section className="nurse-overview-clinic-box">
              <h2 className="nurse-overview-clinic-title">Clinic selection</h2>
              {clinicsLoading && <p className="no-queue">Loading clinics...</p>}
              {!clinicsLoading && clinicsError && <p className="no-queue">{clinicsError}</p>}
              {!clinicsLoading && !clinicsError && (
                <ClinicSelector
                  clinics={clinics}
                  selectedClinicId={selectedClinicId}
                  onSelect={(clinicId) => setSelectedClinicId(clinicId)}
                />
              )}
            </section>
          </div>
        </header>

        <main className="pd-main nurse-dashboard nurse-overview-main">
          <div className="info-box quick-actions-box">
            <h2 className="info-box-title">Quick actions</h2>
            <div className="info-box-content quick-actions">
              <Link to="/dashboard/nurse/appointments" className="action-link">
                Appointments
              </Link>
              <Link to="/dashboard/nurse/queue" className="action-link">
                Queue management
              </Link>
              <Link to="/dashboard/nurse/information" className="action-link">
                Your information
              </Link>
              <Link to="/clinic" className="action-link">
                Clinic info
              </Link>
            </div>
          </div>

          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
        </main>
      </div>
    </div>
  )
}
