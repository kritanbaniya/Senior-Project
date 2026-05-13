import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useClinicContext } from '../../../context/ClinicContext'
import { usePatientQueue } from '../../../features/queue/usePatientQueue'
import ClinicSelectionCard from '../../../features/queue/components/ClinicSelectionCard'
import PatientQueueCard from '../../../features/queue/components/PatientQueueCard'
import PatientSidebar from './components/PatientSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useAuth } from '../../../context/AuthContext'
import {
  fetchLabResults,
  type LabResultRecord,
} from '../../../features/medical/labResultsApi'
import {
  fetchAllPrescriptions,
  type PrescriptionRecord,
} from '../../../features/medical/prescriptionsApi'

type AppointmentStatus =
  | 'pending'
  | 'requested'
  | 'canceled'
  | 'deserted'
  | 'active'
  | 'completed'

type Appointment = {
  id: string
  date: string
  time: string
  doctor: string
  type: string
  status: AppointmentStatus
  rawDate: string
}

type VisitRecord = {
  id: string
  date: string
  doctor: string
  summary: string
}

type PatientInfo = {
  id: string
  age: number | null
  gender: string | null
  birthday: string | null
  blood_type: string | null
  name: string | null
}

type AppointmentDisplayRow = {
  Appointment_id: string
  appointment_date: string | null
  clinician_name: string | null
  visit_type: string | null
  appointment_status: AppointmentStatus | null
  patient_id: string
  clinic_id: string | null
}

type MedicalHistoryRow = {
  id: string
  visit_date: string
  diagnosis: string
  symptoms: string | null
  observations: string | null
  treatment_plan: string | null
  prescriptions: string | null
  follow_up_notes: string | null
  doctor_name: string
  patient_id: string
}


function DashboardPanel({
  title,
  id,
  children,
  className = '',
}: {
  title: string
  id?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      className={[
        'w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95',
        'shadow-[0px_4px_14px_rgba(15,23,42,0.08)]',
        'transition-all duration-300 ease-out motion-reduce:transition-none',
        'hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0px_20px_40px_rgba(15,23,42,0.14)]',
        'backdrop-blur-sm',
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

function buildMedicalSummary(row: MedicalHistoryRow) {
  const parts = [
    row.diagnosis && `Diagnosis: ${row.diagnosis}`,
    row.symptoms && `Symptoms: ${row.symptoms}`,
    row.observations && `Observations: ${row.observations}`,
    row.treatment_plan && `Plan: ${row.treatment_plan}`,
    row.prescriptions && `Prescriptions: ${row.prescriptions}`,
    row.follow_up_notes && `Follow-up: ${row.follow_up_notes}`,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' • ') : 'No visit summary available yet.'
}

function getAppointmentBadgeClasses(status: AppointmentStatus) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700'
    case 'active':
      return 'bg-sky-100 text-sky-700'
    case 'pending':
    case 'requested':
      return 'bg-indigo-100 text-indigo-700'
    case 'canceled':
    case 'deserted':
      return 'bg-rose-100 text-rose-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function formatAppointmentStatus(status: AppointmentStatus) {
  switch (status) {
    case 'requested':
      return 'requested'
    case 'active':
      return 'scheduled'
    case 'canceled':
      return 'canceled'
    default:
      return status.replace('_', ' ')
  }
}

// returns true when the appointment is active and within the check-in window:
// 2 hours before to 1 hour after the scheduled time.
function isCheckInEligible(apt: { rawDate: string; status: AppointmentStatus }) {
  if (apt.status !== 'active') return false
  const t = new Date(apt.rawDate).getTime()
  const now = Date.now()
  return now >= t - 2 * 60 * 60 * 1000 && now <= t + 60 * 60 * 1000
}

export default function PatientDashboard() {
  const location = useLocation()
  const { profile, logout } = useAuth()
  const {
    selectedClinicId,
    selectedClinicName,
    setSelectedClinicId,
    setSelectedClinicName,
  } = useClinicContext()

  const locationClinicId =
    (location.state as { clinicId?: string } | null)?.clinicId ?? null

  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [loadingDashboard, setLoadingDashboard] = useState(true)

  const [info, setInfo] = useState<PatientInfo | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [records, setRecords] = useState<VisitRecord[]>([])
  const [medications, setMedications] = useState<PrescriptionRecord[]>([])
  const [labs, setLabs] = useState<LabResultRecord[]>([])

  const activeClinicId = selectedClinicId

  const {
    loading: queueLoading,
    error: queueError,
    rateLimitRetry,
    row: queueRow,
    exitState,
    activePosition,
    join,
    joinForAppointment,
    leave,
  } = usePatientQueue(activeClinicId)

  useEffect(() => {
    if (locationClinicId) {
      setSelectedClinicId(locationClinicId)
    }
  }, [locationClinicId, setSelectedClinicId])

  useEffect(() => {
    const loadDashboard = async () => {
      setLoadingDashboard(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoadingDashboard(false)
        return
      }

      const patientInfoPromise = supabase
        .from('patient_info_with_age')
        .select('id, name, birthday, gender, age, blood_type')
        .eq('id', user.id)
        .maybeSingle()

      const appointmentsPromise = supabase
        .from('appointmentlist_display')
        .select(
          'Appointment_id, appointment_date, clinician_name, visit_type, appointment_status, patient_id, clinic_id',
        )
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true })

      const recordsPromise = supabase
        .from('medical_history')
        .select(
          'id, visit_date, diagnosis, symptoms, observations, treatment_plan, prescriptions, follow_up_notes, doctor_name, patient_id',
        )
        .eq('patient_id', user.id)
        .order('visit_date', { ascending: false })
        .limit(5)

      const labsPromise = fetchLabResults(user.id)
      const medicationsPromise = fetchAllPrescriptions(user.id)

      const [patientInfoRes, appointmentsRes, recordsRes, labsRes, medicationsRes] =
      await Promise.all([
        patientInfoPromise,
        appointmentsPromise,
        recordsPromise,
        labsPromise,
        medicationsPromise,
      ])

      if (!patientInfoRes.error) {
        setInfo((patientInfoRes.data as PatientInfo | null) ?? null)
      } else {
        setInfo(null)
      }

      if (!appointmentsRes.error && appointmentsRes.data) {
        const mappedAppointments: Appointment[] = (
          appointmentsRes.data as AppointmentDisplayRow[]
        )
          .filter((row) => row.appointment_date)
          .map((row) => {
            const dt = new Date(row.appointment_date as string)

            return {
              id: String(row.Appointment_id),
              date: dt.toISOString().slice(0, 10),
              time: dt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              doctor: row.clinician_name ?? 'Clinic Staff',
              type: row.visit_type ?? 'Appointment',
              status: (row.appointment_status ?? 'requested') as AppointmentStatus,
              rawDate: row.appointment_date as string,
            }
          })

        setAppointments(mappedAppointments)
      } else {
        setAppointments([])
      }

      if (!recordsRes.error && recordsRes.data) {
        const mappedRecords: VisitRecord[] = (
          recordsRes.data as MedicalHistoryRow[]
        ).map((row) => ({
          id: String(row.id),
          date: row.visit_date,
          doctor: row.doctor_name ?? 'Clinic Staff',
          summary: buildMedicalSummary(row),
        }))

        setRecords(mappedRecords)
      } else {
        setRecords([])
      }

      if (!labsRes.error && labsRes.data) {
        setLabs(labsRes.data)
      } else {
        setLabs([])
        }

      if (!medicationsRes.error && medicationsRes.data) {
        setMedications(medicationsRes.data)
      } else {
        setMedications([])
      }

      setLoadingDashboard(false)
    }

    void loadDashboard()
  }, [activeClinicId])

  const displayName =
    info?.name?.trim() || profile?.full_name?.trim() || 'New Patient'

  const upcomingAppointments = useMemo(() => {
    const etFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' })
    const todayET = etFormatter.format(new Date())

    return appointments
      .filter((a) => {
        if (!['pending', 'requested', 'active'].includes(a.status)) return false
        const aptDateET = etFormatter.format(new Date(a.rawDate))
        return aptDateET >= todayET
      })
      .slice(0, 3)
  }, [appointments])

  const recentRecords = useMemo(() => records.slice(0, 2), [records])

  const showWelcomeAlert =
    appointments.length === 0 &&
    records.length === 0 &&
    medications.length === 0 &&
    labs.length === 0

  return (
    <SidebarProvider defaultOpen
      style={
        {
          "--sidebar-width": "15rem",
      "--sidebar-width-mobile": "10rem",
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

            <h1 className="pd-header-title">Patient Dashboard</h1>
            
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
          {showWelcomeAlert && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Welcome to ClinicIQ. Your dashboard is ready. Appointment history,
              records, and other patient data will appear here as it becomes available.
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 2xl:grid-cols-4">
            <div>
              <DashboardPanel
                title="Patient overview"
                id="overview"
                className="min-h-[400px]"
              >
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Age
                    </span>
                    <span className="text-base font-semibold text-slate-800">
                      {info?.age ?? '-'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Gender
                    </span>
                    <span className="text-base font-semibold text-slate-800">
                      {info?.gender ?? '-'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Patient ID
                    </span>
                    <span className="font-mono text-base font-semibold text-slate-800">
                      {info?.id ?? '-'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Blood Type
                    </span>
                    <span className="font-mono text-base font-semibold text-slate-800">
                      {info?.blood_type ?? '-'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date of Birth
                    </span>
                    <span className="font-mono text-base font-semibold text-slate-800">
                      {info?.birthday ?? '-'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </span>
                    <span className="inline-flex w-fit rounded-md bg-emerald-100 px-2.5 py-1 text-sm font-semibold text-emerald-700">
                      active
                    </span>
                  </div>
                </div>
              </DashboardPanel>
            </div>

            <div>
              <ClinicSelectionCard
                selectedClinicName={selectedClinicName}
                onClearClinic={() => {
                  setSelectedClinicId(null)
                  setSelectedClinicName(null)
                }}
              />
            </div>

            <div>
              <PatientQueueCard
                clinicSelected={Boolean(activeClinicId && selectedClinicName?.trim())}
                clinicid={activeClinicId ?? null}
                loading={queueLoading}
                row={queueRow}
                activePosition={activePosition}
                exitState={exitState}
                rateLimitRetry={rateLimitRetry}
                onJoin={join}
                onLeave={leave}
              />
              {queueError && (
                <p className="mt-3 text-sm text-slate-500">{queueError}</p>
              )}
            </div>

            <div>
              <DashboardPanel
                title="Upcoming appointments"
                id="appointments"
                className="min-h-[400px]"
              >
                {loadingDashboard ? (
                  <p className="text-sm text-slate-500">
                    Loading appointments...
                  </p>
                ) : upcomingAppointments.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No appointments scheduled.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {upcomingAppointments.map((apt) => {
                      const alreadyCheckedIn =
                        queueRow?.is_active &&
                        queueRow.appointment_id === apt.id
                      const canCheckIn =
                        isCheckInEligible(apt) &&
                        !queueRow?.is_active

                      return (
                        <li
                          key={apt.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800">
                              {apt.date}
                            </span>
                            <span
                              className={[
                                'rounded-md px-2 py-1 text-xs font-semibold',
                                getAppointmentBadgeClasses(apt.status),
                              ].join(' ')}
                            >
                              {formatAppointmentStatus(apt.status)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-slate-600">
                            {apt.time}
                          </div>
                          <div className="text-sm text-slate-700">
                            {apt.doctor}
                          </div>
                          <div className="text-sm text-slate-500">
                            {apt.type}
                          </div>
                          {alreadyCheckedIn && (
                            <p className="mt-2 text-xs font-medium text-sky-600">
                              You are checked in for this appointment.
                            </p>
                          )}
                          {canCheckIn && (
                            <>
                              <button
                                type="button"
                                className="mt-2 rounded-lg bg-indigo-400 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => joinForAppointment(apt.id)}
                                disabled={!!rateLimitRetry}
                              >
                                Check in now
                              </button>
                              {rateLimitRetry && (
                                <p className="mt-1 text-xs text-slate-500">
                                  too many attempts. please try again later.
                                </p>
                              )}
                            </>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}

                <div className="mt-4">
                  <Link
                    to="/dashboard/patient/appointments"
                    className="inline-block rounded-lg bg-indigo-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                  >
                    All appointments
                  </Link>
                </div>
              </DashboardPanel>
            </div>

            <div>
              <DashboardPanel
                title="Recent medical records"
                id="records"
                className="min-h-[400px]"
              >
                {loadingDashboard ? (
                  <p className="text-sm text-slate-500">Loading records...</p>
                ) : recentRecords.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No medical records yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {recentRecords.map((rec) => (
                      <li
                        key={rec.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="mb-2 flex flex-wrap gap-2 text-sm">
                          <span className="font-semibold text-sky-700">
                            {rec.date}
                          </span>
                          <span className="text-slate-500">{rec.doctor}</span>
                        </div>
                        <p className="text-sm leading-6 text-slate-600">
                          {rec.summary}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  to="/dashboard/patient/visit-summary"
                  className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline"
                >
                  View all records
                </Link>
              </DashboardPanel>
            </div>

   <div>
  <DashboardPanel
    title="Lab results summary"
    id="lab"
    className="min-h-[350px]"
  >
    {loadingDashboard ? (
      <p className="text-sm text-slate-500">Loading lab results...</p>
    ) : labs.length === 0 ? (
      <p className="text-sm text-slate-500">No lab results available.</p>
    ) : (
      <ul className="flex flex-col gap-3">
        {labs.slice(0, 3).map((lab) => (
          <li
            key={lab.id}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-800">
                {lab.test_type}
              </span>

              <span className="rounded-md bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
                {lab.result}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {lab.test_date}
            </p>

            {lab.result_details && (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {lab.result_details}
              </p>
            )}
          </li>
        ))}
      </ul>
    )}

    <Link
      to="/dashboard/patient/lab-results"
      className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline"
    >
      View all lab results
    </Link>
  </DashboardPanel>
</div>

<div>
  <DashboardPanel
    title="Medications"
    id="medications"
    className="min-h-[350px]"
  >
    {loadingDashboard ? (
      <p className="text-sm text-slate-500">Loading medications...</p>
    ) : medications.length === 0 ? (
      <p className="text-sm text-slate-500">No medications on file.</p>
    ) : (
      <ul className="flex flex-col gap-3">
        {medications.slice(0, 3).map((med) => (
          <li
            key={med.id}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-800">
                {med.medication_name}
              </span>

              <span
                className={[
                  'rounded-md px-2 py-1 text-xs font-semibold',
                  med.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : med.status === 'completed'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-rose-100 text-rose-700',
                ].join(' ')}
              >
                {med.status}
              </span>
            </div>

            <p className="mt-1 text-sm text-sky-700">
              {med.dosage} • {med.frequency}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Duration: {med.duration}
            </p>

            {med.instructions && (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {med.instructions}
              </p>
            )}
          </li>
        ))}
      </ul>
    )}

    <Link
      to="/dashboard/patient/medications"
      className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline"
    >
      View all medications
    </Link>
  </DashboardPanel>
</div>

            <div>
              <DashboardPanel
                title="Digital intake & consent"
                id="forms"
                className="min-h-[350px]"
              >
                <p className="mb-4 text-sm text-slate-500">
                  Complete before your visit to reduce paperwork.
                </p>

                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-medium text-slate-800">
                        Intake form
                      </span>
                      <span className="text-sm font-semibold text-slate-500">
                        Not available yet
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-medium text-slate-800">
                        Consent form
                      </span>
                      <span className="text-sm font-semibold text-slate-500">
                        Not available yet
                      </span>
                    </div>
                  </div>
                </div>
              </DashboardPanel>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}