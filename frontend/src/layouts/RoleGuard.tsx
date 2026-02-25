// react-router layout route that enforces per-role access within the dashboard.
// nested under DashboardGuard so the user is already authenticated by the time
// this runs. if the user's role does not match the allowedRole prop it redirects
// them to their own dashboard instead of showing forbidden content.

import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// maps each role to its dashboard base path, used for redirects.
const ROLE_TO_PATH: Record<string, string> = {
  patient: '/dashboard/patient',
  nurse: '/dashboard/nurse',
  doctor: '/dashboard/doctor',
  clinic: '/dashboard/clinic',
}

// returns the dashboard path for a given role, or "/" if the role is unknown.
// exported so other components (e.g. sidebar links) can resolve a role to a url.
export function getDashboardPathForRole(role: string | null): string {
  if (!role || !ROLE_TO_PATH[role]) return '/'
  return ROLE_TO_PATH[role]
}

interface RoleGuardProps {
  allowedRole: string
}

// compares the user's role from AuthContext against allowedRole.
// renders child routes via <Outlet /> on match, otherwise navigates away.
export default function RoleGuard({ allowedRole }: RoleGuardProps) {
  const { profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (profile && profile.role !== allowedRole) {
      navigate(getDashboardPathForRole(profile.role), { replace: true })
    }
  }, [profile, allowedRole, navigate])

  if (!profile || profile.role !== allowedRole) {
    return null
  }

  return <Outlet />
}
