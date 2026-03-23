import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase.ts' 
import AppointmentSwitch from '@/features/appointment/AppointmentSwitch.tsx';
import type { MemberList, Appointment, AppointmentViewPrefs, AppointmentType, AppointmentFormType } from '@/features/appointment/types.ts';
import PatientSideBar from './PatientSideBar'
import AppointmentForm from '@/features/appointment/AppointmentForm.tsx';






export default function PatientAppointmentManager() {
    var debuglog : boolean = false
    type AppointmentCreateStatus = 'idle' | 'loading' | 'success' | 'failed'

    // form management 
    const [createStatus, setCreateStatus] = useState<AppointmentCreateStatus>('idle')
    const [createMessage, setCreateMessage] = useState('')
    const [showScheduleForm, setShowScheduleForm] = useState(false) 
    const [scheduleForm, setScheduleForm] = useState<AppointmentFormType>({
        patientId: '',
        date: '',
        time: '',
        doctorId: '',
        type: '',
    })

    var selectedClinic: string // this should come from a selection in the child 
    
    ////////////////////////////////////////////////////////////////////////////////////////////////
    // VIEW PREFERENCES 
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

    ////////////////////////////////////////////////////////////////////////////////////////////////
    //// HELPER FUNCTIONS:
    // Retrieve clinic ID  
    const [clinic, setClinic] = useState<string>() // CHANGE THIS TO FETCH A LIST 
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

        if(debuglog == true) {console.log(data)} 
        setClinic(data.clinic_id) 
    }
    // temparory empty f 
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
        if(debuglog === true){
            console.log(appointmentTypes)
        }
    }

    // Keep track of patient's own data 
    const [patientName, setPatientName] = useState<MemberList | undefined>(undefined)
    const [patientId, setPatientId] = useState<string>()
    const loadPatientInfo = async (userId: string) => {
        //IN:  pass in userID 
        //OUT: 
        // - retrieve PROFILE user information 
        // - member list 
        
        // supabase. 
    }


    // Retrieve the Practicianers of this Clinic 
    const [practicionerList, setPracticionerList] = useState<MemberList[]>([])
    const retrievePracticioners = async (clinicId: string) => {
        const { data, error } = await supabase
            .schema('public')
            .from('membernamerole')
            .select('*')
            .eq('clinic_id', clinicId)
            .eq('role', 'doctor')
        if (error) {
            console.log('DOCTORS ERROR:', error)
            return
        }
        setPracticionerList(data ?? [])
    }
    
    ////////////////////////////////////////////////////////////////////////////////////////////////
    ///// C R U D !!! 
    //// C: CREATE APPT REQUEST 
    // Handle form press 
    const handleNewAppointment = (start: Date) => {
        const now = new Date()
        if (start < now) {
            setCreateStatus('failed')
            setCreateMessage('Cannot create an appointment for the past.')
            return
        }

        const yyyy = start.getFullYear()
        const mm = String(start.getMonth() + 1).padStart(2, '0')
        const dd = String(start.getDate()).padStart(2, '0')
        const hh = String(start.getHours()).padStart(2, '0')
        const min = String(start.getMinutes()).padStart(2, '0')

        setScheduleForm((f: AppointmentFormType) => ({
            ...f,
            date: `${yyyy}-${mm}-${dd}`,
            time: `${hh}:${min}`,
        }))

        setCreateStatus('idle')
        setCreateMessage('')
        setShowScheduleForm(true)
    }
    const handleCreateAppointment = async () => {
        if (selectedClinic){
            createAppointment(selectedClinic)}
    }
    function createAppointment(clinicId: string){
        return 
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
    
        console.log('APPOINTMENT attempted:')
            // USE THE QUERY TO OBTAIN RETURN DATA 
            const { data, error } = await query
            if (error) {
                console.log('APPOINTMENT READ ERROR:', error)
                setAppointmentsList([])
                return
            }
        console.log(data)
            setAppointmentsList(data)
            return
        }
    
        console.log('APPOINTMENT soon:')
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
        console.log('APPOINTMENT READ:', error)
    }


    //// REACT HOOKS !
    useEffect(() => {
        loadClinic()
        retrieveAppointmentTypes()
    }, [])

    useEffect(() => {
        if (!clinic) return
        retrievePracticioners(clinic)
        readAppointments(clinic, viewPrefs) 
        // can i rewrite this so it only relies on one variable?, so it doesn't appear to double load 
    }, [clinic, viewPrefs])

    useEffect(() => {
        if (practicionerList.length > 0 && scheduleForm.doctorId === '') {
            setScheduleForm((f) => ({ ...f, doctorId: practicionerList[0].user_id }))
        }
    }, [practicionerList])






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

                            <AppointmentForm
                                showScheduleForm={showScheduleForm}
                                setShowScheduleForm={setShowScheduleForm}
                                scheduleForm={scheduleForm}
                                setScheduleForm={setScheduleForm}
                                createStatus={createStatus}
                                setCreateStatus={setCreateStatus}
                                createMessage={createMessage}
                                setCreateMessage={setCreateMessage}
                                handleNewAppointment={handleNewAppointment}
                                createAppointment={createAppointment} // createAppointment
                                nurse={false}
                                patientList={[]}
                                patientName={patientName}
                                practicionerList={practicionerList}
                                appointmentTypes={appointmentTypes}
                                />
                        </div>
                    </div>
                </div>
            </>
        );
    } 















