import { useState } from "react";
import AppointmentCalendar from "./AppointmentCalendar.tsx";
import AppointmentList from "./AppointmentList.tsx";
import type { Appointment } from "./types.ts";

type Props = {
  appointments: Appointment[]
  onSelectAppointment?: (apt: Appointment) => void
  onDeleteAppointment?: (apt: Appointment) => void
  onSelectSlot?: (start: Date) => void
}

export default function AppointmentSwitch({
  appointments,
  onSelectAppointment,
  onDeleteAppointment,
  onSelectSlot,
}: Props) {
  const [view, setView] = useState<"calendar" | "list">("calendar")

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
        />
      ) : (
        <AppointmentList
          appointments={appointments}
          onSelectAppointment={onSelectAppointment}
          onDeleteAppointment={onDeleteAppointment}
        />
      )}
    </>
  )
}