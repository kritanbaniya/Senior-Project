import { useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import './style.css'
import Header from './Header'
import ClinicInfo from './pages/ClinicInfo'
import PatientDashboard from './pages/DashBoard/PatientDashboard'
import NurseDashBoard from './pages/DashBoard/NurseDashBoard'
import LoginModal from './components/LoginModal'

function HomePage() {
  return (
    <div className="home-page info-box homepage-landing">
      <h1 className="page-title">CLINIC IQ</h1>
      <p className="homepage-subtitle">Choose where you want to go</p>
      <div className="homepage-actions">
        <Link to="/dashboard/patient" className="homepage-card">
          <span className="homepage-card-title">Patient</span>
          <span className="homepage-card-desc">Patient portal — appointments, queue, records</span>
        </Link>
        <Link to="/dashboard/nurse" className="homepage-card">
          <span className="homepage-card-title">Staff</span>
          <span className="homepage-card-desc">Nurse dashboard — queue & appointments</span>
        </Link>
        <Link to="/clinic-nearby" className="homepage-card">
          <span className="homepage-card-title">Clinic Nearby</span>
          <span className="homepage-card-desc">Find and check in at nearby clinics</span>
        </Link>
      </div>
    </div>
  )
}

function ClinicNearby() {
  const navigate = useNavigate()
  return (
    <div className="home-page info-box">
      <h1 className="page-title">CLINIC Nearby</h1>
      <div className="frame">
        <h1 className="left_title">CLINIC 1</h1>
        <h2 className="left_title">Location...</h2>
        <h2 className="left_title">...</h2>
        <div className="card">
          <button onClick={() => navigate('/clinic')}>
            Check
          </button>
        </div>
        <p className="read-the-docs" />
      </div>
      <Link to="/" className="back-link">← Back to Home</Link>
    </div>
  )
}

function App() {
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <>
      <Header onLoginClick={() => setLoginOpen(true)} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clinic-nearby" element={<ClinicNearby />} />
        <Route path="/clinic" element={<ClinicInfo />} />
        <Route path="/dashboard/patient" element={<PatientDashboard />} />
        <Route path="/dashboard/nurse" element={<NurseDashBoard />} />
      </Routes>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}

export default App
