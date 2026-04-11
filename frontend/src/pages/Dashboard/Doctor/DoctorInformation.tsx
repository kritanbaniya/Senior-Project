import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../../../lib/supabase"
import { useAuth } from "../../../context/AuthContext"
import { SidebarProvider } from "@/components/ui/sidebar"
import DoctorSidebar from "./DoctorSideBar"

type DoctorInfoRow = {
  id: string
  name: string | null
  birthday: string | null
  license_num: number | null
  phone: number | null
  specialization: string | null
  npi_number: string | null
}

function DashboardPanel({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={[
        'min-h-[400px] w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95',
        'shadow-[0px_4px_14px_rgba(15,23,42,0.08)] backdrop-blur-sm',
        'transition-all duration-300 ease-out motion-reduce:transition-none',
        'hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0px_20px_40px_rgba(15,23,42,0.14)]',
        className,
      ].join(' ')}
    >
      <div className="border-b border-slate-200/80 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      </div>

      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

export default function DoctorInformation() {
  const { profile, logout } = useAuth()
  const displayName = profile?.full_name?.trim() || "Doctor"

  const [profileOpen, setProfileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const [form, setForm] = useState({
    name: "",
    birthday: "",
    license_num: "",
    phone: "",
    specialization: "",
    npi_number: "",
  })

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("doctor_info")
        .select("id, name, birthday, license_num, phone, specialization, npi_number")
        .eq("id", user.id)
        .maybeSingle()

      if (!error && data) {
        const row = data as DoctorInfoRow
        setForm({
          name: row.name ?? "",
          birthday: row.birthday ?? "",
          license_num: row.license_num != null ? String(row.license_num) : "",
          phone: row.phone != null ? String(row.phone) : "",
          specialization: row.specialization ?? "",
          npi_number: row.npi_number ?? "",
        })
      } else {
        setForm({
          name: "",
          birthday: "",
          license_num: "",
          phone: "",
          specialization: "",
          npi_number: "",
        })
      }

      setLoading(false)
    }

    void load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage({ type: "error", text: "Not logged in" })
      return
    }

    setSaving(true)

    const licenseRaw = form.license_num.trim()
    const phoneRaw = form.phone.trim()
    const npiRaw = form.npi_number.trim()

    if (licenseRaw === "") {
      setMessage({ type: "error", text: "Medical license number is required" })
      setSaving(false)
      return
    }

    if (!/^\d+$/.test(licenseRaw)) {
      setMessage({ type: "error", text: "License number must contain digits only" })
      setSaving(false)
      return
    }

    if (phoneRaw === "" || !/^\d{7,15}$/.test(phoneRaw)) {
      setMessage({ type: "error", text: "Phone must be 7–15 digits" })
      setSaving(false)
      return
    }

    if (npiRaw !== "" && !/^\d{10}$/.test(npiRaw)) {
      setMessage({ type: "error", text: "NPI number must be exactly 10 digits" })
      setSaving(false)
      return
    }

    const licenseNum = parseInt(licenseRaw, 10)
    const phoneNum = parseInt(phoneRaw, 10)

    const { error } = await supabase.from("doctor_info").upsert(
      {
        id: user.id,
        name: form.name.trim() || null,
        birthday: form.birthday || null,
        license_num: licenseNum,
        phone: phoneNum,
        specialization: form.specialization.trim() || null,
        npi_number: npiRaw || null,
      },
      { onConflict: "id" }
    )

    setSaving(false)

    if (error) {
      setMessage({ type: "error", text: error.message })
      return
    }

    setMessage({ type: "success", text: "Saved successfully." })
  }

  return (
    <SidebarProvider defaultOpen>
      <DoctorSidebar />

      <div className="pd-right">
        <header className="pd-header">
          <div className="pd-header-left">
            <h1 className="pd-header-title">Your Information</h1>
            <span className="pd-header-patient">{displayName}</span>
          </div>

          <div className="pd-header-actions">
            <div className="pd-profile-wrap">
              <button
                type="button"
                className="pd-profile-btn"
                onClick={() => setProfileOpen((o) => !o)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <span className="pd-avatar">
                  {displayName.slice(0, 2).toUpperCase()}
                </span>
                <span className="pd-profile-name">{displayName}</span>
                <span className="pd-chevron">▼</span>
              </button>

              {profileOpen && (
                <div className="pd-dropdown" role="menu">
                  <Link to="/" className="pd-dropdown-item">
                    Home
                  </Link>
                  <Link to="/dashboard/doctor" className="pd-dropdown-item">
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    className="pd-dropdown-item"
                    onClick={() => void logout()}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="pd-main">
          <div className="grid gap-6 items-start auto-rows-max grid-cols-[repeat(auto-fill,minmax(500px,1fr))]">
            <DashboardPanel title="Personal details" className="min-h-[400px]">
              <p className="mb-4 text-sm text-slate-500">
                View and update your information. Only you can see and edit this.
            </p>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="di-name"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Name
            </label>
            <input
              id="di-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Full name"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-indigo-400"
            />
          </div>

          <div>
            <label
              htmlFor="di-birthday"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Birthday
            </label>
            <input
              id="di-birthday"
              type="date"
              value={form.birthday}
              onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-indigo-400"
            />
          </div>

          <div>
            <label
              htmlFor="di-license_num"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Medical license number
            </label>
            <input
              id="di-license_num"
              type="text"
              inputMode="numeric"
              value={form.license_num}
              onChange={(e) => setForm((f) => ({ ...f, license_num: e.target.value }))}
              placeholder="Medical license number"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-indigo-400"
            />
          </div>

          <div>
            <label
              htmlFor="di-npi_number"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              NPI number (optional)
            </label>
            <input
              id="di-npi_number"
              type="text"
              inputMode="numeric"
              value={form.npi_number}
              onChange={(e) => setForm((f) => ({ ...f, npi_number: e.target.value }))}
              placeholder="10-digit NPI number"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-indigo-400"
            />
          </div>

          <div>
            <label
              htmlFor="di-specialization"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Specialization
            </label>
            <input
              id="di-specialization"
              type="text"
              value={form.specialization}
              onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
              placeholder="e.g., Family Medicine, Cardiology"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-indigo-400"
            />
          </div>

          <div>
            <label
              htmlFor="di-phone"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Phone
            </label>
            <input
              id="di-phone"
              type="text"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="7–15 digits"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-indigo-400"
            />
          </div>

          {message && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                message.type === 'error'
                  ? 'border border-red-200 bg-red-50 text-red-700'
                  : 'border border-green-200 bg-green-50 text-green-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </DashboardPanel>
  </div>
</main>
      </div>
    </SidebarProvider>
  )
}