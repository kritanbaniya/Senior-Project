import { useState, useEffect } from 'react'  
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'  
import { useAuth } from '@/context/AuthContext'  
import { saveMedicalHistory, fetchMedicalHistory, type MedicalHistoryRecord } from '@/features/medical/medicalHistoryApi'  

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

type ChartSectionProps = {
  title: string
  icon?: string
  badge?: number
  defaultExpanded?: boolean
  children: React.ReactNode
}

function ChartSection({ 
  title, 
  icon, 
  badge, 
  defaultExpanded = false, 
  children 
}: ChartSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header - Clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-xl">{icon}</span>}
          <h3 className="font-semibold text-gray-900 text-left">{title}</h3>
          {badge !== undefined && badge > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {badge}
            </span>
          )}
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content - Expandable */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  )
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
  const [fetchedHistory, setFetchedHistory] = useState<MedicalHistoryRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [clinicalNote, setClinicalNote] = useState<ClinicalNote>(INITIAL_CLINICAL_NOTE)
  const [activeTab, setActiveTab] = useState<'intake' | 'history' | 'tests'>('intake')
  const [showTestForm, setShowTestForm] = useState(false)
  const [newTestResult, setNewTestResult] = useState({ type: '', result: '', notes: '' })
  const [saveNoteFeedback, setSaveNoteFeedback] = useState<string | null>(null)

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)
  const { profile } = useAuth() 

  // Fetch medical history when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      const loadHistory = async () => {
        setLoadingHistory(true)
        const { data, error } = await fetchMedicalHistory(selectedPatient.id)
        if (!error && data) {
          setFetchedHistory(data)
        } else {
          setFetchedHistory([])
        }
        setLoadingHistory(false)
      }
      void loadHistory()
    } else {
      setFetchedHistory([])
    }
  }, [selectedPatient])

  const updateClinicalNote = (field: keyof ClinicalNote, value: string | boolean) => {
    setClinicalNote((prev) => ({ ...prev, [field]: value }))
  }

  const setPatientStage = (id: string, stage: DoctorStage) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)))
  }

  const saveVisitNotes = async () => {
  if (!selectedPatient) return
  if (!clinicalNote.assessment.trim()) {
    alert('Please enter an assessment before saving.')
    return
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    alert('You must be logged in to save notes.')
    return
  }

  const { error } = await saveMedicalHistory({
    patientId: selectedPatient.id,
    doctorId: user.id,
    doctorName: profile?.full_name || 'Doctor',
    diagnosis: clinicalNote.assessment,
    symptoms: clinicalNote.symptoms || undefined,
    observations: clinicalNote.observations || undefined,
    treatmentPlan: clinicalNote.treatmentPlan || undefined,
    prescriptions: clinicalNote.prescriptions || undefined,
    followUpRecommended: clinicalNote.followUpRecommended,
    followUpNotes: clinicalNote.followUpNotes || undefined,
  })

  if (error) {
    console.error('Error saving notes:', error)
    alert('Failed to save notes: ' + error.message)
    return
  }

  // Refresh history to show new entry
  const { data } = await fetchMedicalHistory(selectedPatient.id)
  if (data) {
    setFetchedHistory(data)
  }

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


  return (
    <div className="w-full max-w-full p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>

      {/* Three-column grid layout */}
      <div className="grid grid-cols-[280px_1fr_420px] gap-6 items-start">
  
        {/* LEFT COLUMN: Patient Queue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Patient Queue</h2>
          </div>
          <div className="p-4">
            {patients.length === 0 ? (
              <p className="text-sm text-gray-500">No patients assigned.</p>
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

        {/* MIDDLE COLUMN: Patient Chart */}
        {selectedPatient ? (
          <div className="space-y-4">
            
            {/* Patient Overview - Fixed Header (Not Collapsible) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-6">
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

              {/* Patient Overview Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Allergies</p>
                  <p className="text-gray-900">
                    {selectedPatient.intakeForm?.allergies || 'None reported'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Current Medications</p>
                  <p className="text-gray-900">
                    {selectedPatient.intakeForm?.medications || 'None'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Medical History</p>
                  <p className="text-gray-900">
                    {selectedPatient.intakeForm?.medicalHistory || 'None reported'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Emergency Contact</p>
                  <p className="text-gray-900">
                    {selectedPatient.intakeForm?.emergencyContact || 'Not provided'}
                  </p>
                </div>
              </div>

              {selectedPatient.stage === 'completed' && (
                <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-semibold">✓ Visit completed</p>
                </div>
              )}
            </div>

            {/* Section 1: Visit History */}
            <ChartSection 
              title="Visit History" 
              icon="📝"
              badge={fetchedHistory.length}
              defaultExpanded={true}
            >
              {loadingHistory ? (
                <p className="text-sm text-gray-500">Loading history...</p>
              ) : fetchedHistory.length > 0 ? (
                <div className="space-y-4">
                  {fetchedHistory.map((record) => (
                    <div key={record.id} className="pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-sm font-semibold text-blue-600">{record.visit_date}</span>
                        <span className="text-sm font-bold text-gray-900">{record.diagnosis}</span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-700">
                        {record.symptoms && (
                          <p><strong>Symptoms:</strong> {record.symptoms}</p>
                        )}
                        {record.observations && (
                          <p><strong>Examination:</strong> {record.observations}</p>
                        )}
                        {record.treatment_plan && (
                          <p><strong>Treatment:</strong> {record.treatment_plan}</p>
                        )}
                        {record.prescriptions && (
                          <p><strong>Prescriptions:</strong> {record.prescriptions}</p>
                        )}
                        {record.follow_up_recommended && record.follow_up_notes && (
                          <p><strong>Follow-up:</strong> {record.follow_up_notes}</p>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">{record.doctor_name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-medium">No previous visits</p>
                  <p className="text-sm mt-1">This patient's visit history will appear here</p>
                </div>
              )}
            </ChartSection>

            {/* Section 2: Prescriptions */}
            <ChartSection 
              title="Prescriptions" 
              icon="💊"
              defaultExpanded={false}
            >
              {(() => {
                const prescriptions = fetchedHistory
                  .filter(visit => visit.prescriptions)
                  .map(visit => ({
                    date: visit.visit_date,
                    medications: visit.prescriptions,
                    doctor: visit.doctor_name
                  }))

                if (prescriptions.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <p className="font-medium">No prescriptions on file</p>
                      <p className="text-sm mt-1">Medications prescribed during visits will appear here</p>
                    </div>
                  )
                }

                return (
                  <div className="space-y-3">
                    {prescriptions.map((rx, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {rx.medications}
                          </p>
                          <span className="text-xs text-gray-500">{rx.date}</span>
                        </div>
                        <p className="text-xs text-gray-600">Prescribed by {rx.doctor}</p>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </ChartSection>

            {/* Section 3: Lab & Test Results */}
            <ChartSection 
              title="Lab & Test Results" 
              icon="🧪"
              badge={selectedPatient.testResults?.length || 0}
              defaultExpanded={false}
            >
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
                  !showTestForm && (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <p className="font-medium">No lab results available</p>
                      <p className="text-sm mt-1">Test results will be added as they become available</p>
                    </div>
                  )
                )}
              </div>
            </ChartSection>

            {/* Section 4: Appointment History */}
            <ChartSection 
              title="Appointment History" 
              icon="📅"
              defaultExpanded={false}
            >
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="font-medium">Appointment history coming soon</p>
                <p className="text-sm mt-1">Past and upcoming appointments will be displayed here</p>
              </div>
            </ChartSection>

          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px] flex items-center justify-center">
            <p className="text-gray-400 text-center">← Select a patient to view their chart</p>
          </div>
        )}

        {/* RIGHT COLUMN: Visit Notes */}
        {selectedPatient && selectedPatient.stage === 'consultation' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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