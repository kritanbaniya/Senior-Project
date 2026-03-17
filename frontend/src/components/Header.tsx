/**
 * This file defines the Header component, which displays the header section of the application.
 * The header includes the ClinicIQ logo, navigation links, and login/logout buttons based on the user's authentication status.
 */

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { getHomePath } from "@/lib/getHomePath";

function Header() {
  const { profile, openLogin, logout } = useAuth();
  const isLoggedIn = !!profile;
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const showLoginButton = !isLoggedIn && !isHomePage;
  const homePath = getHomePath(profile?.role);

  return (
    <header className="sticky top-0 z-50 w-full bg-violet-200">
      <div className="mx-auto flex h-15 max-w-screen-2xl items-center justify-between px-8 md:px-14 lg:px-20">
        <Link to={homePath} className="flex items-center gap-4">
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
          {isLoggedIn && (
            <Button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg bg-indigo-400 px-5 py-5 text-lg font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              Log Out
            </Button>
          )}

          {showLoginButton && (
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
              Log Out
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