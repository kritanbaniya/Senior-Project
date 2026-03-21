import { useState , useEffect } from "react";
import AppointmentCalendar from "./AppointmentCalendar.tsx";
import AppointmentList from "./AppointmentList.tsx";
import type { ApptProps } from "./types.ts"; 
import { Button } from "@/components/ui/button.tsx";


export default function AppointmentSwitch({
  appointments,
  onSelectAppointment,
  onDeleteAppointment,
  onSelectSlot,
  viewPrefs,
  onUpdateViewPrefs,
}: ApptProps) {
  const [view, setView] = useState<"calendar" | "list">("calendar")

  useEffect(() => {
    return
  }, [appointments])

  return (
    <>
    {/* THE SWITCH */}
      <div className="form-actions">
        <Button type="button" className={view === "calendar"? ("form-actions"):("form-actions bg-gray-700")} onClick={() => {setView("calendar"); onUpdateViewPrefs({mode: 'calendar'})}}>
          Calendar
        </Button>
        <Button type="button" className={view === "list"? ("form-actions"):("form-actions bg-gray-700")}onClick={() => {setView("list"); onUpdateViewPrefs({mode: 'list'})}}>
          List
        </Button>
      </div>

      {/* THE VIEWs */}
      {view === "calendar" ? (
        <AppointmentCalendar
          appointments={appointments}
          onSelectAppointment={onSelectAppointment}
          onSelectSlot={onSelectSlot}
          viewPrefs={viewPrefs}
          onUpdateViewPrefs={onUpdateViewPrefs}
        />
      ) : (
        <AppointmentList
          appointments={appointments}
          onSelectAppointment={onSelectAppointment}
          onDeleteAppointment={onDeleteAppointment}
          viewPrefs={viewPrefs}
          onUpdateViewPrefs={onUpdateViewPrefs}
        />
      )}
    </>
  )
}