/**
 * This file defines the Header component, which displays the header section of the application.
 * The header includes the ClinicIQ logo, navigation links, and login/logout buttons based on the user's authentication status.
 */

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { HouseIcon } from "lucide-react";
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
      <div className="mx-auto flex h-15 items-center justify-between pr-2 md:pr-4 lg:pr-4">
        <div className="flex items-center gap-2">
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

          {isLoggedIn && (
            <Link to={homePath}>
              <Button
                type="button"
                title="Home"
                className="hidden h-10 w-10 items-center justify-center rounded-lg bg-indigo-400 text-white shadow-sm hover:bg-indigo-500 md:flex"
              >
                <HouseIcon className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>

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
          {isLoggedIn && (
            <div className="flex items-center gap-2">
              <Link to={homePath}>
                <Button
                  type="button"
                  title="Home"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-400 text-white shadow-sm hover:bg-indigo-500"
                >
                  <HouseIcon className="h-5 w-5" />
                </Button>
              </Link>

              <Button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
              >
                Log Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;