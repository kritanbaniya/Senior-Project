// layout route for /dashboard/system-admin.
// wraps the sidebar, header, and an <Outlet /> for child pages.
// currently hosts SystemAdminClinicApprovals as the index route.

import { useState } from "react"
import { Link, Outlet } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import SystemAdminSideBar from "./SystemAdminSideBar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function SystemAdminDashboard() {
  const { profile, logout } = useAuth()
  const displayName = profile?.full_name?.trim() || "System Admin"
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          "--sidebar-width": "15rem",
          "--sidebar-width-mobile": "10rem",
        } as React.CSSProperties
      }
    >
      <SystemAdminSideBar />

      <SidebarInset className="min-h-[calc(100vh-60px)]">
        <div className="flex min-h-[calc(100vh-60px)] flex-col">
          <header className="pd-header">
            <div className="pd-header-left">
              <h1 className="pd-header-title">System Admin</h1>
              <span className="pd-header-patient">{displayName}</span>
            </div>

            <div className="pd-header-actions">
              <div className="pd-profile-wrap">
                <button
                  type="button"
                  className="pd-profile-btn"
                  onClick={() => setProfileOpen((o) => !o)}
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                >
                  <span className="pd-avatar">
                    {displayName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="pd-profile-name">{displayName}</span>
                  <span className="pd-chevron">v</span>
                </button>

                {profileOpen && (
                  <div className="pd-dropdown" role="menu">
                    <Link
                      to="/"
                      className="pd-dropdown-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      Home
                    </Link>

                    <Link
                      to="/dashboard/system-admin"
                      className="pd-dropdown-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      Dashboard
                    </Link>

                    <button
                      type="button"
                      className="pd-dropdown-item"
                      onClick={() => {
                        setProfileOpen(false)
                        void logout()
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="pd-main">
            <div className="w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
