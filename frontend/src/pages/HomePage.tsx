import { useState } from "react";
import { BriefcaseMedical, Users } from "lucide-react";
import LoginPanel from "@/components/homepage/LoginPanel.tsx";

type ActivePanel = "patient" | "provider";

export default function HomePage() {
  const [activePanel, setActivePanel] = useState<ActivePanel>("patient");

  const getPanelClasses = (panel: ActivePanel) => {
    const isActive = activePanel === panel;

    return [
      "transition-all duration-300 ease-out",
      "motion-reduce:transition-none",
      isActive
        ? "opacity-100 scale-100 lg:-translate-y-1 shadow-[0px_20px_40px_rgba(0,0,0,0.14)] z-10"
        : "opacity-30 scale-[0.98] lg:translate-y-2 shadow-[0px_8px_18px_rgba(0,0,0,0.08)]",
    ].join(" ");
  };

  return (
    <main className="min-h-screen">
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
            <div
              className={getPanelClasses("patient")}
              onMouseEnter={() => setActivePanel("patient")}
              onFocus={() => setActivePanel("patient")}
            >
              <LoginPanel
                title="Patient Login"
                subtitle="For patients managing personal health records"
                icon={<Users className="h-12 w-12" strokeWidth={2.25} />}
                defaultSignupRole="patient"
                highlighted
                signupRoleOptions={["patient"]}
              />
            </div>

            <div
              className={getPanelClasses("provider")}
              onMouseEnter={() => setActivePanel("provider")}
              onFocus={() => setActivePanel("provider")}
            >
              <LoginPanel
                title="Provider Login"
                subtitle="For healthcare professionals managing patient care."
                icon={
                  <BriefcaseMedical className="h-12 w-12" strokeWidth={2.25} />
                }
                signupRoleOptions={["nurse", "doctor", "clinic"]}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}