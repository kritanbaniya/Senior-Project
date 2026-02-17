import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import './style.css'
import Header from './Header'
import ClinicInfo from './pages/ClinicInfo'
import LoginModal from './components/LoginModal'
import DoctorDashboard from './pages/DoctorDashboard'

function HomePage() {
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
        <Route path="/clinic" element={<ClinicInfo />} />
        <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
      </Routes>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}

export default App
