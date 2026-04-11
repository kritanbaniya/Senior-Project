import { useEffect,  useState } from "react";
import type {  
    AppointmentType, 
    ApptProps, 
    SearchByType,
    SortField, 
} from "./types.ts"; 
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "radix-ui";



// NEXT THING TO DO: 
// search for in query   


export default function AppointmentList({
  appointments, 
  onSelectAppointment,
  onDeleteAppointment, 
  viewPrefs,
  totalPages,
  onUpdateViewPrefs,
  nurse
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
    const [ searchByTypes, setSearchByType] = useState<{ label: string; value: SearchByType }[]>([])
    useEffect(()=>{
        if(nurse === true){
            setSearchByType([
                { label: 'Search by...', value: '' },
                { label: 'Date Range', value: 'date range' },
                { label: 'Visit Type', value: 'visit type' },
                { label: 'Patient', value: 'patient' },
                { label: 'Provider', value: 'provider' }, 
            ])
        }else{
            setSearchByType([
                { label: 'Search by...', value: '' },
                { label: 'Date Range', value: 'date range' },
                { label: 'Visit Type', value: 'visit type' }, 
                { label: 'Provider', value: 'provider' },
                { label: 'Clinic', value: 'clinic' }, // if nurse dont have 
            ])
    }}, [])




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
                    className = "p-2 m-3 w-full bg-[#F5F3EE] rounded-lg" 
                    id="start-date"
                    type="date" 
                    value={searchStart}
                    onChange={e => setSearchStart(e.target.value as string)}
                /> 
                <p className=""> 
                    to </p>
                <input
                    className = "p-2 m-3 w-full bg-[#F5F3EE] rounded-lg"
                    id="end-date"
                    type="date" 
                    value={searchEnd}
                    onChange={e => setSearchEnd(e.target.value as string)} 
                /> 
                <Button
                    className=""
                    onClick={() =>
                        onUpdateViewPrefs({ 
                            rangeStart: searchStart,
                            rangeEnd: searchEnd
                        })
                    }>
                    search
                </Button>
                </div>


            // VISIT TYPE
            case 'visit type':
            return <select 
            value={searchApptType}
            onChange={(e) => {
                // setSearchValue(e.target.value as AppointmentType)
                onUpdateViewPrefs({ searchValue: e.target.value as AppointmentType})
                setSearchApptType(e.target.value as AppointmentType)
                // console.log(viewPrefs)
            }}  
            className = "p-2 m-3 w-full rounded-lg border">
                {ApptTypeList.map((d) => (
                <option value={d.value} key={(d.value)+'visit'}>
                    {d.label} 
                </option>))}
            </select>


            // PATIENT NAME 
            case 'patient':
            return <input type="text" 
                className = "p-2 m-3 w-full bg-[#F5F3EE] rounded-lg "
                placeholder="Patient name" 
                value={searchValue}
                onChange={(e) => {
                    setSearchValue(e.target.value.toLowerCase() as string)
                    onUpdateViewPrefs({ searchValue: e.target.value.toLowerCase() as string})
                    // console.log(viewPrefs)
                }} />


            // PROVIDER NAME 
            case 'provider':
            return <input type="text" 
                className = "p-2 m-3 w-full bg-[#F5F3EE] rounded-lg"
                placeholder="Provider name" 
                value={searchValue}
                onChange={(e) => {
                    setSearchValue(e.target.value.toLowerCase() as string)
                    onUpdateViewPrefs({ searchValue: e.target.value.toLowerCase() as string})
                    // console.log(viewPrefs)
                }} />

            
            // PROVIDER NAME 
            case 'clinic':
            return <input type="text" 
                className = "p-2 m-3 w-full bg-[#F5F3EE] rounded-lg"
                placeholder="Clinic name" 
                value={searchValue}
                onChange={(e) => {
                    setSearchValue(e.target.value.toLowerCase() as string)
                    onUpdateViewPrefs({ searchValue: e.target.value.toLowerCase() as string})
                    // console.log(viewPrefs)
                }} />


            // default
            case '':
            return <input
                    className = "p-2 m-3 w-full bg-white rounded-lg"
                    id="search-disabled"
                    type="text"
                    disabled 
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
  
  



    
    function tristate(fie: SortField, i: number) {
        let nextState = 0
        let newRules = viewPrefs.sortRules.filter(d => d.field !== fie)
        if (i === 0) {
            newRules.unshift({ field: fie, direction: "asc" })
            nextState = 1
        } else if (i === 1) {
            newRules.unshift({ field: fie, direction: "desc" })
            nextState = 2
        } else {
            nextState = 0
        }
        return { nextState, newRules }
    }
    const [iterStatus, setIterStatus] = useState<number>(0)
    const [iterDate, setIterDate] = useState<number>(1)
    const [iterProvider, setIterProvider] = useState<number>(0)
    const [iterType, setIterType] = useState<number>(0)
    const [iterPatient, setIterPatient] = useState<number>(0)
    const [iterClinic, setIterClinic] = useState<number>(0)



    return (
        <div className="nurse-appointment-list border border-[var(--border)] p-2 rounded-lg">
        
        {/* <p className="small-label">Appointments</p> */}
        {/* SEARCH SETTINGS */}
        <div className="flex">
            {/* SEARCHBAR */}
            <> {renderSearchControl()} </>
            {/* SEARCHBY DROPDOWN */}
            <select
            onChange={(e) => {
                onUpdateViewPrefs({ searchBy: e.target.value as SearchByType})
                setSearchBy( e.target.value as SearchByType)

                onUpdateViewPrefs({ searchValue: '' as any})
                setSearchValue('' as any)
            }}
            className = "p-2 m-3 w-1/3 bg-white border  rounded-lg">
                {searchByTypes.map((d) => (
                <option 
                key={d.value+"-SearchByType"} 
                value={d.value}>
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
                <button className = "text-black text-start"
                    onClick={() => {
                            const { nextState, newRules } = tristate('appointment_status', iterStatus)
                            setIterStatus(nextState)
                            onUpdateViewPrefs({ sortRules: newRules })
                        }}> 
                            { iterStatus === 0 ? " ⮃"
                            : iterStatus === 1 ? " 🠇"
                            : " 🠅"}
                        </button>


                <button className = "text-black text-start"
                    onClick={() => {
                            const { nextState, newRules } = tristate('appointment_date', iterDate)
                            setIterDate(nextState)
                            onUpdateViewPrefs({ sortRules: newRules })
                        }}>Date
                            { iterDate === 0 ? " ⮃"
                            : iterDate === 1 ? " 🠇"
                            : " 🠅"}
                        </button>
                <span className = "text-black text-start">Time</span>



                <button className = "text-black text-start"
                    onClick={() => {
                            const { nextState, newRules } = tristate('clinician_name', iterProvider)
                            setIterProvider(nextState)
                            onUpdateViewPrefs({ sortRules: newRules })
                        }}>Provider
                            { iterProvider === 0 ? " ⮃"
                            : iterProvider === 1 ? " 🠇"
                            : " 🠅"}
                        </button>



                <button className = "text-black text-start" 
                    onClick={() => {
                            const { nextState, newRules } = tristate('visit_type', iterType)
                            setIterType(nextState)
                            onUpdateViewPrefs({ sortRules: newRules })
                        }}>Type
                            { iterType === 0 ? " ⮃"
                            : iterType === 1 ? " 🠇"
                            : " 🠅"}
                        </button>

                
                <>
                    {nurse? (<>
                        <button className = "text-black text-start"
                            onClick={() => {
                                    const { nextState, newRules } = tristate('patient_name', iterPatient)
                                    setIterPatient(nextState)
                                    onUpdateViewPrefs({ sortRules: newRules })
                                }}>Patient
                                    { iterPatient === 0 ? " ⮃"
                                    : iterPatient === 1 ? " 🠇"
                                    : " 🠅"}
                        </button>
                    </>):(<>
                        <button className = "text-black text-start"
                            onClick={() => {
                                    const { nextState, newRules } = tristate('clinic_name', iterClinic)
                                    setIterClinic(nextState)
                                    onUpdateViewPrefs({ sortRules: newRules })
                                }}>Clinics
                                    { iterClinic === 0 ? " ⮃"
                                    : iterClinic === 1 ? " 🠇"
                                    : " 🠅"}
                        </button>
                    </>)}
                </>


                <span className = "text-black text-start">Actions</span>
            </div>
            {/* rows */}
            {appointments.map((apt) => {
                // Convert timestamp from SQL to human readable local time  
                const dt = new Date(apt.appointment_date)
                const dateText = Number.isNaN(dt.getTime()) ? apt.appointment_date : dt.toLocaleDateString()
                const timeText = Number.isNaN(dt.getTime()) ? '' : dt.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                })
                return (
                <li
                    key={apt.Appointment_id}
                    className="bg-[#F5F3EE] grid grid-cols-[22px_80px_80px_1fr_1fr_1fr_140px] items-center px-2 py-1 text-sm text-slate-700"
                > 
                    {nurse? (<>
                        <div className="flex"> {/* justify-center*/}
                        <span className={`inline-block h-3 w-3 rounded-full border border-solid ${getStatusColor(apt.appointment_status)}`} />
                        </div>
                        <span className = "font-bold">{dateText}</span>
                        <span>{timeText}</span>
                        <span>{apt.clinician_name}</span>
                        <span>{apt.visit_type}</span>
                        <span>{apt.patient_name}</span>
                        {/* ACTIONS TO EACH APPOINTMENT ROW */}
                        <span className="flex gap-2 justify-around">
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
                    </>):(<>
                        <div className="flex"> {/* justify-center*/}
                        <span className={`inline-block h-3 w-3 rounded-full border border-solid ${getStatusColor(apt.appointment_status)}`} />
                        </div>
                        <span className = "font-bold">{dateText}</span>
                        <span>{timeText}</span>
                        <span>{apt.clinician_name}</span>
                        <span>{apt.visit_type}</span>
                        <span>{apt.clinic_name}</span>
                        {/* ACTIONS TO EACH APPOINTMENT ROW */}
                        <span className="flex gap-2 justify-around">
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
                    </>)}
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
