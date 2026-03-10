import { Activity, Users } from "lucide-react";

type LoginCardProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  highlighted?: boolean;
};

function LoginCard({
  title,
  subtitle,
  icon,
  highlighted = false,
}: LoginCardProps) {
  return (
    <div className="w-full max-w-[623px] overflow-hidden rounded-2xl bg-white shadow-[0px_4px_12px_rgba(0,0,0,0.12)]">
      <div
        className={`flex h-[120px] items-center gap-4 border-b border-neutral-200 px-40 ${
          highlighted
            ? "bg-gradient-to-r from-violet-400 to-indigo-400 text-white"
            : "bg-white text-slate-700"
        }`}
      >
        <div className="shrink-0">{icon}</div>
        <h2 className="text-2xl font-semibold md:text-4xl">{title}</h2>
      </div>

      <div className="flex flex-col px-8 pb-8 pt-6">
        <p className="mb-8 max-w-[507px] text-xl font-medium leading-10 text-slate-700 md:text-3xl">
          {subtitle}
        </p>

        <input
          type="text"
          placeholder="Email or Username"
          className="mb-6 h-16 rounded-lg border border-black/25 px-5 text-xl font-light outline-none placeholder:text-black/25 focus:border-indigo-400"
        />

        <input
          type="password"
          placeholder="Password"
          className="mb-3 h-16 rounded-lg border border-black/25 px-5 text-xl font-light outline-none placeholder:text-black/25 focus:border-indigo-400"
        />

        <button
          type="button"
          className="mb-8 w-fit text-xl font-normal text-indigo-400 transition hover:text-indigo-500"
        >
          Forgot password?
        </button>

        <button
          type="button"
          className="h-16 rounded-lg bg-indigo-400 text-2xl font-semibold text-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] transition hover:bg-indigo-500"
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      <section className="px-6 pb-10 pt-24">
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
        <div className="mx-auto flex max-w-[1325px] flex-col items-center gap-5">
          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
            <LoginCard
              title="Patient Login"
              subtitle="For patients managing personal health records"
              icon={<Users className="h-12 w-12" strokeWidth={2.25} />}
            />

            <LoginCard
              title="Provider Login"
              subtitle="For healthcare professionals managing patient care."
              icon={<Activity className="h-12 w-12" strokeWidth={2.25} />}
              highlighted
            />
          </div>

          <div className="flex h-20 items-center justify-center rounded-2xl bg-white px-8 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
            <p className="text-center text-xl leading-9 md:text-2xl">
              <span className="font-normal text-black">New to ClinicIQ? </span>
              <button
                type="button"
                className="font-semibold text-indigo-400 transition hover:text-indigo-500"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}