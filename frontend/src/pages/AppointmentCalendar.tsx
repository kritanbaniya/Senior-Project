import { useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type View,
  type SlotInfo,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

import type { Appointment } from "./types.ts";

const locales = {
  'en-US': enUS,
}
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  raw: Appointment
}
type Props = { // define the prop's types
  appointments: Appointment[]
  onSelectAppointment?: (apt: Appointment) => void
  onSelectSlot?: (start: Date) => void
}

export default function AppointmentCalendar({
  appointments, // list of appointments to display 
  onSelectAppointment, // function passed in (can be nurse/patient)
  onSelectSlot,// 
}: Props) {
  const [currentView, setCurrentView] = useState<View>(Views.MONTH)
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  //// TREATING DATA 
  // create list of events from list of appointments 
  const events: CalendarEvent[] = useMemo(() => {
    return appointments
      .filter((apt) => {
        const d = new Date(apt.appointment_date)
        const year = d.getFullYear()
        return !Number.isNaN(d.getTime()) && year >= 2020 && year <= 2100
      })
      .map((apt) => {
        const start = new Date(apt.appointment_date)
        const end = new Date(start.getTime() + 30 * 60 * 1000)

        return {
          id: apt.Appointment_id,
          title: `${apt.patient_name} • ${apt.visit_type}`,
          start,
          end,
          raw: apt,
        }
      })
  }, [appointments])
  // ^ dependency: which refreshes on the appointments state from parent


  //// USE CALENDAR COMPONENT 
  return (
    <div style={{ height: '650px', margin: '20px 0' }}>
      <Calendar
        localizer={localizer}
        events={events}
        date={currentDate}
        view={currentView}
        onNavigate={(newDate: Date) => setCurrentDate(newDate)} // aware of today's date
        onView={(newView: View) => setCurrentView(newView)} // set view type
        startAccessor="start"
        endAccessor="end"
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        selectable
        popup
        step={30}
        timeslots={2}
        defaultView={Views.MONTH}
        onSelectEvent={(event : CalendarEvent) => {
          onSelectAppointment?.(event.raw)
        }}
        onSelectSlot={(slotInfo : SlotInfo) => {
          onSelectSlot?.(slotInfo.start as Date)
        }}
        eventPropGetter={(event : CalendarEvent) => {
          let backgroundColor = '#3174ad' // default
          // COLOR BY VISIT TYPE 
          if (event.raw.visit_type === 'Vaccination') {
            backgroundColor = '#2e8b57'
          } else if (event.raw.visit_type === 'Consultation') {
            backgroundColor = '#8b5cf6'
          } else if (event.raw.visit_type === 'Follow-up') {
            backgroundColor = '#d97706'
          } else if (event.raw.visit_type === 'Lab Work') {
            backgroundColor = '#dc2626'
          }

          return {
            style: {
              backgroundColor,
              borderRadius: '6px',
              border: 'none',
              padding: '2px 4px',

            },
          }
        }}
      />
    </div>
  )
}