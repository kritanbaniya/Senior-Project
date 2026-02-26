// global navigation bar shown on every page via RootLayout.
// reads auth state from AuthContext to toggle between a login link
// and a logout button. no props needed thanks to the context.

import { Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// renders the site logo, nav links, and an auth action button.
// when logged out, clicking "login" calls openLogin() which makes
// the LoginModal visible in RootLayout.
function Header() {
  const { profile, openLogin, logout } = useAuth()
  const isLoggedIn = !!profile

  return (
    <header className="header">
      <Link to="/" className="header-logo">CLINIC IQ</Link>
      <nav className="header-nav">
        <Link to="/">Home</Link>
        <a href="/patients">About</a>
        <a href="/appointments">Contact</a>
        {isLoggedIn ? (
          <button
            type="button"
            className="header-logout-button"
            onClick={logout}
          >
            log out
          </button>
        ) : (
          <a
            href="/settings"
            onClick={(e) => {
              e.preventDefault()
              openLogin()
            }}
          >
            login
          </a>
        )}
      </nav>
    </header>
  )
}

export default Header
