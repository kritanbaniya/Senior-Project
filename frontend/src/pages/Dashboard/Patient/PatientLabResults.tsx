import { useEffect, useState } from 'react'
import { Menu, FlaskConical, CalendarDays, UserRound} from 'lucide-react'
import PatientSidebar from './components/PatientSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '../../../lib/supabase'
import {
  fetchLabResults,
  type LabResultRecord,
} from '../../../features/medical/labResultsApi'

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PatientLabResults() {
  const [results, setResults] = useState<LabResultRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const loadResults = async () => {
      setLoading(true)
      setError(null)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('You must be logged in to view lab results.')
        setLoading(false)
        return
      }

      const { data, error } = await fetchLabResults(user.id)

      if (error) {
        setError(error.message)
        setResults([])
      } else {
        setResults(data ?? [])
      }

      setLoading(false)
    }

    void loadResults()
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

            <h1 className="pd-header-title">Lab Results</h1>
            <span className="pd-header-patient">Track tests ordered by your providers</span>
          </div>
        </header>

        <main className="pd-main">
          <section className="mb-6 rounded-3xl border border-sky-100 bg-white/95 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-sky-100 p-3 text-sky-600">
                  <FlaskConical className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Your lab results</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Review test types, results, result details, provider notes, and ordering doctor.
                </p>
              </div>

              <Badge className="rounded-full bg-sky-100 px-4 py-2 text-sky-700 hover:bg-sky-100">
                {results.length} result{results.length === 1 ? '' : 's'}
              </Badge>
            </div>
          </section>

          {error && (
            <Alert className="mb-6 border-rose-200 bg-rose-50 text-rose-800">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
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
          ) : results.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-slate-300 bg-white/90 p-8 text-center">
              <CardContent className="pt-6">
                <FlaskConical className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                <h3 className="text-xl font-semibold text-slate-800">No lab results yet</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Lab results added by your doctor will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {results.map((result) => (
                <Card
                  key={result.id}
                  className="overflow-hidden rounded-3xl border-slate-200 bg-white/95 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-sky-50 to-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl text-slate-900">
                          {result.test_type}
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(result.test_date)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="h-4 w-4" />
                            {result.ordered_by_doctor_name || 'Provider'}
                          </span>
                        </div>
                      </div>

                      {result.test_category && (
                        <Badge className="bg-white text-sky-700 hover:bg-white">
                          {result.test_category}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 p-6">
                    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-sky-700">
                        Result
                      </p>
                      <p className="text-lg font-semibold text-slate-900">{result.result}</p>
                    </div>

                    {result.notes && (
                      <div className="rounded-2xl bg-indigo-50 p-4">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-indigo-600">
                          Notes
                        </p>
                        <p className="text-sm leading-6 text-slate-700">{result.notes}</p>
                      </div>
                    )}
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