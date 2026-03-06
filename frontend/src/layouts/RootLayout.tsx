// top-level layout route that wraps every page in the app.
// renders the global header, an optional welcome banner for logged-in users,
// the current route's content via <Outlet />, and the login modal.
// sits directly inside <AuthProvider> in the route tree so it can read auth state.

import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import LoginModal from '../components/LoginModal'
import { useAuth } from '../context/AuthContext'

// pulls auth state from context to decide whether to show the welcome banner
// and to pass the login modal's open/close state. all child routes render
// in place of <Outlet />.
export default function RootLayout() {
  const { profile, loading, loginOpen, closeLogin } = useAuth()

  return (
    <>
      <Header />
      {!loading && profile && (
        <div className="welcome-banner">
          welcome {profile.full_name ?? 'user'}
        </div>
      )}
      <Outlet />
      <LoginModal isOpen={loginOpen} onClose={closeLogin} />
    </>
  )
}
