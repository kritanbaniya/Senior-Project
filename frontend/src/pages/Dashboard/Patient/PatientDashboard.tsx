import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useClinicContext } from '../../../context/ClinicContext'
import { usePatientQueue } from '../../../features/queue/usePatientQueue'
import PatientQueueCard from '../../../features/queue/components/PatientQueueCard'
import PatientSidebar from './components/PatientSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useAuth } from '../../../context/AuthContext'

type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'

type Appointment = {
  id: string
  date: string
  time: string
  doctor: string
  type: string
  status: AppointmentStatus
}

type VisitRecord = {
  id: string
  date: string
  doctor: string
  summary: string
}

type Medication = {
  id: string
  name: string
  dosage: string
  schedule: string
}

type LabPoint = {
  label: string
  value: number
  max: number
}

type PatientInfo = {
  id: string
  age: number | null
  gender: string | null
  birthday: string | null
  blood_type: string | null
  name: string | null
}

type IntakeFormRow = {
  patient_id: string
  allergies: string | null
  current_medications: string | null
  emergency_contact: string | null
  completed_at: string | null
}

type ConsentFormRow = {
  patient_id: string
  accepted: boolean | null
  accepted_at: string | null
}

type DoctorOption = {
  id: string
  full_name: string | null
}

type AppointmentRow = {
  id: string
  appointment_date: string
  visit_type: string | null
  status: AppointmentStatus | null
  profiles:
    | {
        full_name: string | null
      }
    | {
        full_name: string | null
      }[]
    | null
}

type MedicalRecordRow = {
  id: string
  visit_date: string
  summary: string | null
  profiles:
    | {
        full_name: string | null
      }
    | {
        full_name: string | null
      }[]
    | null
}

type MedicationRow = {
  id: string
  name: string | null
  dosage: string | null
  schedule: string | null
}

type LabRow = {
  id: string
  test_name: string | null
  result_value: number | string | null
  reference_max: number | string | null
  recorded_at: string | null
}

type MembershipDoctorRow = {
  user_id: string
  profiles:
    | {
        full_name: string | null
      }
    | {
        full_name: string | null
      }[]
    | null
}

const APPOINTMENT_TYPES = [
  'General Check-up',
  'Follow-up',
  'Consultation',
  'Vaccination',
  'Lab Work',
]

const DEFAULT_LAB_REFERENCE_MAX: Record<string, number> = {
  Glucose: 140,
  Cholesterol: 200,
  HbA1c: 6,
  WBC: 11,
}

function getJoinedName(
  relation:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null
    | undefined,
  fallback: string,
) {
  if (!relation) return fallback
  if (Array.isArray(relation)) return relation[0]?.full_name ?? fallback
  return relation.full_name ?? fallback
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
  const [loadingDashboard, setLoadingDashboard] = useState(true)

  const [info, setInfo] = useState<PatientInfo | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [records, setRecords] = useState<VisitRecord[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [labs, setLabs] = useState<LabPoint[]>([])
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([])

  const [intakeComplete, setIntakeComplete] = useState(false)
  const [consentComplete, setConsentComplete] = useState(false)

  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showIntakeForm, setShowIntakeForm] = useState(false)
  const [showConsentForm, setShowConsentForm] = useState(false)

  const [intakeForm, setIntakeForm] = useState({
    allergies: '',
    currentMedications: '',
    emergencyContact: '',
  })

  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    doctorId: '',
    type: APPOINTMENT_TYPES[0],
    reason: '',
  })

  const activeClinicId = selectedClinicId

  const {
    loading: queueLoading,
    error: queueError,
    row: queueRow,
    exitState,
    activePosition,
    peopleAhead,
    join,
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
        .from('patient_info')
        .select('id, name, birthday, gender, age, blood_type')
        .eq('id', user.id)
        .maybeSingle()

      const appointmentsPromise = supabase
        .from('appointments')
        .select(
          `
          id,
          appointment_date,
          visit_type,
          status,
          profiles!appointments_clinician_id_fkey(full_name)
        `,
        )
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true })

      const recordsPromise = supabase
        .from('medical_records')
        .select(
          `
          id,
          visit_date,
          summary,
          profiles!medical_records_clinician_id_fkey(full_name)
        `,
        )
        .eq('patient_id', user.id)
        .order('visit_date', { ascending: false })
        .limit(5)

      const medicationsPromise = supabase
        .from('patient_medications')
        .select('id, name, dosage, schedule')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })

      const labsPromise = supabase
        .from('patient_lab_results')
        .select('id, test_name, result_value, reference_max, recorded_at')
        .eq('patient_id', user.id)
        .order('recorded_at', { ascending: false })

      const intakePromise = supabase
        .from('patient_intake_forms')
        .select(
          'patient_id, allergies, current_medications, emergency_contact, completed_at',
        )
        .eq('patient_id', user.id)
        .maybeSingle()

      const consentPromise = supabase
        .from('patient_consent_forms')
        .select('patient_id, accepted, accepted_at')
        .eq('patient_id', user.id)
        .maybeSingle()

      const doctorsPromise = activeClinicId
        ? supabase
            .from('memberships')
            .select(
              `
              user_id,
              profiles!memberships_user_id_fkey(full_name)
            `,
            )
            .eq('clinic_id', activeClinicId)
            .eq('role', 'doctor')
        : Promise.resolve({ data: [], error: null })

      const [
        patientInfoRes,
        appointmentsRes,
        recordsRes,
        medicationsRes,
        labsRes,
        intakeRes,
        consentRes,
        doctorsRes,
      ] = await Promise.all([
        patientInfoPromise,
        appointmentsPromise,
        recordsPromise,
        medicationsPromise,
        labsPromise,
        intakePromise,
        consentPromise,
        doctorsPromise,
      ])

      if (!patientInfoRes.error) {
        setInfo((patientInfoRes.data as PatientInfo | null) ?? null)
      }

      if (!appointmentsRes.error && appointmentsRes.data) {
        const mappedAppointments: Appointment[] = (
          appointmentsRes.data as AppointmentRow[]
        ).map((row) => {
          const dt = new Date(row.appointment_date)
          return {
            id: String(row.id),
            date: dt.toISOString().slice(0, 10),
            time: dt.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            doctor: getJoinedName(row.profiles, 'Clinic Staff'),
            type: row.visit_type ?? 'Appointment',
            status: (row.status ?? 'scheduled') as AppointmentStatus,
          }
        })
        setAppointments(mappedAppointments)
      } else {
        setAppointments([])
      }

      if (!recordsRes.error && recordsRes.data) {
        const mappedRecords: VisitRecord[] = (
          recordsRes.data as MedicalRecordRow[]
        ).map((row) => ({
          id: String(row.id),
          date: row.visit_date,
          doctor: getJoinedName(row.profiles, 'Clinic Staff'),
          summary: row.summary ?? 'No visit summary available yet.',
        }))
        setRecords(mappedRecords)
      } else {
        setRecords([])
      }

      if (!medicationsRes.error && medicationsRes.data) {
        const mappedMeds: Medication[] = (
          medicationsRes.data as MedicationRow[]
        ).map((row) => ({
          id: String(row.id),
          name: row.name ?? 'Unnamed medication',
          dosage: row.dosage ?? '-',
          schedule: row.schedule ?? '-',
        }))
        setMedications(mappedMeds)
      } else {
        setMedications([])
      }

      if (!labsRes.error && labsRes.data) {
        const latestByLabel = new Map<string, LabPoint>()

        for (const row of labsRes.data as LabRow[]) {
          const label = row.test_name ?? 'Unknown'
          if (!latestByLabel.has(label)) {
            const value = Number(row.result_value ?? 0)
            const fallbackMax = DEFAULT_LAB_REFERENCE_MAX[label] ?? 100
            const max = Number(row.reference_max ?? fallbackMax)

            latestByLabel.set(label, {
              label,
              value,
              max: Number.isFinite(max) && max > 0 ? max : fallbackMax,
            })
          }
        }

        setLabs(Array.from(latestByLabel.values()).slice(0, 4))
      } else {
        setLabs([])
      }

      if (!intakeRes.error && intakeRes.data) {
        const intake = intakeRes.data as IntakeFormRow
        setIntakeComplete(Boolean(intake.completed_at))
        setIntakeForm({
          allergies: intake.allergies ?? '',
          currentMedications: intake.current_medications ?? '',
          emergencyContact: intake.emergency_contact ?? '',
        })
      } else {
        setIntakeComplete(false)
        setIntakeForm({
          allergies: '',
          currentMedications: '',
          emergencyContact: '',
        })
      }

      if (!consentRes.error && consentRes.data) {
        const consent = consentRes.data as ConsentFormRow
        setConsentComplete(Boolean(consent.accepted))
      } else {
        setConsentComplete(false)
      }

      if (!doctorsRes.error && doctorsRes.data) {
        const mappedDoctors: DoctorOption[] = (
          doctorsRes.data as MembershipDoctorRow[]
        ).map((row) => ({
          id: row.user_id,
          full_name: getJoinedName(row.profiles, 'Doctor'),
        }))

        setDoctorOptions(mappedDoctors)
        setScheduleForm((prev) => ({
          ...prev,
          doctorId: prev.doctorId || mappedDoctors[0]?.id || '',
        }))
      } else {
        setDoctorOptions([])
      }

      setLoadingDashboard(false)
    }

    void loadDashboard()
  }, [activeClinicId])

  const displayName =
    info?.name?.trim() || profile?.full_name?.trim() || 'New Patient'

  const todayStr = new Date().toISOString().slice(0, 10)

  const upcomingAppointments = useMemo(
    () =>
      appointments.filter((a) =>
        ['scheduled', 'confirmed', 'checked_in'].includes(a.status),
      ),
    [appointments],
  )

  const recentRecords = useMemo(() => records.slice(0, 2), [records])

  const showWelcomeAlert =
    !intakeComplete &&
    !consentComplete &&
    appointments.length === 0 &&
    records.length === 0 &&
    medications.length === 0 &&
    labs.length === 0

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !activeClinicId || !scheduleForm.doctorId) return

    const appointmentDate = `${scheduleForm.date}T${scheduleForm.time}:00`

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: user.id,
        clinic_id: activeClinicId,
        clinician_id: scheduleForm.doctorId,
        appointment_date: appointmentDate,
        visit_type: scheduleForm.type,
        status: 'scheduled',
        reason: scheduleForm.reason || null,
      })
      .select(
        `
        id,
        appointment_date,
        visit_type,
        status,
        profiles!appointments_clinician_id_fkey(full_name)
      `,
      )
      .single()

    if (error || !data) return

    const row = data as AppointmentRow
    const dt = new Date(row.appointment_date)

    const newAppointment: Appointment = {
      id: String(row.id),
      date: dt.toISOString().slice(0, 10),
      time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      doctor: getJoinedName(row.profiles, 'Clinic Staff'),
      type: row.visit_type ?? 'Appointment',
      status: (row.status ?? 'scheduled') as AppointmentStatus,
    }

    setAppointments((prev) =>
      [...prev, newAppointment].sort((a, b) =>
        `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
      ),
    )

    setScheduleForm({
      date: '',
      time: '',
      doctorId: doctorOptions[0]?.id ?? '',
      type: APPOINTMENT_TYPES[0],
      reason: '',
    })
    setShowScheduleForm(false)
  }

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase.from('patient_intake_forms').upsert(
      {
        patient_id: user.id,
        allergies: intakeForm.allergies || null,
        current_medications: intakeForm.currentMedications || null,
        emergency_contact: intakeForm.emergencyContact || null,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'patient_id' },
    )

    if (error) return

    setIntakeComplete(true)
    setShowIntakeForm(false)
  }

  const handleConsentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase.from('patient_consent_forms').upsert(
      {
        patient_id: user.id,
        accepted: true,
        accepted_at: new Date().toISOString(),
      },
      { onConflict: 'patient_id' },
    )

    if (error) return

    setConsentComplete(true)
    setShowConsentForm(false)
  }

  return (
    <SidebarProvider defaultOpen>
      <PatientSidebar />

      <div className="pd-right">
        <header className="pd-header">
          <div className="pd-header-left">
            <h1 className="pd-header-title">Patient Dashboard</h1>
            <span className="pd-header-patient">{displayName}</span>
          </div>

          <div className="pd-header-actions">
            <div className="pd-search-wrap">
              <span className="pd-search-icon" aria-hidden>
                🔍
              </span>
              <input
                type="search"
                className="pd-search"
                placeholder="Search..."
                aria-label="Search"
              />
            </div>

            <button
              type="button"
              className="pd-icon-btn"
              aria-label="Notifications"
            >
              <span className="pd-bell">🔔</span>
              {showWelcomeAlert && <span className="pd-badge">1</span>}
            </button>

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
              Welcome to ClinicIQ. Complete your intake and consent forms to get
              started.
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
              <PatientQueueCard
                clinicSelected={Boolean(activeClinicId && selectedClinicName?.trim())}
                selectedClinicName={selectedClinicName}
                loading={queueLoading}
                row={queueRow}
                activePosition={activePosition}
                peopleAhead={peopleAhead}
                exitState={exitState}
                onJoin={join}
                onLeave={leave}
                onClearClinic={() => {
                  setSelectedClinicId(null)
                  setSelectedClinicName(null)
                }}
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
                    {upcomingAppointments.map((apt) => (
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
                              apt.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : apt.status === 'checked_in'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-indigo-100 text-indigo-700',
                            ].join(' ')}
                          >
                            {apt.status.replace('_', ' ')}
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
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4">
                  {!showScheduleForm ? (
                    <button
                      type="button"
                      className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                      onClick={() => setShowScheduleForm(true)}
                      disabled={!activeClinicId}
                    >
                      Book appointment
                    </button>
                  ) : (
                    <form
                      className="flex flex-col gap-3"
                      onSubmit={handleScheduleSubmit}
                    >
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Date
                        </label>
                        <input
                          type="date"
                          value={scheduleForm.date}
                          onChange={(e) =>
                            setScheduleForm((f) => ({
                              ...f,
                              date: e.target.value,
                            }))
                          }
                          min={todayStr}
                          required
                          className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Time
                        </label>
                        <input
                          type="time"
                          value={scheduleForm.time}
                          onChange={(e) =>
                            setScheduleForm((f) => ({
                              ...f,
                              time: e.target.value,
                            }))
                          }
                          required
                          className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Provider
                        </label>
                        <select
                          value={scheduleForm.doctorId}
                          onChange={(e) =>
                            setScheduleForm((f) => ({
                              ...f,
                              doctorId: e.target.value,
                            }))
                          }
                          required
                          className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                        >
                          {doctorOptions.length === 0 ? (
                            <option value="">No providers available</option>
                          ) : (
                            doctorOptions.map((doctor) => (
                              <option key={doctor.id} value={doctor.id}>
                                {doctor.full_name ?? 'Doctor'}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Visit type
                        </label>
                        <select
                          value={scheduleForm.type}
                          onChange={(e) =>
                            setScheduleForm((f) => ({
                              ...f,
                              type: e.target.value,
                            }))
                          }
                          className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                        >
                          {APPOINTMENT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Reason
                        </label>
                        <input
                          type="text"
                          value={scheduleForm.reason}
                          onChange={(e) =>
                            setScheduleForm((f) => ({
                              ...f,
                              reason: e.target.value,
                            }))
                          }
                          placeholder="Reason for visit"
                          className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div className="mt-2 flex gap-3">
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                          onClick={() => setShowScheduleForm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {!activeClinicId && (
                    <p className="mt-3 text-sm text-slate-500">
                      Select a clinic first before booking.
                    </p>
                  )}
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
                  to="/dashboard/patient#records"
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
                  <p className="text-sm text-slate-500">
                    Loading lab results...
                  </p>
                ) : labs.length === 0 ? (
                  <>
                    <p className="text-sm text-slate-500">
                      No lab results available.
                    </p>
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      Results will appear here after your clinic uploads them.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-4">
                      {labs.map((point) => (
                        <div
                          key={point.label}
                          className="grid grid-cols-[80px_1fr_40px] items-center gap-2 text-sm"
                        >
                          <span className="font-medium text-slate-600">
                            {point.label}
                          </span>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (point.value / point.max) * 100,
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-right font-semibold text-slate-800">
                            {point.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      Showing your most recent lab values.
                    </p>
                  </>
                )}
              </DashboardPanel>
            </div>

            <div>
              <DashboardPanel
                title="Medications"
                id="medications"
                className="min-h-[350px]"
              >
                {loadingDashboard ? (
                  <p className="text-sm text-slate-500">
                    Loading medications...
                  </p>
                ) : medications.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No medications on file.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {medications.map((medication) => (
                      <li
                        key={medication.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800">
                            {medication.name}
                          </span>
                          <span className="text-sm font-medium text-sky-700">
                            {medication.dosage}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {medication.schedule}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
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

                      {intakeComplete ? (
                        <span className="text-sm font-semibold text-emerald-700">
                          Done
                        </span>
                      ) : !showIntakeForm ? (
                        <button
                          type="button"
                          className="rounded-lg bg-indigo-400 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                          onClick={() => setShowIntakeForm(true)}
                        >
                          Complete
                        </button>
                      ) : null}
                    </div>

                    {showIntakeForm && !intakeComplete && (
                      <form
                        className="mt-4 flex flex-col gap-3"
                        onSubmit={handleIntakeSubmit}
                      >
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            Allergies
                          </label>
                          <input
                            type="text"
                            value={intakeForm.allergies}
                            onChange={(e) =>
                              setIntakeForm((f) => ({
                                ...f,
                                allergies: e.target.value,
                              }))
                            }
                            placeholder="List any"
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            Medications
                          </label>
                          <input
                            type="text"
                            value={intakeForm.currentMedications}
                            onChange={(e) =>
                              setIntakeForm((f) => ({
                                ...f,
                                currentMedications: e.target.value,
                              }))
                            }
                            placeholder="Current meds"
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            Emergency contact
                          </label>
                          <input
                            type="text"
                            value={intakeForm.emergencyContact}
                            onChange={(e) =>
                              setIntakeForm((f) => ({
                                ...f,
                                emergencyContact: e.target.value,
                              }))
                            }
                            placeholder="Name, phone"
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="submit"
                            className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                          >
                            Submit
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                            onClick={() => setShowIntakeForm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-medium text-slate-800">
                        Consent form
                      </span>

                      {consentComplete ? (
                        <span className="text-sm font-semibold text-emerald-700">
                          Done
                        </span>
                      ) : !showConsentForm ? (
                        <button
                          type="button"
                          className="rounded-lg bg-indigo-400 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                          onClick={() => setShowConsentForm(true)}
                        >
                          Complete
                        </button>
                      ) : null}
                    </div>

                    {showConsentForm && !consentComplete && (
                      <form
                        className="mt-4 flex flex-col gap-3"
                        onSubmit={handleConsentSubmit}
                      >
                        <label className="flex items-start gap-2 text-sm text-slate-600">
                          <input type="checkbox" required className="mt-1" />
                          I consent to treatment and privacy practices.
                        </label>

                        <div className="flex gap-3">
                          <button
                            type="submit"
                            className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                          >
                            Submit
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                            onClick={() => setShowConsentForm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
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