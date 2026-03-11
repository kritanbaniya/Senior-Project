import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";

function Header() {
  const { profile, openLogin, logout } = useAuth();
  const isLoggedIn = !!profile;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "text-lg font-medium transition-colors duration-200",
      isActive ? "text-yellow-700" : "text-slate-700",
      "hover:text-yellow-500",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 w-full bg-violet-200">
      <div className="mx-auto flex h-15 max-w-screen-2xl items-center justify-between px-8 md:px-14 lg:px-20">
        <Link to="/" className="flex items-center gap-4">
          <img
            src="/assets/ClinicIQ Logo.png"
            alt="ClinicIQ"
            className="h-12 w-14 object-contain"
          />
          <div className="text-4xl font-bold leading-[54px]">
            <span className="text-slate-700">Clinic</span>
            <span className="text-indigo-500">IQ</span>
          </div>
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
              className="rounded-lg bg-indigo-400 px-5 py-5 text-lg font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              LOG OUT
            </Button>
          ) : (
            <Button
              type="button"
              onClick={openLogin}
              className="rounded-lg bg-indigo-400 px-5 py-5 text-lg font-medium text-white shadow-sm hover:bg-indigo-500"
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
              className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              LOG OUT
            </Button>
          ) : (
            <Button
              type="button"
              onClick={openLogin}
              className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
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