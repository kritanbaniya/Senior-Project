function Header() {
  return (
    <header className="header">
      <a href="/" className="header-logo">CLINIC IQ</a>
      <nav className="header-nav">
        <a href="/">Home</a>
        <a href="/patients">About</a>
        <a href="/appointments">Contact</a>
        <a href="/settings">Login</a>
      </nav>
    </header>
  )
}

export default Header
