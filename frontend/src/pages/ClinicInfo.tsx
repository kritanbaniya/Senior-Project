import { Link } from 'react-router-dom'

export default function ClinicInfo() {
  return (
    <div className="clinic-info-page">
      <h1 className="page-title">Clinic Information</h1>

      <div className="info-box clinic-box">
        <h2 className="info-box-title">Clinic Information</h2>
        <div className="info-box-content">
          <p><strong>Clinic Name:</strong> CLINIC 1</p>
          <p><strong>Address:</strong> Location...</p>
          <p><strong>Phone:</strong> ...</p>
          <p><strong>Hours:</strong> Mon–Fri 9:00–18:00</p>
        </div>
      </div>

      <div className="info-box doctor-box">
        <h2 className="info-box-title">Doctor Information</h2>
        <div className="info-box-content">
          <p><strong>Doctor Name:</strong> ...</p>
          <p><strong>Department:</strong> ...</p>
          <p><strong>Specialty:</strong> ...</p>
        </div>
      </div>

      <Link to="/" className="back-link">← Back to Home</Link>
    </div>
  )
}
