import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import NurseAppointmentManager from './NurseAppointmentManager'

// Queue stage: patient flow through the clinic
type QueueStage = 'waiting' | 'consultation' | 'discharge'

type QueuePatient = {
  id: string
  patientName: string
  appointmentId: string
  appointmentType: string
  doctor: string
  stage: QueueStage
  intakeRequested: boolean
  addedAt: string // ISO time
}


const STAGE_LABELS: Record<QueueStage, string> = {
  waiting: 'Waiting',
  consultation: 'In consultation',
  discharge: 'Discharged',
}



// DELETE SOON 
type AppointmentStatus = 'scheduled' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled'
type Appointment = {
  id: string
  date: string
  time: string
  doctor: string
  type: string
  status: AppointmentStatus
  patientName: string
}

// DELETE SOON 
type NewAppointment = {
  id: string; 
  appointment_date: string;  
  patient_name: string;
  patient_email: string;
  clinician_name: string;
  clinic_name: string;
  checkin_at: string | null;
  seen_at: string | null;
  type: string; 
};



//// THE COMPONENT 
export default function NurseDashBoard() {
  const [queue, setQueue] = useState<QueuePatient[]>([
    { id: 'q1', patientName: 'Jane Doe', appointmentId: '1', appointmentType: 'General Check-up', doctor: 'Dr. Smith', stage: 'consultation', intakeRequested: false, addedAt: new Date().toISOString() },
    { id: 'q2', patientName: 'John Smith', appointmentId: '2', appointmentType: 'Follow-up', doctor: 'Dr. Lee', stage: 'waiting', intakeRequested: true, addedAt: new Date().toISOString() },
    { id: 'q3', patientName: 'Maria Garcia', appointmentId: '3', appointmentType: 'Consultation', doctor: 'Dr. Johnson', stage: 'waiting', intakeRequested: false, addedAt: new Date().toISOString() },
  ])
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', date: '2025-02-15', time: '10:00', doctor: 'Dr. Smith', type: 'General Check-up', status: 'checked_in', patientName: 'Jane Doe' },
    { id: '2', date: '2025-02-15', time: '10:30', doctor: 'Dr. Lee', type: 'Follow-up', status: 'checked_in', patientName: 'John Smith' },
    { id: '3', date: '2025-02-15', time: '11:00', doctor: 'Dr. Johnson', type: 'Consultation', status: 'checked_in', patientName: 'Maria Garcia' },
    { id: '4', date: '2025-02-15', time: '14:00', doctor: 'Dr. Smith', type: 'Vaccination', status: 'confirmed', patientName: 'Alex Chen' },
  ])
  const [showAddToQueue, setShowAddToQueue] = useState(false)

  const [intakeSentFeedback, setIntakeSentFeedback] = useState<string | null>(null)

  const todayStr = new Date().toISOString().slice(0, 10)
  const inQueueAppointmentIds = new Set(queue.map((q) => q.appointmentId))
  const availableToAdd = appointments.filter(
    (a) => a.date === todayStr && (a.status === 'confirmed' || a.status === 'scheduled') && !inQueueAppointmentIds.has(a.id)
  )

  const setPatientStage = (queueId: string, stage: QueueStage) => {
    setQueue((prev) => prev.map((p) => (p.id === queueId ? { ...p, stage } : p)))
  }

  const moveInQueue = (queueId: string, direction: 'up' | 'down') => {
    setQueue((prev) => {
      const idx = prev.findIndex((p) => p.id === queueId)
      if (idx === -1) return prev
      const next = idx + (direction === 'up' ? -1 : 1)
      if (next < 0 || next >= prev.length) return prev
      const copy = [...prev]
      ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
      return copy
    })
  }

  const addToQueue = (apt: Appointment) => {
    const newPatient: QueuePatient = {
      id: `q-${apt.id}-${Date.now()}`,
      patientName: apt.patientName,
      appointmentId: apt.id,
      appointmentType: apt.type,
      doctor: apt.doctor,
      stage: 'waiting',
      intakeRequested: false,
      addedAt: new Date().toISOString(),
    }
    setQueue((prev) => [...prev, newPatient])
    setAppointments((prev) => prev.map((a) => (a.id === apt.id ? { ...a, status: 'checked_in' as AppointmentStatus } : a)))
    setShowAddToQueue(false)
  }

  const removeFromQueue = (queueId: string) => {
    const entry = queue.find((p) => p.id === queueId)
    setQueue((prev) => prev.filter((p) => p.id !== queueId))
    if (entry) {
      setAppointments((prev) => prev.map((a) => (a.id === entry.appointmentId ? { ...a, status: 'completed' as AppointmentStatus } : a)))
    }
  }

  const sendIntakeRequest = (queueId: string) => {
    setQueue((prev) => prev.map((p) => (p.id === queueId ? { ...p, intakeRequested: true } : p)))
    setIntakeSentFeedback(queueId)
    setTimeout(() => setIntakeSentFeedback(null), 3000)
  }



  return (
    <div className="clinic-info-page nurse-dashboard">
      <h1 className="page-title">Nurse Dashboard</h1>



      {/* Live service queue */}
      <div className="info-box queue-section">
        <h2 className="info-box-title">Live service queue</h2>
        <div className="info-box-content">
          <p className="nurse-intro">Track and manage patient flow. Change stage or reorder so providers receive patients in sequence.</p>
          {queue.length === 0 ? (
            <p className="no-queue">No patients in queue. Add someone from today’s appointments when they check in.</p>
          ) : (
            <ol className="nurse-queue-list">
              {queue.map((p, index) => (
                <li key={p.id} className={`nurse-queue-item stage-${p.stage}`}>
                  <span className="queue-order">#{index + 1}</span>
                  <div className="queue-patient-info">
                    <span className="queue-patient-name">{p.patientName}</span>
                    <span className="queue-apt-type">{p.appointmentType}</span>
                    <span className="queue-doctor">{p.doctor}</span>
                  </div>
                  <div className="queue-stage-badges">
                    {(['waiting', 'consultation', 'discharge'] as const).map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        className={`stage-btn ${p.stage === stage ? 'active' : ''}`}
                        onClick={() => setPatientStage(p.id, stage)}
                      >
                        {STAGE_LABELS[stage]}
                      </button>
                    ))}
                  </div>
                  <div className="queue-actions">
                    <button type="button" className="btn-small" onClick={() => moveInQueue(p.id, 'up')} disabled={index === 0} title="Move up">
                      ↑
                    </button>
                    <button type="button" className="btn-small" onClick={() => moveInQueue(p.id, 'down')} disabled={index === queue.length - 1} title="Move down">
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn-small"
                      onClick={() => sendIntakeRequest(p.id)}
                      disabled={p.intakeRequested}
                      title="Send intake form request to patient"
                    >
                      {p.intakeRequested ? 'Intake sent' : 'Send intake form'}
                    </button>
                    {p.stage === 'discharge' && (
                      <button type="button" className="btn-small btn-remove" onClick={() => removeFromQueue(p.id)}>
                        Remove
                      </button>
                    )}
                  </div>
                  {intakeSentFeedback === p.id && <span className="feedback-msg">Request sent to patient</span>}
                </li>
              ))}
            </ol>
          )}
          {availableToAdd.length > 0 && (
            <div className="add-to-queue-area">
              {!showAddToQueue ? (
                <button type="button" className="btn-primary" onClick={() => setShowAddToQueue(true)}>
                  Add patient to queue
                </button>
              ) : (
                <div className="add-to-queue-list">
                  <p className="small-label">Today’s appointments not yet in queue:</p>
                  {availableToAdd.map((apt) => (
                    <div key={apt.id} className="add-to-queue-row">
                      <span>{apt.patientName} – {apt.time} – {apt.type}</span>
                      <button type="button" className="btn-small" onClick={() => addToQueue(apt)}>Add</button>
                    </div>
                  ))}
                  <button type="button" className="btn-secondary" onClick={() => setShowAddToQueue(false)}>Cancel</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <NurseAppointmentManager /> 


      {/*QUICK ACTIONS*/}
      <div className="info-box quick-actions-box">
        <h2 className="info-box-title">Quick actions</h2>
        <div className="info-box-content quick-actions">
          <Link to="/dashboard/patient" className="action-link">Patient portal</Link>
          <Link to="/clinic" className="action-link">Clinic info</Link>
          <Link to="/" className="action-link">Home</Link>
        </div>
      </div>

      <Link to="/" className="back-link">← Back to Home</Link>
    </div>
  )
}
