import { Link } from "react-router-dom";

function Panel({
  title,
  subtitle,
  variant,
  to,
}: {
  title: string;
  subtitle: string;
  variant: "light" | "accent";
  to: string;
}) {
  return (
    <div className={`panel ${variant}`}>
      <h3>{title}</h3>
      <p className="muted">{subtitle}</p>

      <div className="field">
        <input type="text" placeholder="Email or Username" />
      </div>
      <div className="field">
        <input type="password" placeholder="Password" />
      </div>

      <Link to="/reset-password" className="link">
        Forgot password?
      </Link>

      <Link to={to} className={`btn ${variant === "accent" ? "btn-accent" : "btn-primary"} full`}>
        Login
      </Link>
    </div>
  );
}

export default function LoginPanels() {
  return (
    <section className="login-section">
      <div className="panels">
        <Panel
          title="Patient Login"
          subtitle="For patients managing personal health records"
          variant="light"
          to="/dashboard/patient"
        />

        <Panel
          title="Provider Login"
          subtitle="For healthcare professionals managing patient care."
          variant="accent"
          to="/dashboard/clinic"
        />
      </div>

      <div className="signup-pill">
        <span>New to ClinicIQ?</span>
        <Link to="/signup">Sign Up</Link>
      </div>
    </section>
  );
}