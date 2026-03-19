

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'





export default function PatientSideBar(){


  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

return(<>
      <aside className={`pd-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="pd-sidebar-header">
          <Link to="/" className="pd-sidebar-logo"><span>ClinicIQ</span></Link>
          <button type="button" className="pd-sidebar-toggle" onClick={() => setSidebarCollapsed((c) => !c)} aria-label="Toggle sidebar">
            {sidebarCollapsed ? '->' : '<-'}
          </button>
        </div>
        <nav className="pd-nav">
          <Link to="/dashboard/patient" className="pd-nav-item">Overview</Link>
          <a href="/dashboard/patient/appointments" className="pd-nav-item">Appointments</a>
          <a href="/dashboard/patient#records" className="pd-nav-item">Records</a>
          <a href="/dashboard/patient#medications" className="pd-nav-item">Medications</a>
          <a href="/dashboard/patient#vitals" className="pd-nav-item">Vitals</a>
          <a href="/dashboard/patient#lab" className="pd-nav-item">Lab results</a>
          <Link to="/dashboard/patient/information" className="pd-nav-item active">Your information</Link>
          <Link to="/clinic" className="pd-nav-item">Clinic info</Link>
        </nav>
      </aside></>);

}