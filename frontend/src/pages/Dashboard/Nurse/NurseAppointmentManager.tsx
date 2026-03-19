import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase.ts' 
import type { Appointment, MemberList } from '../../../features/appointment/types.ts'
import AppointmentSwitch from '@/features/appointment/AppointmentSwitch.tsx'

type AppointmentType =
  | 'General Check-up'
  | 'Follow-up'
  | 'Consultation'
  | 'Vaccination'
  | 'Lab Work'

type AppointmentCreateStatus = 'idle' | 'loading' | 'success' | 'failed'

type AppointmentForm = {
  patientId: string
  date: string
  time: string
  doctorId: string
  type: AppointmentType | ''
}

type UpdateAppointmentForm = {
  appointmentId: string
  patientId: string
  date: string
  time: string
  doctorId: string
  type: AppointmentType | ''
}

const debuglog: boolean = false

export default function NurseAppointmentManager() {
  

  ////////////////////////////////////////////////////////////////////////////////////////////////
  //// COMPONENT RENDER VARIABLES - decides if a part of the page gets mounted
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showAptUpdateForm, setShowAptUpdateForm] = useState(false)

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
  }
  
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

  // Get Time Helper // used in a commented piece of code. 
  function getNowForDateTimeInput() {
    const now = new Date()
    now.setSeconds(0, 0)

    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')

    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
      combined: `${yyyy}-${mm}-${dd} ${hh}:${min}:00`,
    }
  }

  


  
  ////////////////////////////////////////////////////////////////////////////////////////////////
  ///// C R U D !!! 
  const [scheduleForm, setScheduleForm] = useState<AppointmentForm>({
    patientId: '',
    date: '',
    time: '',
    doctorId: '',
    type: '',
  })

  // check for when supabase recieves information
  // const [appointmentResponse, setAppointmentResponse] = useState<Response>('Loading')
  const [createStatus, setCreateStatus] = useState<AppointmentCreateStatus>('idle')
  const [createMessage, setCreateMessage] = useState('')


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

    await readAppointments(clinicId)
  }
  // function passed to appointment components 
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

  const readAppointments = async (clinicId: string) => {
    const { data, error } = await supabase
      .schema('public')
      .from('appointmentlist_display2')
      .select('*')
      .eq('clinic_id', clinicId)

    if(debuglog == true){
    console.log('APPOINTMENT DATA:', data)}

    if (error) {
      setAppointmentsList([])
      return
    }

    setAppointmentsList(data ?? [])
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
    await readAppointments(clinicId)
  }

  ////////////////////////////////////////////////
  //// REACT HOOKS !
  useEffect(() => {
    loadClinic()
    retrieveAppointmentTypes()
  }, [])

  // only load data when the clinic information is retrieved 
  useEffect(() => {
    if (!clinic) return

    readAppointments(clinic)
    retrievePracticioners(clinic)
    retrievePatients(clinic)
  }, [clinic])

  // Rerender components when these change 
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


  return (
    <>
      <div className="info-box appointments-section">
        <h2 className="info-box-title">Appointment scheduling</h2>

        {!clinic ? (
        <p>Loading clinic...</p>
      ) : (<>
        <AppointmentSwitch
          appointments={appointmentsList}
          onSelectAppointment={handleEditAppointment}
          onDeleteAppointment={(apt) =>
            deleteAppointments(apt.Appointment_id, clinic)
          }
          onSelectSlot={handleNewAppointment}
        />
      

        <div className="info-box-content"> 
          {/* STATUS MESSAGE */}
          {createStatus === 'idle' && (
            <p className="small-label">View, create, and modify appointments.</p>
          )}
          {createStatus === 'loading' && (
            <p className="small-label">Creating appointment...</p>
          )}
          {createStatus === 'success' && (
            <p className="success-message" style={{color: 'green' }}>{createMessage}</p>
          )}
          {createStatus === 'failed' && (
            <p className="error-message" style={{color: 'red' }}>{createMessage}</p>
          )}



          {/* FORMS */}
          {!showScheduleForm ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleNewAppointment(new Date())}
            >
              Create appointment
            </button>
          ) : (
            <form
              className="portal-form"
              onSubmit={(e) => {
                e.preventDefault()
                createAppointment(clinic)
              }}
            >
              <div className="form-row">
                <label>Patient name</label>
                <select
                  value={scheduleForm.patientId}
                  onChange={(e) =>
                    setScheduleForm((f) => ({ ...f, patientId: e.target.value }))
                  }
                >
                  {patientList.map((d) => (
                    <option key={d.user_id} value={d.user_id}>
                      {d.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Date</label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  //min={getNowForDateTimeInput().date} redundant, and mismatching style. but may still be useful
                  onChange={(e) => setScheduleForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <label>Time</label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, time: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <label>Provider</label>
                <select
                  value={scheduleForm.doctorId}
                  onChange={(e) =>
                    setScheduleForm((f) => ({ ...f, doctorId: e.target.value }))
                  }
                >
                  {practicionerList.map((d) => (
                    <option key={d.user_id} value={d.user_id}>
                      {d.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Visit type</label>
                <select
                  name="type"
                  value={scheduleForm.type}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, type: e.target.value as AppointmentType, }))}
                >
                  {appointmentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Create
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowScheduleForm(false)
                    setCreateStatus('idle')
                    setCreateMessage('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {showAptUpdateForm ? (
            <form
              className="portal-form"
              onSubmit={(e) => {
                e.preventDefault()
                updateAppointments()
              }}
            >
              <div className="form-row">
                <label>Patient name</label>
                <select
                  value={updateForm.patientId}
                  onChange={(e) =>
                    setUpdateForm((f) => ({ ...f, patientId: e.target.value }))
                  }
                >
                  {patientList.map((d) => (
                    <option key={d.user_id} value={d.user_id}>
                      {d.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Date</label>
                <input
                  type="date"
                  value={updateForm.date}
                  onChange={(e) => setUpdateForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <label>Time</label>
                <input
                  type="time"
                  value={updateForm.time}
                  onChange={(e) => setUpdateForm((f) => ({ ...f, time: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <label>Provider</label>
                <select
                  value={updateForm.doctorId}
                  onChange={(e) =>
                    setUpdateForm((f) => ({ ...f, doctorId: e.target.value }))
                  }
                >
                  {practicionerList.map((d) => (
                    <option key={d.user_id} value={d.user_id}>
                      {d.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Visit type</label>
                <select
                  value={updateForm.type}
                  onChange={(e) => setUpdateForm((f) => ({ ...f, type: e.target.value as AppointmentType, }))}
                >
                  {appointmentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Save changes
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAptUpdateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <></>
          )}


        </div>
        </>)}


      </div>
    </>
  )
}