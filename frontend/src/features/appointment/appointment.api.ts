import type { 
    Appointment, 
    CreateApptForm, 
    UpdateApptForm 
} from "./types";
import { supabase } from "@/lib/supabase";



/////// CREATE UTILITY 
// export async function apiCreateAppt (input: CreateApptForm, clinicId: string):Promise<Appointment> {  
//     let appointmentDate = `${input.date} ${input.time}:00`
//     const { data, error } = await supabase
//         .schema('public')
//         .from('Appointments')
//         .insert([
//             {
//                 // Appointment_id: -- leave blank so supabase auto generates  
//                 appointment_date: appointmentDate,
//                 patient_id: input.patientId,
//                 clinician_id: input.doctorId,
//                 clinic_id: clinicId,
//                 checkin_at: null,
//                 seen_at: null,
//                 visit_type: input.type,
//                 appointment_status: input.appointment_status, 
//                 nurse_note: input.nurse_note 
//             },
//         ])
//         .select('*')
//         .single() 
//     if (error) throw error
//     return data
// }
export async function apiCreateAppt(
  input: CreateApptForm,
  clinicId: string
): Promise<Appointment> {
  const appointmentDate = `${input.date} ${input.time}:00`;

  const { data, error } = await supabase.rpc("create_appt", {
    p_appointment_date: appointmentDate,
    p_patient_id: input.patientId,
    p_clinician_id: input.doctorId,
    p_clinic_id: clinicId,
    p_visit_type: input.type,
    p_appointment_status: input.appointment_status,
    p_nurse_note: input.nurse_note,
    p_patient_note: input.patient_note,
  });

  if (error) throw error;
  return data;
}


/////// UPDATE UTILITY 
export async function apiUpdateAppt (input: UpdateApptForm):Promise<Appointment> {  
    let appointmentDate = `${input.date} ${input.time}:00`
    const { data, error } = await supabase
        .schema('public')
        .from('Appointments')
        .update({
            appointment_date: appointmentDate,
            patient_id: input.patientId,
            clinician_id: input.doctorId,
            visit_type: input.type,
            appointment_status: input.appointment_status, 
            nurse_note: input.nurse_note 
        })
        .eq('Appointment_id', input.appointmentId)
        .select('*')
        .single() 
    if (error) throw error
    return data
}
export async function apiFetchSpecificAppt (input: Appointment):Promise<Appointment> {  
    const { data, error } = await supabase
      .schema('public')
      .from('Appointments')
      .select('*')
      .eq('Appointment_id', input.Appointment_id)
      .single()
    if (error) throw error
    return data
}



//// REMOVE 
// let appointmentDate = `${updateForm.date} ${updateForm.time}:00`
//         const { data, error } = await supabase
//             .schema('public')
//             .from('Appointments')
//             .update({
//                 appointment_date: appointmentDate,
//                 patient_id: updateForm.patientId,
//                 clinician_id: updateForm.doctorId,
//                 visit_type: updateForm.type,
//                 appointment_status: updateForm.appointment_status, 
//                 nurse_note: updateForm.nurse_note 
//             })
//             .eq('Appointment_id', updateForm.appointmentId)
//             .select()
//             .single() 
//         // if Supabase error 
//         if (error) {console.log('UPDATE ERROR:', error)
//             setUpdateStatus('failed')
//             setUpdateMessage('Appointment update failed.')
//             console.log('ERROR CREATE:', error)
//             return
//         } 









