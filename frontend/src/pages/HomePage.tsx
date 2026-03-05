import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="home-page info-box homepage-landing">
      <h1 className="page-title">CLINIC IQ</h1>
      <p className="homepage-subtitle">Choose where you want to go</p>
      <div className="homepage-actions">
        <Link to="/dashboard/patient" className="homepage-card">
          <span className="homepage-card-title">DashBoard</span>
          <span className="homepage-card-desc">go to your own dashboard</span>
        </Link>
        
        <Link to="/clinic-discovery" className="homepage-card">
          <span className="homepage-card-title">Clinic Nearby</span>
          <span className="homepage-card-desc">Find and check in at nearby clinics</span>
        </Link>
      </div>
    </div>
  )
}
