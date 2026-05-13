import { useEffect, useState } from 'react'
import { Menu, NotebookPen, CalendarDays, UserRound, Stethoscope } from 'lucide-react'
import PatientSidebar from './components/PatientSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '../../../lib/supabase'
import {
  fetchMedicalHistory,
  type MedicalHistoryRecord,
} from '../../../features/medical/medicalHistoryApi'

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PatientVisitSummary() {
  const [records, setRecords] = useState<MedicalHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true)
      setError(null)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('You must be logged in to view visit summaries.')
        setLoading(false)
        return
      }

      const { data, error } = await fetchMedicalHistory(user.id)

      if (error) {
        setError(error.message)
        setRecords([])
      } else {
        setRecords(data ?? [])
      }

      setLoading(false)
    }

    void loadRecords()
  }, [])

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

            <h1 className="pd-header-title">Visit Summary Notes</h1>
            <span className="pd-header-patient">Review your clinical visit history</span>
          </div>
        </header>

        <main className="pd-main">
          <section className="mb-6 rounded-3xl border border-indigo-100 bg-white/95 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-indigo-100 p-3 text-indigo-600">
                  <NotebookPen className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Your visit summaries</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  View diagnoses, symptoms, observations, treatment plans, and follow-up notes
                  shared by your care team.
                </p>
              </div>

              <Badge className="rounded-full bg-indigo-100 px-4 py-2 text-indigo-700 hover:bg-indigo-100">
                {records.length} record{records.length === 1 ? '' : 's'}
              </Badge>
            </div>
          </section>

          {error && (
            <Alert className="mb-6 border-rose-200 bg-rose-50 text-rose-800">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((item) => (
                <Card key={item} className="rounded-2xl border-slate-200 bg-white/95">
                  <CardHeader>
                    <Skeleton className="h-6 w-56" />
                    <Skeleton className="h-4 w-40" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : records.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-slate-300 bg-white/90 p-8 text-center">
              <CardContent className="pt-6">
                <NotebookPen className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                <h3 className="text-xl font-semibold text-slate-800">No visit summaries yet</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Once a doctor saves visit notes, they will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5">
              {records.map((record) => (
                <Card
                  key={record.id}
                  className="overflow-hidden rounded-3xl border-slate-200 bg-white/95 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl text-slate-900">
                          {record.diagnosis}
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(record.visit_date)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="h-4 w-4" />
                            {record.doctor_name}
                          </span>
                        </div>
                      </div>

                      {record.follow_up_recommended && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                          Follow-up recommended
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                    {[
                      ['Symptoms', record.symptoms],
                      ['Observations', record.observations],
                      ['Treatment Plan', record.treatment_plan],
                      ['Follow-up Notes', record.follow_up_notes],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-slate-50 p-4">
                        <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          <Stethoscope className="h-3.5 w-3.5" />
                          {label}
                        </p>
                        <p className="text-sm leading-6 text-slate-700">
                          {value || 'Not provided'}
                        </p>
                      </div>
                    ))}
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