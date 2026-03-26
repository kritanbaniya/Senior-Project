import { useEffect,  useState } from "react";
import type {  ApptProps} from "./types.ts"; 
import { Button } from "@/components/ui/button.tsx";



// NEXT THING TO DO: 
// VIEW PAST APPOINTMENTS 
// ADVANCED SEARCHES 


export default function AppointmentList({
  appointments,
  onSelectAppointment,
  onDeleteAppointment,
  // onSelectSlot,
  viewPrefs,
  totalPages,
  onUpdateViewPrefs,
}: ApptProps) { 
  // pull info from view pref obj 
  let page = viewPrefs ? (viewPrefs.page) : (1)
  const safeTotalPages = totalPages ?? 1
  // let totalPages = viewPrefs ? (viewPrefs.totalpages) : (1)
  // console.log(totalPages)

  

  // Validate that the number in the input box is an integer, and follows the min and max 
  const [rowsInput, setRowsInput] = useState(Number(viewPrefs.rowsPerPage))
  const commitRowsPerPage = () => {
    const parsed = Number(rowsInput)
    if ((Number.isInteger(parsed)) && (parsed > 0) && (parsed < 201)) {
      onUpdateViewPrefs({ rowsPerPage: parsed })
      return
    } else { 
      setRowsInput(viewPrefs.rowsPerPage)
      console.log("ROW SETTING ERROR")
    }
  }


  const [pageNum, setPageNum] = useState(Number(viewPrefs.page))
  const CommitPageNumber = () => {
    const parsed = Number(pageNum)
    if ((Number.isInteger(parsed)) && (parsed > 0) && (parsed <= safeTotalPages)) {
      onUpdateViewPrefs({ page: parsed })
      return
    } else { 
      setPageNum(viewPrefs.page)
      console.log("PAGE SETTING ERROR")
    }
  }


  useEffect(()=>{
    setPageNum(Number(page))
  }, [page, rowsInput])
 
  useEffect(()=>{
    // console.log(
    //   "ROWs AND PAGE:", 
    //   rowsInput, pageNum
    // )
  }, [rowsInput, pageNum])


  return (
    <div className="nurse-appointment-list">
      <div className="flex">
        <p className="small-label">Appointments (today & upcoming)</p>
        {/* insert, date range adjuster here */}
      </div>
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
      
      <hr className="m-5 border-2 border-solid rad rounded-xl"></hr>
      <br></br>
      {/* SET THE VIEW PREFERENCES */}
      {/* UPDATE AMOUNT OF ROWS PERPAGE */}
      <label className="flex items-center gap-2 justify-end" style={{ marginLeft: "12px" }}>
        <span>Rows per page</span>
        <input
          type="text"
          inputMode="numeric"
          value={rowsInput}
          onChange={(e) => {
            const value = e.target.value
            if (/^\d*$/.test(value)) {
              setRowsInput(Number(value))
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              commitRowsPerPage()
            }}} onBlur={commitRowsPerPage}
          className="w-10 rounded border px-2 py-1"
        />
      </label>
      <div className="form-actions flex justify-between" style={{ marginTop: "12px" }}>
        {/* PREV PAGE BUTTON */}
        <Button
          type="button"
          className="btn-secondary"
          onClick={() => onUpdateViewPrefs({ page: viewPrefs.page - 1 })}
          disabled={page === 1}
        >
          Previous
        </Button>

        <span style={{ alignSelf: "center" }}>
          Page 
        <input 
            type="text"
            inputMode="numeric"
            value={pageNum}
            onChange={(e) => {
              const value = e.target.value
              if (/^\d*$/.test(value)) {
                setPageNum(Number(value))
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                CommitPageNumber() 
              }}} onBlur={CommitPageNumber}
            className="m-2 w-15 rounded border px-2 py-1"
          />
          
          
           of {safeTotalPages}
        </span>

        {/* NEXT PAGE BUTTON */}
        <Button
          type="button"
          className="btn-secondary"
          onClick={() => onUpdateViewPrefs({ page: viewPrefs.page + 1 })}
          disabled={page === safeTotalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
