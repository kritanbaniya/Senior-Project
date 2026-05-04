import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase.ts' 
import AppointmentSwitch from '@/features/appointment/AppointmentSwitch.tsx';
import type {  
    UserClinicRelationship, 
    Appointment, 
    AppointmentViewPrefs, 
    AppointmentType, 
    CreateApptForm 
} from '@/features/appointment/types.ts';
import PatientSidebar from './components/PatientSidebar.tsx'
import ApptCreateModal from '@/features/appointment/ApptCreateModal.tsx';
import { apiCreateAppt } from '@/features/appointment/appointment.api.ts';
import { SidebarProvider } from '@/components/ui/sidebar'
import ApptDetailModal from '@/features/appointment/ApptDetailModal.tsx';
 

// CAN ONLY EDIT REQUESTS OR PENDING 



export default function PatientAppointmentManager() {
    type debuglogType = 'initial'| 'read' | 'create' | 'update' | 'delete' | 'lifecycle'
    var debuglog: debuglogType[] = []
    type AppointmentCreateStatus = 'idle' | 'loading' | 'success' | 'failed' 


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
        if(debuglog.includes('initial')){
            console.log(appointmentTypes)
        }
    }
    
    // The CLINIC Selected for creation  
    const [ showClinicSelector, setShowClinicSelector ] = useState<boolean>(true) // decides if form needs to show clinic selector UI 
    const [ clinicReq, setClinicReq ] = useState<string>() // for the Form 
    const [clinicView, setClinicView] = useState<string>() // for the View 
    const [clinicList, setClinicList] = useState<UserClinicRelationship[]>([]) 
    const loadClinics = async () => {
        const { data: authData, error: authErr } = await supabase.auth.getUser()
        if (authErr || !authData.user) {
            console.log('AUTH ERROR:', authErr)
            return null
        } 
        const { data, error } = await supabase
            .schema('public')
            .from('clinics')
            .select('*') 

        if (error || !data) {
            console.log('CLINIC ERROR:', error)
            return  
        }
        if(debuglog.includes('initial')) {console.log(data)} 
        // 
        data.unshift({clinic_id: 'all', clinic_name: 'All', created_at: null, role: 'patient'})
        setClinicList(data) 
        setClinicView(data[0].clinic_id)  
    }

    // Retrieve the PRACTICIANERS of selected clinic 
    const [practicionerList, setPracticionerList] = useState<UserClinicRelationship[]>([])
    const retrievePracticioners = async (clinicId: string) => {
        if(clinicId == 'all'){
            setPracticionerList([])
        }else{
            const { data, error } = await supabase
                .schema('public')
                .from('membernamerole')
                .select('*')
                .eq('clinic_id', clinicId)
                .eq('role', 'doctor')
                console.log
            if (error) {
                console.log('DOCTORS ERROR:', error)
                return
            }
            console.log("doctor list:", data)
            setPracticionerList(data ?? [])
        }
    }

    // Retrieve own info
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
        if (debuglog.includes('initial')){ console.log("PROFILE INFO:", data) } 
    }



    // temparory empty f 
    function emptyf(): void {
        return
    }
    



    ////////////////////////////////////////////////////////////////////////////////////////////////
    ///// C R U D !!! 
    // C: UI 
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false)
    const [createForm, setCreateForm] = useState<CreateApptForm>({
        appointmentId: '', 
        patientId: '',
        doctorId: '',
        date: '',
        time: '',
        type: '',
        appointment_status: 'requested',
        nurse_note: '',
        patient_note: '' 
    })
    const [createStatus, setCreateStatus] = useState<AppointmentCreateStatus>('idle')
    const [createMessage, setCreateMessage] = useState('')
    //// C: CREATE APPT REQUEST 
    const createAppointment = async (clinicId: string) => { // I : clinicId  &&  Submission form 
        if(debuglog.includes('create')){console.log('CREATEFORM SUBMITTED', createForm)} 


        ////// SET UI 
        setCreateStatus('loading')
        setCreateMessage('')  
  
        ////// EXIT CASES 
        // exit if form is incomplete. 
        if (  !clinicId || 
            !patientInfo?.id || 
            !createForm || 
            !createForm.date || 
            !createForm.time || 
            !createForm.doctorId || 
            !createForm.type) {
            setCreateStatus('failed')
            setCreateMessage('Appointment creation failed. Please complete all fields.')
            console.log('ERROR: APPOINTMENT CREATION FAILED')
            return
        }
        if (clinicId === 'all' ){
            setCreateStatus('failed')
            setCreateMessage('Please select a clinic') 
            console.log('APPOINTMENT CREATION REQUIRES A CLINIC')
            return}
        // exit if appt time is before current time 
        const selectedDateTime = new Date(`${createForm.date}T${createForm.time}`)
        const now = new Date()
        if (selectedDateTime < now) {
            setCreateStatus('failed')
            setCreateMessage('Appointment cannot be created in the past.')
            return
        }

        // CREATE IT 
        try {
            const created = await apiCreateAppt(createForm, clinicId)
            if(debuglog.includes('create')) console.log('CREATED:', created)
            // TAIL UI CHANGES console.log('doctorId in form:', createForm.doctorId)
            const doctorName = practicionerList.find((d) => d.user_id === createForm.doctorId)?.full_name ?? 'Unknown provider' 
            const clinicThis = clinicList.find((d) => d.clinic_id === clinicReq)?.clinic_name ?? 'Unknown Clinic' 
            setCreateStatus('success')
            setCreateMessage(`Appointment Requested for ${createForm.date} at ${clinicThis} with ${doctorName}.`)
            // since appt list changed, re-call readAppt
            if(clinicView === clinicId) await readAppointments(clinicId, viewPrefs)
        } catch (error) {
            console.log('ERROR CREATE:', error)
            // TAIL UI CHANGES  
            setCreateStatus('failed')
            setCreateMessage('Appointment request failed.') 
        } finally {
            // if(clinic) await readAppointments(clinic, viewPrefs)
        }  
    }
    /// pass these to children 
    // create an appointment 
    const handleCreateAppointment = async () => { 
        if(clinicReq) createAppointment(clinicReq) 
        if(!clinicReq) if(!clinicView) createAppointment(clinicView as string)
    }
    // open the form modal * 
    const openCreateForm = (start: Date) => { 
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
        
        if(!patientInfo) {
            setCreateStatus('failed')                           // for UI 
            setCreateMessage('No valid user logged in')         // for UI 
            setShowCreateForm(false)   // Allow the user to edit the form 
            return}


        setCreateForm((f: CreateApptForm) => ({     // prefill date and time 
            ...f,
            date: `${yyyy}-${mm}-${dd}`,
            time: `${hh}:${min}`,  
            patientId: patientInfo.id,
            appointment_status: 'requested', 
        }))
        // setShowAptUpdateForm(false)     // make sure updateForm is not open 
        setCreateStatus('idle')     // for UI 
        setCreateMessage('')        // for UI 
        setShowCreateForm(true)   // Allow the user to edit the form 
    } 




    /////////////////////////////////////////////////////
    //// R: READ APPOINTMENT// VIEW PREFERENCES 
    const [totalPages, setTotalPage] = useState<number>(0)
    const [viewPrefs, setViewPrefs] = useState<AppointmentViewPrefs>({
        mode: 'calendar',
        page: 1, 
        rowsPerPage: 10, // user can edit the number of rows per page 
        sortRules: [ // by default, sort by date 
        { field: 'appointment_date', direction: 'asc' },
        ], 
        searchBy: '',
        searchValue: '',
        showReqs: [ 
            'pending',
            'requested',
            'canceled',
            'deserted',
            'active',
            'completed'  
        ], 
        showPast: true, 
        rangeStart: '',
        rangeEnd: '',
    }) 
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

            if(debuglog.includes('read')) console.log("PREFERENCES:", viewPrefs) 
            return next
        })
    } 
    const [appointmentsLoading, setAppointmentsLoading] = useState(false)
    const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([])
    const readAppointments = async (
        clinicId: string,            // retrieve this clinic ID 
        prefs: AppointmentViewPrefs  // query based on these preferences 
    ) => {
        setAppointmentsLoading(true)
        
        //   CREATE initial QUERY & ADD RULES 
        let query 
        if (clinicId === 'all'){
            query = supabase
                .schema('public')
                .from('appointmentlist_display')
                .select('*', { count: prefs.mode === 'list' ? 'exact' : undefined }) 
        } else {
            query = supabase
                .schema('public')
                .from('appointmentlist_display')
                .select('*', { count: prefs.mode === 'list' ? 'exact' : undefined })
                .eq('clinic_id', clinicId)
        }
        
        /////////////////////////////////////////////////////////////////////////////
        //// BUILD QUERY   
        // Appointment Status Checklist 
        if (debuglog.includes('read')) console.log('Appointment Status Checklist :', prefs.showReqs)
        if (prefs.showReqs.length === 0) {
            return
        }
        const filters = [] 
        for (const status of prefs.showReqs) {
            filters.push(`appointment_status.eq.${status}`)
        } 
        query = query.or(filters.join(','))
    

        // CALENDAR MODE 
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
    

        // LIST MODE 
        if (prefs.mode === 'list'){
            const from = (prefs.page - 1) * prefs.rowsPerPage // first row on page 
            const to = (prefs.rowsPerPage * prefs.page)-1     // last row on page 
        
            // show past 
            if (prefs.showPast === false && prefs.searchBy !== 'date range'){ 
                const now = new Date();
                const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
                query = query.gte('appointment_date', formatted) //  new Date().toISOString())
            } 
            
            // search by date range 
            if (prefs.searchBy === 'date range' &&
                prefs.rangeStart &&
                prefs.rangeEnd) {
                query = query.gte('appointment_date', `${prefs.rangeStart}T00:00:00`)
                query = query.lte('appointment_date', `${prefs.rangeEnd}T23:59:59`)
            } 
            if (prefs.searchBy === 'visit type' && prefs.searchValue){
                query = query.eq('visit_type', prefs.searchValue as AppointmentType)
            } 
            if (prefs.searchBy === 'patient' && prefs.searchValue){
                query = query.ilike('patient_name', `%${prefs.searchValue}%`)
            } 
            if (prefs.searchBy === 'provider' && prefs.searchValue){
                query = query.ilike('clinician_name', `%${prefs.searchValue}%`)
            } 
            if (prefs.searchBy === 'clinic' && prefs.searchValue){
                query = query.ilike('clinic_name', `%${prefs.searchValue}%`)
            } 


            for (const rule of prefs.sortRules) {
                query = query.order(rule.field, {
                ascending: rule.direction === 'asc',
                })
            } // add more sort rules 
  
        

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

            if(debuglog.includes('read')) {console.log("total pages", totalPages)} 
        }
        setAppointmentsLoading(false)
    } 




    const [showApptDetails, setShowApptDetails ] = useState<boolean>(false)
    const [selectApptDetails, setSelectApptDetails ] = useState<Appointment>()
    const openAppointmentDetails = (appt: Appointment) => {
        setShowApptDetails(true)
        setSelectApptDetails(appt)
    }
    

    /////////////////////////////////////////////////////
    //// c: Cancel Appt   
    //// U: UPDATE EXISTING APPOINTMENT
    // const updateAppointments = async () => { // relies on updateForm data 
    //     if(debuglog.includes('update')){console.log('UPDATEFORM SUBMITTED:', updateForm)}
 
        
    //     ////// EXIT CASES  
    //     // UPDATE IT 
    //     try {
    //         const updated = await apiUpdateAppt(updateForm)
    //         if(debuglog.includes('update')) console.log('UPDATED:', updated)
    //         // TAIL UI CHANGES  
    //         const patientName = patientList.find((p) => p.user_id === updateForm.patientId)?.full_name ?? 'Unknown patient'
    //         const doctorName = practicionerList.find((d) => d.user_id === updateForm.doctorId)?.full_name ?? 'Unknown provider' 
    //         setUpdateStatus('success')
    //         setUpdateMessage(`Appointment created for ${patientName} on ${updateForm.date} at ${updateForm.time} with ${doctorName}.`)
    //         // since appt list changed, re-call readAppt
    //         if(clinic) await readAppointments(clinic, viewPrefs)
    //     } catch (error) {
    //         console.log('UPDATE ERROR:', error)
    //         // TAIL UI CHANGES  
    //         setUpdateStatus('failed')
    //         setUpdateMessage('Appointment update failed.') 
    //     } finally {
    //         // if(clinic) await readAppointments(clinic, viewPrefs)
    //     }
    // }




    ////////////////////////////////////////////////////////////////////////////////////////////////
    //// REACT HOOKS !
    useEffect(() => {
        loadClinics() 
        loadPatientInfo()
    }, [])

    useEffect(() => {
        if (createStatus !== 'success') return

        const timer = setTimeout(() => {
            setShowCreateForm(false)
            setCreateStatus('idle')
            setCreateMessage('')
        }, 1200) // closes after 1.2 seconds
        if(clinicView){readAppointments(clinicView, viewPrefs)}
        return () => clearTimeout(timer)
    }, [createStatus])

    useEffect(() => { // Show Clinic Selector 
        if (!clinicView)  return  
        setShowClinicSelector(true)  
        setClinicReq(clinicView)
    }, [clinicView])

    useEffect(() => { // Load Practicianers depending on clinicReq 
        if (!clinicReq)  return 
        retrieveAppointmentTypes()
        retrievePracticioners(clinicReq) 
    }, [clinicReq])

    // RE-QUERY FETCH APPTs WHEN VIEW SETTINGS CHANGE 
    useEffect(() => { 
        if (!clinicView) return 
        readAppointments(clinicView, viewPrefs)
    }, [clinicView, viewPrefs])

    // Rerender components when these values are retrieved/updated 
    useEffect(() => {
        if (practicionerList.length > 0 && createForm.doctorId === '') {
            setCreateForm((f) => ({ ...f, doctorId: practicionerList[0].user_id }))
        }
    }, [practicionerList])

    useEffect(() => {
        if (appointmentTypes.length > 0) {
            setCreateForm((f) => ({
                ...f,
                type: f.type || appointmentTypes[0],
            }))
        }
    }, [appointmentTypes])



    return( <>
            <SidebarProvider defaultOpen>
            {/* Left sidebar */}
            <PatientSidebar/> 
                    
                <div className="pd-right">
                    <div className="info-box appointments-section">
                        <div className='flex justify-between'>
                        {/* SELECT CLINIC */}
                        <h1 className="info-box-title">
                            <select 
                                className='m-2 p-2 font-bold border-2 border-solid rounded-lg' 
                                onChange={(e) =>
                                setClinicView(() => (e.target.value))
                                }>
                                {clinicList.map((c) => (
                                <option key={c.clinic_id} value={c.clinic_id}>
                                        {c.clinic_name}
                                </option>))} 
                            </select>
                            Appointment Scheduling
                        </h1>

                        {/* FORM/MODALS */}
                        {/* CREATION FORM */}
                        <div className = "flex items-center">
                            <ApptCreateModal
                                showClinicSelector={showClinicSelector}
                                clinicList={clinicList} 
                                selectedClinic = {clinicReq || ''}
                                setSelectedClinic={setClinicReq}

                                showCreateForm={showCreateForm}
                                setShowCreateForm={setShowCreateForm}
                                createForm={createForm}
                                setCreateForm={setCreateForm}
                                createStatus={createStatus}
                                setCreateStatus={setCreateStatus}
                                createMessage={createMessage}
                                setCreateMessage={setCreateMessage}
                                openCreateForm={openCreateForm}
                                createAppointment={handleCreateAppointment} // createAppointment
                                nurse={false}
                                patientList={[]}
                                patientName={patientInfo?.full_name || 'Err Or'}
                                practicionerList={practicionerList}
                                appointmentTypes={appointmentTypes}
                            /> 
                        </div>
                    </div> 



                    {/* VIEW APPT DETAILS */}
                    <div className = "flex items-center">
                        <ApptDetailModal
                            AppointmentDetails = {selectApptDetails} 
                            // UPDATE : form for UI and submission | display it 
                            showApptDetails = {showApptDetails} 
                            setShowApptDetails = {setShowApptDetails} 
                             
                            nurse = {true} 
                        />
                    </div>
                        
                        
                        {(!clinicView || !viewPrefs) ? (<p>Loading clinic...</p>) 
                        : (<>
                            {/* VIEWING APPOINTMENTS */}
                            <AppointmentSwitch
                                appointments={appointmentsLoading ? [] : appointmentsList} // send a subset of appointments 
                                // functions to handle appointment CRUD actions 
                                onSelectAppointment={(apt) => openAppointmentDetails(apt)} 
                                onDeleteAppointment={emptyf}
                                onSelectSlot={openCreateForm}
                                // function to handle appointment view changes (changing query)
                                viewPrefs={viewPrefs}
                                totalPages = {totalPages}
                                onUpdateViewPrefs = {updateViewPrefs}
                                nurse={false}
                                /> 
                            </>)}
                    </div>
                </div>
            </SidebarProvider>
        </>
    );
} 















