import { Link } from "react-router-dom";

export default function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">IQ</span>
          <span className="brand-text">ClinicIQ</span>
        </Link>

        <nav className="navlinks">
          <Link to="/about">About</Link>
          <Link to="/help">Help</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/login" className="btn btn-primary">Login</Link>
        </nav>
      </div>
    </header>
  );
}