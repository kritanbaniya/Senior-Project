/**
 * This file defines the HomePage component, which serves as the landing page for the ClinicIQ application.
 * It includes a hero section, login panels for patients and providers, a feature card, and a footer.
 */
import { useState } from "react";
import { BriefcaseMedical, Users } from "lucide-react";
import HeroSection from "@/components/homepage/Hero.tsx";
import LoginPanel from "@/components/homepage/LoginPanel.tsx";
import FeatureCard from "@/components/homepage/FeatureCard.tsx";
import Footer from "@/components/homepage/Footer.tsx";
import FindClinicsCTA from "@/components/homepage/FindClinicsCTA.tsx";

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
      <HeroSection />

      <section className="px-6 pb-10">
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

      <FindClinicsCTA />

      <section className="px-6 pb-12">
        <div className="mx-auto flex max-w-[1325px] flex-col items-center gap-10">
          <FeatureCard />
          <Footer />
        </div>
      </section>
    </main>
  );
}