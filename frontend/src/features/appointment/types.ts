

// Temperary? 
export type AppointmentType = ''
    | 'General Check-up'
    | 'Follow-up'
    | 'Consultation'
    | 'Vaccination'
    | 'Lab Work'



// REQUEST TYPES - fixed 
export type viewRequestTypes = 
    'all' | 
    'pending'|  // patient needs to make changes 
    'unseen'|   // nurse/clinic has not seen it 
    'canceled'| // appointment was canceled 
    'deserted'|  // patient did not show up 
    'active'|   // active = APPOINTMENTS 
    'completed' // Appointment successfully closed 




////////////////////////////////////////////////
////// FORMS - these are forms we can push into supabase 
// create form  
export type CreateApptForm = {
    // add clinicId (for patient use and easier to manage data)
    appointmentId: string 
    patientId: string
    doctorId: string
    date: string
    time: string
    type: AppointmentType | ''
    appointment_status: string
    nurse_note: string
    patient_note: string 
} 
// update form 
export type  UpdateApptForm = {
    appointmentId: string 
    patientId: string
    doctorId: string
    date: string
    time: string
    type: AppointmentType | ''
    appointment_status: string
    nurse_note: string
    patient_note: string 
}







////////////////////////////////////////////////
////// row data from Supabase - same "shapes"
// VIEW : appointmentlist_display 
export type Appointment = {
    Appointment_id: string
    appointment_date: string
    patient_name?: string 
    patient_email?: string
    clinician_name?: string
    clinic_name?: string
    visit_type: string
    // confirmed  
    checkin_at?: string | null
    seen_at?: string | null
    // requests 
    created_at: string 
    appointment_status: viewRequestTypes 
    patient_note: string 
    nurse_note: string 
    // IDs 
    patient_id: string 
    clinician_id: string 
    clinic_id: string 
}

// VIEW : membernamerole 
export type UserClinicRelationship = {
    clinic_name: string; 
    full_name: string;  
    role: string;
    created_at: string;
    user_id: string;
    clinic_id: string; 
}; 








////////////////////////////////////////////////
////// SORTING TYPES 
// Appointments span all of time, so it's important to define which appointments we want to find
export type SearchBy = '' 
    | 'date range' 
    | 'visit type' 
    | 'patient' 
    | 'provider' 
    | 'clinic'
type SortField = 'appointment_date' | 'clinician_name' | 'patient_name' | 'visit_type' 
type SortDirection = 'asc' | 'desc' 
type SortRule = {
  field: SortField
  direction: SortDirection
}
export type AppointmentViewPrefs = {
    mode: 'list' | 'calendar'
    // list-only
    page: number
    rowsPerPage: number 
    sortRules: SortRule[]
    showReqs: viewRequestTypes
    showPast: boolean 
    searchBy: SearchBy 
    searchInput: string // for any search query
    // only for search by date range
    rangeStart: string
    rangeEnd: string
}


//// used by: ApptSwitch -> ApptCalendar && ApptList
export type ApptProps = {// define the prop's types
    appointments: Appointment[]
    onSelectAppointment?: (apt: Appointment) => void
    onDeleteAppointment?: (apt: Appointment) => void
    onSelectSlot?: (start: Date) => void
    viewPrefs: AppointmentViewPrefs
    totalPages?: number
    onUpdateViewPrefs: (updates: Partial<AppointmentViewPrefs>) => void
}




 





























