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
    <header className="sticky top-0 z-50 w-full bg-[#ede9fc] border-b border-[rgba(124,111,224,0.22)]">
      <div className="mx-auto flex h-[52px] items-center justify-between px-4">
        <Link to={homePath} className="flex items-center gap-2">
          <img
            src="/assets/ClinicIQ Logo.png"
            alt="ClinicIQ"
            className="h-7 w-8 object-contain"
          />
          <span className="text-[15px] font-[500] text-[#1e1b3a]">
            Clinic<span className="text-[#7c6fe0]">IQ</span>
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {isLoggedIn && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void logout()}
              className="h-8 rounded-md border-[rgba(124,111,224,0.22)] px-3 text-[13px] font-[500] text-[#4a3fa8] shadow-none hover:bg-white hover:text-[#1e1b3a]"
            >
              Log Out
            </Button>
          )}

          {showLoginButton && (
            <Button
              type="button"
              onClick={openLogin}
              className="h-8 rounded-md bg-[#7c6fe0] px-3 text-[13px] font-[500] text-white shadow-none hover:bg-[#6457c6]"
            >
              Login
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
