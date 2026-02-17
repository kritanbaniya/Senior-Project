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
  file?: string
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
}

type ClinicalNote = {
  chiefComplaint: string
  diagnosis: string
  prescriptions: string
  treatmentPlan: string
  followUp: string
  additionalNotes: string
}

const STAGE_LABELS: Record<DoctorStage, string> = {
  waiting: 'Waiting',
  consultation: 'In Consultation',
  completed: 'Completed',
}

const INITIAL_CLINICAL_NOTE: ClinicalNote = {
  chiefComplaint: '',
  diagnosis: '',
  prescriptions: '',
  treatmentPlan: '',
  followUp: '',
  additionalNotes: '',
}

export default function DoctorDashboard() {
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
          notes: 'Prescribed amoxicillin 500mg. Symptoms resolved.',
          doctor: 'Dr. Smith',
        },
        {
          date: '2024-08-22',
          diagnosis: 'Annual physical',
          notes: 'All vitals normal. Continue current medication.',
          doctor: 'Dr. Johnson',
        },
      ],
      testResults: [
        {
          id: 't1',
          type: 'Blood Panel',
          date: '2024-08-22',
          result: 'Normal - All values within range',
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
          notes: 'HbA1c at 7.2%. Continue current regimen.',
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
  const [newTestResult, setNewTestResult] = useState({ type: '', result: '' })
  const [showTestForm, setShowTestForm] = useState(false)

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  const updateClinicalNote = (field: keyof ClinicalNote, value: string) => {
    setClinicalNote((prev) => ({ ...prev, [field]: value }))
  }

  const setPatientStage = (id: string, stage: DoctorStage) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)))
  }

  const completeConsultation = (id: string) => {
    if (!clinicalNote.diagnosis.trim()) {
      alert('Please enter a diagnosis before completing the consultation.')
      return
    }

    // In a real app, this would save to backend
    console.log('Saving clinical note:', clinicalNote)

    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, stage: 'completed' } : p)))
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
    }

    setPatients((prev) =>
      prev.map((p) =>
        p.id === selectedPatient.id
          ? { ...p, testResults: [...(p.testResults || []), testResult] }
          : p
      )
    )

    setNewTestResult({ type: '', result: '' })
    setShowTestForm(false)
  }

  const waitingCount = patients.filter((p) => p.stage === 'waiting').length
  const inConsultationCount = patients.filter((p) => p.stage === 'consultation').length

  return (
    <div className="doctor-dashboard">
      <style>{`
        .doctor-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .dashboard-subtitle {
          color: #666;
          font-size: 1rem;
        }

        .stats-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          flex: 1;
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          color: #666;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .main-content {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 2rem;
        }

        .patient-queue {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          height: fit-content;
        }

        .queue-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1a1a1a;
        }

        .patient-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .patient-card:hover {
          border-color: #2563eb;
          transform: translateX(4px);
        }

        .patient-card.active {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .patient-card.stage-consultation {
          border-left: 4px solid #10b981;
        }

        .patient-card.stage-waiting {
          border-left: 4px solid #f59e0b;
        }

        .patient-card.stage-completed {
          border-left: 4px solid #6b7280;
          opacity: 0.6;
        }

        .patient-name {
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 0.25rem;
        }

        .patient-meta {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .patient-status {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .patient-status.status-waiting {
          background: #fef3c7;
          color: #92400e;
        }

        .patient-status.status-consultation {
          background: #d1fae5;
          color: #065f46;
        }

        .patient-status.status-completed {
          background: #e5e7eb;
          color: #374151;
        }

        .consultation-panel {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .consultation-panel.empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          color: #9ca3af;
          font-size: 1.125rem;
        }

        .panel-header {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
        }

        .patient-info-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
        }

        .patient-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .patient-details {
          color: #666;
          font-size: 0.875rem;
        }

        .stage-controls {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .btn-success {
          background: #10b981;
          color: white;
        }

        .btn-success:hover {
          background: #059669;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #d1d5db;
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .tab {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
          color: #6b7280;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #2563eb;
        }

        .tab.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }

        .info-section {
          margin-bottom: 1.5rem;
        }

        .info-label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-content {
          color: #1a1a1a;
          line-height: 1.6;
          background: #f9fafb;
          padding: 1rem;
          border-radius: 6px;
        }

        .history-item {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          border-left: 4px solid #2563eb;
        }

        .history-date {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.25rem;
        }

        .history-diagnosis {
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .history-notes {
          color: #666;
          font-size: 0.875rem;
        }

        .test-result-item {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: start;
        }

        .test-info {
          flex: 1;
        }

        .test-type {
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 0.25rem;
        }

        .test-date {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .test-result {
          color: #374151;
        }

        .clinical-notes-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid #e5e7eb;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 1rem;
        }

        .form-grid {
          display: grid;
          gap: 1.5rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
        }

        .field-label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .field-input {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .field-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        textarea.field-input {
          min-height: 100px;
          resize: vertical;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid #e5e7eb;
        }

        .back-link {
          display: inline-block;
          margin-top: 2rem;
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .add-test-btn {
          background: #f3f4f6;
          border: 2px dashed #d1d5db;
          padding: 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          text-align: center;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 1rem;
          transition: all 0.2s;
        }

        .add-test-btn:hover {
          border-color: #2563eb;
          color: #2563eb;
          background: #eff6ff;
        }

        .test-form {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .test-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .test-form-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }
      `}</style>

      <div className="dashboard-header">
        <h1 className="dashboard-title">Doctor Dashboard</h1>
        <p className="dashboard-subtitle">Manage consultations and patient care</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{waitingCount}</div>
          <div className="stat-label">Patients Waiting</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{inConsultationCount}</div>
          <div className="stat-label">In Consultation</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{patients.length}</div>
          <div className="stat-label">Total Assigned</div>
        </div>
      </div>

      <div className="main-content">
        {/* Patient Queue */}
        <div className="patient-queue">
          <h2 className="queue-title">Patient Queue</h2>
          {patients.map((patient) => (
            <div
              key={patient.id}
              className={`patient-card stage-${patient.stage} ${
                selectedPatientId === patient.id ? 'active' : ''
              }`}
              onClick={() => setSelectedPatientId(patient.id)}
            >
              <div className="patient-name">{patient.patientName}</div>
              <div className="patient-meta">
                {patient.age} yrs • {patient.appointmentType}
              </div>
              <div className="patient-meta">Arrival: {patient.arrivalTime}</div>
              <span className={`patient-status status-${patient.stage}`}>
                {STAGE_LABELS[patient.stage]}
              </span>
            </div>
          ))}
        </div>

        {/* Consultation Panel */}
        {selectedPatient ? (
          <div className="consultation-panel">
            <div className="panel-header">
              <div className="patient-info-header">
                <div>
                  <h2 className="patient-title">{selectedPatient.patientName}</h2>
                  <div className="patient-details">
                    {selectedPatient.age} years • {selectedPatient.gender} •{' '}
                    {selectedPatient.appointmentType}
                  </div>
                  <div className="patient-details">
                    <strong>Chief Complaint:</strong> {selectedPatient.symptoms}
                  </div>
                </div>
                <div className="stage-controls">
                  {selectedPatient.stage === 'waiting' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setPatientStage(selectedPatient.id, 'consultation')}
                    >
                      Start Consultation
                    </button>
                  )}
                  {selectedPatient.stage === 'consultation' && (
                    <button
                      className="btn btn-success"
                      onClick={() => completeConsultation(selectedPatient.id)}
                    >
                      Complete Visit
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'intake' ? 'active' : ''}`}
                onClick={() => setActiveTab('intake')}
              >
                Intake Form
              </button>
              <button
                className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                Medical History
              </button>
              <button
                className={`tab ${activeTab === 'tests' ? 'active' : ''}`}
                onClick={() => setActiveTab('tests')}
              >
                Test Results
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'intake' && selectedPatient.intakeForm && (
              <>
                <div className="info-section">
                  <div className="info-label">Allergies</div>
                  <div className="info-content">
                    {selectedPatient.intakeForm.allergies || 'None reported'}
                  </div>
                </div>

                <div className="info-section">
                  <div className="info-label">Current Medications</div>
                  <div className="info-content">
                    {selectedPatient.intakeForm.medications || 'None'}
                  </div>
                </div>

                <div className="info-section">
                  <div className="info-label">Medical History</div>
                  <div className="info-content">
                    {selectedPatient.intakeForm.medicalHistory || 'No significant history'}
                  </div>
                </div>

                <div className="info-section">
                  <div className="info-label">Emergency Contact</div>
                  <div className="info-content">
                    {selectedPatient.intakeForm.emergencyContact}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'history' && (
              <>
                {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 ? (
                  selectedPatient.medicalHistory.map((record, index) => (
                    <div key={index} className="history-item">
                      <div className="history-date">{record.date}</div>
                      <div className="history-diagnosis">{record.diagnosis}</div>
                      <div className="history-notes">{record.notes}</div>
                      <div className="history-notes" style={{ marginTop: '0.5rem' }}>
                        <em>Provider: {record.doctor}</em>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="info-content">No previous visits on record</div>
                )}
              </>
            )}

            {activeTab === 'tests' && (
              <>
                {!showTestForm && (
                  <div className="add-test-btn" onClick={() => setShowTestForm(true)}>
                    + Add Test Result
                  </div>
                )}

                {showTestForm && (
                  <div className="test-form">
                    <div className="test-form-row">
                      <div className="form-field">
                        <label className="field-label">Test Type</label>
                        <input
                          type="text"
                          className="field-input"
                          placeholder="e.g., X-Ray, Blood Test, ECG"
                          value={newTestResult.type}
                          onChange={(e) =>
                            setNewTestResult({ ...newTestResult, type: e.target.value })
                          }
                        />
                      </div>
                      <div className="form-field">
                        <label className="field-label">Result</label>
                        <input
                          type="text"
                          className="field-input"
                          placeholder="e.g., Normal, Abnormal"
                          value={newTestResult.result}
                          onChange={(e) =>
                            setNewTestResult({ ...newTestResult, result: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="test-form-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowTestForm(false)
                          setNewTestResult({ type: '', result: '' })
                        }}
                      >
                        Cancel
                      </button>
                      <button className="btn btn-primary" onClick={addTestResult}>
                        Add Result
                      </button>
                    </div>
                  </div>
                )}

                {selectedPatient.testResults && selectedPatient.testResults.length > 0 ? (
                  selectedPatient.testResults.map((test) => (
                    <div key={test.id} className="test-result-item">
                      <div className="test-info">
                        <div className="test-type">{test.type}</div>
                        <div className="test-date">{test.date}</div>
                        <div className="test-result">{test.result}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  !showTestForm && <div className="info-content">No test results available</div>
                )}
              </>
            )}

            {/* Clinical Notes Section */}
            {selectedPatient.stage === 'consultation' && (
              <div className="clinical-notes-section">
                <h3 className="section-title">Clinical Documentation</h3>

                <div className="form-grid">
                  <div className="form-field">
                    <label className="field-label">Chief Complaint</label>
                    <textarea
                      className="field-input"
                      placeholder="Main reason for visit..."
                      value={clinicalNote.chiefComplaint}
                      onChange={(e) => updateClinicalNote('chiefComplaint', e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Diagnosis *</label>
                    <textarea
                      className="field-input"
                      placeholder="Primary and secondary diagnoses..."
                      value={clinicalNote.diagnosis}
                      onChange={(e) => updateClinicalNote('diagnosis', e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Prescriptions</label>
                    <textarea
                      className="field-input"
                      placeholder="Medications, dosage, frequency..."
                      value={clinicalNote.prescriptions}
                      onChange={(e) => updateClinicalNote('prescriptions', e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Treatment Plan</label>
                    <textarea
                      className="field-input"
                      placeholder="Recommended treatment, lifestyle changes, referrals..."
                      value={clinicalNote.treatmentPlan}
                      onChange={(e) => updateClinicalNote('treatmentPlan', e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Follow-up</label>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="e.g., Return in 2 weeks, Call if symptoms worsen"
                      value={clinicalNote.followUp}
                      onChange={(e) => updateClinicalNote('followUp', e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Additional Notes</label>
                    <textarea
                      className="field-input"
                      placeholder="Any additional observations or comments..."
                      value={clinicalNote.additionalNotes}
                      onChange={(e) => updateClinicalNote('additionalNotes', e.target.value)}
                    />
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setClinicalNote(INITIAL_CLINICAL_NOTE)}
                  >
                    Clear Form
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => completeConsultation(selectedPatient.id)}
                  >
                    Save & Complete Visit
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="consultation-panel empty">
            Select a patient from the queue to begin consultation
          </div>
        )}
      </div>

      <Link to="/" className="back-link">
        ← Back to Home
      </Link>
    </div>
  )
}