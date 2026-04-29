import { useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type View,
  type SlotInfo,
} from "react-big-calendar"; 
import {
  format,
  parse,
  startOfWeek, 
  getDay,
  startOfDay, 
} from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { Appointment  , ApptProps} from "./types.ts"; 
import { statusColor } from "./ApptUtil.ts";






type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  raw: Appointment
} 
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



export default function AppointmentCalendar({
  appointments, // list of appointments to display 
  onSelectAppointment, // function passed in (can be nurse/patient)
  // onDeleteAppointment,
  onSelectSlot,// 
  // viewPrefs,
  onUpdateViewPrefs,
}: ApptProps) {
  const [currentView, setCurrentView] = useState<View>(Views.MONTH)
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const today = startOfDay(new Date())



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
 

  const totalEvents: CalendarEvent[] = useMemo(() => {
    
    // if (viewPrefs.showReqs === 'all'){ 
    // const merged = [...eventsReq, ...events]; 
    //   return merged}
    // else if (viewPrefs.showReqs === 'requested'){ 
    //   return eventsReq}
    // else if (viewPrefs.showReqs === 'active'){ 
    //   return events}
    
    return events
  }, [events])
  

  //// USE CALENDAR COMPONENT 
  return (
    <div style={{ height: '650px', margin: '20px 0' }}>
      <Calendar
        localizer={localizer}
        events={totalEvents}
        date={currentDate}
        view={currentView}
        onNavigate={(newDate: Date) => setCurrentDate(newDate)} // aware of today's date
        onView={(newView: View) => setCurrentView(newView)} // set view type
        
        onRangeChange={(range) => {
          if (Array.isArray(range) && range.length > 0) {
            const start = range[0]
            const end = range[range.length - 1]

            onUpdateViewPrefs({
              mode: "calendar",
              rangeStart: format(start, "yyyy-MM-dd"),
              rangeEnd: format(end, "yyyy-MM-dd"),
            })
          } else if ("start" in range && "end" in range) {
            onUpdateViewPrefs({
              mode: "calendar",
              rangeStart: format(range.start, "yyyy-MM-dd"),
              rangeEnd: format(range.end, "yyyy-MM-dd"),
            })
          }
        }}
        
        startAccessor="start"
        endAccessor="end"
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        selectable
        popup
        step={30}
        timeslots={2}
        defaultView={Views.WEEK}
        dayPropGetter={(date: Date) => {
          const cellDate = startOfDay(date)
          if (cellDate < today) {
            return {
              style: {
                backgroundColor: '#e4e3e3',
                color: '#9ca3af',
              },
            }
          }
          if (cellDate.getTime() === today.getTime()) {
            return {
              style: {
                backgroundColor: '#cfc8ee', // light blue
                border: '2px solid #8374be', 
              },
            }
          }
          return {}
        }}
        onSelectEvent={(event : CalendarEvent) => {
          onSelectAppointment?.(event.raw)
        }}
        onSelectSlot={(slotInfo : SlotInfo) => {
          onSelectSlot?.(slotInfo.start as Date)
        }}
        eventPropGetter={(event : CalendarEvent) => {
          let backgroundColor = statusColor(event.raw.appointment_status)

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