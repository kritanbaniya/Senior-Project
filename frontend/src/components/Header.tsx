import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";

function Header() {
  const { profile, openLogin, logout } = useAuth();
  const isLoggedIn = !!profile;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "text-sm font-medium transition-colors",
      "text-slate-700 hover:text-violet-700",
      isActive ? "text-violet-700" : "",
    ].join(" ");

  return (
    <header className="border-b border-violet-100 bg-[#C7C0F0]">
      <div className="mx-auto flex h-24 w-full max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/assets/ClinicIQ Logo.png"
            className="h-11 w-auto object-contain"
            alt="ClinicIQ"
          />
          <span className="text-3xl font-bold tracking-tight text-[#3D3762]">
            ClinicIQ
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/help" className={navLinkClass}>
            Help
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact Us
          </NavLink>

          {isLoggedIn ? (
            <Button
              type="button"
              onClick={() => void logout()}
              className="rounded-xl bg-violet-500 px-5 py-2 text-white shadow-sm hover:bg-violet-600"
            >
              Log Out
            </Button>
          ) : (
            <Button
              type="button"
              onClick={openLogin}
              className="rounded-xl bg-violet-500 px-5 py-2 text-white shadow-sm hover:bg-violet-600"
            >
              Login
            </Button>
          )}
        </nav>

        <div className="md:hidden">
          {isLoggedIn ? (
            <Button
              type="button"
              onClick={() => void logout()}
              className="rounded-xl bg-violet-500 px-4 py-2 text-white shadow-sm hover:bg-violet-600"
            >
              Log Out
            </Button>
          ) : (
            <Button
              type="button"
              onClick={openLogin}
              className="rounded-xl bg-violet-500 px-4 py-2 text-white shadow-sm hover:bg-violet-600"
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;