

import { useState, useEffect } from 'react' 
import { NavLink , Link} from 'react-router-dom'




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
          <NavLink to="/dashboard/patient" end className=  {({ isActive }) => `pd-nav-item ${isActive ? 'active' : ''}`}>Overview</NavLink>
          <NavLink to="/dashboard/patient/appointments" className={({ isActive }) => `pd-nav-item ${isActive ? 'active' : ''}`}>Appointments</NavLink>
          <a href="/dashboard/patient#records" className="pd-nav-item">Records</a>
          <a href="/dashboard/patient#medications" className="pd-nav-item">Medications</a>
          <a href="/dashboard/patient#vitals" className="pd-nav-item">Vitals</a>
          <a href="/dashboard/patient#lab" className="pd-nav-item">Lab results</a>
          <NavLink to="/dashboard/patient/information" className={({ isActive }) => `pd-nav-item ${isActive ? 'active' : ''}`}>Your information</NavLink>
          <NavLink to="/clinic" className="pd-nav-item">Clinic info</NavLink>
        </nav>
      </aside></>);

}