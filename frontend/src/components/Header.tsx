// global navigation bar shown on every page via RootLayout.
// reads auth state from AuthContext to toggle between a login link
// and a logout button. no props needed thanks to the context.

import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// renders the site logo, nav links, and an auth action button.
// when logged out, clicking "login" calls openLogin() which makes
// the LoginModal visible in RootLayout.
function Header() {
  const { profile, openLogin, logout } = useAuth();
  const isLoggedIn = !!profile;

  return (
    <header className="header">
  <div className="header-inner">
    <Link to="/" className="header-brand">
      <img src="/assets/ClinicIQ Logo.png" className="header-logo" alt="ClinicIQ" />
      <span className="header-brand-text">ClinicIQ</span>
    </Link>

    <nav className="header-nav">
      <NavLink to="/about" className="header-link">About</NavLink>
      <NavLink to="/help" className="header-link">Help</NavLink>
      <NavLink to="/contact" className="header-link">Contact Us</NavLink>

    {isLoggedIn ? (
    <button type="button" className="header-logout-button" onClick={logout}>
      Log Out
    </button>
    ) : (
    <button type="button" className="header-login-button" onClick={openLogin}>
      Login
    </button>
    )}
    </nav>
  </div>
</header>
  );
}

export default Header;