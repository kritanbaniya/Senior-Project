


import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'





export default function NurseSideBar(){


  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)





return(<> 
{/* Left sidebar */}
        <aside className={`pd-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="pd-sidebar-header">
            <Link to="/" className="pd-sidebar-logo"><span>ClinicIQ</span></Link>
            <button type="button" className="pd-sidebar-toggle" onClick={() => setSidebarCollapsed((c) => !c)} aria-label="Toggle sidebar">
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
          <nav className="pd-nav">
            <a href="#overview" className="pd-nav-item active">Overview</a>
            <a href="/dashboard/nurse/appointments" className="pd-nav-item">Appointments</a>
            <a href="#records" className="pd-nav-item">Records</a>
            <a href="#medications" className="pd-nav-item">Medications</a>
            <a href="#vitals" className="pd-nav-item">Vitals</a>
            <a href="#lab" className="pd-nav-item">Lab results</a>
            <Link to="/dashboard/patient/information" className="pd-nav-item">Your information</Link>
            <Link to="/clinic" className="pd-nav-item">Clinic info</Link>
          </nav>
        </aside>
          </>);

}