/*
This LoginPanel component contains both the visual TailwindCSS styling and the logic for handling login, signup and password reset flows using Supabase.
It is designed to be used in the HomePage as the main entry point for users to access their accounts or create new ones. 
The component manages its own internal state for form inputs, submission status, and error/status messages, and provides a seamless user experience for authentication-related actions.
*/
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

type SignupRole = "patient" | "nurse" | "doctor" | "clinic";

type LoginPanelMode = "login" | "forgot" | "signup";

type LoginPanelProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  highlighted?: boolean;
  defaultSignupRole?: SignupRole;
  signupRoleOptions?: SignupRole[];
};

const roleLabels: Record<SignupRole, string> = {
  patient: "Patient",
  nurse: "Nurse",
  doctor: "Doctor",
  clinic: "Clinic Administrator",
};

export default function LoginPanel({
  title,
  subtitle,
  icon,
  highlighted = false,
  defaultSignupRole,
  signupRoleOptions = ["patient"],
}: LoginPanelProps) {
  const navigate = useNavigate();

  const [mode, setMode] = useState<LoginPanelMode>("login");

  const [email, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState("");

  const [signupFullName, setSignupFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] =
    useState(false);
  const [signupRole, setSignupRole] = useState<SignupRole | "">(
    defaultSignupRole ?? ""
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const multipleRoles = signupRoleOptions.length > 1;

  const panelHeaderClasses = useMemo(
    () =>
      [
        "flex h-[120px] items-center gap-4 border-b border-neutral-200 px-8 md:px-42",
        highlighted
          ? "bg-gradient-to-r from-violet-400 to-indigo-400 text-white"
          : "bg-white text-slate-700",
      ].join(" "),
    [highlighted]
  );

  const resetMessages = () => {
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const resetAllFields = () => {
    setUsername("");
    setPassword("");
    setResetEmail("");
    setSignupFullName("");
    setSignupEmail("");
    setSignupPassword("");
    setSignupConfirmPassword("");
    setSignupRole(defaultSignupRole ?? "");
    setShowPassword(false);
    setShowSignupPassword(false);
    setShowSignupConfirmPassword(false);
    resetMessages();
  };

  const switchMode = (nextMode: LoginPanelMode) => {
    resetMessages();
    setMode(nextMode);
  };

  const routeToDashboard = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      navigate("/dashboard/patient");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    if (role === "patient") navigate("/dashboard/patient");
    else if (role === "nurse") navigate("/dashboard/nurse");
    else if (role === "doctor") navigate("/dashboard/doctor");
    else if (role === "clinic") navigate("/dashboard/clinic");
    else navigate("/");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email || !password) {
      setErrorMessage("Please fill out both email and password.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setSubmitting(false);
        return;
      }

      setStatusMessage("Logged in successfully.");
      await routeToDashboard();
      resetAllFields();
      setMode("login");
    } catch {
      setErrorMessage("Unable to log in right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!resetEmail) {
      setErrorMessage("Please enter your email.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMessage(error.message);
        setSubmitting(false);
        return;
      }

      setStatusMessage(
        "If an account with that email exists, a reset link has been sent."
      );
    } catch {
      setErrorMessage("Unable to send reset email right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!signupRole) {
      setErrorMessage("Please choose a role to continue.");
      return;
    }

    if (
      !signupFullName ||
      !signupEmail ||
      !signupPassword ||
      !signupConfirmPassword
    ) {
      setErrorMessage("Please fill out all fields.");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            role: signupRole,
            full_name: signupFullName,
          },
        },
      });

      if (error) {
        const errorMsg = error.message.toLowerCase();

        if (
          errorMsg.includes("already") ||
          errorMsg.includes("registered") ||
          errorMsg.includes("exists")
        ) {
          setErrorMessage(
            "An account with this email already exists. Please log in instead."
          );
        } else {
          setErrorMessage(error.message);
        }
        setSubmitting(false);
        return;
      }

      if (
        data?.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        setErrorMessage(
          "An account with this email already exists. Please log in instead."
        );
        setSubmitting(false);
        return;
      }

      setStatusMessage(
        "Account created successfully. Please check your email to verify your account, then log in."
      );

      setSignupFullName("");
      setSignupEmail("");
      setSignupPassword("");
      setSignupConfirmPassword("");
      setSignupRole(defaultSignupRole ?? "");
      setMode("login");
    } catch {
      setErrorMessage("Unable to sign up right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white shadow-[0px_4px_12px_rgba(0,0,0,0.12)]">
      <div className={panelHeaderClasses}>
        <div className="shrink-0">{icon}</div>
        <h2 className="text-2xl font-semibold md:text-4xl">{title}</h2>
      </div>

      <div className="flex flex-col px-8 pb-8 pt-6">
        <p className="mb-8 max-w-[507px] text-xl font-medium leading-10 text-slate-700 md:text-3xl">
          {subtitle}
        </p>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {statusMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {statusMessage}
          </div>
        )}

        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="flex flex-col">
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="Email or Username"
              value={email}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="mb-6 h-16 rounded-lg border border-black/25 px-5 text-xl outline-none placeholder:text-black/25 focus:border-indigo-400"
            />

            <div className="relative mb-3">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-16 w-full rounded-lg border border-black/25 px-5 pr-14 text-xl outline-none placeholder:text-black/25 focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent p-0 text-slate-500 hover:text-slate-700 !outline-none focus:!outline-none focus-visible:!outline-none"
              >
                {showPassword ? <EyeOff size={30} /> : <Eye size={30} />}
              </button>
            </div>

            <Link
              type="button"
              to="#"
              onClick={() => switchMode("forgot")}
              className="mb-8 w-fit text-xl font-normal text-indigo-400 transition hover:text-indigo-500"
            >
              Forgot password?
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="h-16 rounded-lg bg-indigo-400 text-2xl font-semibold text-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={handleForgotSubmit} className="flex flex-col">
            <input
              id="reset-email"
              name="email"
              type="email"
              placeholder="Enter your login email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              autoComplete="email"
              className="mb-6 h-16 rounded-lg border border-black/25 px-5 text-xl outline-none placeholder:text-black/25 focus:border-indigo-400"
            />

            <div className="mb-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="h-14 rounded-lg bg-indigo-400 px-6 text-lg font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Sending..." : "Send reset link"}
              </button>
            </div>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignupSubmit} className="flex flex-col">
            {multipleRoles && (
              <select
                value={signupRole}
                onChange={(e) => setSignupRole(e.target.value as SignupRole)}
                className="mb-6 h-16 rounded-lg border border-black/25 px-5 text-xl outline-none focus:border-indigo-400"
              >
                <option value="">Choose a role</option>
                {signupRoleOptions.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
            )}

            {!multipleRoles && signupRole && (
              <div className="mb-4 text-left text-lg font-medium text-slate-700">
                Signing up as <span className="text-indigo-500">{roleLabels[signupRole]}</span>
              </div>
            )}

            <input
              id="signup-full-name"
              name="fullName"
              type="text"
              placeholder="Full Name"
              value={signupFullName}
              onChange={(e) => setSignupFullName(e.target.value)}
              autoComplete="name"
              className="mb-6 h-16 rounded-lg border border-black/25 px-5 text-xl outline-none placeholder:text-black/25 focus:border-indigo-400"
            />

            <input
              id="signup-email"
              name="email"
              type="email"
              placeholder="Email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              autoComplete="email"
              className="mb-6 h-16 rounded-lg border border-black/25 px-5 text-xl outline-none placeholder:text-black/25 focus:border-indigo-400"
            />

            <div className="relative mb-6">
              <input
                id="signup-password"
                name="password"
                type={showSignupPassword ? "text" : "password"}
                placeholder="Password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                autoComplete="new-password"
                className="h-16 w-full rounded-lg border border-black/25 px-5 pr-14 text-xl outline-none placeholder:text-black/25 focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={() => setShowSignupPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent p-0 text-slate-500 hover:text-slate-700"
              >
                {showSignupPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>

            <div className="relative mb-6">
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type={showSignupConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="h-16 w-full rounded-lg border border-black/25 px-5 pr-14 text-xl outline-none placeholder:text-black/25 focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={() =>
                  setShowSignupConfirmPassword((prev) => !prev)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent p-0 text-slate-500 hover:text-slate-700"
              >
                {showSignupConfirmPassword ? (
                  <EyeOff size={22} />
                ) : (
                  <Eye size={22} />
                )}
              </button>
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="h-14 rounded-lg bg-indigo-400 px-6 text-lg font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Signing up..." : "Create account"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-lg">
          {mode !== "signup" && mode !== "forgot" && (
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="bg-transparent p-0 font-semibold text-indigo-400 transition hover:text-indigo-500"
            >
              Sign Up
            </button>
          )}

          {mode !== "login" && (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="bg-transparent p-0 font-medium text-slate-600 transition hover:text-slate-800"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}