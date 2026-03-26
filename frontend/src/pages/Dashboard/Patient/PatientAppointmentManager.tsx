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
    const [scheduleForm, setScheduleForm] = useState<AppointmentFormType>({
        patientId: '',
        date: '',
        time: '',
        doctorId: '',
        type: '',
    })

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // VIEW PREFERENCES 
    const [totalPages, setTotalPage] = useState<number>(0)
    const [viewPrefs, setViewPrefs] = useState<AppointmentViewPrefs>({
        mode: 'calendar',
        page: 1,
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
    //// COMPONENT RENDER VARIABLES - decides if a part of the page gets mounted
    const [showScheduleForm, setShowScheduleForm] = useState(false) 
    // const [showAptUpdateForm, setShowAptUpdateForm] = useState(false)
    // creation status 
    const [createStatus, setCreateStatus] = useState<AppointmentCreateStatus>('idle')
    const [createMessage, setCreateMessage] = useState('')
    // stop showing appointments while new query is loading new appt list - MAY NEED BETTER PERFORMANCE
    const [appointmentsLoading, setAppointmentsLoading] = useState(false)




    ////////////////////////////////////////////////////////////////////////////////////////////////
    //// HELPER FUNCTIONS: 
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
    
    // Retrieve clinic ID  
    const [clinicList, setClinicList] = useState<any[]>([])
    const [clinic, setClinic] = useState<string>() 
    const loadClinics = async () => {
        const { data: authData, error: authErr } = await supabase.auth.getUser()
        if (authErr || !authData.user) {
            console.log('AUTH ERROR:', authErr)
            return null
        } 
        const { data, error } = await supabase
            .schema('public')
            .from('membernamerole')
            .select('*')
            .eq('user_id', authData.user.id) 

        if (error || !data) {
            console.log('CLINIC ERROR:', error)
            return  
        }
        if(debuglog == true) {console.log(data)} 

        setClinicList(data) 
        setClinic(data[0].clinic_id)  
    }


    // temparory empty f 
    function emptyf(): void {
        return
    }

    
    // Retrieve the Practicianers of selected clinic 
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
        console.log("doctor list:", data)
        setPracticionerList(data ?? [])
    }

    // Keep track of patient's own data 
    // just load into one object? yes. - i want to do that
    // const [patientName, setPatientName] = useState<MemberList | undefined>(undefined)
    // const [patientId, setPatientId] = useState<string>()
    type patientInfoType = {
        created_at : string, 
        email : string, 
        full_name : string, 
        id : string, 
        role : string
    }
    const [patientInfo, setPatientInfo] = useState<patientInfoType>()
    const loadPatientInfo = async () => {
        const { data: authData, error: authErr } = await supabase.auth.getUser()
        if (authErr || !authData.user) {
            console.log('AUTH ERROR:', authErr)
            return null
        } 

        const { data , error } = await supabase 
            .schema('public')
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single()
            
        if (error || !data) {
            console.log('PATIENT INFO ERROR:', error)
            return  
        }
        
        setPatientInfo(data)
        // console.log(data)
        if (debuglog == true){ console.log("PROFILE INFO:", data) }

        //IN:  pass in userID 
        //OUT: 
        // - retrieve PROFILE user information 
        // - member list 
        
        // supabase. 
    }
    



    ////////////////////////////////////////////////////////////////////////////////////////////////
    ///// C R U D !!! 
    //// C: CREATE APPT REQUEST 
    const createAppointment = async (clinicId: string) => {
        setCreateStatus('loading')
        setCreateMessage('')  
        if(debuglog == true){console.log('FORMSUBMITTED', scheduleForm)}
        
        // exit if form is incomplete. 
        if (  !clinicId ||
        !patientInfo?.id ||
        !scheduleForm.date ||
        !scheduleForm.time ||
        !scheduleForm.doctorId ||
        !scheduleForm.type) {
            setCreateStatus('failed')
            setCreateMessage('Appointment creation failed. Please complete all fields.')
            console.log('ERROR: APPOINTMENT CREATION FAILED')
            return
        }
        // exit if appt time is before current time 
        const selectedDateTime = new Date(`${scheduleForm.date}T${scheduleForm.time}`)
        const now = new Date()
        if (selectedDateTime < now) {
            setCreateStatus('failed')
            setCreateMessage('Appointment cannot be created in the past.')
            return
        }

        // CREATE IT 
        let appointmentDate = `${scheduleForm.date} ${scheduleForm.time}:00`
        const { data, error } = await supabase
            .schema('public')
            .from('appt_creation_requests')
            .insert([
                {
                    appointment_date: appointmentDate,
                    patient_id: patientInfo.id,
                    clinic_id: clinicId,
                    clinician_id: scheduleForm.doctorId,
                    visit_type: scheduleForm.type,
                    patient_notes: null, 
                    nurse_notes: null, 
                    request_status: 'unseen'
                },
            ])
            .select('*')
            .single()
    
        if (error || !data) {
            setCreateStatus('failed')
            setCreateMessage('Appointment creation failed.')
            console.log('ERROR CREATE:', error)
            return
        }

        const doctorName = practicionerList.find((d) => d.user_id === scheduleForm.doctorId)?.full_name ??
        'Unknown provider'
        setCreateStatus('success')
        setCreateMessage(
        `Appointment created for ${patientInfo.full_name} on ${scheduleForm.date} at ${scheduleForm.time} with ${doctorName}.`
        )

        await readAppointments(clinicId, viewPrefs)
    }
    /// pass these to children 
    // create am appointment FOR FORM 
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
    // : string // this should come from a selection in the child 
    const handleCreateAppointment = async () => {
        if (clinic){
            createAppointment(clinic)}
    }




    //// R: READ APPOINTMENT
    const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([])
    const readAppointments = async (
        clinicId: string,            // retrieve this clinic ID 
        prefs: AppointmentViewPrefs  // query based on these preferences 
    ) => {
        setAppointmentsLoading(true)
        
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
                setAppointmentsLoading(false)
                return
            }
            setAppointmentsList(data ?? [])
            setAppointmentsLoading(false)
            
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
        setAppointmentsLoading(false)
        return
        }
        setAppointmentsList(data ?? [])
        setAppointmentsLoading(false) 
        setTotalPage(count ? Math.ceil(count / viewPrefs.rowsPerPage) : 1) 

        if(debuglog == true) {console.log("total pages", totalPages)} 
    }





    ////////////////////////////////////////////////////////////////////////////////////////////////
    //// REACT HOOKS !
    useEffect(() => {
        loadClinics() 
        loadPatientInfo()
    }, [])

    useEffect(() => {
        if (!clinic) return
        retrieveAppointmentTypes()    // may depend on clinics in the future 
        retrievePracticioners(clinic)
        // can i rewrite this so it only relies on one variable?, so it doesn't appear to double load 
    }, [clinic])

    useEffect(() => {
        if (!clinic) return
        readAppointments(clinic, viewPrefs)
    }, [clinic, viewPrefs])


    // Rerender components when these values are retrieved/updated 
    useEffect(() => {
        if (practicionerList.length > 0 && scheduleForm.doctorId === '') {
            setScheduleForm((f) => ({ ...f, doctorId: practicionerList[0].user_id }))
        }
    }, [practicionerList])
    useEffect(() => {
        if (appointmentTypes.length > 0) {
            setScheduleForm((f) => ({
                ...f,
                type: f.type || appointmentTypes[0],
            }))

            // setUpdateForm((f) => ({
            //     ...f,
            //     type: f.type || appointmentTypes[0],
            // }))
        }
    }, [appointmentTypes])


    // useEffect(()=>{
    //     console.log(appointmentsList)
    // }, [appointmentsList])



        return(
            <>
                <div className="pd-layout">
                {/* Left sidebar */}
                <PatientSideBar/> 
                        
                    <div className="pd-right">
                        <div className="info-box appointments-section">
                            <h1 className="info-box-title">
                                <select 
                                    className='m-2 p-2 font-bold border-2 border-solid rounded-lg' 
                                    onChange={(e) =>
                                    setClinic(() => (e.target.value))
                                    }>
                                    {clinicList.map((c) => (
                                    <option key={c.clinic_id} value={c.clinic_id}>
                                            {c.clinic_name}
                                    </option>))} 
                                </select>
                                Appointment Scheduling
                            </h1>
                            {(!clinic || !viewPrefs) ? (<p>Loading clinic...</p>) 
                            : (<>
                            {/* VIEWING APPOINTMENTS */}
                            <AppointmentSwitch
                                appointments={appointmentsLoading ? [] : appointmentsList} // send a subset of appointments
                                // functions to handle appointment CRUD actions 
                                onSelectAppointment={emptyf} 
                                onDeleteAppointment={emptyf}
                                onSelectSlot={emptyf}
                                // function to handle appointment view changes (changing query)
                                viewPrefs={viewPrefs}
                                totalPages = {totalPages}
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
                                createAppointment={handleCreateAppointment} // createAppointment
                                nurse={false}
                                patientList={[]}
                                patientName={patientInfo?.full_name || 'Err Or'}
                                practicionerList={practicionerList}
                                appointmentTypes={appointmentTypes}
                                />
                                </>)}
                        </div>
                    </div>
                </div>
            </>
        );
    } 















