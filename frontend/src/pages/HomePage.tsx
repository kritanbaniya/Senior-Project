import { Activity, Users } from "lucide-react";
import { Link } from "react-router-dom";
import LoginPanel from "@/components/homepage/LoginPanel.tsx";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      <section className="px-6 pb-10 pt-12">
        <div className="mx-auto flex w-full max-w-[844px] flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-center text-5xl font-bold text-slate-700 md:text-6xl">
              Secure Healthcare Portal
            </h1>

            <p className="max-w-[649px] text-center text-xl leading-9 text-slate-700/75 md:text-2xl">
              Seamlessly manage patient care and medical records in one secure,
              easy-to-use platform
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto flex max-w-[1325px] flex-col items-center gap-8">
          <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
            <LoginPanel
              title="Patient Login"
              subtitle="For patients managing personal health records"
              icon={<Users className="h-12 w-12" strokeWidth={2.25} />}
              defaultSignupRole="patient"
              signupRoleOptions={["patient"]}
            />

            <LoginPanel
              title="Provider Login"
              subtitle="For healthcare professionals managing patient care."
              icon={<Activity className="h-12 w-12" strokeWidth={2.25} />}
              highlighted
              signupRoleOptions={["nurse", "doctor", "clinic"]}
            />
          </div>

          <div className="flex h-20 items-center justify-center rounded-2xl bg-white px-6 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
            <p className="text-center text-xl leading-9 md:text-2xl">
              <span className="font-normal text-black">New to ClinicIQ? </span>
              <Link
                to="/"
                className="font-semibold text-indigo-400 transition hover:text-indigo-500"
              >
                Click Sign Up
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}