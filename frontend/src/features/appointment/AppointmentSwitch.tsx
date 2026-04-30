import { useState , useEffect } from "react";
import AppointmentCalendar from "./AppointmentCalendar.tsx";
import AppointmentList from "./AppointmentList.tsx";
import type { ApptProps } from "./types.ts"; 
import { Button } from "@/components/ui/button.tsx";
// import { Switch } from "radix-ui"; 
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CheckIcon } from "@radix-ui/react-icons"
import { statusColor } from "./ApptUtil.ts";



export default function AppointmentSwitch({
    appointments, 
    onSelectAppointment,
    onDeleteAppointment,
    onSelectSlot,
    viewPrefs,
    totalPages, 
    onUpdateViewPrefs,
    nurse
    }: ApptProps) {
    const [view, setView] = useState<"calendar" | "list">("calendar")

    useEffect(() => {
        return
    }, [appointments])

    const viewRequests : any[] = [
        'pending',  // patient needs to make changes 
        'requested',   // nurse/clinic has not seen it 
        'canceled', // appointment was canceled 
        'deserted',  // patient did not show up 
        'active',   // active = APPOINTMENTS 
        'completed' // Appointment successfully closed 
    ] // [ 'Both', 'Requests', 'Hide'] 
    
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <>
        {/* TOP SELECT */}
        <div className="flex justify-between">
            {/* SWITCH : LIST & CALENDAR */}
            <div className="form-actions">
            <Button 
            type="button" 
            variant={view === "calendar" ? "default" : "outline"}
            className={view === "calendar"? ("form-actions"):("form-actions bg-white")} 
            onClick={() => {setView("calendar"); onUpdateViewPrefs({mode: 'calendar'})}}>
                Calendar
            </Button>
            <Button 
            type="button" 
            variant={view === "list" ? "default" : "outline"}
            className={view === "list"? ("form-actions"):("form-actions bg-white")}
            onClick={() => {setView("list"); onUpdateViewPrefs({mode: 'list'})}}>
                List
            </Button>
            </div>



            {/* OPTION : Appointment Request  */} 
            <DropdownMenu.Root  open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenu.Trigger asChild>
                    <button className=" border rounded-lg ">
                        <p className="m-1 mx-3">Status Checklist  {menuOpen ? "🠝":"🠟"}</p>
                    </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Content
                    className="bg-white border rounded-lg shadow-lg p-2 w-56 z-10000"
                    sideOffset={5}
                >
                    {viewRequests.map((status) => {
                    const checked = viewPrefs.showReqs.includes(status)

                    return (
                        <DropdownMenu.CheckboxItem
                        key={status}
                        checked={checked}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={(isChecked) => {
                            const next = isChecked
                            ? [...viewPrefs.showReqs, status]
                            : viewPrefs.showReqs.filter((s) => s !== status)

                            onUpdateViewPrefs({ showReqs: next })
                        }}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                        >
                            <DropdownMenu.ItemIndicator className="absolute right-2 inline-flex items-center border-2 rounded-lg">
                                <CheckIcon />
                            </DropdownMenu.ItemIndicator>
                        <span className={
                            `inline-block h-3 w-3 rounded-full border border-solid`}
                            style={{
                                backgroundColor: statusColor(status),
                            }} />
                            {status}
                        </DropdownMenu.CheckboxItem>
                    )
                    })}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>
    


        {/* THE VIEWs */}
        {view === "calendar" ? (
            <AppointmentCalendar
            appointments={appointments} 
            onSelectAppointment={onSelectAppointment}
            onSelectSlot={onSelectSlot}
            viewPrefs={viewPrefs}
            onUpdateViewPrefs={onUpdateViewPrefs}
            nurse={nurse}
            />
        ) : (
            <AppointmentList
            appointments={appointments} 
            onSelectAppointment={onSelectAppointment}
            onDeleteAppointment={onDeleteAppointment}
            viewPrefs={viewPrefs}
            totalPages={totalPages} 
            onUpdateViewPrefs={onUpdateViewPrefs}
            nurse={nurse}
            />
        )}



        {/* The Creator */}
        
        </>
    )
}