import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useClinicContext } from '../../../context/ClinicContext'
import { usePatientQueue } from '../../../features/queue/usePatientQueue'
import PatientQueueCard from '../../../features/queue/components/PatientQueueCard'
import PatientSidebar from './components/PatientSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

type AppointmentStatus = 'scheduled' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled'
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
  testResults: { name: string; value: string; unit?: string; status?: string }[]
}

type Medication = { id: string; name: string; dosage: string; schedule: string }
type Vital = { label: string; value: string; unit: string; status?: 'normal' | 'warning' }
type LabPoint = { label: string; value: number; max: number }

const MOCK_DOCTORS = ['Dr. Smith', 'Dr. Lee', 'Dr. Johnson']
const MOCK_APPOINTMENT_TYPES = ['General Check-up', 'Follow-up', 'Consultation', 'Vaccination', 'Lab Work']

const MOCK_PATIENT = {
  name: 'Mock Patient',
  age: 42,
  gender: 'Female',
  patientId: 'MRN-8842',
  status: 'Active',
}

const MOCK_RECORDS: VisitRecord[] = [
  {
    id: 'r1',
    date: '2025-02-01',
    doctor: 'Dr. Smith',
    summary: 'Annual physical. Vital signs normal. Discussed diet and exercise. No acute concerns.',
    testResults: [
      { name: 'Blood Pressure', value: '118/76', unit: 'mmHg', status: 'Normal' },
      { name: 'Heart Rate', value: '72', unit: 'bpm', status: 'Normal' },
    ],
  },
  {
    id: 'r2',
    date: '2025-01-15',
    doctor: 'Dr. Lee',
    summary: 'Follow-up for seasonal allergies. Prescription refill provided.',
    testResults: [{ name: 'Allergy Panel', value: 'Negative', status: 'Normal' }],
  },
]

const MOCK_MEDICATIONS: Medication[] = [
  { id: 'm1', name: 'Lisinopril', dosage: '10 mg', schedule: 'Once daily, morning' },
  { id: 'm2', name: 'Vitamin D3', dosage: '2000 IU', schedule: 'Once daily' },
  { id: 'm3', name: 'Cetirizine', dosage: '10 mg', schedule: 'As needed for allergies' },
]

const MOCK_VITALS: Vital[] = [
  { label: 'Heart rate', value: '72', unit: 'bpm', status: 'normal' },
  { label: 'Blood pressure', value: '118/76', unit: 'mmHg', status: 'normal' },
  { label: 'Temperature', value: '98.6', unit: '°F', status: 'normal' },
]

const MOCK_LAB_CHART: LabPoint[] = [
  { label: 'Glucose', value: 95, max: 140 },
  { label: 'Cholesterol', value: 178, max: 200 },
  { label: 'HbA1c', value: 5.4, max: 6 },
  { label: 'WBC', value: 6.2, max: 11 },
]

const MOCK_ALERTS = [
  { id: 'a1', text: 'Annual flu shot due this month', severity: 'info' as const },
  { id: 'a2', text: 'Follow-up lab work requested by Dr. Smith', severity: 'warning' as const },
]

export type PatientInfo = {
  id: string
  age: number | null
  gender: string | null
  birthday: string | null
  blood_type: string | null
  name: string | null
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
        'w-full overflow-hidden rounded-2xl bg-white/95 border border-slate-200/70',
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
  const { selectedClinicId, selectedClinicName, setSelectedClinicId, setSelectedClinicName } = useClinicContext()
  const locationClinicId = (location.state as { clinicId?: string } | null)?.clinicId ?? null

  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', date: '2025-02-15', time: '10:00', doctor: 'Dr. Smith', type: 'General Check-up', status: 'confirmed' },
    { id: '2', date: '2025-02-22', time: '14:30', doctor: 'Dr. Lee', type: 'Follow-up', status: 'confirmed' },
  ])
  const [intakeComplete, setIntakeComplete] = useState(false)
  const [consentComplete, setConsentComplete] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showIntakeForm, setShowIntakeForm] = useState(false)
  const [showConsentForm, setShowConsentForm] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    doctor: MOCK_DOCTORS[0],
    type: MOCK_APPOINTMENT_TYPES[0],
    reason: '',
  })
  const [profileOpen, setProfileOpen] = useState(false)
  const [info, setInfo] = useState<PatientInfo | null>(null)

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
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('patient_info')
        .select('id, name, birthday, gender, age, blood_type')
        .eq('id', user.id)
        .maybeSingle()

      if (!error && data) {
        setInfo(data)
      } else {
        setInfo(null)
      }
    }

    void load()
  }, [])

  const displayName = info?.name?.trim() || MOCK_PATIENT.name
  const todayStr = new Date().toISOString().slice(0, 10)

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newApt: Appointment = {
      id: String(Date.now()),
      date: scheduleForm.date,
      time: scheduleForm.time,
      doctor: scheduleForm.doctor,
      type: scheduleForm.type,
      status: 'scheduled',
    }

    setAppointments((prev) =>
      [...prev, newApt].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    )

    setScheduleForm({
      date: '',
      time: '',
      doctor: MOCK_DOCTORS[0],
      type: MOCK_APPOINTMENT_TYPES[0],
      reason: '',
    })
    setShowScheduleForm(false)
  }

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIntakeComplete(true)
    setShowIntakeForm(false)
  }

  const handleConsentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConsentComplete(true)
    setShowConsentForm(false)
  }

  const upcomingAppointments = appointments.filter((a) =>
    ['scheduled', 'confirmed', 'checked_in'].includes(a.status),
  )
  const recentRecords = MOCK_RECORDS.slice(0, 2)

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
              <span className="pd-search-icon" aria-hidden>🔍</span>
              <input type="search" className="pd-search" placeholder="Search..." aria-label="Search" />
            </div>

            <button type="button" className="pd-icon-btn" aria-label="Notifications">
              <span className="pd-bell">🔔</span>
              {MOCK_ALERTS.length > 0 && <span className="pd-badge">{MOCK_ALERTS.length}</span>}
            </button>

            <div className="pd-profile-wrap">
              <button
                type="button"
                className="pd-profile-btn"
                onClick={() => setProfileOpen((o) => !o)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <span className="pd-avatar">{displayName.slice(0, 2).toUpperCase()}</span>
                <span className="pd-profile-name">{displayName}</span>
                <span className="pd-chevron">▼</span>
              </button>

              {profileOpen && (
                <div className="pd-dropdown" role="menu">
                  <Link to="/" className="pd-dropdown-item">Home</Link>
                  <button type="button" className="pd-dropdown-item" onClick={() => setProfileOpen(false)}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="pd-main">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4 items-start">
            <div>
              <DashboardPanel title="Patient overview" id="overview" className="min-h-[400px]">
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Age</span>
                    <span className="text-base font-semibold text-slate-800">{info ? info.age : '-'}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gender</span>
                    <span className="text-base font-semibold text-slate-800">{info ? info.gender : '-'}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Patient ID</span>
                    <span className="font-mono text-base font-semibold text-slate-800">-</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blood Type</span>
                    <span className="font-mono text-base font-semibold text-slate-800">{info ? info.blood_type : '-'}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date of Birth</span>
                    <span className="font-mono text-base font-semibold text-slate-800">{info ? info.birthday : '-'}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                    <span className="inline-flex w-fit rounded-md bg-emerald-100 px-2.5 py-1 text-sm font-semibold text-emerald-700">
                      {info ? 'active' : 'inactive'}
                    </span>
                  </div>
                </div>
              </DashboardPanel>
            </div>

            <div>
                <PatientQueueCard
                  clinicSelected={Boolean(activeClinicId)}
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
              {queueError && <p className="mt-3 text-sm text-slate-500">{queueError}</p>}
            </div>

            <div>
              <DashboardPanel title="Upcoming appointments" id="appointments" className="min-h-[400px]">
                {upcomingAppointments.length === 0 ? (
                  <p className="text-sm text-slate-500">No upcoming appointments.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {upcomingAppointments.map((apt) => (
                      <li key={apt.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800">{apt.date}</span>
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
                        <div className="mt-2 text-sm text-slate-600">{apt.time}</div>
                        <div className="text-sm text-slate-700">{apt.doctor}</div>
                        <div className="text-sm text-slate-500">{apt.type}</div>
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
                    >
                      Book appointment
                    </button>
                  ) : (
                    <form className="flex flex-col gap-3" onSubmit={handleScheduleSubmit}>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                        <input
                          type="date"
                          value={scheduleForm.date}
                          onChange={(e) => setScheduleForm((f) => ({ ...f, date: e.target.value }))}
                          min={todayStr}
                          required
                          className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Time</label>
                        <input
                          type="time"
                          value={scheduleForm.time}
                          onChange={(e) => setScheduleForm((f) => ({ ...f, time: e.target.value }))}
                          required
                          className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Provider</label>
                        <select
                          value={scheduleForm.doctor}
                          onChange={(e) => setScheduleForm((f) => ({ ...f, doctor: e.target.value }))}
                          className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                        >
                          {MOCK_DOCTORS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Visit type</label>
                        <select
                          value={scheduleForm.type}
                          onChange={(e) => setScheduleForm((f) => ({ ...f, type: e.target.value }))}
                          className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                        >
                          {MOCK_APPOINTMENT_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-2 flex gap-3">
                        <button type="submit" className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
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
                </div>
              </DashboardPanel>
            </div>

            <div>
              <DashboardPanel title="Recent medical records" id="records" className="min-h-[400px]">
                {recentRecords.length === 0 ? (
                  <p className="text-sm text-slate-500">No recent records.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {recentRecords.map((rec) => (
                      <li key={rec.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="mb-2 flex flex-wrap gap-2 text-sm">
                          <span className="font-semibold text-sky-700">{rec.date}</span>
                          <span className="text-slate-500">{rec.doctor}</span>
                        </div>
                        <p className="text-sm leading-6 text-slate-600">{rec.summary}</p>
                      </li>
                    ))}
                  </ul>
                )}

                <Link to="/dashboard/patient#records" className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline">
                  View all records
                </Link>
              </DashboardPanel>
            </div>

            <div>
              <DashboardPanel title="Lab results summary" id="lab" className="min-h-[350px]">
                <div className="flex flex-col gap-4">
                  {MOCK_LAB_CHART.map((point) => (
                    <div key={point.label} className="grid grid-cols-[80px_1fr_40px] items-center gap-2 text-sm">
                      <span className="font-medium text-slate-600">{point.label}</span>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all"
                          style={{ width: `${Math.min(100, (point.value / point.max) * 100)}%` }}
                        />
                      </div>
                      <span className="text-right font-semibold text-slate-800">{point.value}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Values within reference range. Last updated Feb 2025.
                </p>
              </DashboardPanel>
            </div>

            <div>
              <DashboardPanel title="Medications" id="medications" className="min-h-[350px]">
                <ul className="flex flex-col gap-3">
                  {MOCK_MEDICATIONS.map((m) => (
                    <li key={m.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800">{m.name}</span>
                        <span className="text-sm font-medium text-sky-700">{m.dosage}</span>
                      </div>
                      <div className="mt-1 text-sm text-slate-500">{m.schedule}</div>
                    </li>
                  ))}
                </ul>
              </DashboardPanel>
            </div>

            <div>
              <DashboardPanel title="Vital signs" id="vitals" className="min-h-[350px]">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {MOCK_VITALS.map((v) => (
                    <div key={v.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{v.label}</div>
                      <div className="mt-2 text-lg font-bold text-slate-800">
                        {v.value} <span className="text-sm font-medium text-slate-500">{v.unit}</span>
                      </div>
                      {v.status && (
                        <div className="mt-2 text-xs font-semibold capitalize text-emerald-700">
                          {v.status}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-sm text-slate-500">Last recorded at your most recent visit.</p>
              </DashboardPanel>
            </div>

            <div>
              <DashboardPanel title="Digital intake & consent" id="forms" className="min-h-[350px]">
                <p className="mb-4 text-sm text-slate-500">Complete before your visit to reduce paperwork.</p>

                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-medium text-slate-800">Intake form</span>

                      {intakeComplete ? (
                        <span className="text-sm font-semibold text-emerald-700">Done</span>
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
                      <form className="mt-4 flex flex-col gap-3" onSubmit={handleIntakeSubmit}>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Allergies</label>
                          <input
                            type="text"
                            placeholder="List any"
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Medications</label>
                          <input
                            type="text"
                            placeholder="Current meds"
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Emergency contact</label>
                          <input
                            type="text"
                            placeholder="Name, phone"
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button type="submit" className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
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
                      <span className="font-medium text-slate-800">Consent form</span>

                      {consentComplete ? (
                        <span className="text-sm font-semibold text-emerald-700">Done</span>
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
                      <form className="mt-4 flex flex-col gap-3" onSubmit={handleConsentSubmit}>
                        <label className="flex items-start gap-2 text-sm text-slate-600">
                          <input type="checkbox" required className="mt-1" />
                          I consent to treatment and privacy practices.
                        </label>

                        <div className="flex gap-3">
                          <button type="submit" className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
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