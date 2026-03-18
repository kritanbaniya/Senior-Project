import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase.ts'
import AppointmentCalendar from '../../../features/appointment/AppointmentCalendar.tsx'
import type { Appointment, MemberList } from '../../../features/appointment/types.ts'


 

export default function PatientAppointmentManager() {
    return(
        <>

            <AppointmentCalendar
            appointments={appointmentsList}
            onSelectAppointment={handleEditAppointmentRequest}
            onSelectSlot={handleNewAppointmentRequest}
            />

        </>
    );
} 