

import { useEffect, useState } from 'react'
// import { supabase } from '../../../lib/supabase.ts' 
// import AppointmentSwitch from '@/features/appointment/AppointmentSwitch.tsx'
import type { Appointment, MemberList ,AppointmentType } from "@/features/appointment/types.ts"; 
 





// FOR THE FORMS (need to be refacs)
type AppointmentForm = {
  patientId: string
  date: string
  time: string
  doctorId: string
  type: AppointmentType | ''
}

// type UpdateAppointmentForm = {
//   appointmentId: string
//   patientId: string
//   date: string
//   time: string
//   doctorId: string
//   type: AppointmentType | ''
// }


type AppointmentCreateStatus = 'idle' | 'loading' | 'success' | 'failed'

type apptFormProp = {
    showScheduleForm : Boolean, 
    setShowScheduleForm : (a : boolean) => void, 


    createStatus : AppointmentCreateStatus,
    setCreateStatus : (s: AppointmentCreateStatus) => void,
    createMessage : string, 
    setCreateMessage : (m : string) => void, 

    handleNewAppointment : (start: Date) => void, 
    createAppointment : (apt: Appointment) => void, 

    nurse : boolean, 
    patientList : MemberList[], 
    patientName : MemberList | undefined, 

    practicionerList : MemberList[], 
    appointmentTypes : AppointmentType[], 

}


export default function AppointmentForm({
    showScheduleForm, 
    setShowScheduleForm, 

    createStatus,
    setCreateStatus,
    createMessage ,
    setCreateMessage,

    handleNewAppointment,
    createAppointment,

    nurse,
    patientList,
    patientName,

    practicionerList,
    appointmentTypes,
}:apptFormProp){

    var patientNamet : string = "dave"
    useEffect(()=>{
        if (nurse == false) {
            // patientName : MemberList 
            // patientName = "dave"
        }

    }, []) 


    const [scheduleForm, setScheduleForm] = useState<AppointmentForm>({
        patientId: '',
        date: '',
        time: '',
        doctorId: '',
        type: '',
    })





    return(<>
        
        
          {/* CREATION / EDITING FORM */}
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
                onClick={() => handleNewAppointment}
              >
                Create appointment
              </button>
            ) : (
              <form
                className="portal-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  createAppointment
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
                    {nurse ? 
                        (patientList.map((d) => (
                        <option key={d.user_id} value={d.user_id}>
                            {d.full_name}
                        </option>
                        ))):(
                            <label>{patientNamet}</label> // .full_name
                        )}
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
            {/* {showAptUpdateForm ? (
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
            )} */}
          </div>
        
        </>)
}




