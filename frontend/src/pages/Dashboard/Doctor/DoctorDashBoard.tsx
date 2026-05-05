import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { fetchDoctorInProgressQueue } from '@/features/queue/api'
import type { DoctorQueuePatientRow } from '@/features/queue/api'

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


function formatArrivalTime(startedAt: string | null) {
  if (!startedAt) return 'Unknown'

  return new Date(startedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mapQueueRowToDoctorPatient(row: DoctorQueuePatientRow): DoctorPatient {
  return {
    id: row.queue_entry_id,
    patientName: row.patient_name ?? 'Unknown patient',
    age: 0,
    gender: 'Unknown',
    appointmentType: row.visit_type ?? 'Visit',
    symptoms: 'No visit reason provided.',
    stage: 'consultation',
    arrivalTime: formatArrivalTime(row.started_at),
    formsComplete: true,
  }
}

export default function DoctorDashBoard() {
  const [patients, setPatients] = useState<DoctorPatient[]>([])
  const [isLoadingQueue, setIsLoadingQueue] = useState(true)
  const [queueError, setQueueError] = useState<string | null>(null)

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [clinicalNote, setClinicalNote] = useState<ClinicalNote>(INITIAL_CLINICAL_NOTE)
  const [activeTab, setActiveTab] = useState<'intake' | 'history' | 'tests'>('intake')
  const [showTestForm, setShowTestForm] = useState(false)
  const [newTestResult, setNewTestResult] = useState({ type: '', result: '', notes: '' })
  const [saveNoteFeedback, setSaveNoteFeedback] = useState<string | null>(null)
  const [flagFormsFeedback, setFlagFormsFeedback] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDoctorQueue() {
      try {
        setIsLoadingQueue(true)
        setQueueError(null)

        const rows = await fetchDoctorInProgressQueue()
        const mappedPatients = rows.map(mapQueueRowToDoctorPatient)

        if (!isMounted) return

        setPatients(mappedPatients)
        setSelectedPatientId((currentId) => {
          if (!currentId) return currentId
          return mappedPatients.some((patient) => patient.id === currentId)
            ? currentId
            : null
        })
      } catch (error) {
        console.error('Failed to load doctor queue:', error)

        if (!isMounted) return
        setQueueError('Unable to load doctor queue.')
      } finally {
        if (isMounted) {
          setIsLoadingQueue(false)
        }
      }
    }

    void loadDoctorQueue()

    return () => {
      isMounted = false
    }
  }, [])

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
    <div className="w-full max-w-full p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>

      {/* Three-column grid layout */}
      <div className="grid grid-cols-[260px_1fr_420px] gap-6 items-start">
        
        {/* LEFT COLUMN: Patient Queue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-4 max-h-[85vh] overflow-y-auto">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Patient Queue</h2>
          </div>
          <div className="p-4">
            {isLoadingQueue ? (
              <p className="text-sm text-gray-500">Loading doctor queue...</p>
            ) : queueError ? (
              <p className="text-sm text-red-600">{queueError}</p>
            ) : patients.length === 0 ? (
              <p className="text-sm text-gray-500">No patients currently in progress.</p>
            ) : (
              <div className="space-y-2">
                {patients.map((patient, index) => (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatientId(patient.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPatientId === patient.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    } ${
                      patient.stage === 'consultation' ? 'border-l-4 border-l-green-500' :
                      patient.stage === 'waiting' ? 'border-l-4 border-l-amber-500' :
                      'border-l-4 border-l-gray-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{patient.patientName}</div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {patient.age}y • {patient.appointmentType}
                        </div>
                        {!patient.formsComplete && (
                          <div className="text-xs text-red-600 font-semibold mt-1">
                            ⚠ Incomplete
                          </div>
                        )}
                        <span 
                          className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-md ${
                            patient.stage === 'consultation' ? 'bg-green-100 text-green-800' :
                            patient.stage === 'waiting' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {STAGE_LABELS[patient.stage]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: Patient Information */}
        {selectedPatient ? (
          <div className="space-y-5">
            
            {/* Patient Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.patientName}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedPatient.age} years • {selectedPatient.gender} • {selectedPatient.appointmentType}
                  </p>
                </div>
                
                {selectedPatient.stage === 'waiting' && (
                  <Button onClick={() => setPatientStage(selectedPatient.id, 'consultation')}>
                    Start Visit
                  </Button>
                )}
              </div>

              <div className="p-3 bg-blue-50 border-l-4 border-blue-600 rounded">
                <p className="text-xs font-semibold text-blue-700 uppercase">Chief Complaint:</p>
                <p className="text-sm text-gray-900 mt-1">{selectedPatient.symptoms}</p>
              </div>

              {!selectedPatient.formsComplete && (
                <div className="mt-3 flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => flagMissingForms(selectedPatient.id)}
                  >
                    Flag Incomplete Forms
                  </Button>
                  {flagFormsFeedback === selectedPatient.id && (
                    <span className="text-xs text-green-600 font-medium">Nurse notified</span>
                  )}
                </div>
              )}

              {selectedPatient.stage === 'completed' && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-semibold">✓ Visit completed</p>
                </div>
              )}
            </div>

            {/* Patient Information Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Tab Headers */}
              <div className="border-b border-gray-200">
                <div className="flex px-6">
                  {(['intake', 'history', 'tests'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
                        activeTab === tab
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 max-h-[450px] overflow-y-auto">
                
                {/* Intake Tab */}
                {activeTab === 'intake' && selectedPatient.intakeForm && (
                  <div className="space-y-4">
                    {[
                      { label: 'Allergies', value: selectedPatient.intakeForm.allergies || 'None reported' },
                      { label: 'Medications', value: selectedPatient.intakeForm.medications || 'None' },
                      { label: 'Medical History', value: selectedPatient.intakeForm.medicalHistory || 'None' },
                      { label: 'Emergency Contact', value: selectedPatient.intakeForm.emergencyContact }
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">{label}</p>
                        <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-900">{value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <>
                    {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 ? (
                      <div className="space-y-4">
                        {selectedPatient.medicalHistory.map((record, index) => (
                          <div key={index} className="pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                            <div className="flex items-baseline gap-3 mb-1">
                              <span className="text-sm font-semibold text-blue-600">{record.date}</span>
                              <span className="text-sm font-medium text-gray-900">{record.diagnosis}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">{record.notes}</p>
                            <p className="text-xs text-gray-500">{record.doctor}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No previous visits</p>
                    )}
                  </>
                )}

                {/* Tests Tab */}
                {activeTab === 'tests' && (
                  <div className="space-y-3">
                    {!showTestForm && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowTestForm(true)}
                        className="w-full"
                      >
                        + Add Test Result
                      </Button>
                    )}

                    {showTestForm && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          addTestResult()
                        }}
                        className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Test Type</label>
                          <input
                            type="text"
                            placeholder="X-Ray, Blood Test, ECG"
                            value={newTestResult.type}
                            onChange={(e) => setNewTestResult({ ...newTestResult, type: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Result</label>
                          <input
                            type="text"
                            placeholder="Normal, Abnormal"
                            value={newTestResult.result}
                            onChange={(e) => setNewTestResult({ ...newTestResult, result: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
                          <input
                            type="text"
                            placeholder="Additional details"
                            value={newTestResult.notes}
                            onChange={(e) => setNewTestResult({ ...newTestResult, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm">Add</Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowTestForm(false)
                              setNewTestResult({ type: '', result: '', notes: '' })
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}

                    {selectedPatient.testResults && selectedPatient.testResults.length > 0 ? (
                      <div className="space-y-4">
                        {selectedPatient.testResults.map((test) => (
                          <div key={test.id} className="pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                            <div className="flex items-baseline gap-3 mb-1">
                              <span className="text-sm font-semibold text-blue-600">{test.date}</span>
                              <span className="text-sm font-medium text-gray-900">{test.type}</span>
                            </div>
                            <p className="text-sm text-gray-700">
                              <strong>Result:</strong> {test.result}
                              {test.notes && (
                                <>
                                  <br />
                                  <strong>Notes:</strong> {test.notes}
                                </>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      !showTestForm && <p className="text-sm text-gray-500">No test results</p>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px] flex items-center justify-center">
            <p className="text-gray-400 text-center">← Select a patient</p>
          </div>
        )}

        {/* RIGHT COLUMN: Visit Notes */}
        {selectedPatient && selectedPatient.stage === 'consultation' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-4 max-h-[85vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Visit Notes</h2>
            </div>
            <div className="p-5">
              <form className="space-y-3">
                {[
                  { label: 'Symptoms', field: 'symptoms', placeholder: 'Patient-reported symptoms...', rows: 2 },
                  { label: 'Observations', field: 'observations', placeholder: 'Exam findings...', rows: 2 },
                  { label: 'Assessment *', field: 'assessment', placeholder: 'Diagnosis...', rows: 3, required: true },
                  { label: 'Treatment', field: 'treatmentPlan', placeholder: 'Treatment plan...', rows: 2 },
                  { label: 'Prescriptions', field: 'prescriptions', placeholder: 'Medications...', rows: 2 }
                ].map(({ label, field, placeholder, rows }) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                    <textarea
                      placeholder={placeholder}
                      value={clinicalNote[field as keyof ClinicalNote] as string}
                      onChange={(e) => updateClinicalNote(field as keyof ClinicalNote, e.target.value)}
                      rows={rows}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="followUp"
                    checked={clinicalNote.followUpRecommended}
                    onChange={(e) => updateClinicalNote('followUpRecommended', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="followUp" className="text-sm text-gray-700 cursor-pointer">
                    Recommend follow-up
                  </label>
                </div>

                {clinicalNote.followUpRecommended && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Follow-up Notes</label>
                    <input
                      type="text"
                      placeholder="e.g., Return in 2 weeks"
                      value={clinicalNote.followUpNotes}
                      onChange={(e) => updateClinicalNote('followUpNotes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <Button
                    type="button"
                    onClick={completeVisit}
                    className="w-full bg-green-700 hover:bg-green-800"
                  >
                    Complete Visit
                  </Button>
                  <Button
                    type="button"
                    onClick={saveVisitNotes}
                    className="w-full"
                  >
                    Save Notes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setClinicalNote(INITIAL_CLINICAL_NOTE)}
                    className="w-full"
                  >
                    Clear
                  </Button>
                </div>

                {saveNoteFeedback && (
                  <p className="text-xs text-green-600 text-center font-medium">{saveNoteFeedback}</p>
                )}
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-4 min-h-[300px] flex items-center justify-center">
            <p className="text-sm text-gray-400 text-center px-4">
              {selectedPatient ? (
                selectedPatient.stage === 'completed' ? '✓ Visit completed' : 'Start visit to take notes'
              ) : (
                'Select a patient'
              )}
            </p>
          </div>
        )}

      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
        </div>
        <div className="p-5 flex gap-3">
          <Button asChild>
            <Link to="/">Home</Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard/doctor/information">Your Information</Link>
          </Button>
        </div>
      </div>

      <Link to="/" className="inline-block text-blue-600 hover:text-blue-800 font-medium transition-colors">
        ← Back to Home
      </Link>
    </div>
  )
}