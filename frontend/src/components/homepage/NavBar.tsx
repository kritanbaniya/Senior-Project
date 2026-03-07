//This Navigation Bar is leftover from the original template. It is not currently used in the application, but it may be useful for future development. It is a simple navigation bar with links to the home page, about page, help page, contact page, and login page. It also includes a brand logo and name.
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