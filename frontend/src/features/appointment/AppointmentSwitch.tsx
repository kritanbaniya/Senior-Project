import { useState , useEffect } from "react";
import AppointmentCalendar from "./AppointmentCalendar.tsx";
import AppointmentList from "./AppointmentList.tsx";
import type { Appointment, AppointmentViewPrefs } from "./types.ts"; 

type Props = {
  appointments: Appointment[]
  onSelectAppointment?: (apt: Appointment) => void
  onDeleteAppointment?: (apt: Appointment) => void
  onSelectSlot?: (start: Date) => void
  viewPrefs: AppointmentViewPrefs
  onUpdateViewPrefs: (updates: Partial<AppointmentViewPrefs>) => void
}

export default function AppointmentSwitch({
  appointments,
  onSelectAppointment,
  onDeleteAppointment,
  onSelectSlot,
  viewPrefs,
  onUpdateViewPrefs,
}: Props) {
  const [view, setView] = useState<"calendar" | "list">("calendar")

  useEffect(() => {
    return
  }, [appointments])

  return (
    <>
      <div className="form-actions">
        <button type="button" onClick={() => setView("calendar")}>
          Calendar
        </button>
        <button type="button" onClick={() => setView("list")}>
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