import { useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import type { View } from "react-big-calendar"
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'

import type { Appointment , MemberList } from '../../types.ts'


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

// local to this, so dont move 
type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  raw: Appointment
}
type Props = {
  appointments: Appointment[]
  onSelectAppointment?: (apt: Appointment) => void
  onSelectSlot?: (start: Date) => void
}

export default function AppointmentCalendar({
  appointments,
  onSelectAppointment,
  onSelectSlot,
}: Props) {
  const [currentView, setCurrentView] = useState<View>(Views.MONTH)
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

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

  return (
    <div style={{ height: '650px', margin: '20px 0' }}>
      <Calendar
        localizer={localizer}
        events={events}
        date={currentDate}
        view={currentView}
        onNavigate={(newDate) => setCurrentDate(newDate)}
        onView={(newView) => setCurrentView(newView)}
        startAccessor="start"
        endAccessor="end"
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        selectable
        popup
        step={30}
        timeslots={2}
        defaultView={Views.MONTH}
        onSelectEvent={(event) => {
          onSelectAppointment?.(event.raw)
        }}
        onSelectSlot={(slotInfo) => {
          onSelectSlot?.(slotInfo.start)
        }}
        eventPropGetter={(event) => {
          let backgroundColor = '#3174ad'

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