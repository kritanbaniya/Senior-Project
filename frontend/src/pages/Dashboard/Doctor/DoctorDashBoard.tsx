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
    console.log('Flagging missing forms for patient:', patientId)
    setFlagFormsFeedback(patientId)
    setTimeout(() => setFlagFormsFeedback(null), 3000)
  }

  return (
    <div className="clinic-info-page doctor-dashboard" style={{ maxWidth: '100%', width: '100%' }}>
      <h1 className="page-title">Doctor Dashboard</h1>

      {/* Three-column layout: Queue | Patient Info | Visit Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 420px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Patient Queue */}
        <div className="info-box queue-section" style={{ position: 'sticky', top: '1rem', maxHeight: '85vh', overflowY: 'auto' }}>
          <h2 className="info-box-title">Patient Queue</h2>
          <div className="info-box-content">

            {patients.length === 0 ? (
              <p className="no-queue">No patients assigned.</p>
            ) : (
              <ol className="nurse-queue-list" style={{ marginBottom: 0 }}>
                {patients.map((patient, index) => (
                  <li
                    key={patient.id}
                    className={`nurse-queue-item stage-${patient.stage}`}
                    onClick={() => setSelectedPatientId(patient.id)}
                    style={{
                      cursor: 'pointer',
                      border: selectedPatientId === patient.id ? '2px solid #0369a1' : '1px solid rgba(0,0,0,0.08)',
                      background: selectedPatientId === patient.id ? '#f0f9ff' : undefined,
                      gridTemplateColumns: 'auto 1fr',
                      padding: '0.65rem',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <span className="queue-order" style={{ fontSize: '0.85rem' }}>#{index + 1}</span>
                    <div>
                      <div className="queue-patient-name" style={{ marginBottom: '0.2rem', fontSize: '0.9rem' }}>
                        {patient.patientName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {patient.age}y • {patient.appointmentType}
                      </div>
                      {!patient.formsComplete && (
                        <div style={{ color: '#dc2626', fontSize: '0.7rem', fontWeight: 600, marginTop: '0.2rem' }}>
                          ⚠ Incomplete
                        </div>
                      )}
                      <div style={{ marginTop: '0.35rem' }}>
                        <span className={`patient-status status-${patient.stage}`} style={{
                          fontSize: '0.65rem',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '3px',
                          textTransform: 'uppercase',
                          display: 'inline-block'
                        }}>
                          {STAGE_LABELS[patient.stage]}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: Patient Information */}
        {selectedPatient ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Patient Header */}
            <div className="info-box">
              <div className="info-box-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <div>
                    <h2 style={{ margin: '0 0 0.35rem 0', fontSize: '1.4rem' }}>
                      {selectedPatient.patientName}
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {selectedPatient.age} years • {selectedPatient.gender} • {selectedPatient.appointmentType}
                    </div>
                  </div>
                  
                  {selectedPatient.stage === 'waiting' && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setPatientStage(selectedPatient.id, 'consultation')}
                    >
                      Start Visit
                    </button>
                  )}
                </div>

                <div style={{ 
                  padding: '0.65rem', 
                  background: '#f0f9ff', 
                  borderRadius: '6px',
                  borderLeft: '3px solid #0369a1',
                  fontSize: '0.9rem'
                }}>
                  <strong style={{ fontSize: '0.8rem', color: '#0369a1' }}>Chief Complaint:</strong>
                  <div style={{ marginTop: '0.2rem' }}>{selectedPatient.symptoms}</div>
                </div>

                {!selectedPatient.formsComplete && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn-small"
                      onClick={() => flagMissingForms(selectedPatient.id)}
                    >
                      Flag Incomplete Forms
                    </button>
                    {flagFormsFeedback === selectedPatient.id && (
                      <span className="feedback-msg" style={{ marginLeft: '0.5rem' }}>Nurse notified</span>
                    )}
                  </div>
                )}

                {selectedPatient.stage === 'completed' && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#f0fdf4', borderRadius: '6px', color: '#166534', fontSize: '0.85rem', fontWeight: 600 }}>
                    ✓ Visit completed
                  </div>
                )}
              </div>
            </div>

            {/* Patient Information Tabs */}
            <div className="info-box">
              <div style={{ borderBottom: '2px solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: '0.25rem', padding: '0 1rem' }}>
                  {(['intake', 'history', 'tests'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      style={{
                        background: activeTab === tab ? '#0369a1' : 'transparent',
                        color: activeTab === tab ? '#fff' : '#555',
                        border: 'none',
                        borderBottom: activeTab === tab ? '3px solid #0369a1' : '3px solid transparent',
                        borderRadius: 0,
                        padding: '0.65rem 0.85rem',
                        marginBottom: '-2px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="info-box-content" style={{ padding: '1.25rem', maxHeight: '450px', overflowY: 'auto' }}>
                
                {/* Intake Tab */}
                {activeTab === 'intake' && selectedPatient.intakeForm && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {[
                      { label: 'Allergies', value: selectedPatient.intakeForm.allergies || 'None reported' },
                      { label: 'Medications', value: selectedPatient.intakeForm.medications || 'None' },
                      { label: 'Medical History', value: selectedPatient.intakeForm.medicalHistory || 'None' },
                      { label: 'Emergency Contact', value: selectedPatient.intakeForm.emergencyContact }
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase' }}>
                          {label}
                        </div>
                        <div style={{ padding: '0.65rem', background: '#f9fafb', borderRadius: '6px', fontSize: '0.9rem' }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <>
                    {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 ? (
                      <ul className="records-list">
                        {selectedPatient.medicalHistory.map((record, index) => (
                          <li key={index} className="record-item">
                            <div className="record-header">
                              <span className="record-date">{record.date}</span>
                              <span style={{ fontSize: '0.9rem' }}>{record.diagnosis}</span>
                            </div>
                            <p className="record-summary" style={{ fontSize: '0.85rem' }}>{record.notes}</p>
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.35rem' }}>
                              {record.doctor}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-queue">No previous visits</p>
                    )}
                  </>
                )}

                {/* Tests Tab */}
                {activeTab === 'tests' && (
                  <>
                    {!showTestForm && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowTestForm(true)}
                        style={{ marginBottom: '0.85rem', fontSize: '0.85rem' }}
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
                        style={{ marginBottom: '0.85rem', padding: '0.85rem', background: '#f9fafb', borderRadius: '6px' }}
                      >
                        <div className="form-row">
                          <label style={{ fontSize: '0.85rem' }}>Test Type</label>
                          <input
                            type="text"
                            placeholder="X-Ray, Blood Test, ECG"
                            value={newTestResult.type}
                            onChange={(e) => setNewTestResult({ ...newTestResult, type: e.target.value })}
                            required
                            style={{ fontSize: '0.85rem' }}
                          />
                        </div>
                        <div className="form-row">
                          <label style={{ fontSize: '0.85rem' }}>Result</label>
                          <input
                            type="text"
                            placeholder="Normal, Abnormal"
                            value={newTestResult.result}
                            onChange={(e) => setNewTestResult({ ...newTestResult, result: e.target.value })}
                            required
                            style={{ fontSize: '0.85rem' }}
                          />
                        </div>
                        <div className="form-row">
                          <label style={{ fontSize: '0.85rem' }}>Notes</label>
                          <input
                            type="text"
                            placeholder="Optional"
                            value={newTestResult.notes}
                            onChange={(e) => setNewTestResult({ ...newTestResult, notes: e.target.value })}
                            style={{ fontSize: '0.85rem' }}
                          />
                        </div>
                        <div className="form-actions">
                          <button type="submit" className="btn-primary btn-small">Add</button>
                          <button
                            type="button"
                            className="btn-secondary btn-small"
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
                              <span style={{ fontSize: '0.9rem' }}>{test.type}</span>
                            </div>
                            <p className="record-summary" style={{ fontSize: '0.85rem' }}>
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
                      !showTestForm && <p className="no-queue">No test results</p>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="info-box" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#999', fontSize: '0.95rem' }}>
              ← Select a patient
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Visit Notes */}
        {selectedPatient && selectedPatient.stage === 'consultation' ? (
          <div className="info-box" style={{ position: 'sticky', top: '1rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <h2 className="info-box-title">Visit Notes</h2>
            <div className="info-box-content">
              <form className="portal-form" style={{ gap: '0.65rem' }}>
                {[
                  { label: 'Symptoms', field: 'symptoms', placeholder: 'Patient-reported symptoms...', rows: 2 },
                  { label: 'Observations', field: 'observations', placeholder: 'Exam findings...', rows: 2 },
                  { label: 'Assessment *', field: 'assessment', placeholder: 'Diagnosis...', rows: 3, required: true },
                  { label: 'Treatment', field: 'treatmentPlan', placeholder: 'Treatment plan...', rows: 2 },
                  { label: 'Prescriptions', field: 'prescriptions', placeholder: 'Medications...', rows: 2 }
                ].map(({ label, field, placeholder, rows, required }) => (
                  <div key={field} className="form-row">
                    <label style={{ fontSize: '0.8rem' }}>{label}</label>
                    <textarea
                      placeholder={placeholder}
                      value={clinicalNote[field as keyof ClinicalNote] as string}
                      onChange={(e) => updateClinicalNote(field as keyof ClinicalNote, e.target.value)}
                      style={{ minHeight: `${rows * 25}px`, resize: 'vertical', fontSize: '0.85rem' }}
                      required={required}
                    />
                  </div>
                ))}

                <div className="form-row">
                  <label className="checkbox-label" style={{ fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={clinicalNote.followUpRecommended}
                      onChange={(e) => updateClinicalNote('followUpRecommended', e.target.checked)}
                    />
                    <span>Recommend follow-up</span>
                  </label>
                </div>

                {clinicalNote.followUpRecommended && (
                  <div className="form-row">
                    <label style={{ fontSize: '0.8rem' }}>Follow-up Notes</label>
                    <input
                      type="text"
                      placeholder="e.g., Return in 2 weeks"
                      value={clinicalNote.followUpNotes}
                      onChange={(e) => updateClinicalNote('followUpNotes', e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={completeVisit}
                    style={{ width: '100%', background: '#15803d', fontSize: '0.9rem' }}
                  >
                    Complete Visit
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={saveVisitNotes}
                    style={{ width: '100%', fontSize: '0.9rem' }}
                  >
                    Save Notes
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setClinicalNote(INITIAL_CLINICAL_NOTE)}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    Clear
                  </button>
                </div>
                {saveNoteFeedback && (
                  <span className="feedback-msg" style={{ display: 'block', textAlign: 'center', fontSize: '0.8rem' }}>
                    {saveNoteFeedback}
                  </span>
                )}
              </form>
            </div>
          </div>
        ) : (
          <div className="info-box" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'sticky', top: '1rem' }}>
            <div style={{ textAlign: 'center', color: '#999', fontSize: '0.9rem', padding: '1rem' }}>
              {selectedPatient ? (
                selectedPatient.stage === 'completed' ? '✓ Visit completed' : 'Start visit to take notes'
              ) : (
                'Select a patient'
              )}
            </div>
          </div>
        )}

      </div>

      {/* Quick Actions */}
      <div className="info-box quick-actions-box" style={{ marginTop: '1.5rem' }}>
        <h2 className="info-box-title">Quick actions</h2>
        <div className="info-box-content quick-actions">
          <Link to="/" className="action-link">Home</Link>
          <Link to="/dashboard/doctor/information" className="action-link">Your Information</Link>
        </div>
      </div>

      <Link to="/" className="back-link">← Back to Home</Link>
    </div>
  )
}