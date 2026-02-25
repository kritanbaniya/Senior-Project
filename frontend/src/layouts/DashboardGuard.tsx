// react-router layout route that protects all /dashboard/* paths.
// if the user is not authenticated it redirects to the home page.
// nested inside RootLayout in the route tree; renders <Outlet /> so
// child role guards and dashboard pages appear within it.

import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// checks auth from AuthContext. shows a loading state while the session is
// being resolved, redirects unauthenticated visitors to "/", and renders
// child routes via <Outlet /> once a valid profile is confirmed.
export default function DashboardGuard() {
  const { profile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !profile) {
      navigate('/', { replace: true })
    }
  }, [loading, profile, navigate])

  if (loading) {
    return <div className="clinic-info-page">Loading...</div>
  }

  if (!profile) {
    return null
  }

  return <Outlet />
}
