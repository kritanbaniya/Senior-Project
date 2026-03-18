import { useMemo, useState } from "react";
import type { Appointment } from "./types.ts";




type Props = { // define the prop's types
  appointments: Appointment[]
  onSelectAppointment?: (apt: Appointment) => void
  onDeleteAppointment?: (apt: Appointment) => void
  onSelectSlot?: (start: Date) => void
}


export default function AppointmentList({
        appointments,
        onSelectAppointment,
        onDeleteAppointment,
        onSelectSlot,
    }: Props) { 
  // useState
  // same functionality as calendar 
  
  // VIEWING: 
  // filter calender by: 
  // - time (desc/asc)
  // - Clinic 
  // - Provider 
  // - view past appointments 
  // - view appointments failed to fulfill? 

  return(
    <>
    <div className="nurse-appointment-list">
            <p className="small-label">Appointments (today & upcoming)</p>
            <ul className="appointment-list">
              {appointments.map((apt) => (
                <li key={apt.Appointment_id} className="appointment-item nurse-apt-item">
                  <span className="apt-date">{apt.appointment_date}</span>
                  <span className="apt-doctor">{apt.clinician_name}</span>
                  <span className="apt-type">{apt.visit_type}</span>
                  <span className="apt-patient">{apt.patient_name}</span>
                  <button
                    type="button"
                    className="btn-small"
                    onClick={() => onSelectAppointment?.(apt)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-small"
                    onClick={() => onDeleteAppointment?.(apt)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
    </>
  )
}



