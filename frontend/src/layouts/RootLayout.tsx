// top-level layout route that wraps every page in the app.
// renders the global header, the current route's content via <Outlet />, and the login modal.
// sits directly inside <AuthProvider> in the route tree so it can read auth state.

import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import LoginModal from '../components/LoginModal'
import { useAuth } from '../context/AuthContext'

// passes the login modal's open/close state. all child routes render
// in place of <Outlet />.
export default function RootLayout() {
  const { loginOpen, closeLogin } = useAuth()

  return (
    <>
      <Header />
      <Outlet />
      <LoginModal isOpen={loginOpen} onClose={closeLogin} />
    </>
  )
}
