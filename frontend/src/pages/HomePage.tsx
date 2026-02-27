import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <>
      <div className="home-page info-box homepage-landing">
        <h1 className="page-title">Clinic IQ</h1>
        <p className="homepage-subtitle">
        Patient intake and queue management in clinics is full of long, unpredictable wait times and operational inefficiency, often causing patient anxiety and administrative strain. This inefficiency stems from the conventional approach of slow paper form check-ins and old, separate computer systems that don’t talk to each other. To solve this, ClinicIQ is a platform that provides smart clinic discovery, predicted wait times, and remote digital form completion. Simultaneously, it creates an adaptive workflow for staff via a unified dashboard that integrates real-time resource status (like room/machine availability), and task management tools, all upon a universal platform that can be used for any clinic specialty.

        </p>
      </div>

      <div className="home-page info-box homepage-landing">
        <p className="homepage-subtitle">Choose where you want to go</p>
        <div className="homepage-actions">
          <Link to="/dashboard/patient" className="homepage-card">
            <span className="homepage-card-title">DashBoard</span>
            <span className="homepage-card-desc">go to your own dashboard</span>
          </Link>

          <Link to="/clinic-nearby" className="homepage-card">
            <span className="homepage-card-title">Clinic Nearby</span>
            <span className="homepage-card-desc">Find and check in at nearby clinics</span>
          </Link>
        </div>
      </div>
    </>
  )
}
