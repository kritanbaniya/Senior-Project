import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

type ClinicSideBarProps = {
  clinicCreated: boolean
}

export default function ClinicSideBar({ clinicCreated }: ClinicSideBarProps) {
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
        <span
          className="pd-nav-item pd-nav-item-disabled"
          style={{ opacity: clinicCreated ? 1 : 0.4 }}
          aria-disabled="true"
        >
          Queue Management
        </span>
        <span
          className="pd-nav-item pd-nav-item-disabled"
          style={{ opacity: clinicCreated ? 1 : 0.4 }}
          aria-disabled="true"
        >
          Staff
        </span>
        <span
          className="pd-nav-item pd-nav-item-disabled"
          style={{ opacity: clinicCreated ? 1 : 0.4 }}
          aria-disabled="true"
        >
          Settings
        </span>
      </nav>
    </aside>
  )
}
