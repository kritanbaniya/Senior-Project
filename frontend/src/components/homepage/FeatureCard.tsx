/**
 * This file defines the FeatureCard component, which displays a set of features in a card format.
 * Each feature includes an icon, title, and description. The card is styled with a shadow and rounded corners.
 */

import {
  ClipboardList,
  Clock3,
  Monitor,
  WalletCards,
} from "lucide-react";

type FeatureItemProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  withDivider?: boolean;
};

function FeatureItem({
  icon,
  title,
  description,
  withDivider = false,
}: FeatureItemProps) {
  return (
    <div
      className={[
        "flex items-start gap-4 px-6 py-6 md:px-10",
        withDivider ? "md:border-r md:border-black/15" : "",
      ].join(" ")}
    >
      <div className="shrink-0 pt-1 text-slate-800">{icon}</div>

      <div className="max-w-[320px]">
        <h3 className="text-2xl font-semibold leading-10 text-slate-700">
          {title}
        </h3>
        <p className="text-lg font-lightbold leading-8 text-slate-700/75">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function FeatureCard() {
  return (
    <section className="w-full">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0px_4px_12px_rgba(0,0,0,0.12)]">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <FeatureItem
            icon={<ClipboardList className="h-12 w-12" strokeWidth={2.25} />}
            title="Access Health Records"
            description="View your medical history, test results, and more"
            withDivider
          />

          <FeatureItem
            icon={<Clock3 className="h-12 w-12" strokeWidth={2.25} />}
            title="Schedule Appointments"
            description="Book and manage your appointments online."
          />

          <FeatureItem
            icon={<Monitor className="h-12 w-12" strokeWidth={2.25} />}
            title="Change Clinics"
            description="Pick your desired doctor’s office"
            withDivider
          />

          <FeatureItem
            icon={<WalletCards className="h-12 w-12" strokeWidth={2.25} />}
            title="Manage Prescriptions"
            description="View your prescriptions information such as dose and number of refills."
          />
        </div>
      </div>
    </section>
  );
}