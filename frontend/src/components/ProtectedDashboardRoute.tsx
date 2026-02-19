import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

const ROLE_TO_PATH: Record<string, string> = {
  patient: '/dashboard/patient',
  nurse: '/dashboard/nurse',
  doctor: '/dashboard/doctor',
  clinic: '/dashboard/clinic',
}

export function getDashboardPathForRole(role: string | null): string {
  if (!role || !ROLE_TO_PATH[role]) return '/'
  return ROLE_TO_PATH[role]
}

type Profile = { full_name: string | null; role: string | null } | null

interface ProtectedDashboardRouteProps {
  allowedRole: string
  profile: Profile
  loadingProfile: boolean
  children: ReactNode
}

export default function ProtectedDashboardRoute({
  allowedRole,
  profile,
  loadingProfile,
  children,
}: ProtectedDashboardRouteProps) {
  const navigate = useNavigate()

  useEffect(() => {
    if (loadingProfile) return
    if (!profile) {
      navigate('/', { replace: true })
      return
    }
    if (profile.role !== allowedRole) {
      navigate(getDashboardPathForRole(profile.role), { replace: true })
    }
  }, [loadingProfile, profile, allowedRole, navigate])

  if (loadingProfile) {
    return <div className="clinic-info-page">Loading...</div>
  }
  if (!profile) {
    return null
  }
  if (profile.role !== allowedRole) {
    return null
  }
  return <>{children}</>
}
