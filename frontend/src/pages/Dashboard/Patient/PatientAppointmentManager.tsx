import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase.ts' 
import AppointmentSwitch from '@/features/appointment/AppointmentSwitch.tsx';
import type { Appointment, AppointmentViewPrefs, AppointmentType } from '@/features/appointment/types.ts';
import PatientSideBar from './PatientSideBar'







export default function PatientAppointmentManager() {

    const [viewPrefs, setViewPrefs] = useState<AppointmentViewPrefs>({
        mode: 'calendar',
        page: 1,
        totalpages: 1,
        rowsPerPage: 10, // user can edit the number of rows per page 
        sortRules: [ // by default, sort by date 
        { field: 'appointment_date', direction: 'asc' },
        ], 
        dateMode: 'upcoming',
        rangeStart: '',
        rangeEnd: '',
    }) // viewPref CANNOT be undefined 
    // call back function; update viewpreferences from child components 
    const updateViewPrefs = (updates: Partial<AppointmentViewPrefs>) => {
        setViewPrefs((prev) => {  // old object 
        const next = {
        ...prev,    // copy what remains the same 
        ...updates, // overwrite with what changes 
        }

        if (
            updates.rowsPerPage !== undefined &&
            updates.rowsPerPage !== prev.rowsPerPage
        ) {
            next.page = 1
        }
        return next
        })
    }



    //// HELPER FUNCTIONS:
    // Retrieve clinic ID
    const [clinic, setClinic] = useState<string>()
    const loadClinic = async () => {
        const { data: authData, error: authErr } = await supabase.auth.getUser()
        if (authErr || !authData.user) {
            console.log('AUTH ERROR:', authErr)
            return null
        } 

        const { data, error } = await supabase
            .schema('public')
            .from('Memberships')
            .select('clinic_id')
            .eq('user_id', authData.user.id)
            .single()

        if (error || !data) {
            console.log('CLINIC ERROR:', error)
            return  
        }

        setClinic(data.clinic_id) 
    }
    function emptyf(): void {
        return
    }

    // Retrieve Appointment Types 
    const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([])
    const retrieveAppointmentTypes = async () => {
        const { data, error } = await supabase.rpc('get_appointment_types')

        if (error) {
            console.log('APPOINTMENT TYPES ERROR:', error)
            setAppointmentTypes([])
            return
        }

        const values = (data ?? []).map(
            (row: { value: string }) => row.value as AppointmentType
        )
        setAppointmentTypes(values)
    }

    



    //// R: READ APPOINTMENT
    const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([])
    const readAppointments = async (
        clinicId: string,            // retrieve this clinic ID 
        prefs: AppointmentViewPrefs  // query based on these preferences 
    ) => {
    
        //   CREATE initial QUERY & ADD RULES 
        let query = supabase
        .schema('public')
        .from('appointmentlist_display2')
        .select('*', { count: prefs.mode === 'list' ? 'exact' : undefined })
        .eq('clinic_id', clinicId)
    
        
        // IF CALENDAR MODE 
        if (prefs.mode === 'calendar') {
        // from 
        if (prefs.rangeStart) {
            query = query.gte('appointment_date', `${prefs.rangeStart}T00:00:00`)
        }
        if (prefs.rangeEnd) {
            query = query.lte('appointment_date', `${prefs.rangeEnd}T23:59:59`)
        }
    
        for (const rule of prefs.sortRules) {
            query = query.order(rule.field, {
            ascending: rule.direction === 'asc',
            })
        }
    
        // USE THE QUERY TO OBTAIN RETURN DATA 
        const { data, error } = await query
        if (error) {
            console.log('APPOINTMENT READ ERROR:', error)
            setAppointmentsList([])
            return
        }
        setAppointmentsList(data ?? [])
        return
        }
    
        // list mode
        const from = (prefs.page - 1) * prefs.rowsPerPage // first row on page 
        const to = (prefs.rowsPerPage * prefs.page)-1     // last row on page 
    
        if (prefs.dateMode === 'upcoming') {
        query = query.gte('appointment_date', new Date().toISOString())
        } else if (prefs.dateMode === 'past') {
        query = query.lt('appointment_date', new Date().toISOString())
        } else if (
        prefs.dateMode === 'range' &&
        prefs.rangeStart &&
        prefs.rangeEnd
        ) {
        query = query.gte('appointment_date', `${prefs.rangeStart}T00:00:00`)
        query = query.lte('appointment_date', `${prefs.rangeEnd}T23:59:59`)
        }
    
        for (const rule of prefs.sortRules) {
        query = query.order(rule.field, {
            ascending: rule.direction === 'asc',
        })
        }
    
        // USE THE QUERY TO OBTAIN RETURN DATA 
        const { data, error, count } = await query.range(from, to)
        if (error) {
        console.log('APPOINTMENT READ ERROR:', error)
        setAppointmentsList([])
        return
        }
        setAppointmentsList(data ?? [])
        setViewPrefs((prev) => ({
        ...prev,
        totalpages: count ? Math.ceil(count / prev.rowsPerPage) : 1,
        }))
    }





    //// REACT HOOKS !
    useEffect(() => {
        loadClinic()
        retrieveAppointmentTypes()
    }, [])
    useEffect(() => {
        if (!clinic) return
        readAppointments(clinic, viewPrefs)
    }, [clinic, viewPrefs])








        return(
            <>



    <div className="pd-layout">
      {/* Left sidebar */}
      <PatientSideBar/> 




            
      <div className="pd-right">
      <div className="info-box appointments-section">
        <h2 className="info-box-title">Appointments</h2>
                {/* VIEWING APPOINTMENTS */}
                <AppointmentSwitch
                appointments={appointmentsList} // send a subset of appointments
                // functions to handle appointment CRUD actions 
                onSelectAppointment={emptyf} 
                onDeleteAppointment={emptyf}
                onSelectSlot={emptyf}
                // function to handle appointment view changes (changing query)
                viewPrefs={viewPrefs}
                onUpdateViewPrefs = {updateViewPrefs}
                />
</div></div></div>
            </>
        );
    } 















