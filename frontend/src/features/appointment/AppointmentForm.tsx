

import {  useEffect, useState } from 'react'
// import { supabase } from '../../../lib/supabase.ts' 
// import AppointmentSwitch from '@/features/appointment/AppointmentSwitch.tsx'
import type { clinicListInfoType, AppointmentFormType, MemberList ,AppointmentType } from "@/features/appointment/types.ts"; 
import { Button } from '@/components/ui/button';
// import ClinicSelector from "../queue/components/ClinicSelector";




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
    showClinicSelector : boolean,
    clinicList : clinicListInfoType[], 
    selectedClinic : string,
    setSelectedClinic : (s:string) => void, 

    showScheduleForm : boolean, 
    setShowScheduleForm : (a : boolean) => void, 

    scheduleForm : AppointmentFormType, 
    setScheduleForm: React.Dispatch<React.SetStateAction<AppointmentFormType>>,  

    createStatus : AppointmentCreateStatus,
    setCreateStatus : (s: AppointmentCreateStatus) => void,
    createMessage : string, 
    setCreateMessage : (m : string) => void, 

    handleNewAppointment : (start: Date) => void, 
    createAppointment : () => void, 

    nurse : boolean, 
    patientList : MemberList[], 
    patientName : string | undefined, 

    practicionerList : MemberList[], 
    appointmentTypes : AppointmentType[], 

}


export default function AppointmentForm({
    showClinicSelector,
    clinicList, 
    selectedClinic, 
    setSelectedClinic, 

    showScheduleForm, 
    setShowScheduleForm, 

    scheduleForm, 
    setScheduleForm, 

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
 

  
  const [ clinicNameById , setClinicNameById ] = useState<string>('')
  useEffect(() => {
    for(var i = 0; i < clinicList.length ; i ++ ){
      if (clinicList[i].clinic_id == selectedClinic){
        setClinicNameById(clinicList[i].clinic_name)
        break
      }
    }
  }, [selectedClinic])
  


  const handleClose = () => {
      setShowScheduleForm(false)
  }


    return(<>
        
        
          {/* CREATION / EDITING FORM */}
          <div className="info-box-content">   
            <Button
                type="button" 
                onClick={() => handleNewAppointment(new Date())}
              >
                Create appointment
              </Button>

            {/* FORMS */}
            {!showScheduleForm ? (
              <>
              </>
            ) : (
              <div className="form-overlay" onClick={handleClose}>
                <div className="form-modal" onClick={e => e.stopPropagation()}> 
                  {/* STATUS MESSAGE */}
                  {createStatus === 'idle' && (
                    <p className="small-label">Appointment Details</p>
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
                  
                  
                  {/* THE FORM */}
                  <form
                    className="portal-form"
                    onSubmit={(e) => {
                      e.preventDefault()
                      createAppointment()
                    }}> 
                    <div className="form-row">
                      <label>Patient name</label>
                        {nurse ? 
                        (<select
                        
                          value={scheduleForm.patientId}
                          onChange={(e) =>
                            setScheduleForm((f) => ({ ...f, patientId: e.target.value }))
                          }>
                          {(patientList.map((d) => (
                          <option key={d.user_id} value={d.user_id}>
                              {d.full_name}
                          </option>
                          )))}
                        </select>) : 
                        (
                          <p>{patientName}</p>  
                        )}
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
                      
                    
                    { showClinicSelector ? (
                    <div className="form-row">
                      <label>Clinic</label> 
                      <select 
                        value={selectedClinic}
                        onChange={(e) =>{
                          setSelectedClinic( e.target.value ) }
                        }
                      >
                        {clinicList.map((d) => (
                          <option key={d.clinic_id} value={d.clinic_id}>
                            {d.clinic_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    ) : (<>
                      <label>Clinic</label> 
                      {clinicNameById}
                      {}
                    </>)}


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
                </div>
              </div>
            )}
            
          </div>
        
        </>)
}




