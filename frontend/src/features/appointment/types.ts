
export type AppointmentFormType = {
  patientId: string
  date: string
  time: string
  doctorId: string
  type: AppointmentType | ''
}


export type AppointmentType =
  | 'General Check-up'
  | 'Follow-up'
  | 'Consultation'
  | 'Vaccination'
  | 'Lab Work'


export type Appointment = {
  Appointment_id: string
  appointment_date: string
  patient_email?: string
  patient_name: string
  clinician_name: string
  clinic_name?: string
  visit_type: string
  // diff 
  checkin_at?: string | null
  seen_at?: string | null
  patient_id: string 
  clinician_id: string 
  clinic_id: string 
}



export type reqAppointmentTypes = {
  id: string 
  appointment_date: string 
  patient_email: string 
  patient_name: string 
  clinician_name: string 
  clinic_name: string 
  visit_type: string 
  // diff  
  patient_note: string 
  nurse_note: string 
  request_status: string 
  patient_id: string 
  clinician_id: string 
  clinic_id: string 
}


// for doctor list 
export type MemberList = {
  clinic_name: string; 
  full_name: string;  
  role: string;
  created_at: string;
  user_id: string;
  clinic_id: string; 
};




// SORTING TYPES 
// Appointments span all of time, so it's important to define which appointments we want to find
type DateMode = 'upcoming' | 'past' | 'all' | 'range'

// columns to sort by 
type SortField = 'appointment_date' | 'clinician_name' | 'patient_name' | 'visit_type'

// asc/desc a column 
type SortDirection = 'asc' | 'desc'


type SortRule = {
  field: SortField
  direction: SortDirection
}


export type viewRequestTypes = 'Both' | 'Requests' | 'Hide' 



export type AppointmentViewPrefs = {
  mode: 'list' | 'calendar'
  // list-only
  page: number
  rowsPerPage: number
  // totalpages: number 
  // both 
  sortRules: SortRule[]
  dateMode: DateMode
  rangeStart: string
  rangeEnd: string
  showReqs: viewRequestTypes
  showPast: boolean 
}



export type ApptProps = {// define the prop's types
  appointments: Appointment[]
  reqAppointments: reqAppointmentTypes[] 
  onSelectAppointment?: (apt: Appointment) => void
  onDeleteAppointment?: (apt: Appointment) => void
  onSelectSlot?: (start: Date) => void
  viewPrefs: AppointmentViewPrefs
  totalPages?: number
  onUpdateViewPrefs: (updates: Partial<AppointmentViewPrefs>) => void
}





export type clinicListInfoType = {
  clinic_id : string , 
  clinic_name : string, 
  full_name : string , 
  role : string , 
  user_id : string, 
}

