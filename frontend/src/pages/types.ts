








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




