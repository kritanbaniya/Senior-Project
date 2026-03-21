import { useState , useEffect } from "react";
import AppointmentCalendar from "./AppointmentCalendar.tsx";
import AppointmentList from "./AppointmentList.tsx";
import type { ApptProps } from "./types.ts"; 



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
      <div className="form-actions">
        <button type="button" onClick={() => {setView("calendar"); onUpdateViewPrefs({mode: 'calendar'})}}>
          Calendar
        </button>
        <button type="button" onClick={() => {setView("list"); onUpdateViewPrefs({mode: 'list'})}}>
          List
        </button>
      </div>

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