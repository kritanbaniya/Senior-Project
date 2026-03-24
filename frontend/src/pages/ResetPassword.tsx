// page users land on after clicking the password-reset link in their email.
// supabase automatically exchanges the url token for a session before the page
// loads, so supabase.auth.updateUser() can set the new password. after a
// successful update the user is signed out and redirected to the home page.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { supabase } from "../lib/supabase";

// shows a new-password / confirm-password form. on success it signs the user
// out (so the old session is invalidated) and redirects to "/" after a short delay.
export default function ResetPassword() {
  // validates both fields match, calls supabase.auth.updateUser with the new
  // password, then signs out and navigates home so the user can log in fresh.
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!password || !confirmPassword) {
      setErrorMessage("Please fill out both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setSubmitting(false);
        return;
      }

      await supabase.auth.signOut();
      setPasswordReset(true);
      setStatusMessage("Your password has been updated. Redirecting to login...");

      setTimeout(() => {
        navigate("/");
      }, 2500);
    } catch {
      setErrorMessage("Unable to update password right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto flex max-w-6xl items-center justify-center">
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0px_10px_30px_rgba(0,0,0,0.10)]">
          <div className="flex items-center gap-4 bg-gradient-to-r from-violet-400 to-indigo-400 px-8 py-6 text-white">
            <div className="rounded-2xl bg-white/15 p-3">
              <LockKeyhole className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/80">
                ClinicIQ
              </p>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Reset Password
              </h1>
            </div>
          </div>

          <div className="px-8 py-8 md:px-10">
            <p className="mb-8 text-lg leading-8 text-slate-600 md:text-xl">
              Enter your new password below to regain access to your account.
            </p>

            {errorMessage && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            {statusMessage && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {statusMessage}
              </div>
            )}

            {passwordReset ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-base text-green-700">
                  Your password was successfully updated.
                </div>

                <Link
                  to="/"
                  className="inline-flex text-base font-semibold text-indigo-500 transition hover:text-indigo-600"
                >
                  Return to home
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Enter a new password"
                      className="h-14 w-full rounded-xl border border-slate-300 px-4 pr-14 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent p-0 text-slate-500 transition hover:text-slate-700 !outline-none focus:!outline-none focus-visible:!outline-none"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-7 w-7" />
                      ) : (
                        <Eye className="h-7 w-7" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-new-password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-new-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Confirm your new password"
                      className="h-14 w-full rounded-xl border border-slate-300 px-4 pr-14 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent p-0 text-slate-500 transition hover:text-slate-700 !outline-none focus:!outline-none focus-visible:!outline-none"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-7 w-7" />
                      ) : (
                        <Eye className="h-7 w-7" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-14 rounded-xl bg-indigo-400 text-lg font-semibold text-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}