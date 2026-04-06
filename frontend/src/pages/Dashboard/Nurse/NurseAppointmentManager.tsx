import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase.ts' 
import AppointmentSwitch from '@/features/appointment/AppointmentSwitch.tsx'
import type { 
  AppointmentFormType, 
  AppointmentViewPrefs, 
  Appointment, 
  MemberList ,
  AppointmentType , 
  clinicListInfoType, 
  reqAppointmentTypes
} from "@/features/appointment/types.ts"; 
import AppointmentForm from '@/features/appointment/AppointmentForm.tsx';
import NurseSideBar from './NurseSideBar';  
// import AppointmentR
// import { Switch } from "radix-ui";
 
 


export default function NurseAppointmentManager() {
  var debuglog: boolean = true
  type AppointmentCreateStatus = 'idle' | 'loading' | 'success' | 'failed'

  type UpdateAppointmentForm = {
    appointmentId: string
    patientId: string
    date: string
    time: string
    doctorId: string
    type: AppointmentType | ''
  }

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
    showReqs: 'Both', 
    showPast: false 
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

      if(debuglog === true){
        console.log("PREFERENCES:", viewPrefs)
      }
      return next
    })
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////
  //// COMPONENT RENDER VARIABLES - decides if a part of the page gets mounted
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showAptUpdateForm, setShowAptUpdateForm] = useState(false)
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
  const [ showClinicSelector ] = useState<boolean>(false) // will not change.
  const [clinicList, setClinicList] = useState<clinicListInfoType[]>([])
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
    if (debuglog == true){ console.log(data) }

    setClinicList(data) 
    setClinic(data[0].clinic_id) 
  }

  // Retrieve list of practicioner in this clinic
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

  // Retrieve Patients in this clinic
  const [patientList, setPatientList] = useState<MemberList[]>([])
  const retrievePatients = async (clinicId: string) => {
    const { data, error } = await supabase
      .schema('public')
      .from('membernamerole')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('role', 'patient')

    if (error) {
      console.log('PATIENTS ERROR:', error)
      return
    }

    setPatientList(data ?? [])
  }



  


  
  ////////////////////////////////////////////////////////////////////////////////////////////////
  ///// C R U D !!! 
  const [scheduleForm, setScheduleForm] = useState<AppointmentFormType>({
    patientId: '',
    date: '',
    time: '',
    doctorId: '',
    type: '',
  })
 
  //// C: CREATE NEW APPOINTMENT
  const createAppointment = async (clinicId: string) => {
    setCreateStatus('loading')
    setCreateMessage('')  
    if(debuglog == true){console.log('FORMSUBMITTED', scheduleForm)}
    
    // exit if form is incomplete. 
    if (  !clinicId ||
          !scheduleForm.patientId ||
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
      .from('Appointments')
      .insert([
        {
          appointment_date: appointmentDate,
          patient_id: scheduleForm.patientId,
          clinic_id: clinicId,
          clinician_id: scheduleForm.doctorId,
          checkin_at: null,
          seen_at: null,
          visit_type: scheduleForm.type,
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

    const patientName =
    patientList.find((p) => p.user_id === scheduleForm.patientId)?.full_name ?? 'Unknown patient'
    const doctorName =
      practicionerList.find((d) => d.user_id === scheduleForm.doctorId)?.full_name ??
      'Unknown provider'
    setCreateStatus('success')
    setCreateMessage(
      `Appointment created for ${patientName} on ${scheduleForm.date} at ${scheduleForm.time} with ${doctorName}.`
    )

    await readAppointments(clinicId, viewPrefs)
  }
  /// pass these to children 
  // create am appointment 
  const handleCreateAppointment = async () => {
    if (clinic){
    createAppointment(clinic)}
  }
  // get ready to create an appointment 
  const handleNewAppointment = (start: Date) => {
    const now = new Date()
    if (start < now) {
      setCreateStatus('failed')
      setCreateMessage('Cannot create an appointment in the past.')
      return
    }

    const yyyy = start.getFullYear()
    const mm = String(start.getMonth() + 1).padStart(2, '0')
    const dd = String(start.getDate()).padStart(2, '0')
    const hh = String(start.getHours()).padStart(2, '0')
    const min = String(start.getMinutes()).padStart(2, '0')

    setScheduleForm((f) => ({
      ...f,
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
    }))

    setCreateStatus('idle')
    setCreateMessage('')
    setShowAptUpdateForm(false)
    setShowScheduleForm(true)
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

    if (prefs.showPast === false){ // prefs.dateMode === 'upcoming') {
        query = query.gte('appointment_date', new Date().toISOString())
    } else if (prefs.showPast === true) { // prefs.dateMode === 'past' || 
        //query = query.lt('appointment_date', new Date().toISOString())
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


  // const [ viewAptReq , setViewAptReq ] = useState<boolean>(false)
  const [reqAppointmentsList, setReqAppointmentsList] = useState<reqAppointmentTypes[]>([])
  const readRequestedAppointments = async (
      clinicId: string,            // retrieve this clinic ID 
      prefs: AppointmentViewPrefs  // query based on these preferences 
  ) => {
      setAppointmentsLoading(true)
      
      //   CREATE initial QUERY & ADD RULES 
      let query = supabase
          .schema('public')
          .from('appointmentreq_display')
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
              setReqAppointmentsList([])
              setAppointmentsLoading(false)
              return
          }
          setReqAppointmentsList(data ?? [])
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



  //// U: UPDATE APPOINTMENT
  const [updateForm, setUpdateForm] = useState<UpdateAppointmentForm>({
    appointmentId: '',
    patientId: '',
    date: '',
    time: '',
    doctorId: '',
    type: '',
  })
  const handleEditAppointment = async (apt: Appointment) => {
    const { data, error } = await supabase
      .schema('public')
      .from('Appointments')
      .select('*')
      .eq('Appointment_id', apt.Appointment_id)
      .single()

    if (error || !data) {
      return
    }

    if(debuglog == true){
    console.log(data)}

    const d = new Date(data.appointment_date)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')

    setUpdateForm({
      appointmentId: data.Appointment_id,
      patientId: data.patient_id ?? '',
      doctorId: data.clinician_id ?? '',
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
      type: data.visit_type ?? appointmentTypes[0],
    })

    setShowAptUpdateForm(true)
  }
  const updateAppointments = async () => {
    if(debuglog == true){console.log('UPDATEFORM SUBMITTED:', updateForm)}

    if (updateForm.appointmentId != null && updateForm.doctorId != null) {
      const appointmentDate = `${updateForm.date} ${updateForm.time}:00`

      const { data, error } = await supabase
        .schema('public')
        .from('Appointments')
        .update({
          appointment_date: appointmentDate,
          patient_id: updateForm.patientId,
          clinician_id: updateForm.doctorId,
          visit_type: updateForm.type,
        })
        .eq('Appointment_id', updateForm.appointmentId)
        .select()
        .single()

      
      if(debuglog == true){console.log('UPDATE DATA:', data)}
      if (error) {console.log('UPDATE ERROR:', error)
        return
      }
    }
  }

  //// D: DELETE APPOINTMENT
  const deleteAppointments = async (aptid: string, clinicId: string) => {
    const { data, error } = await supabase
      .schema('public')
      .from('Appointments')
      .delete()
      .eq('Appointment_id', aptid)


    if(debuglog == true){console.log('DELETE DATA:', data)}
    if (error) {
      console.log('DELETE ERROR:', error)
      return
    }
    await readAppointments(clinicId, viewPrefs)
  }





  ////////////////////////////////////////////////////////////////////////////////////////////////
  //// REACT HOOKS !
  useEffect(() => {
    loadClinics()
  }, [])


  // only load patient and doctor data when the clinic information is retrieved 
  useEffect(() => {
    if (!clinic) return 
    retrieveAppointmentTypes()    // may depend on clinics in the future 
    retrievePracticioners(clinic) // depend on clinics
    retrievePatients(clinic)      // depend on clinics 
    if(viewPrefs){setViewPrefs((prev) => ({...prev, page: 1}))}
  }, [clinic])

  // load the subset of appointments when we have the clinic 
  //    OR when the viewPreferences are updated 
  useEffect(() => {
    if (!clinic) return
    // readAppointments(clinic, viewPrefs)
    // readRequestedAppointments(clinic, viewPrefs)
    if (debuglog === true) console.log("SHOW REQ", viewPrefs.showReqs)
    if (viewPrefs.showReqs === 'Both'){
      if (debuglog === true) console.log("BOTH")
      readAppointments(clinic, viewPrefs)
      readRequestedAppointments(clinic, viewPrefs)}
    else if (viewPrefs.showReqs === 'Requests'){
      if (debuglog === true) console.log("Requests")
      readRequestedAppointments(clinic, viewPrefs)}
    else if (viewPrefs.showReqs === 'Hide'){
      if (debuglog === true) console.log("Hide")
      readAppointments(clinic, viewPrefs)}
  }, [clinic, viewPrefs, viewPrefs.showReqs])


  // Rerender components when these values are retrieved/updated 
  useEffect(() => {
    if (patientList.length > 0 && scheduleForm.patientId === '') {
      setScheduleForm((f) => ({ ...f, patientId: patientList[0].user_id }))
    }
  }, [patientList])
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

      setUpdateForm((f) => ({
        ...f,
        type: f.type || appointmentTypes[0],
      }))
    }
  }, [appointmentTypes])
  
  useEffect (() => {
    if (debuglog === true) {
      console.log("REQJUESTS", reqAppointmentsList)
    }
  }, [reqAppointmentsList, clinic])














  return ( <> 
    <div className="pd-layout">
      {/* Left sidebar */}
      <NurseSideBar/> 

      <div className="pd-right">
        <div className="info-box appointments-section">
          <div className='flex justify-between'>
            {/* SELECT CLINIC */}
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

            {/* FORM/MODALS */}
            {/* CREATION FORM */}
            <div className = "flex items-center">
              <AppointmentForm
                showClinicSelector = {showClinicSelector}
                clinicList = {clinicList} 
                selectedClinic = { clinic ? clinic : '' }
                setSelectedClinic={ setClinic } // should not be used 
                
                showScheduleForm = {showScheduleForm} 
                setShowScheduleForm = {setShowScheduleForm}
                scheduleForm = {scheduleForm}
                setScheduleForm = {setScheduleForm}
                createStatus = {createStatus} 
                setCreateStatus = {setCreateStatus}
                createMessage = {createMessage} 
                setCreateMessage = {setCreateMessage} 
                handleNewAppointment = {handleNewAppointment} 
                createAppointment = {handleCreateAppointment} 
                nurse = {true}
                patientName = {undefined}
                patientList = {patientList} 
                practicionerList = {practicionerList}
                appointmentTypes = {appointmentTypes} 
              />
            </div>

            {/* EDITTING FORM */}
            {/* place component here */}
          </div> 




          {/* VIEWING APPOINTMENTS */}
          {(!clinic || !viewPrefs) ? (<p>Loading clinic...</p>) : (<>
            <AppointmentSwitch 
              appointments={appointmentsLoading ? [] : appointmentsList} // send a subset of appointments
              reqAppointments={appointmentsLoading ? [] : reqAppointmentsList} 
              // reqAppointmentsList={reqAppointmentsList? reqAppointmentsList : []}
              // functions to handle appointment CRUD actions 
              onSelectAppointment={handleEditAppointment} 
              onDeleteAppointment={(apt) =>
                deleteAppointments(apt.Appointment_id, clinic)
              }
              onSelectSlot={handleNewAppointment}
              // function to handle appointment view changes (changing query)
              viewPrefs={viewPrefs}
              totalPages = {totalPages}
              onUpdateViewPrefs = {updateViewPrefs}
            />
          </>)}


        </div>
      </div>
    </div>
  </> )
}