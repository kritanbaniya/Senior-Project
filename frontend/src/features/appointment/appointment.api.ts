import type { Appointment, UpdateApptForm } from "./types";
import { supabase } from "@/lib/supabase";


 



export async function apiUpdateAppt (input: UpdateApptForm):Promise<Appointment> { 
    // UPDATE IT 
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
        .select()
        .single() 
    if (error) throw error
    return data
}















