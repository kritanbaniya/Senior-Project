


import { useState  } from 'react'
import { NavLink, Link } from 'react-router-dom'





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
            <NavLink to="/dashboard/nurse" end className={({ isActive }) => `pd-nav-item ${isActive ? 'active' : ''}`}>Overview</NavLink>
            <NavLink to="/dashboard/nurse/appointments" className={({ isActive }) => `pd-nav-item ${isActive ? 'active' : ''}`}>Appointments</NavLink>
            <NavLink to="/dashboard/nurse/queue" className={({ isActive }) => `pd-nav-item ${isActive ? 'active' : ''}`}>Queue</NavLink>
            <a href="#records" className="pd-nav-item">Records</a>
            <a href="#medications" className="pd-nav-item">Medications</a>
            <a href="#vitals" className="pd-nav-item">Vitals</a>
            <a href="#lab" className="pd-nav-item">Lab results</a>
            <NavLink to="/dashboard/nurse/information" className={({ isActive }) => `pd-nav-item ${isActive ? 'active' : ''}`}>Your information</NavLink>
            <NavLink to="/clinic" className="pd-nav-item">Clinic info</NavLink>
          </nav>
        </aside>
          </>);

}