import { useState } from 'react'
import { Link } from 'react-router-dom'

type DoctorStage = 'waiting' | 'consultation' | 'completed'

type MedicalRecord = {
  date: string
  diagnosis: string
  notes: string
  doctor: string
}

type IntakeForm = {
  allergies: string
  medications: string
  medicalHistory: string
  emergencyContact: string
}

type TestResult = {
  id: string
  type: string
  date: string
  result: string
  notes?: string
}

type DoctorPatient = {
  id: string
  patientName: string
  age: number
  gender: string
  appointmentType: string
  symptoms: string
  stage: DoctorStage
  arrivalTime: string
  intakeForm?: IntakeForm
  medicalHistory?: MedicalRecord[]
  testResults?: TestResult[]
  formsComplete: boolean
}

type ClinicalNote = {
  symptoms: string
  observations: string
  assessment: string
  treatmentPlan: string
  prescriptions: string
  followUpRecommended: boolean
  followUpNotes: string
}

const STAGE_LABELS: Record<DoctorStage, string> = {
  waiting: 'Waiting',
  consultation: 'In consultation',
  completed: 'Completed',
}

const INITIAL_CLINICAL_NOTE: ClinicalNote = {
  symptoms: '',
  observations: '',
  assessment: '',
  treatmentPlan: '',
  prescriptions: '',
  followUpRecommended: false,
  followUpNotes: '',
}

export default function DoctorDashBoard() {
  const [patients, setPatients] = useState<DoctorPatient[]>([
    {
      id: '1',
      patientName: 'Jane Doe',
      age: 34,
      gender: 'Female',
      appointmentType: 'General Check-up',
      symptoms: 'Persistent headache, fatigue for 3 days',
      stage: 'consultation',
      arrivalTime: '09:15 AM',
      formsComplete: true,
      intakeForm: {
        allergies: 'Penicillin',
        medications: 'Lisinopril 10mg daily',
        medicalHistory: 'Hypertension (diagnosed 2020)',
        emergencyContact: 'John Doe (spouse) - 555-0123',
      },
      medicalHistory: [
        {
          date: '2024-11-15',
          diagnosis: 'Upper respiratory infection',
          notes: 'Prescribed amoxicillin 500mg. Symptoms resolved after 7 days.',
          doctor: 'Dr. Smith',
        },
        {
          date: '2024-08-22',
          diagnosis: 'Annual physical examination',
          notes: 'All vitals normal. Continue current hypertension medication.',
          doctor: 'Dr. Johnson',
        },
      ],
      testResults: [
        {
          id: 't1',
          type: 'Blood Panel',
          date: '2024-08-22',
          result: 'Normal',
          notes: 'All values within normal range',
        },
      ],
    },
    {
      id: '2',
      patientName: 'John Smith',
      age: 58,
      gender: 'Male',
      appointmentType: 'Follow-up',
      symptoms: 'Chest discomfort, shortness of breath',
      stage: 'waiting',
      arrivalTime: '09:30 AM',
      formsComplete: false,
      intakeForm: {
        allergies: 'None',
        medications: 'Metformin 500mg twice daily, Atorvastatin 20mg',
        medicalHistory: 'Type 2 Diabetes, High cholesterol',
        emergencyContact: 'Sarah Smith (daughter) - 555-0456',
      },
      medicalHistory: [
        {
          date: '2024-12-01',
          diagnosis: 'Type 2 Diabetes follow-up',
          notes: 'HbA1c at 7.2%. Continue current regimen. Recommend dietary counseling.',
          doctor: 'Dr. Martinez',
        },
      ],
    },
    {
      id: '3',
      patientName: 'Maria Garcia',
      age: 42,
      gender: 'Female',
      appointmentType: 'Consultation',
      symptoms: 'Lower back pain for 2 weeks',
      stage: 'waiting',
      arrivalTime: '09:45 AM',
      formsComplete: true,
      intakeForm: {
        allergies: 'Latex',
        medications: 'Ibuprofen as needed',
        medicalHistory: 'No significant medical history',
        emergencyContact: 'Carlos Garcia (husband) - 555-0789',
      },
    },
  ])

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [clinicalNote, setClinicalNote] = useState<ClinicalNote>(INITIAL_CLINICAL_NOTE)
  const [activeTab, setActiveTab] = useState<'intake' | 'history' | 'tests'>('intake')
  const [showTestForm, setShowTestForm] = useState(false)
  const [newTestResult, setNewTestResult] = useState({ type: '', result: '', notes: '' })
  const [saveNoteFeedback, setSaveNoteFeedback] = useState<string | null>(null)
  const [flagFormsFeedback, setFlagFormsFeedback] = useState<string | null>(null)

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  const updateClinicalNote = (field: keyof ClinicalNote, value: string | boolean) => {
    setClinicalNote((prev) => ({ ...prev, [field]: value }))
  }

  const setPatientStage = (id: string, stage: DoctorStage) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)))
  }

  const saveVisitNotes = () => {
    if (!selectedPatient) return
    if (!clinicalNote.assessment.trim()) {
      alert('Please enter an assessment before saving.')
      return
    }

    // In production, this would save to backend
    console.log('Saving visit notes:', {
      patientId: selectedPatient.id,
      notes: clinicalNote,
      timestamp: new Date().toISOString(),
    })

    setSaveNoteFeedback('Visit notes saved successfully')
    setTimeout(() => setSaveNoteFeedback(null), 3000)
  }

  const completeVisit = () => {
    if (!selectedPatient) return
    if (!clinicalNote.assessment.trim()) {
      alert('Please enter an assessment before completing the visit.')
      return
    }

    // Save notes and mark complete
    console.log('Completing visit for:', selectedPatient.patientName)
    setPatientStage(selectedPatient.id, 'completed')
    setSelectedPatientId(null)
    setClinicalNote(INITIAL_CLINICAL_NOTE)
  }

  const addTestResult = () => {
    if (!selectedPatient || !newTestResult.type || !newTestResult.result) return

    const testResult: TestResult = {
      id: `t${Date.now()}`,
      type: newTestResult.type,
      date: new Date().toISOString().split('T')[0],
      result: newTestResult.result,
      notes: newTestResult.notes,
    }

    setPatients((prev) =>
      prev.map((p) =>
        p.id === selectedPatient.id
          ? { ...p, testResults: [...(p.testResults || []), testResult] }
          : p
      )
    )

    setNewTestResult({ type: '', result: '', notes: '' })
    setShowTestForm(false)
  }

  const flagMissingForms = (patientId: string) => {
    // In production, this would notify nurse
    console.log('Flagging missing forms for patient:', patientId)
    setFlagFormsFeedback(patientId)
    setTimeout(() => setFlagFormsFeedback(null), 3000)
  }

  const waitingCount = patients.filter((p) => p.stage === 'waiting').length
  const inConsultationCount = patients.filter((p) => p.stage === 'consultation').length

  return (
    <div className="clinic-info-page doctor-dashboard">
      <h1 className="page-title">Doctor Dashboard</h1>

      {/* Provider Queue View */}
      <div className="info-box queue-section">
        <h2 className="info-box-title">My Patient Queue</h2>
        <div className="info-box-content">
          <p className="nurse-intro">
            View your assigned patients and their status. Select a patient to review intake forms,
            medical history, and write visit notes.
          </p>

          {/* Quick stats */}
          <div className="queue-live">
            <div className="queue-stat">
              <span className="queue-label">Waiting</span>
              <span className="queue-value">{waitingCount}</span>
            </div>
            <div className="queue-stat">
              <span className="queue-label">In consultation</span>
              <span className="queue-value">{inConsultationCount}</span>
            </div>
            <div className="queue-stat">
              <span className="queue-label">Total assigned</span>
              <span className="queue-value">{patients.length}</span>
            </div>
          </div>

          {patients.length === 0 ? (
            <p className="no-queue">No patients assigned to you today.</p>
          ) : (
            <ol className="nurse-queue-list">
              {patients.map((patient, index) => (
                <li
                  key={patient.id}
                  className={`nurse-queue-item stage-${patient.stage}`}
                >
                  <span className="queue-order">#{index + 1}</span>
                  <div className="queue-patient-info">
                    <span className="queue-patient-name">{patient.patientName}</span>
                    <span className="queue-apt-type">
                      {patient.age} yrs • {patient.appointmentType}
                    </span>
                    <span className="queue-doctor">Arrival: {patient.arrivalTime}</span>
                    {!patient.formsComplete && (
                      <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>
                        ⚠ Forms incomplete
                      </span>
                    )}
                  </div>
                  <div className="queue-stage-badges">
                    {(['waiting', 'consultation', 'completed'] as const).map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        className={`stage-btn ${patient.stage === stage ? 'active' : ''}`}
                        onClick={() => setPatientStage(patient.id, stage)}
                      >
                        {STAGE_LABELS[stage]}
                      </button>
                    ))}
                  </div>
                  <div className="queue-actions">
                    <button
                      type="button"
                      className="btn-small"
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      {selectedPatientId === patient.id ? 'Viewing' : 'View Details'}
                    </button>
                    {!patient.formsComplete && (
                      <button
                        type="button"
                        className="btn-small"
                        onClick={() => flagMissingForms(patient.id)}
                        title="Flag for nurse attention"
                      >
                        Flag forms
                      </button>
                    )}
                  </div>
                  {flagFormsFeedback === patient.id && (
                    <span className="feedback-msg">Nurse notified about missing forms</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Patient Details Panel */}
      {selectedPatient ? (
        <>
          <div className="info-box">
            <h2 className="info-box-title">
              Patient: {selectedPatient.patientName}
            </h2>
            <div className="info-box-content">
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>Age:</span>
                  <strong style={{ marginLeft: '0.5rem' }}>{selectedPatient.age} years</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>Gender:</span>
                  <strong style={{ marginLeft: '0.5rem' }}>{selectedPatient.gender}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>Visit Type:</span>
                  <strong style={{ marginLeft: '0.5rem' }}>{selectedPatient.appointmentType}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>Forms:</span>
                  <strong
                    style={{
                      marginLeft: '0.5rem',
                      color: selectedPatient.formsComplete ? '#166534' : '#dc2626',
                    }}
                  >
                    {selectedPatient.formsComplete ? 'Complete' : 'Incomplete'}
                  </strong>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                  <strong>Chief Complaint:</strong> {selectedPatient.symptoms}
                </p>
              </div>

              {/* Tabs for patient information */}
              <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('intake')}
                    className="stage-btn"
                    style={{
                      background: activeTab === 'intake' ? '#0369a1' : '#fff',
                      color: activeTab === 'intake' ? '#fff' : '#555',
                      borderColor: activeTab === 'intake' ? '#0369a1' : '#ccc',
                      borderRadius: '8px 8px 0 0',
                    }}
                  >
                    Intake Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="stage-btn"
                    style={{
                      background: activeTab === 'history' ? '#0369a1' : '#fff',
                      color: activeTab === 'history' ? '#fff' : '#555',
                      borderColor: activeTab === 'history' ? '#0369a1' : '#ccc',
                      borderRadius: '8px 8px 0 0',
                    }}
                  >
                    Medical History
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tests')}
                    className="stage-btn"
                    style={{
                      background: activeTab === 'tests' ? '#0369a1' : '#fff',
                      color: activeTab === 'tests' ? '#fff' : '#555',
                      borderColor: activeTab === 'tests' ? '#0369a1' : '#ccc',
                      borderRadius: '8px 8px 0 0',
                    }}
                  >
                    Test Results
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'intake' && selectedPatient.intakeForm && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem', fontWeight: 600 }}>
                      ALLERGIES
                    </div>
                    <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
                      {selectedPatient.intakeForm.allergies || 'None reported'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem', fontWeight: 600 }}>
                      CURRENT MEDICATIONS
                    </div>
                    <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
                      {selectedPatient.intakeForm.medications || 'None'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem', fontWeight: 600 }}>
                      MEDICAL HISTORY
                    </div>
                    <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
                      {selectedPatient.intakeForm.medicalHistory || 'No significant history'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem', fontWeight: 600 }}>
                      EMERGENCY CONTACT
                    </div>
                    <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
                      {selectedPatient.intakeForm.emergencyContact}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <>
                  {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 ? (
                    <ul className="records-list">
                      {selectedPatient.medicalHistory.map((record, index) => (
                        <li key={index} className="record-item">
                          <div className="record-header">
                            <span className="record-date">{record.date}</span>
                            <span>{record.diagnosis}</span>
                          </div>
                          <p className="record-summary">{record.notes}</p>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                            Provider: {record.doctor}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-queue">No previous visits on record</p>
                  )}
                </>
              )}

              {activeTab === 'tests' && (
                <>
                  {!showTestForm && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowTestForm(true)}
                      style={{ marginBottom: '1rem' }}
                    >
                      + Add Test Result
                    </button>
                  )}

                  {showTestForm && (
                    <form
                      className="portal-form compact"
                      onSubmit={(e) => {
                        e.preventDefault()
                        addTestResult()
                      }}
                      style={{ marginBottom: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}
                    >
                      <div className="form-row">
                        <label>Test Type</label>
                        <input
                          type="text"
                          placeholder="e.g., X-Ray, Blood Test, ECG"
                          value={newTestResult.type}
                          onChange={(e) => setNewTestResult({ ...newTestResult, type: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-row">
                        <label>Result</label>
                        <input
                          type="text"
                          placeholder="e.g., Normal, Abnormal"
                          value={newTestResult.result}
                          onChange={(e) => setNewTestResult({ ...newTestResult, result: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-row">
                        <label>Notes (optional)</label>
                        <input
                          type="text"
                          placeholder="Additional details"
                          value={newTestResult.notes}
                          onChange={(e) => setNewTestResult({ ...newTestResult, notes: e.target.value })}
                        />
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn-primary">
                          Add Result
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setShowTestForm(false)
                            setNewTestResult({ type: '', result: '', notes: '' })
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {selectedPatient.testResults && selectedPatient.testResults.length > 0 ? (
                    <ul className="records-list">
                      {selectedPatient.testResults.map((test) => (
                        <li key={test.id} className="record-item">
                          <div className="record-header">
                            <span className="record-date">{test.date}</span>
                            <span>{test.type}</span>
                          </div>
                          <p className="record-summary">
                            <strong>Result:</strong> {test.result}
                            {test.notes && (
                              <>
                                <br />
                                <strong>Notes:</strong> {test.notes}
                              </>
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    !showTestForm && <p className="no-queue">No test results available</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Visit Notes Section - Only show when in consultation */}
          {selectedPatient.stage === 'consultation' && (
            <div className="info-box">
              <h2 className="info-box-title">Visit Notes</h2>
              <div className="info-box-content">
                <p className="portal-note">
                  Document symptoms, observations, and assessment. Text-based notes only.
                </p>

                <form className="portal-form">
                  <div className="form-row">
                    <label>Symptoms</label>
                    <textarea
                      placeholder="Patient-reported symptoms..."
                      value={clinicalNote.symptoms}
                      onChange={(e) => updateClinicalNote('symptoms', e.target.value)}
                      style={{ minHeight: '80px', resize: 'vertical' }}
                    />
                  </div>

                  <div className="form-row">
                    <label>Observations</label>
                    <textarea
                      placeholder="Physical examination findings, vital signs..."
                      value={clinicalNote.observations}
                      onChange={(e) => updateClinicalNote('observations', e.target.value)}
                      style={{ minHeight: '80px', resize: 'vertical' }}
                    />
                  </div>

                  <div className="form-row">
                    <label>Assessment (Required)</label>
                    <textarea
                      placeholder="Diagnosis, clinical impression..."
                      value={clinicalNote.assessment}
                      onChange={(e) => updateClinicalNote('assessment', e.target.value)}
                      style={{ minHeight: '100px', resize: 'vertical' }}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <label>Treatment Plan</label>
                    <textarea
                      placeholder="Recommended treatment, lifestyle changes..."
                      value={clinicalNote.treatmentPlan}
                      onChange={(e) => updateClinicalNote('treatmentPlan', e.target.value)}
                      style={{ minHeight: '80px', resize: 'vertical' }}
                    />
                  </div>

                  <div className="form-row">
                    <label>Prescriptions</label>
                    <textarea
                      placeholder="Medications, dosage, frequency..."
                      value={clinicalNote.prescriptions}
                      onChange={(e) => updateClinicalNote('prescriptions', e.target.value)}
                      style={{ minHeight: '80px', resize: 'vertical' }}
                    />
                  </div>

                  <div className="form-row">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={clinicalNote.followUpRecommended}
                        onChange={(e) => updateClinicalNote('followUpRecommended', e.target.checked)}
                      />
                      <span>Recommend follow-up appointment</span>
                    </label>
                  </div>

                  {clinicalNote.followUpRecommended && (
                    <div className="form-row">
                      <label>Follow-up Notes</label>
                      <input
                        type="text"
                        placeholder="e.g., Return in 2 weeks, schedule with nurse"
                        value={clinicalNote.followUpNotes}
                        onChange={(e) => updateClinicalNote('followUpNotes', e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={saveVisitNotes}
                    >
                      Save Notes
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={completeVisit}
                      style={{ background: '#15803d' }}
                    >
                      Complete Visit
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setClinicalNote(INITIAL_CLINICAL_NOTE)}
                    >
                      Clear Form
                    </button>
                  </div>
                  {saveNoteFeedback && (
                    <span className="feedback-msg" style={{ marginTop: '0.5rem', display: 'block' }}>
                      {saveNoteFeedback}
                    </span>
                  )}
                </form>
              </div>
            </div>
          )}

          {selectedPatient.stage === 'waiting' && (
            <div className="info-box">
              <div className="info-box-content">
                <p className="portal-note">
                  Patient is waiting. Mark as "In consultation" to begin writing visit notes.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setPatientStage(selectedPatient.id, 'consultation')}
                >
                  Start Visit
                </button>
              </div>
            </div>
          )}

          {selectedPatient.stage === 'completed' && (
            <div className="info-box">
              <div className="info-box-content">
                <p className="portal-note" style={{ color: '#166534', fontWeight: 600 }}>
                  ✓ Visit completed. Notes have been saved to patient record.
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="info-box">
          <div className="info-box-content">
            <p className="no-queue">Select a patient from the queue above to view details and write visit notes.</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="info-box quick-actions-box">
        <h2 className="info-box-title">Quick actions</h2>
        <div className="info-box-content quick-actions">
          <Link to="/" className="action-link">
            Home
          </Link>
        </div>
      </div>

      <Link to="/" className="back-link">
        ← Back to Home
      </Link>
    </div>
  )
}