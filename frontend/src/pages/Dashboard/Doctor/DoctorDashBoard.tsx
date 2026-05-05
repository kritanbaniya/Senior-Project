import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'  
import { useAuth } from '@/context/AuthContext'  
import { saveMedicalHistory, fetchMedicalHistory, type MedicalHistoryRecord } from '@/features/medical/medicalHistoryApi'  
import { saveLabResult, fetchLabResults, type LabResultRecord } from '@/features/medical/labResultsApi' 
import { savePrescription, fetchAllPrescriptions, type PrescriptionRecord } from '@/features/medical/prescriptionsApi'
import { SidebarProvider } from "@/components/ui/sidebar" 
import DoctorSidebar from "./DoctorSideBar" 
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

// Most common and important test types only
const TEST_CATEGORIES = {
  'Blood Tests': [
    'Complete Blood Count (CBC)',
    'Basic Metabolic Panel',
    'Lipid Panel',
    'Hemoglobin A1C',
    'Blood Glucose',
  ],
  'Imaging': [
    'X-Ray',
    'CT Scan',
    'MRI',
    'Ultrasound',
  ],
  'Cardiac': [
    'ECG/EKG',
    'Echocardiogram',
  ],
  'Other': [
    'Urinalysis',
    'COVID-19 Test',
    'Strep Test',
  ]
}

// Prescription dropdown options
const DOSAGE_OPTIONS = [
  '250mg',
  '500mg',
  '750mg',
  '1000mg (1g)',
  '5mg',
  '10mg',
  '20mg',
  '25mg',
  '50mg',
  '100mg',
  '1 tablet',
  '2 tablets',
  '1 capsule',
  '2 capsules',
  '5ml',
  '10ml',
  '1 puff',
  '2 puffs',
]

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Before meals',
  'After meals',
  'At bedtime',
]

const DURATION_OPTIONS = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '30 days',
  '60 days',
  '90 days',
  'Ongoing',
  'Until symptoms resolve',
]

// Flatten for dropdown
const ALL_TEST_TYPES = Object.entries(TEST_CATEGORIES).flatMap(([category, tests]) =>
  tests.map(test => ({ category, test }))
)

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

// Helper function to calculate prescription status based on date and duration
function calculatePrescriptionStatus(prescribedDate: string, duration: string, manualStatus: string): string {
  // If manually discontinued, always show that
  if (manualStatus === 'discontinued') {
    return 'discontinued'
  }

  // If duration is "Ongoing", always active
  if (duration === 'Ongoing' || duration === 'Until symptoms resolve') {
    return 'active'
  }

  // Parse duration to days
  const durationMatch = duration.match(/(\d+)\s*days?/)
  if (!durationMatch) {
    return manualStatus // Can't parse, use database status
  }

  const durationDays = parseInt(durationMatch[1], 10)
  
  // Calculate if prescription has expired
  const prescribed = new Date(prescribedDate)
  const today = new Date()
  const daysSincePrescribed = Math.floor((today.getTime() - prescribed.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSincePrescribed > durationDays) {
    return 'completed'
  }

  return 'active'
}

export default function DoctorDashBoard() {
  const [patients, setPatients] = useState<DoctorPatient[]>([])
  const [isLoadingQueue, setIsLoadingQueue] = useState(true)
  const [queueError, setQueueError] = useState<string | null>(null)

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [fetchedHistory, setFetchedHistory] = useState<MedicalHistoryRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [clinicalNote, setClinicalNote] = useState<ClinicalNote>(INITIAL_CLINICAL_NOTE)
  const [showTestForm, setShowTestForm] = useState(false)
  const [newTestResult, setNewTestResult] = useState({ type: '', result: '', notes: '' })
  const [fetchedLabResults, setFetchedLabResults] = useState<LabResultRecord[]>([])
  const [loadingLabResults, setLoadingLabResults] = useState(false)
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [newPrescription, setNewPrescription] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  })
  const [fetchedPrescriptions, setFetchedPrescriptions] = useState<PrescriptionRecord[]>([])
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false)
  const [saveNoteFeedback, setSaveNoteFeedback] = useState<string | null>(null)

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
  const { profile, logout } = useAuth() 
  const displayName = profile?.full_name?.trim() || "Doctor" 
  const [profileOpen, setProfileOpen] = useState(false)

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

  // Fetch lab results when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      const loadLabResults = async () => {
        setLoadingLabResults(true)
        const { data, error } = await fetchLabResults(selectedPatient.id)
        if (!error && data) {
          setFetchedLabResults(data)
        } else {
          setFetchedLabResults([])
        }
        setLoadingLabResults(false)
      }
      void loadLabResults()
    } else {
      setFetchedLabResults([])
    }
  }, [selectedPatient])

  // Fetch prescriptions when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      const loadPrescriptions = async () => {
        setLoadingPrescriptions(true)
        const { data, error } = await fetchAllPrescriptions(selectedPatient.id)
        if (!error && data) {
          setFetchedPrescriptions(data)
        } else {
          setFetchedPrescriptions([])
        }
        setLoadingPrescriptions(false)
      }
      void loadPrescriptions()
    } else {
      setFetchedPrescriptions([])
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

  const addTestResult = async () => {
    if (!selectedPatient || !newTestResult.type || !newTestResult.result) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('You must be logged in to add test results.')
      return
    }

    // Parse test type to get category
    const testInfo = ALL_TEST_TYPES.find(t => t.test === newTestResult.type)
    
    const { error } = await saveLabResult({
      patientId: selectedPatient.id,
      doctorId: user.id,
      testType: newTestResult.type,
      testCategory: testInfo?.category || 'Other',
      result: newTestResult.result,
      notes: newTestResult.notes || undefined,
      orderedByDoctorName: profile?.full_name || 'Doctor',
    })

    if (error) {
      console.error('Error saving lab result:', error)
      alert('Failed to save test result: ' + error.message)
      return
    }

    // Refresh lab results
    const { data } = await fetchLabResults(selectedPatient.id)
    if (data) {
      setFetchedLabResults(data)
    }

    // Clear form and close
    setNewTestResult({ type: '', result: '', notes: '' })
    setShowTestForm(false)
  }

  const addPrescription = async () => {
  if (
    !selectedPatient ||
    !newPrescription.medicationName ||
    !newPrescription.dosage ||
    !newPrescription.frequency ||
    !newPrescription.duration
  ) {
    alert('Please fill in all required fields')
    return
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    alert('You must be logged in to add prescriptions.')
    return
  }

  const { error } = await savePrescription({
    patientId: selectedPatient.id,
    doctorId: user.id,
    medicationName: newPrescription.medicationName,
    dosage: newPrescription.dosage,
    frequency: newPrescription.frequency,
    duration: newPrescription.duration,
    instructions: newPrescription.instructions || undefined,
    doctorName: profile?.full_name || 'Doctor',
  })

  if (error) {
    console.error('Error saving prescription:', error)
    alert('Failed to save prescription: ' + error.message)
    return
  }

  // Refresh prescriptions
  const { data } = await fetchAllPrescriptions(selectedPatient.id)
  if (data) {
    setFetchedPrescriptions(data)
  }

  // Clear form and close
  setNewPrescription({
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  })
  setShowPrescriptionForm(false)
}


  return (
    <SidebarProvider 
      defaultOpen
      style={
        {
          "--sidebar-width": "15rem",
          "--sidebar-width-mobile": "10rem",
        } as React.CSSProperties
      }
    >
      <DoctorSidebar />

      <div className="pd-right">
        {/* Header (same as DoctorInformation) */}
        <header className="pd-header">
          <div className="pd-header-left">
            <h1 className="pd-header-title">Doctor Dashboard</h1>
            <span className="pd-header-patient">{displayName}</span>
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
                  <Link to="/dashboard/doctor/information" className="pd-dropdown-item">
                    Your Information
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

        {/* Main Content */}
        <main className="pd-main">
          <div className="w-full max-w-full space-y-6">

            {/* Three-column grid layout */}
            <div className="grid grid-cols-[280px_1fr_420px] gap-6 items-start">
        
              {/* LEFT COLUMN: Patient Queue */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
                    badge={fetchedPrescriptions.filter(rx => 
                      calculatePrescriptionStatus(rx.prescribed_date, rx.duration, rx.status) === 'active'
                    ).length}
                    defaultExpanded={false}
                  >
                    <div className="space-y-3">
                      {!showPrescriptionForm && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowPrescriptionForm(true)}
                          className="w-full"
                        >
                          + Add Prescription
                        </Button>
                      )}

                      {showPrescriptionForm && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            addPrescription()
                          }}
                          className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Medication Name *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Ibuprofen, Lisinopril, Amoxicillin"
                              value={newPrescription.medicationName}
                              onChange={(e) => setNewPrescription({ ...newPrescription, medicationName: e.target.value })}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Dosage *
                            </label>
                            <select
                              value={newPrescription.dosage}
                              onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select dosage...</option>
                              {DOSAGE_OPTIONS.map((dosage) => (
                                <option key={dosage} value={dosage}>
                                  {dosage}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Frequency *
                            </label>
                            <select
                              value={newPrescription.frequency}
                              onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select frequency...</option>
                              {FREQUENCY_OPTIONS.map((frequency) => (
                                <option key={frequency} value={frequency}>
                                  {frequency}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Duration *
                            </label>
                            <select
                              value={newPrescription.duration}
                              onChange={(e) => setNewPrescription({ ...newPrescription, duration: e.target.value })}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select duration...</option>
                              {DURATION_OPTIONS.map((duration) => (
                                <option key={duration} value={duration}>
                                  {duration}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Instructions (optional)
                            </label>
                            <textarea
                              placeholder="e.g., Take with food, Avoid alcohol, Take at bedtime"
                              value={newPrescription.instructions}
                              onChange={(e) => setNewPrescription({ ...newPrescription, instructions: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button type="submit" size="sm">Add</Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowPrescriptionForm(false)
                                setNewPrescription({
                                  medicationName: '',
                                  dosage: '',
                                  frequency: '',
                                  duration: '',
                                  instructions: '',
                                })
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      )}

                      {/* Display prescriptions from database */}
                      {loadingPrescriptions ? (
                        <p className="text-sm text-gray-500">Loading prescriptions...</p>
                      ) : fetchedPrescriptions.length > 0 ? (
                        <div className="space-y-3">
                          {fetchedPrescriptions.map((rx) => {
                            // Calculate actual status based on date and duration
                            const actualStatus = calculatePrescriptionStatus(
                              rx.prescribed_date, 
                              rx.duration, 
                              rx.status
                            )
                            
                            return (
                              <div 
                                key={rx.id} 
                                className={`p-3 rounded border ${
                                  actualStatus === 'active' 
                                    ? 'bg-green-50 border-green-200' 
                                    : actualStatus === 'completed'
                                    ? 'bg-gray-50 border-gray-200 opacity-60'
                                    : 'bg-red-50 border-red-200 opacity-60'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {rx.medication_name}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                      {rx.dosage} • {rx.frequency}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs text-gray-500">{rx.prescribed_date}</span>
                                    <span className={`block text-xs font-medium mt-0.5 ${
                                      actualStatus === 'active' ? 'text-green-600' :
                                      actualStatus === 'completed' ? 'text-gray-500' :
                                      'text-red-600'
                                    }`}>
                                      {actualStatus === 'active' ? 'Active' :
                                      actualStatus === 'completed' ? 'Completed' :
                                      'Discontinued'}
                                    </span>
                                  </div>
                                </div>
                                
                                <p className="text-xs text-gray-700">
                                  <strong>Duration:</strong> {rx.duration}
                                </p>
                                
                                {rx.instructions && (
                                  <p className="text-xs text-gray-700 mt-1">
                                    <strong>Instructions:</strong> {rx.instructions}
                                  </p>
                                )}
                                
                                <p className="text-xs text-gray-500 mt-2">
                                  Prescribed by {rx.doctor_name}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        !showPrescriptionForm && (
                          <div className="text-center py-8 text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <p className="font-medium">No prescriptions on file</p>
                            <p className="text-sm mt-1">Medications prescribed will appear here</p>
                          </div>
                        )
                      )}
                    </div>
                  </ChartSection>

                  {/* Section 3: Lab & Test Results */}
                  <ChartSection 
                    title="Lab & Test Results" 
                    icon="🧪"
                    badge={fetchedLabResults.length}
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
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Test Type *
                            </label>
                            <select
                              value={newTestResult.type}
                              onChange={(e) => setNewTestResult({ ...newTestResult, type: e.target.value })}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select test type...</option>
                              {Object.entries(TEST_CATEGORIES).map(([category, tests]) => (
                                <optgroup key={category} label={category}>
                                  {tests.map((test) => (
                                    <option key={test} value={test}>
                                      {test}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Result *
                            </label>
                            <select
                              value={newTestResult.result}
                              onChange={(e) => setNewTestResult({ ...newTestResult, result: e.target.value })}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select result...</option>
                              <option value="Normal">Normal</option>
                              <option value="Abnormal">Abnormal</option>
                              <option value="Critical">Critical</option>
                              <option value="Pending">Pending</option>
                              <option value="Negative">Negative</option>
                              <option value="Positive">Positive</option>
                              <option value="Inconclusive">Inconclusive</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Notes (optional)
                            </label>
                            <textarea
                              placeholder="Additional details, measurements, findings..."
                              value={newTestResult.notes}
                              onChange={(e) => setNewTestResult({ ...newTestResult, notes: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                      {/* Display lab results from database */}
                      {loadingLabResults ? (
                        <p className="text-sm text-gray-500">Loading test results...</p>
                      ) : fetchedLabResults.length > 0 ? (
                        <div className="space-y-4">
                          {fetchedLabResults.map((test) => (
                            <div key={test.id} className="pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                              <div className="flex items-baseline gap-3 mb-1">
                                <span className="text-sm font-semibold text-blue-600">{test.test_date}</span>
                                <span className="text-sm font-medium text-gray-900">{test.test_type}</span>
                                {test.test_category && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                    {test.test_category}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700">
                                <strong>Result:</strong>{' '}
                                <span className={
                                  test.result === 'Normal' || test.result === 'Negative' ? 'text-green-600' :
                                  test.result === 'Abnormal' || test.result === 'Positive' ? 'text-amber-600' :
                                  test.result === 'Critical' ? 'text-red-600' :
                                  'text-gray-900'
                                }>
                                  {test.result}
                                </span>
                                {test.result_details && (
                                  <>
                                    <br />
                                    <strong>Details:</strong> {test.result_details}
                                  </>
                                )}
                                {test.notes && (
                                  <>
                                    <br />
                                    <strong>Notes:</strong> {test.notes}
                                  </>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">Ordered by {test.ordered_by_doctor_name}</p>
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
                        { label: 'Treatment', field: 'treatmentPlan', placeholder: 'Treatment plan...', rows: 2 }
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
          
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}