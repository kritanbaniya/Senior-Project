import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useClinicContext } from '../../../context/ClinicContext'
import { usePatientQueue } from '../../../features/queue/usePatientQueue'
import PatientQueueCard from '../../../features/queue/components/PatientQueueCard'

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
type LabPoint = { label: string; value: number; max: number } // for simple bar chart

// Mock data – replace with Supabase/API
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
      if (!user) {
        return
      }
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
    setAppointments((prev) => [...prev, newApt].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)))
    setScheduleForm({ date: '', time: '', doctor: MOCK_DOCTORS[0], type: MOCK_APPOINTMENT_TYPES[0], reason: '' })
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

  const upcomingAppointments = appointments.filter((a) => ['scheduled', 'confirmed', 'checked_in'].includes(a.status))
  const recentRecords = MOCK_RECORDS.slice(0, 2)
  /*if (!true) {
    return (
      <div className="pd-layout pd-login-required">
        <div className="pd-login-required-content">
          <p className="pd-login-required-text">Please log in first</p>
          <p className="pd-login-required-hint">Log in to use the patient portal — view appointments, queue status, and medical records.</p>
          <button type="button" className="pd-btn pd-btn-primary pd-login-required-btn" onClick={onOpenLogin}>
            Log in
          </button>
        </div>
      </div>
    )
  }*/
  return (
    <div className="pd-layout">
      {/* Left sidebar */}
      <aside className={`pd-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="pd-sidebar-header">
          <Link to="/" className="pd-sidebar-logo"><span>ClinicIQ</span></Link>
          <button type="button" className="pd-sidebar-toggle" onClick={() => setSidebarCollapsed((c) => !c)} aria-label="Toggle sidebar">
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
        <nav className="pd-nav">
          <a href="#overview" className="pd-nav-item active">Overview</a>
          <a href="#appointments" className="pd-nav-item">Appointments</a>
          <a href="#records" className="pd-nav-item">Records</a>
          <a href="#medications" className="pd-nav-item">Medications</a>
          <a href="#vitals" className="pd-nav-item">Vitals</a>
          <a href="#lab" className="pd-nav-item">Lab results</a>
          <Link to="/dashboard/patient/information" className="pd-nav-item">Your information</Link>
          <Link to="/clinic" className="pd-nav-item">Clinic info</Link>
        </nav>
      </aside>

      <div className="pd-right">
        {/* Top header */}
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
              <button type="button" className="pd-profile-btn" onClick={() => setProfileOpen((o) => !o)} aria-expanded={profileOpen} aria-haspopup="true">
                <span className="pd-avatar">{displayName.slice(0, 2).toUpperCase()}</span>
                <span className="pd-profile-name">{displayName}</span>
                <span className="pd-chevron">▼</span>
              </button>
              {profileOpen && (
                <div className="pd-dropdown" role="menu">
                  <Link to="/" className="pd-dropdown-item">Home</Link>
                  <button type="button" className="pd-dropdown-item" onClick={() => setProfileOpen(false)}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content – card grid */}
        <main className="pd-main">
          {/* Alerts – soft red, top priority */}
          {MOCK_ALERTS.length > 0 && (
            <section className="pd-alerts" id="alerts">
              {MOCK_ALERTS.map((a) => (
                <div key={a.id} className={`pd-alert pd-alert-${a.severity}`}>
                  <span className="pd-alert-icon">⚠</span>
                  <span>{a.text}</span>
                </div>
              ))}
            </section>
          )}

          <div className="pd-grid">
            {/* Patient overview card */}
            <section className="pd-card pd-card-overview" id="overview">
              <h2 className="pd-card-title">Patient overview</h2>
              <div className="pd-overview-grid">
                <div className="pd-overview-item">
                  <span className="pd-overview-label">Age</span>
                  <span className="pd-overview-value">{info?info.age:"-"}</span>
                </div>
                <div className="pd-overview-item">
                  <span className="pd-overview-label">Gender</span>
                  <span className="pd-overview-value">{info?info.gender:"-"}</span>
                </div>
                <div className="pd-overview-item">
                  <span className="pd-overview-label">Patient ID</span>
                  <span className="pd-overview-value pd-mono">{"-"}</span>
                </div>
                <div className="pd-overview-item">
                  <span className="pd-overview-label">Blood Type</span>
                  <span className="pd-overview-value pd-mono">{info?info.blood_type:"-"}</span>
                </div>
                <div className="pd-overview-item">
                  <span className="pd-overview-label">Birthday</span>
                  <span className="pd-overview-value pd-mono">{info?info.birthday:"-"}</span>
                </div>
                <div className="pd-overview-item">
                  <span className="pd-overview-label">Status</span>
                  <span className="pd-overview-value pd-status-badge">{info?"active" : "diactive"}</span>
                </div>
              </div>
            </section>

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
            {queueError && <p className="pd-empty">{queueError}</p>}

            {/* Upcoming appointments */}
            <section className="pd-card pd-card-appointments" id="appointments">
              <h2 className="pd-card-title">Upcoming appointments</h2>
              {upcomingAppointments.length === 0 ? (
                <p className="pd-empty">No upcoming appointments.</p>
              ) : (
                <ul className="pd-list pd-apt-list">
                  {upcomingAppointments.map((apt) => (
                    <li key={apt.id} className="pd-apt-item">
                      <span className="pd-apt-date">{apt.date}</span>
                      <span className="pd-apt-time">{apt.time}</span>
                      <span className="pd-apt-doctor">{apt.doctor}</span>
                      <span className="pd-apt-type">{apt.type}</span>
                      <span className={`pd-apt-status pd-status-${apt.status}`}>{apt.status.replace('_', ' ')}</span>
                    </li>
                  ))}
                </ul>
              )}
              {!showScheduleForm ? (
                <button type="button" className="pd-btn pd-btn-secondary pd-btn-sm" onClick={() => setShowScheduleForm(true)}>Book appointment</button>
              ) : (
                <form className="pd-form" onSubmit={handleScheduleSubmit}>
                  <div className="pd-form-row">
                    <label>Date</label>
                    <input type="date" value={scheduleForm.date} onChange={(e) => setScheduleForm((f) => ({ ...f, date: e.target.value }))} min={todayStr} required />
                  </div>
                  <div className="pd-form-row">
                    <label>Time</label>
                    <input type="time" value={scheduleForm.time} onChange={(e) => setScheduleForm((f) => ({ ...f, time: e.target.value }))} required />
                  </div>
                  <div className="pd-form-row">
                    <label>Provider</label>
                    <select value={scheduleForm.doctor} onChange={(e) => setScheduleForm((f) => ({ ...f, doctor: e.target.value }))}>
                      {MOCK_DOCTORS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="pd-form-row">
                    <label>Visit type</label>
                    <select value={scheduleForm.type} onChange={(e) => setScheduleForm((f) => ({ ...f, type: e.target.value }))}>
                      {MOCK_APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="pd-form-actions">
                    <button type="submit" className="pd-btn pd-btn-primary">Confirm</button>
                    <button type="button" className="pd-btn pd-btn-secondary" onClick={() => setShowScheduleForm(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </section>

            {/* Recent medical records */}
            <section className="pd-card pd-card-records" id="records">
              <h2 className="pd-card-title">Recent medical records</h2>
              {recentRecords.length === 0 ? (
                <p className="pd-empty">No recent records.</p>
              ) : (
                <ul className="pd-list pd-records-list">
                  {recentRecords.map((rec) => (
                    <li key={rec.id} className="pd-record-item">
                      <div className="pd-record-meta">
                        <span className="pd-record-date">{rec.date}</span>
                        <span className="pd-record-doctor">{rec.doctor}</span>
                      </div>
                      <p className="pd-record-summary">{rec.summary}</p>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/dashboard/patient#records" className="pd-link">View all records</Link>
            </section>

            {/* Lab results summary with chart */}
            <section className="pd-card pd-card-lab" id="lab">
              <h2 className="pd-card-title">Lab results summary</h2>
              <div className="pd-lab-chart">
                {MOCK_LAB_CHART.map((point) => (
                  <div key={point.label} className="pd-lab-bar-wrap">
                    <span className="pd-lab-label">{point.label}</span>
                    <div className="pd-lab-bar-bg">
                      <div className="pd-lab-bar-fill" style={{ width: `${Math.min(100, (point.value / point.max) * 100)}%` }} />
                    </div>
                    <span className="pd-lab-value">{point.value}</span>
                  </div>
                ))}
              </div>
              <p className="pd-card-note">Values within reference range. Last updated Feb 2025.</p>
            </section>

            {/* Medications */}
            <section className="pd-card pd-card-meds" id="medications">
              <h2 className="pd-card-title">Medications</h2>
              <ul className="pd-list pd-med-list">
                {MOCK_MEDICATIONS.map((m) => (
                  <li key={m.id} className="pd-med-item">
                    <span className="pd-med-name">{m.name}</span>
                    <span className="pd-med-dosage">{m.dosage}</span>
                    <span className="pd-med-schedule">{m.schedule}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Vital signs */}
            <section className="pd-card pd-card-vitals" id="vitals">
              <h2 className="pd-card-title">Vital signs</h2>
              <div className="pd-vitals-grid">
                {MOCK_VITALS.map((v) => (
                  <div key={v.label} className="pd-vital-item">
                    <span className="pd-vital-label">{v.label}</span>
                    <span className="pd-vital-value">{v.value} <span className="pd-vital-unit">{v.unit}</span></span>
                    {v.status && <span className={`pd-vital-status pd-vital-${v.status}`}>{v.status}</span>}
                  </div>
                ))}
              </div>
              <p className="pd-card-note">Last recorded at your most recent visit.</p>
            </section>

            {/* Digital intake & consent – compact card */}
            <section className="pd-card pd-card-forms" id="forms">
              <h2 className="pd-card-title">Digital intake & consent</h2>
              <p className="pd-card-desc">Complete before your visit to reduce paperwork.</p>
              <div className="pd-form-status-list">
                <div className="pd-form-status">
                  <span>Intake form</span>
                  {intakeComplete ? <span className="pd-status-done">Done</span> : (
                    !showIntakeForm ? (
                      <button type="button" className="pd-btn pd-btn-sm" onClick={() => setShowIntakeForm(true)}>Complete</button>
                    ) : (
                      <form className="pd-form compact" onSubmit={handleIntakeSubmit}>
                        <div className="pd-form-row"><label>Allergies</label><input type="text" placeholder="List any" /></div>
                        <div className="pd-form-row"><label>Medications</label><input type="text" placeholder="Current meds" /></div>
                        <div className="pd-form-row"><label>Emergency contact</label><input type="text" placeholder="Name, phone" /></div>
                        <div className="pd-form-actions">
                          <button type="submit" className="pd-btn pd-btn-primary">Submit</button>
                          <button type="button" className="pd-btn pd-btn-secondary" onClick={() => setShowIntakeForm(false)}>Cancel</button>
                        </div>
                      </form>
                    )
                  )}
                </div>
                <div className="pd-form-status">
                  <span>Consent form</span>
                  {consentComplete ? <span className="pd-status-done">Done</span> : (
                    !showConsentForm ? (
                      <button type="button" className="pd-btn pd-btn-sm" onClick={() => setShowConsentForm(true)}>Complete</button>
                    ) : (
                      <form className="pd-form compact" onSubmit={handleConsentSubmit}>
                        <label className="pd-checkbox-label">
                          <input type="checkbox" required /> I consent to treatment and privacy practices.
                        </label>
                        <div className="pd-form-actions">
                          <button type="submit" className="pd-btn pd-btn-primary">Submit</button>
                          <button type="button" className="pd-btn pd-btn-secondary" onClick={() => setShowConsentForm(false)}>Cancel</button>
                        </div>
                      </form>
                    )
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
