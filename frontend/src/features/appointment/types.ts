






export type Appointment = {
  Appointment_id: string
  appointment_date: string
  patient_name: string
  clinician_name: string
  visit_type: string
  clinic_name?: string
  patient_email?: string
  checkin_at?: string | null
  seen_at?: string | null
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
export type AppointmentViewPrefs = {
  page: number
  rowsPerPage: number
  totalpages: number 
  sortRules: SortRule[]
  dateMode: DateMode
  rangeStart: string
  rangeEnd: string
}






