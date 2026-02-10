import { Link } from 'react-router-dom'

interface HeaderProps {
  onLoginClick?: () => void
}

function Header({ onLoginClick }: HeaderProps) {
  return (
    <header className="header">
      <Link to="/" className="header-logo">CLINIC IQ</Link>
      <nav className="header-nav">
        <Link to="/">Home</Link>
        <a href="/patients">About</a>
        <a href="/appointments">Contact</a>
        <a
          href="/settings"
          onClick={(e) => {
            e.preventDefault()
            onLoginClick?.()
          }}
        >
          Login
        </a>
      </nav>
    </header>
  )
}

export default Header
