import { useMemo, useEffect,  useState } from "react";
import type {  AppointmentType, Appointment, ApptProps, SearchByType } from "./types.ts"; 
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "radix-ui";



// NEXT THING TO DO: 
// VIEW PAST APPOINTMENTS 
// ADVANCED SEARCHES 


export default function AppointmentList({
  appointments, 
  onSelectAppointment,
  onDeleteAppointment, 
  viewPrefs,
  totalPages,
  onUpdateViewPrefs,
}: ApptProps) {  
    //// PAGE and ROW ADJUSTMENTS 
    // Validate that the number in the input box is an integer, and follows the min and max 
    let page = viewPrefs ? (viewPrefs.page) : (1)
    const safeTotalPages = totalPages ?? 1 
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




    //// SEARCH STATES 
    const searchByTypes: { label: string; value: SearchByType }[] = [
        { label: 'Search by...', value: '' },
        { label: 'Date Range', value: 'date range' },
        { label: 'Visit Type', value: 'visit type' },
        { label: 'Patient', value: 'patient' },
        { label: 'Provider', value: 'provider' },
        { label: 'Clinic', value: 'clinic' }, // if nurse dont have 
    ]
    const [ searchBy , setSearchBy ] = useState<SearchByType>('') 
    // remember input values 
    const [ searchValue , setSearchValue ] = useState<string>('') 
    const [ searchStart , setSearchStart ] = useState<string>('') 
    const [ searchEnd , setSearchEnd ] = useState<string>('') 

    // SEARCH BY: visit Type 
    const ApptTypeList : { label: string; value: AppointmentType }[] = [
        { label: 'visit type...', value: '' },
        { label: 'General Check-up', value: 'General Check-up' },
        { label: 'Follow-up', value: 'Follow-up' },
        { label: 'Consultation', value: 'Consultation' },
        { label: 'Vaccination', value: 'Vaccination' },
        { label: 'Lab Work', value: 'Lab Work' } 
    ]
    const [ searchApptType , setSearchApptType ] = 
        useState<AppointmentType>('')



    // DISPLAY DIFFERENT INPUT TYPES PER SEARCH TYPE 
    function renderSearchControl() {
        switch (searchBy) {
            // DATE RANGE 
            case 'date range':
            return <div className = "flex ml-3 w-full items-center">
                <p className = "">
                    From: </p>
                <input
                    className = "p-2 m-3 w-full bg-[#F5F3EE] rounded-lg text-gray-400" 
                    id="start-date"
                    type="date" 
                    value={searchStart}
                    onChange={e => setSearchStart(e.target.value as string)}
                    placeholder="search by ..." 
                /> 
                <p className=""> 
                    to </p>
                <input
                    className = "p-2 m-3 w-full bg-[#F5F3EE] rounded-lg text-gray-400"
                    id="end-date"
                    type="date" 
                    value={searchEnd}
                    onChange={e => setSearchEnd(e.target.value as string)}
                    placeholder="search by ..." 
                /> 
                </div>


            // VISIT TYPE
            case 'visit type':
            return <select 
            value={searchApptType}
            onChange={e => setSearchApptType(e.target.value as AppointmentType)} 
            className = "p-2 m-3 w-full bg-[#F5F3EE] rounded-lg text-gray-400">
                {ApptTypeList.map((d) => (<option value={d.value} key={(d.value)+'visit'}>
                    {d.label} 
                </option>))}
            </select>


            // PATIENT NAME 
            case 'patient':
            return <input type="text" 
                className = "p-2 m-3 w-full bg-[#F5F3EE] rounded-lg text-gray-400"
                placeholder="Patient name" />


            // PROVIDER NAME 
            case 'provider':
            return <input type="text" 
                className = "p-2 m-3 w-full bg-[#F5F3EE] rounded-lg"
                placeholder="Provider name" />

            
            // PROVIDER NAME 
            case 'clinic':
            return <input type="text" 
                className = "p-2 m-3 w-full bg-[#F5F3EE] rounded-lg"
                placeholder="Clinic name" />


            // default
            case '':
            return <input
                    className = "p-2 m-3 w-full bg-white rounded-lg"
                    id="search-disabled"
                    type="text"
                    disabled
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value as SearchByType)}
                    placeholder="Search through Appointments" 
                />   
        }
    }



    function getStatusColor(status: string): string {
    switch (status) {
      case "pending":
        return "bg-slate-400 border-[#F5F3EE]"
      case "requested":
        return "bg-yellow-600 border-[#F5F3EE]"
      case "canceled":
        return "bg-slate-400 border-[#F5F3EE]"
      case "deserted":
        return "bg-slate-400 border-[#F5F3EE]"
      case "active":
        return "bg-green-600 border-[#F5F3EE]"
      case "completed":
        return "bg-[#7c86ff] border-[#F5F3EE]"
      default:
        return "bg-slate-300 border-[#F5F3EE]"
    }
  }





    //// REACT HOOKS 
    useEffect(()=>{
        setPageNum(Number(page))
    }, [page, rowsInput])
  
  


  return (
    <div className="nurse-appointment-list border border-[var(--border)] p-2 rounded-lg">
      
      {/* <p className="small-label">Appointments</p> */}
      {/* SEARCH SETTINGS */}
      <div className="flex">
        {/* SEARCHBAR */}
        <> {renderSearchControl()} </>
        {/* SEARCHBY DROPDOWN */}
        <select
          onChange={(e) => setSearchBy( e.target.value as SearchByType)}
          className = "p-2 m-3 w-1/3 bg-white border  rounded-lg">
            {searchByTypes.map((d) => (
              <option key={d.value+"-SearchByType"} value={d.value}>
              {d.label}
              </option>
            ))} 
        </select>
        {/* search button? */}
        <div>
        </div>
      </div>

      {/* THE LIST ITSELF */}
      <div className="overflow-x-auto rounded-md m-3">
        <ul className="appointment-list min-w-[760px]">
          {/* header */}
          <div className="bg-[#90a1b9] grid grid-cols-[22px_80px_80px_1fr_1fr_1fr_140px] items-center px-2 py-1 text-sm font-semibold text-slate-500">
            <button className = "text-black text-start"> </button>
            <button className = "text-black text-start">Date</button>
            <button className = "text-black text-start">Time</button>
            <button className = "text-black text-start">Provider</button>
            <button className = "text-black text-start">Type</button>
            <button className = "text-black text-start">Patient</button>
            <button className = "text-black text-start">Actions</button>
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
                className="bg-[#F5F3EE] grid grid-cols-[22px_80px_80px_1fr_1fr_1fr_140px] items-center px-2 py-1 text-sm text-slate-700"
              > 
                <div className="flex"> {/* justify-center*/}
                  <span className={`inline-block h-3 w-3 rounded-full border border-solid ${getStatusColor(apt.appointment_status)}`} />
                </div>
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
      {/* SET VIEW PREFERENCES */}
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
