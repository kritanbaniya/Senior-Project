import { Link, useNavigate } from 'react-router-dom'

export default function ClinicNearby() {
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
      <Link to="/" className="back-link">&larr; Back to Home</Link>
    </div>
  )
}
