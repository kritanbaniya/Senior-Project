



import AppointmentList from "./AppointmentList";
import AppointmentCalendar from "./AppointmentCalendar";
import { useMemo, useState } from "react";
import type { Appointment } from "./types.ts";
import { Button } from "@/components/ui/button.tsx";


export default function AppointmentSwitch() {
    const [view, SetView ] = useState(false); 
    // 1 is calendar, 0 is list 

    

    return(
        <>
            <Button 
                type = "button"
                onClick={() => SetView(!view)}>
            </Button>
            {view ? 
            (<>
                <p>Appointment Calender</p>
            </>):
            (<>
                <p>Appointmnet List</p>
                <AppointmentList/>
            </>)}
            
        </>
    )
}








