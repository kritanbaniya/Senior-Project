import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import AppointmentCalendar from '../../AppointmentCalendar.tsx'
import type { Appointment, MemberList } from '../../types.ts'

//// TO BE REMOVED AFTER SUPABASE IMPLEMENTATION IS COMPLETE
// NEED SUPABASE ENUM
const MOCK_APPOINTMENT_TYPES = [
  'General Check-up',
  'Follow-up',
  'Consultation',
  'Vaccination',
  'Lab Work',
]
/*

enums and stuff implemented in supabase already.
create type AppointmentTypes as enum ('General Check-up', 'Follow-up', 'Consultation', 'Vaccination', 'Lab Work');
create type AppointmentStatus as enum ( 'scheduled', 'completed' , 'cancelled' );

*/

type Response = 'Failed' | 'Success' | 'Loading'

export default function NurseAppointmentManager() {
  ////////////////////////////////////////////////////////////////////////////////////////////////
  //// COMPONENT RENDER VARIABLES - decides if a part of the page gets mounted
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showAptUpdateForm, setShowAptUpdateForm] = useState(false)

  ////////////////////////////////////////////////////////////////////////////////////////////////
  //// HELPER FUNCTIONS:
  // Retrieve list of doctors in this clinic
  const [clinicThis, setClinicThis] = useState<string>()
  const [doctorList, setDoctorList] = useState<MemberList[]>([])

  const thisNursesClinic = async () => {
    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData.user) {
      console.log('AUTH ERROR:', authErr)
      return null
    }
    const userId = authData.user.id

    const { data, error } = await supabase
      .schema('public')
      .from('Memberships')
      .select('clinic_id')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      console.log('CLINIC ERROR:', error)
      return null
    }

    setClinicThis(data.clinic_id)
    return data.clinic_id
  }

  const retrievePracticioners = async () => {
    const { data, error } = await supabase
      .schema('public')
      .from('membernamerole')
      .select('*')
      .eq('clinic_id', await thisNursesClinic())
      .eq('role', 'doctor')

    if (error) {
      console.log('DOCTORS ERROR:', error)
      return
    }

    setDoctorList(data ?? [])
  }

  const [patientList, setPatientList] = useState<MemberList[]>([])

  const retrievePatients = async () => {
    const { data, error } = await supabase
      .schema('public')
      .from('membernamerole')
      .select('*')
      .eq('clinic_id', await thisNursesClinic())
      .eq('role', 'patient')

    if (error) {
      console.log('PATIENTS ERROR:', error)
      return
    }

    setPatientList(data ?? [])
  }

  // Select after doing the supabase insert, and using that to confirm submission.
  // which can render a "completed!" thing

  ////////////////////////////////////////////////
  ///// C R U D !!!
  // I GOT SPIDERS CRAWLING DOWN MY SPINE,
  // one thousand fourty bugs to pay the fine-
  // pass data from ui form to function
  const [scheduleForm, setScheduleForm] = useState({
    patientId: '',
    date: '',
    time: '',
    doctorId: '',
    type: MOCK_APPOINTMENT_TYPES[0],
  })

  // check for when supabase recieves information
  const [appointmentResponse, setAppointmentResponse] = useState<Response>('Loading')

  //// C: CREATE NEW APPOINTMENT
  const createAppointment = async () => {
    setAppointmentResponse('Loading')
    console.log(appointmentResponse)
    console.log('FORMSUBMITTED', scheduleForm)

    if (scheduleForm.patientId != null && scheduleForm.doctorId != null) {
      const appointmentDate = `${scheduleForm.date} ${scheduleForm.time}:00`

      const { data, error } = await supabase
        .schema('public')
        .from('Appointments')
        .insert([
          {
            appointment_date: appointmentDate,
            patient_id: scheduleForm.patientId,
            clinic_id: clinicThis,
            clinician_id: scheduleForm.doctorId,
            created_at: '2026-03-20 14:32:00',
            checkin_at: null,
            seen_at: null,
            visit_type: scheduleForm.type,
          },
        ])
        .select('*')
        .single()

      console.log(data)

      if (error) {
        setAppointmentResponse('Failed')
        console.log('ERROR CREATE:', error)
        return
      }

      setAppointmentResponse('Success')
      console.log(appointmentResponse)

      await readAppointments()
    } else {
      setAppointmentResponse('Failed')
      console.log('ERROR: APPOINTMENT CREATION FAILED')
    }
  }

  const handleNewAppointment = (start: Date) => {
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

    setShowAptUpdateForm(false)
    setShowScheduleForm(true)
  }

  //// R: READ APPOINTMENT
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([])

  const readAppointments = async () => {
    const { data, error } = await supabase
      .schema('public')
      .from('appointmentlist_display2')
      .select('*')
      .eq('clinic_id', await thisNursesClinic())

    console.log('APPOINTMENT DATA:', data)

    if (error) {
      setAppointmentsList([])
      return
    }

    setAppointmentsList(data ?? [])
  }

  //// U: UPDATE APPOINTMENT
  const [updateForm, setUpdateForm] = useState({
    appointmentId: '',
    patientId: '',
    date: '',
    time: '',
    doctorId: '',
    type: MOCK_APPOINTMENT_TYPES[0],
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

    console.log(data)

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
      type: data.visit_type ?? MOCK_APPOINTMENT_TYPES[0],
    })

    setShowAptUpdateForm(true)
  }

  const updateAppointments = async () => {
    console.log('UPDATEFORM SUBMITTED:', updateForm)

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

      console.log('UPDATE DATA:', data)
      console.log('UPDATE ERROR:', error)

      if (error) {
        return
      }
    }
  }

  //// D: DELETE APPOINTMENT
  const deleteAppointments = async (aptid: string) => {
    const { data, error } = await supabase
      .schema('public')
      .from('Appointments')
      .delete()
      .eq('Appointment_id', aptid)

    console.log('DELETE DATA:', data)
    console.log('DELETE ERROR:', error)

    if (error) {
      return
    }

    await readAppointments()
  }

  ////////////////////////////////////////////////
  //// REACT HOOKS !
  useEffect(() => {
    readAppointments()
    retrievePracticioners()
    retrievePatients()

    return
  }, [])

  useEffect(() => {
    if (patientList.length > 0 && scheduleForm.patientId === '') {
      setScheduleForm((f) => ({ ...f, patientId: patientList[0].user_id }))
    }
  }, [patientList])

  useEffect(() => {
    if (doctorList.length > 0 && scheduleForm.doctorId === '') {
      setScheduleForm((f) => ({ ...f, doctorId: doctorList[0].user_id }))
    }
  }, [doctorList])

  return (
    <>
      <div className="info-box appointments-section">
        <h2 className="info-box-title">Appointment scheduling</h2>

        <AppointmentCalendar
          appointments={appointmentsList}
          onSelectAppointment={handleEditAppointment}
          onSelectSlot={handleNewAppointment}
        />

        <div className="info-box-content">
          <p>View, create, and modify appointments.</p>

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
                createAppointment()
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
                  {doctorList.map((d) => (
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
                  onChange={(e) => setScheduleForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {MOCK_APPOINTMENT_TYPES.map((t) => (
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
                  onClick={() => setShowScheduleForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="nurse-appointment-list">
            <p className="small-label">Appointments (today & upcoming)</p>
            <ul className="appointment-list">
              {appointmentsList.map((apt) => (
                <li key={apt.Appointment_id} className="appointment-item nurse-apt-item">
                  <span className="apt-date">{apt.appointment_date}</span>
                  <span className="apt-doctor">{apt.clinician_name}</span>
                  <span className="apt-type">{apt.visit_type}</span>
                  <span className="apt-patient">{apt.patient_name}</span>
                  <button
                    type="button"
                    className="btn-small"
                    onClick={() => handleEditAppointment(apt)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-small"
                    onClick={() => deleteAppointments(apt.Appointment_id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>

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
                  {doctorList.map((d) => (
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
                  onChange={(e) => setUpdateForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {MOCK_APPOINTMENT_TYPES.map((t) => (
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
      </div>
    </>
  )
}