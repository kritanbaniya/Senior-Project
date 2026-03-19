import { useEffect, useMemo, useState } from "react";
import type { Appointment , AppointmentViewPrefs } from "./types.ts"; 






type Props = {
  appointments: Appointment[]
  onSelectAppointment?: (apt: Appointment) => void
  onDeleteAppointment?: (apt: Appointment) => void
  onSelectSlot?: (start: Date) => void
  viewPrefs: AppointmentViewPrefs
  onUpdateViewPrefs: (updates: Partial<AppointmentViewPrefs>) => void
}







export default function AppointmentList({
  appointments,
  onSelectAppointment,
  onDeleteAppointment,
  onSelectSlot,
  viewPrefs,
  onUpdateViewPrefs,
}: Props) { 
  // pull info from view pref obj 
  let page = viewPrefs ? (viewPrefs.page) : (1)
  let totalPages = viewPrefs ? (viewPrefs.totalpages) : (1)
 



  // Validate that the number in the input box is an integer, and follows the min and max 
  const [rowsInput, setRowsInput] = useState(String(viewPrefs.rowsPerPage))
  const commitRowsPerPage = () => {
    const parsed = Number(rowsInput)
    if (!Number.isInteger(parsed) || parsed > 5 || parsed < 150) {
      onUpdateViewPrefs({ rowsPerPage: parsed })
      return
    } 
  }


  const [pageNum, setPageNum] = useState(String(viewPrefs.page))
  const CommitPageNumber = () => {
      const parsed = Number(pageNum)
      if (!Number.isInteger(parsed) || parsed > 1 || parsed < totalPages) {
        onUpdateViewPrefs({ page: parsed })
        return
      } 
    }


  useEffect(()=>{
    setPageNum(String(page))
  }, [page, rowsInput])


  return (
    <div className="nurse-appointment-list">
      <p className="small-label">Appointments (today & upcoming)</p>

      {/* THE LIST ITSELF */}
      <ul className="appointment-list">
        {/* header */}
        <div className="grid grid-cols-[120px_100px_1fr_1fr_1fr_140px] items-center px-2 py-1 text-sm font-semibold text-slate-500">
          <span>Date</span>
          <span>Time</span>
          <span>Provider</span>
          <span>Type</span>
          <span>Patient</span>
          <span>Actions</span>
        </div>
        {/* rows */}
        {appointments.map((apt) => {
          // Convert timestamp from SQL to human readable local time  
          const dt = new Date(apt.appointment_date)
          const dateText = Number.isNaN(dt.getTime())
            ? apt.appointment_date
            : dt.toLocaleDateString()
          const timeText = Number.isNaN(dt.getTime())
            ? ''
            : dt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
          return (
            <li
              key={apt.Appointment_id}
              className="grid grid-cols-[120px_100px_1fr_1fr_1fr_140px] items-center px-2 py-1 text-sm text-slate-700"
            >
              {/* columns! Design the colors better */}
              <span>{dateText}</span>
              <span>{timeText}</span>
              <span>{apt.clinician_name}</span>
              <span>{apt.visit_type}</span>
              <span>{apt.patient_name}</span>
              {/* ACTIONS TO EACH APPOINTMENT ROW */}
              <span className="flex gap-2">
                {onSelectAppointment && (
                  <button
                    type="button"
                    className="btn-small"
                    onClick={() => onSelectAppointment(apt)}
                  >
                    Edit
                  </button>
                )}
                {onDeleteAppointment && (
                  <button
                    type="button"
                    className="btn-small"
                    onClick={() => onDeleteAppointment(apt)}
                  >
                    Delete
                  </button>
                )}

              </span>
            </li>
          )
        })}
      </ul>

      {/* SET THE VIEW PREFERENCES */}
      <div className="form-actions" style={{ marginTop: "12px" }}>
        {/* PREV PAGE BUTTON */}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onUpdateViewPrefs({ page: viewPrefs.page - 1 })}
          disabled={page === 1}
        >
          Previous
        </button>

        <span style={{ alignSelf: "center" }}>
          Page 
        <input
            type="text"
            inputMode="numeric"
            value={pageNum}
            onChange={(e) => {
              const value = e.target.value
              if (/^\d*$/.test(value)) {
                setPageNum(value)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                CommitPageNumber() 
              }
            }}
            onBlur={CommitPageNumber}
            className="w-20 rounded border px-2 py-1"
          />
          
          
           of {totalPages}
        </span>

        {/* NEXT PAGE BUTTON */}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onUpdateViewPrefs({ page: viewPrefs.page + 1 })}
          disabled={page === totalPages}
        >
          Next
        </button>

        {/* UPDATE AMOUNT OF ROWS PERPAGE */}
        <label className="flex items-center gap-2" style={{ marginLeft: "12px" }}>
          <span>Rows per page</span>
          <input
            type="text"
            inputMode="numeric"
            value={rowsInput}
            onChange={(e) => {
              const value = e.target.value
              if (/^\d*$/.test(value)) {
                setRowsInput(value)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                commitRowsPerPage()
              }
            }}
            onBlur={commitRowsPerPage}
            className="w-20 rounded border px-2 py-1"
          />
        </label>
      </div>
    </div>
  )
}