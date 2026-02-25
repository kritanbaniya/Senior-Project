import { Link } from 'react-router-dom'

interface HeaderProps {
  onLoginClick?: () => void
  onLogoutClick?: () => void
  isLoggedIn?: boolean
  fullName?: string | null
}

function Header({ onLoginClick, onLogoutClick, isLoggedIn }: HeaderProps) {
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
            onClick={onLogoutClick}
          >
            log out
          </button>
        ) : (
          <a
            href="/settings"
            onClick={(e) => {
              e.preventDefault()
              onLoginClick?.()
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