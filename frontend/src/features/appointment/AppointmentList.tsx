import { useMemo, useEffect,  useState } from "react";
import type {  Appointment, ApptProps} from "./types.ts"; 
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "radix-ui";



// NEXT THING TO DO: 
// VIEW PAST APPOINTMENTS 
// ADVANCED SEARCHES 


export default function AppointmentList({
  appointments,
  reqAppointments, 
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

  const [ searchType , setSearchType ] = useState<string>('')
  const [ search , setSearch ] = useState<string>('') 

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

  const Totalappointments: Appointment[] = useMemo(() => {
    
    if (viewPrefs.showReqs === 'Both'){ 
      const merged = [...appointments, ...reqAppointments]; 
      return merged}
    else if (viewPrefs.showReqs === 'Requests'){ 
      return reqAppointments}
    else if (viewPrefs.showReqs === 'Hide'){ 
      return appointments}
    
    return []
  }, [reqAppointments, appointments, viewPrefs.showReqs])


  return (
    <div className="nurse-appointment-list border border-[var(--border)] p-2 rounded-lg">
      
      <p className="small-label">Appointments</p>
      {/* SEARCHBAR */}
      <div className="flex">
        <input
          className = "p-2 m-3 w-full bg-[#F5F3EE] rounded-lg"
          id="search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="search by ..." 
        />
        
        <select
          onChange={(e) => setSearchType(() => (e.target.value))}
          className = "p-2 m-3 w-1/3 bg-[#F5F3EE] rounded-lg">
            <option value="">select an option</option>
            <option value ="date">Date</option>
            <option value ="provider">Provider</option>
            <option value ="type">Type</option>
            <option value ="patient">Patient</option>
        </select>
        <div></div>
      </div>

      {/* THE LIST ITSELF */}
      <div className="overflow-x-auto rounded-md m-3">
        <ul className="appointment-list min-w-[760px]">
          {/* header */}
          <div className="bg-[#90a1b9] grid grid-cols-[100px_80px_1fr_1fr_1fr_140px] items-center px-2 py-1 text-sm font-semibold text-slate-500">
            <span className = "text-black">Date</span>
            <span className = "text-black">Time</span>
            <span className = "text-black">Provider</span>
            <span className = "text-black">Type</span>
            <span className = "text-black">Patient</span>
            <span className = "text-black">Actions</span>
          </div>
          {/* rows */}
          {Totalappointments.map((apt) => {
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
                className="bg-[#F5F3EE] grid grid-cols-[100px_80px_1fr_1fr_1fr_140px] items-center px-2 py-1 text-sm text-slate-700"
              >
                {/* columns! Design the colors better */}
                <span className = "font-bold">{dateText}</span>
                <span>{timeText}</span>
                <span>{apt.clinician_name}</span>
                <span>{apt.visit_type}</span>
                <span>{apt.patient_name}</span>
                {/* ACTIONS TO EACH APPOINTMENT ROW */}
                <span className="flex gap-2 justify-between">
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
      </div>


      <hr className="m-5 border-2 border-solid rad rounded-xl"></hr>
      {/* SET THE VIEW PREFERENCES */}
      <div>
        <label className="flex items-center gap-2 justify-between">
          {/* Display Past Switch */}
          <div  className="flex items-center">  
            <Switch.Root 
              checked={viewPrefs.showPast}
              onCheckedChange={(checked) =>
                onUpdateViewPrefs({ showPast: checked })
              }
              className="w-10 h-6 bg-gray-300 rounded-full data-[state=checked]:bg-[#7c86ff]"
              >
              <Switch.Thumb className="block w-4 h-4 bg-white rounded-full translate-x-1 data-[state=checked]:translate-x-5 transition" />
            </Switch.Root>
            <span className = "m-2">show past appointments</span>
          </div>
          {/* Rows per page */}
          <div>
            <span className = "m-2">Rows per page</span>
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
              className="w-15 rounded-md border px-2 py-1"
            />
          </div>
        </label>



        <div className="form-actions flex justify-between" style={{ marginTop: "5px" }}>
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
    </div>
  )
}
