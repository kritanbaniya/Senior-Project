import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase.ts' 
import AppointmentSwitch from '@/features/appointment/AppointmentSwitch.tsx'
import type { 
  CreateApptForm, 
  AppointmentViewPrefs, 
  Appointment, 
  UserClinicRelationship ,
  AppointmentType ,  
  UpdateApptForm
} from "@/features/appointment/types.ts"; 
import ApptCreateModal from '@/features/appointment/ApptCreateModal.tsx';
import ApptEditModal from '@/features/appointment/ApptEditModel.tsx';
import NurseSideBar from './NurseSideBar';  
import { 
    // UPDATE API THINGS 
    apiUpdateAppt, 
    apiFetchSpecificAppt
} from '@/features/appointment/appointment.api.ts';
// import AppointmentR
// import { Switch } from "radix-ui";
 import { apiCreateAppt } from '@/features/appointment/appointment.api.ts';
 


export default function NurseAppointmentManager() {
  var debuglog: boolean = true
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
      if(debuglog === true){
        console.log(appointmentTypes)
      }
  }
  
  // Retrieve clinic ID
  const [ showClinicSelector ] = useState<boolean>(false) // will not change.
  const [clinicList, setClinicList] = useState<UserClinicRelationship[]>([])
  const [clinic, setClinic] = useState<string>()
  const loadClinics = async () => { // set clinicList 
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
  const [practicionerList, setPracticionerList] = useState<UserClinicRelationship[]>([])
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
  const [patientList, setPatientList] = useState<UserClinicRelationship[]>([])
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
    // C: UI 
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false)
    const [createForm, setCreateForm] = useState<CreateApptForm>({ 
        appointmentId: '', 
        patientId: '',
        doctorId: '',
        date: '',
        time: '',
        type: '',
        appointment_status: '',
        nurse_note: '',
        patient_note: '' 
    }) 
    const [createStatus, setCreateStatus] = useState<AppointmentCreateStatus>('idle')
    const [createMessage, setCreateMessage] = useState('')
    //// C: CREATE NEW APPOINTMENT
    const createAppointment = async (clinicId: string) => {
        if(debuglog == true){console.log('CREATEFORM SUBMITTED', createForm)} 


        ////// SET UI 
        setCreateStatus('loading')
        setCreateMessage('')  
        
        ////// EXIT CASES 
        // exit if form is incomplete. 
        if (  !clinicId ||
            !createForm.patientId ||
            !createForm.date ||
            !createForm.time ||
            !createForm.doctorId ||
            !createForm.type) {
            setCreateStatus('failed')
            setCreateMessage('Appointment creation failed. Please complete all fields.')
            console.log('ERROR: APPOINTMENT CREATION FAILED')
            return
        }
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
            if(debuglog == true) console.log('CREATED:', created)
            // TAIL UI CHANGES  
            const patientName = patientList.find((p) => p.user_id === createForm.patientId)?.full_name ?? 'Unknown patient'
            const doctorName = practicionerList.find((d) => d.user_id === createForm.doctorId)?.full_name ?? 'Unknown provider' 
            setCreateStatus('success')
            setCreateMessage(`Appointment created for ${patientName} on ${createForm.date} at ${createForm.time} with ${doctorName}.`)
            // since appt list changed, re-call readAppt
            if(clinic) await readAppointments(clinic, viewPrefs)
        } catch (error) {
            console.log('ERROR CREATE:', error)
            // TAIL UI CHANGES  
            setCreateStatus('failed')
            setCreateMessage('Appointment creation failed.') 
        } finally {
            // if(clinic) await readAppointments(clinic, viewPrefs)
        } 
        // since appt list changed, re-call readAppt
        // await readAppointments(clinicId, viewPrefs)
    }
    /// pass these to children 
    // create an appointment 
    const handleCreateAppointment = async () => { // relies on clinic existing in nurseApptManager
        if (clinic){
        createAppointment(clinic)}
    }
    // open createForm and prefill information 
    const openCreateForm = (start: Date) => {
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

        setCreateForm((f: CreateApptForm) => ({     // prefill date and time  
            ...f,
            date: `${yyyy}-${mm}-${dd}`,
            time: `${hh}:${min}`,
        }))
        setShowAptUpdateForm(false)     // make sure updateForm is not open 
        setCreateStatus('idle')             // set UI status value 
        setCreateMessage('')                // set UI status message 
        setShowCreateForm(true)             // display create form 
    }






  /////////////////////////////////////////////////////
  //// R: READ APPOINTMENT  // VIEW PREFERENCES 
  const [totalPages, setTotalPage] = useState<number>(0)
  const [viewPrefs, setViewPrefs] = useState<AppointmentViewPrefs>({
    mode: 'calendar',
    page: 1, 
    rowsPerPage: 10, // user can edit the number of rows per page 
    sortRules: [ // by default, sort by date 
      { field: 'appointment_date', direction: 'asc' },
    ], 
    searchBy: 'upcoming',
    rangeStart: '',
    rangeEnd: '',
    showReqs: 'all', 
    showPast: false 
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

      if(debuglog === true){
        console.log("PREFERENCES:", viewPrefs)
      }
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
    let query = supabase
      .schema('public')
      .from('appointmentlist_display')
      .select('*', { count: prefs.mode === 'list' ? 'exact' : undefined })
      .eq('clinic_id', clinicId)

    

    //// BUILD QUERY 
    // show Req
    if (prefs.showReqs !== 'all') {
      query = query.eq('appointment_status', prefs.showReqs)
    } 


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
      if (prefs.showPast === false){ 
          query = query.gte('appointment_date', new Date().toISOString())
      } 
      
      // search by date range 
      if (prefs.searchBy === 'date range' &&
          prefs.rangeStart &&
          prefs.rangeEnd) {
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
    setAppointmentsLoading(false)
  }
 







    /////////////////////////////////////////////////////
    // U: UI 
    const [showAptUpdateForm, setShowAptUpdateForm] = useState(false)
    const [updateForm, setUpdateForm] = useState<UpdateApptForm>({
        appointmentId: '',
        patientId: '',
        doctorId: '',
        date: '',
        time: '',
        type: '',
        appointment_status: '',
        nurse_note: '',
        patient_note: '' 
    })
    const [updateStatus, setUpdateStatus] = useState<AppointmentCreateStatus>('idle')
    const [updateMessage, setUpdateMessage] = useState('')
    //// U: UPDATE EXISTING APPOINTMENT
    const updateAppointments = async () => { // relies on updateForm data 
        if(debuglog == true){console.log('UPDATEFORM SUBMITTED:', updateForm)}

        ////// SET UI 
        setUpdateStatus('loading')
        setUpdateMessage('')  
        
        ////// EXIT CASES 
        if (updateForm.appointmentId === null || updateForm.doctorId === null) return

        // UPDATE IT 
        try {
            const updated = await apiUpdateAppt(updateForm)
            if(debuglog == true) console.log('UPDATED:', updated)
            // TAIL UI CHANGES  
            const patientName = patientList.find((p) => p.user_id === updateForm.patientId)?.full_name ?? 'Unknown patient'
            const doctorName = practicionerList.find((d) => d.user_id === updateForm.doctorId)?.full_name ?? 'Unknown provider' 
            setUpdateStatus('success')
            setUpdateMessage(`Appointment created for ${patientName} on ${updateForm.date} at ${updateForm.time} with ${doctorName}.`)
            // since appt list changed, re-call readAppt
            if(clinic) await readAppointments(clinic, viewPrefs)
        } catch (error) {
            console.log('UPDATE ERROR:', error)
            // TAIL UI CHANGES  
            setUpdateStatus('failed')
            setUpdateMessage('Appointment update failed.') 
        } finally {
            // if(clinic) await readAppointments(clinic, viewPrefs)
        }
    } 
    // open createForm and prefill information 
    const openUpdateForm = async (apt: Appointment) => {
        try {
            const singleAppt = await apiFetchSpecificAppt(apt)
            if(debuglog == true) console.log("UPDATE FORM PREFILLED", singleAppt) 
            // transform datetime data 
            const d = new Date(singleAppt.appointment_date)
            const yyyy = d.getFullYear()
            const mm = String(d.getMonth() + 1).padStart(2, '0')
            const dd = String(d.getDate()).padStart(2, '0')
            const hh = String(d.getHours()).padStart(2, '0')
            const min = String(d.getMinutes()).padStart(2, '0')
            // UI CHANGES 
            setUpdateForm({
                appointmentId: singleAppt.Appointment_id,
                patientId: singleAppt.patient_id ?? '',
                doctorId: singleAppt.clinician_id ?? '',
                date: `${yyyy}-${mm}-${dd}`,
                time: `${hh}:${min}`,
                type: singleAppt.visit_type as AppointmentType ?? '',
                appointment_status: singleAppt.appointment_status,
                nurse_note: singleAppt.nurse_note,
                patient_note: singleAppt.patient_note
            }) 
            setShowAptUpdateForm(true)
        } catch (error) {
            console.log('READ SPECIFIC APPT:', error) 
        }  
    } 




  /////////////////////////////////////////////////////
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
    if (viewPrefs.searchBy === "date range") updateViewPrefs({showPast : true})
    if (debuglog === true) console.log("SHOW REQ", viewPrefs.showReqs)
    readAppointments(clinic, viewPrefs)
  }, [clinic, viewPrefs])


  // Rerender components when these values are retrieved/updated 
  useEffect(() => {
    if (patientList.length > 0 && createForm.patientId === '') {
      setCreateForm((f) => ({ ...f, patientId: patientList[0].user_id }))
    }
  }, [patientList])
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

      setUpdateForm((f) => ({
        ...f,
        type: f.type || appointmentTypes[0],
      }))
    }
  }, [appointmentTypes])
  






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
              <ApptCreateModal
                showClinicSelector = {showClinicSelector}
                clinicList = {clinicList} 
                selectedClinic = { clinic ? clinic : '' }
                setSelectedClinic={ setClinic } // should not be used 
                // CREATE : form for UI and submission | display it 
                showCreateForm = {showCreateForm} 
                setShowCreateForm = {setShowCreateForm}
                createForm = {createForm}
                setCreateForm = {setCreateForm}
                // CREATE : STATUS and MESSAGE 
                createStatus = {createStatus} 
                setCreateStatus = {setCreateStatus}
                createMessage = {createMessage} 
                setCreateMessage = {setCreateMessage}  

                openCreateForm = {openCreateForm} 
                createAppointment = {handleCreateAppointment} 

                nurse = {true}
                patientName = {undefined}
                patientList = {patientList} 
                practicionerList = {practicionerList}
                appointmentTypes = {appointmentTypes} 
              />
            </div> 
        </div> 


          {/* EDITTING FORM */}
          <div className = "flex items-center">
            <ApptEditModal
                showClinicSelector = {showClinicSelector} 
                // display and change selected clinic 
                clinicList = {clinicList} 
                selectedClinic = { clinic ? clinic : '' }
                setSelectedClinic={ setClinic } // should not be used 
                
                // UPDATE : form for UI and submission | display it 
                showAptUpdateForm = {showAptUpdateForm} 
                setShowAptUpdateForm = {setShowAptUpdateForm}
                updateForm = {updateForm}
                setUpdateForm = {setUpdateForm}
                
                // UPDATE : STATUS and MESSAGE 
                updateStatus = {updateStatus} 
                setUpdateStatus = {setUpdateStatus}
                updateMessage = {updateMessage} 
                setUpdateMessage = {setUpdateMessage} 

                openUpdateForm = {openUpdateForm} 
                updateAppointments = {updateAppointments} 

                nurse = {true}
                patientName = {undefined}
                patientList = {patientList} 
                practicionerList = {practicionerList}
                appointmentTypes = {appointmentTypes} 
            />
          </div>


          {/* VIEWING APPOINTMENTS */}
          {(!clinic || !viewPrefs) ? (<p>Loading clinic...</p>) : (<>
            <AppointmentSwitch 
              appointments={appointmentsLoading ? [] : appointmentsList} // send a subset of appointments
              // reqAppointmentsList={reqAppointmentsList? reqAppointmentsList : []}
              // functions to handle appointment CRUD actions 
              onSelectAppointment={openUpdateForm} 
              onDeleteAppointment={(apt) =>
                deleteAppointments(apt.Appointment_id, clinic)
              }
              onSelectSlot={openCreateForm}
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