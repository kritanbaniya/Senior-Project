// system admin page: lists all clinics with their approval status and
// provides approve / disapprove actions.
//
// data flow:
//   - fetches all clinics ordered by approval status (pending first), then date
//   - fetches profiles for each clinic's admin_id to display their name and email
//   - calls supabase update on the clinics table when admin toggles approval
//     (allowed by the prevent_admin_overreach trigger carve-out + rls policy)

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { ClinicRow } from "../Clinic/ClinicADashBoard"

type AdminProfile = {
  id: string
  full_name: string | null
  email: string | null
}

type Filter = "all" | "pending" | "approved"

const FILTER_LABELS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
]

function StatusBadge({ approved }: { approved: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        approved
          ? "bg-green-100 text-green-800"
          : "bg-amber-100 text-amber-800",
      ].join(" ")}
    >
      {approved ? "Approved" : "Pending"}
    </span>
  )
}

export default function AdminClinicApprovals() {
  const [clinics, setClinics] = useState<ClinicRow[]>([])
  const [adminProfiles, setAdminProfiles] = useState<Map<string, AdminProfile>>(new Map())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    void loadClinics()
  }, [])

  const loadClinics = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("clinics")
      .select("*")
      .order("approved", { ascending: true })
      .order("created_at", { ascending: false })

    if (error || !data) {
      setLoading(false)
      return
    }

    const rows = data as ClinicRow[]
    setClinics(rows)

    // fetch profile info for each unique admin_id
    const adminIds = [...new Set(rows.map((c) => c.admin_id))]
    if (adminIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", adminIds)

      if (profiles) {
        const map = new Map<string, AdminProfile>()
        for (const p of profiles as AdminProfile[]) {
          map.set(p.id, p)
        }
        setAdminProfiles(map)
      }
    }

    setLoading(false)
  }

  const handleSetApproval = async (clinicId: string, newStatus: boolean) => {
    setActionLoading(clinicId)
    setMessage(null)

    const { error } = await supabase
      .from("clinics")
      .update({ approved: newStatus })
      .eq("clinic_id", clinicId)

    setActionLoading(null)

    if (error) {
      setMessage({ type: "error", text: error.message })
      return
    }

    setClinics((prev) =>
      prev.map((c) =>
        c.clinic_id === clinicId ? { ...c, approved: newStatus } : c,
      ),
    )

    setMessage({
      type: "success",
      text: newStatus ? "clinic approved" : "clinic approval removed",
    })
  }

  const filteredClinics = clinics.filter((c) => {
    if (filter === "pending") return !c.approved
    if (filter === "approved") return c.approved
    return true
  })

  const pendingCount = clinics.filter((c) => !c.approved).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
        loading clinics...
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-slate-900">Clinic Approvals</h2>
        <p className="text-sm text-slate-500">
          {clinics.length} clinic{clinics.length !== 1 ? "s" : ""} total
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {pendingCount} pending
            </span>
          )}
        </p>
      </div>

      {message && (
        <div
          className={[
            "rounded-lg px-4 py-3 text-sm font-medium",
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-700",
          ].join(" ")}
        >
          {message.text}
        </div>
      )}

      {/* filter tabs */}
      <div className="flex gap-2">
        {FILTER_LABELS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={[
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              filter === value
                ? "bg-indigo-600 text-white"
                : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredClinics.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
          no clinics match this filter
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Clinic</th>
                <th className="px-5 py-3">Admin</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClinics.map((clinic) => {
                const admin = adminProfiles.get(clinic.admin_id)
                const isActing = actionLoading === clinic.clinic_id

                return (
                  <tr
                    key={clinic.clinic_id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {clinic.clinic_name}
                      </div>
                      {clinic.specialty && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {clinic.specialty}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">
                        {admin?.full_name ?? "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {admin?.email ?? ""}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {clinic.city && clinic.state
                        ? `${clinic.city}, ${clinic.state}`
                        : clinic.city || clinic.state || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {new Date(clinic.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge approved={clinic.approved} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      {clinic.approved ? (
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => void handleSetApproval(clinic.clinic_id, false)}
                          className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {isActing ? "saving..." : "Disapprove"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => void handleSetApproval(clinic.clinic_id, true)}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {isActing ? "saving..." : "Approve"}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
