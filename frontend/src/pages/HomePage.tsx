import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f7fb] via-[#eef4ff] to-[#dfe9ff]">
      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 pb-24 pt-18 text-center md:px-10 lg:px-16">
        <div className="flex w-full max-w-[844px] flex-col items-center gap-10">
          <div className="flex w-full flex-col items-center gap-6">
            <h1 className="w-full text-center text-5xl font-bold tracking-tight text-slate-700 md:text-6xl">
              Secure Healthcare Portal
            </h1>

            <p className="max-w-[649px] text-center text-lg leading-8 text-slate-700/75 md:text-2xl md:leading-9">
              Seamlessly manage patient care and medical records in one secure,
              easy-to-use platform
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}