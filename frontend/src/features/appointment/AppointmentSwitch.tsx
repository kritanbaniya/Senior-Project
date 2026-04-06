import { useState , useEffect } from "react";
import AppointmentCalendar from "./AppointmentCalendar.tsx";
import AppointmentList from "./AppointmentList.tsx";
import type { ApptProps, viewRequestTypes } from "./types.ts"; 
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "radix-ui";



export default function AppointmentSwitch({
  appointments,
  reqAppointments, 
  onSelectAppointment,
  onDeleteAppointment,
  onSelectSlot,
  viewPrefs,
  totalPages, 
  onUpdateViewPrefs,
}: ApptProps) {
  const [view, setView] = useState<"calendar" | "list">("calendar")

  useEffect(() => {
    return
  }, [appointments])

  const viewRequests : viewRequestTypes[] = [ 'Both', 'Requests', 'Hide'] 
  

  return (
    <>
      {/* TOP SELECT */}
      <div className="flex justify-between">
        {/* SWITCH : LIST & CALENDAR */}
        <div className="form-actions">
          <Button 
          type="button" 
          variant={view === "calendar" ? "default" : "outline"}
          className={view === "calendar"? ("form-actions"):("form-actions bg-white")} 
          onClick={() => {setView("calendar"); onUpdateViewPrefs({mode: 'calendar'})}}>
            Calendar
          </Button>
          <Button 
          type="button" 
          variant={view === "list" ? "default" : "outline"}
          className={view === "list"? ("form-actions"):("form-actions bg-white")}
          onClick={() => {setView("list"); onUpdateViewPrefs({mode: 'list'})}}>
            List
          </Button>
        </div>



        {/* OPTION : Appointment Request  */}
        <div className="flex items-center">  
          <span className = "m-2">Show Requests: </span>
          <select
            className='p-2 font-bold border-2 border-solid rounded-lg' 
            value={viewPrefs.showReqs}
            onChange={(e) =>
              onUpdateViewPrefs({showReqs : e.target.value as viewRequestTypes})
            }>
            {(viewRequests.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            )))}
          </select>
        </div> 
      </div>
 


      {/* THE VIEWs */}
      {view === "calendar" ? (
        <AppointmentCalendar
          appointments={appointments}
          reqAppointments = {reqAppointments}
          onSelectAppointment={onSelectAppointment}
          onSelectSlot={onSelectSlot}
          viewPrefs={viewPrefs}
          onUpdateViewPrefs={onUpdateViewPrefs}
        />
      ) : (
        <AppointmentList
          appointments={appointments}
          reqAppointments = {reqAppointments}
          onSelectAppointment={onSelectAppointment}
          onDeleteAppointment={onDeleteAppointment}
          viewPrefs={viewPrefs}
          totalPages={totalPages} 
          onUpdateViewPrefs={onUpdateViewPrefs}
        />
      )}



      {/* The Creator */}
      
    </>
  )
}