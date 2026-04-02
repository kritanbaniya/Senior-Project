import { Link, useLocation } from 'react-router-dom'
import type { ClinicRow } from './Dashboard/Clinic/ClinicADashBoard'

export default function ClinicInfo() {
  const location = useLocation()
  const state = location.state as { clinicId?: string; clinic?: ClinicRow } | null
  const clinic = state?.clinic

  const formatAddress = (c: ClinicRow) => {
    const parts = [c.address_line1, c.address_line2, c.city, c.state, c.zip_code].filter(Boolean)
    return parts.length ? parts.join(', ') : 'No address available'
  }

  if (!clinic) {
    return (
      <div className="clinic-info-page">
        <h1 className="page-title">Clinic Information</h1>
        <div className="info-box clinic-box">
          <h2 className="info-box-title">No clinic selected</h2>
          <div className="info-box-content">
            <p>Please go back and choose a clinic first.</p>
          </div>
        </div>
        <div className="clinic-info-actions">
          <Link to="/clinic-discovery" className="back-link">← Back to Clinic Discovery</Link>
          <Link to="/clinic-nearby" className="back-link">← Back to Clinics Nearby</Link>
          <Link to="/" className="back-link">← Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="clinic-info-page">
      <h1 className="page-title">Clinic Information</h1>

      <div className="info-box clinic-box">
        <h2 className="info-box-title">Clinic Information</h2>
        <div className="info-box-content">
          <p><strong>Clinic Name:</strong> {clinic.clinic_name}</p>
          <p><strong>Specialty:</strong> {clinic.specialty ?? 'Not specified'}</p>
          <p><strong>Address:</strong> {formatAddress(clinic)}</p>
          <p><strong>Phone:</strong> {clinic.phone ?? 'Not provided'}</p>
          <p><strong>Email:</strong> {clinic.email ?? 'Not provided'}</p>
          {clinic.website && (
            <p>
              <strong>Website:</strong>{' '}
              <a
                href={clinic.website.startsWith('http') ? clinic.website : `https://${clinic.website}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {clinic.website}
              </a>
            </p>
          )}
          {clinic.description && (
            <p><strong>Description:</strong> {clinic.description}</p>
          )}
        </div>
      </div>

      <div className="info-box doctor-box">
        <h2 className="info-box-title">Doctor Information</h2>
        <div className="info-box-content">
          <p><strong>Doctor Name:</strong> Coming soon</p>
          <p><strong>Department:</strong> Coming soon</p>
          <p><strong>Specialty:</strong> {clinic.specialty ?? 'Not specified'}</p>
        </div>
      </div>

      <Link to="/" className="back-link">← Back to Home</Link>
    </div>
  )
}
