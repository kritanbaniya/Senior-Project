import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function ClinicSideBar() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <aside className={`pd-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="pd-sidebar-header">
        <Link to="/" className="pd-sidebar-logo">
          <span>ClinicIQ</span>
        </Link>
        <button
          type="button"
          className="pd-sidebar-toggle"
          onClick={() => setSidebarCollapsed((c) => !c)}
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? '->' : '<-'}
        </button>
      </div>
      <nav className="pd-nav">
        <NavLink
          to="/dashboard/clinic"
          end
          className={({ isActive }) => `pd-nav-item ${isActive ? 'active' : ''}`}
        >
          Overview
        </NavLink>
        <NavLink
          to="/dashboard/clinic/my-clinic"
          className={({ isActive }) => `pd-nav-item ${isActive ? 'active' : ''}`}
        >
          My Clinic
        </NavLink>
        <span className="pd-nav-item pd-nav-item-disabled" style={{ opacity: 0.4 }} aria-disabled="true">
          Queue Management
        </span>
        <span className="pd-nav-item pd-nav-item-disabled" style={{ opacity: 0.4 }} aria-disabled="true">
          Staff
        </span>
        <span className="pd-nav-item pd-nav-item-disabled" style={{ opacity: 0.4 }} aria-disabled="true">
          Settings
        </span>
      </nav>
    </aside>
  )
}
