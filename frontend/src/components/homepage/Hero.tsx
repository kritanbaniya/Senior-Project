/**
 * This file defines the HeroSection component, which displays the hero section of the homepage.
 * The hero section includes a title and subtitle that introduce the ClinicIQ platform and its benefits for managing patient care and medical records.
 */
export default function HeroSection() {
  return (
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
  );
}