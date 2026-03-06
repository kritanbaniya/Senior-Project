import { Link, useNavigate } from 'react-router-dom'
import { useClinicContext } from '../context/ClinicContext'

const DEMO_CLINICS = [
  {
    clinic_id: 'f371acba-107c-4a5b-8d5a-963bbcfab16d',
    clinic_name: 'Demo Family Clinic',
    address: '123 Demo Street',
    city: 'New York',
    state: 'NY',
  },
]

export default function ClinicNearby() {
  const navigate = useNavigate()
  const { setSelectedClinicId } = useClinicContext()
  return (
    <div className="home-page info-box">
      <h1 className="page-title">Clinic Nearby</h1>
      <div className="frame">
        {DEMO_CLINICS.map((clinic) => (
          <div key={clinic.clinic_id} className="info-box clinic-box">
            <h2 className="info-box-title">{clinic.clinic_name}</h2>
            <div className="info-box-content">
              <p>
                <strong>Address:</strong> {clinic.address}, {clinic.city}, {clinic.state}
              </p>
              <div className="card">
                <button
                  onClick={() => {
                    setSelectedClinicId(clinic.clinic_id)
                    navigate('/dashboard/patient', { state: { clinicId: clinic.clinic_id } })
                  }}
                >
                  Enter queue
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Link to="/" className="back-link">&larr; Back to Home</Link>
    </div>
  )
}
