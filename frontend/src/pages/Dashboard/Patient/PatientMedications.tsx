import { useEffect, useMemo, useState } from 'react'
import { Menu, Pill, CalendarDays, UserRound, Clock3, ClipboardList } from 'lucide-react'
import PatientSidebar from './components/PatientSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '../../../lib/supabase'
import {
  fetchAllPrescriptions,
  type PrescriptionRecord,
} from '../../../features/medical/prescriptionsApi'

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStatusClasses(status: string) {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
    case 'completed':
      return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
    case 'discontinued':
      return 'bg-rose-100 text-rose-700 hover:bg-rose-100'
    default:
      return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100'
  }
}

export default function PatientMedications() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const loadPrescriptions = async () => {
      setLoading(true)
      setError(null)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('You must be logged in to view medications.')
        setLoading(false)
        return
      }

      const { data, error } = await fetchAllPrescriptions(user.id)

      if (error) {
        setError(error.message)
        setPrescriptions([])
      } else {
        setPrescriptions(data ?? [])
      }

      setLoading(false)
    }

    void loadPrescriptions()
  }, [])

  const activeCount = useMemo(
    () => prescriptions.filter((p) => p.status === 'active').length,
    [prescriptions],
  )

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          '--sidebar-width': '15rem',
          '--sidebar-width-mobile': '10rem',
        } as React.CSSProperties
      }
    >
      <PatientSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="pd-right">
        <header className="pd-header">
          <div className="pd-header-left">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-indigo-400/70 text-slate-700 shadow-sm transition hover:bg-slate-100 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="pd-header-title">Medications</h1>
            <span className="pd-header-patient">View prescriptions from your providers</span>
          </div>
        </header>

        <main className="pd-main">
          <section className="mb-6 rounded-3xl border border-emerald-100 bg-white/95 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-emerald-100 p-3 text-emerald-600">
                  <Pill className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Your medications</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Review dosage, frequency, duration, instructions, prescribing doctor, and medication status.
                </p>
              </div>

              <div className="flex gap-2">
                <Badge className="rounded-full bg-emerald-100 px-4 py-2 text-emerald-700 hover:bg-emerald-100">
                  {activeCount} active
                </Badge>
                <Badge className="rounded-full bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-100">
                  {prescriptions.length} total
                </Badge>
              </div>
            </div>
          </section>

          {error && (
            <Alert className="mb-6 border-rose-200 bg-rose-50 text-rose-800">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <Card key={item} className="rounded-2xl border-slate-200 bg-white/95">
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-36" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : prescriptions.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-slate-300 bg-white/90 p-8 text-center">
              <CardContent className="pt-6">
                <Pill className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                <h3 className="text-xl font-semibold text-slate-800">No medications yet</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Prescriptions added by your doctor will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {prescriptions.map((prescription) => (
                <Card
                  key={prescription.id}
                  className="overflow-hidden rounded-3xl border-slate-200 bg-white/95 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl text-slate-900">
                          {prescription.medication_name}
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(prescription.prescribed_date)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="h-4 w-4" />
                            {prescription.doctor_name}
                          </span>
                        </div>
                      </div>

                      <Badge className={getStatusClasses(prescription.status)}>
                        {prescription.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 p-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Dosage
                        </p>
                        <p className="text-sm font-semibold text-slate-800">
                          {prescription.dosage}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Duration
                        </p>
                        <p className="text-sm font-semibold text-slate-800">
                          {prescription.duration}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                        <Clock3 className="h-3.5 w-3.5" />
                        Frequency
                      </p>
                      <p className="text-sm leading-6 text-slate-700">
                        {prescription.frequency}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <ClipboardList className="h-3.5 w-3.5" />
                        Instructions
                      </p>
                      <p className="text-sm leading-6 text-slate-700">
                        {prescription.instructions || 'No special instructions provided.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  )
}