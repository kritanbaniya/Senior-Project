import { useState , useEffect } from "react";
import AppointmentCalendar from "./AppointmentCalendar.tsx";
import AppointmentList from "./AppointmentList.tsx";
import type { ApptProps } from "./types.ts"; 
import { Button } from "@/components/ui/button.tsx";


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


   

  return (
    <>
    {/* THE SWITCH  */}
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
      {/* <Button 
        type = "button" 
        variant={view === "calendar" ? "default" : "outline"}
        onClick={() => handleViewChange("calendar")}
        >
          Calendar
        </Button>
        <Button
          type="button"
          variant={view === "list" ? "default" : "outline"}
          onClick={() => handleViewChange("list")}
        >
          List
        </Button>  */}



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