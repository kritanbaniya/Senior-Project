

import {  useEffect, useState } from 'react'
// import { supabase } from '../../../lib/supabase.ts' 
// import AppointmentSwitch from '@/features/appointment/AppointmentSwitch.tsx'
import type { 
    UpdateApptForm, 
    UserClinicRelationship, 
    AppointmentType , 
    Appointment
} from "@/features/appointment/types.ts"; 
import { Button } from '@/components/ui/button';
// import ClinicSelector from "../queue/components/ClinicSelector";


 


type AppointmentCreateStatus = 'idle' | 'loading' | 'success' | 'failed'

type updateFormProp = {
    showClinicSelector : boolean,
    // display and change selected clinic 
    clinicList : UserClinicRelationship[], 
    selectedClinic : string,
    setSelectedClinic : (s:string) => void, 
    
    // UPDATE : form for UI and submission | display it 
    showAptUpdateForm : boolean, 
    setShowAptUpdateForm : (a : boolean) => void, 
    // the form itself 
    updateForm : UpdateApptForm, 
    setUpdateForm: React.Dispatch<React.SetStateAction<UpdateApptForm>>,  

    // UPDATE : STATUS and MESSAGE 
    updateStatus : AppointmentCreateStatus,
    setUpdateStatus : (s: AppointmentCreateStatus) => void,
    updateMessage : string, 
    setUpdateMessage : (m : string) => void, 
    
    // UPDATE callback functions 
    openUpdateForm : (apt: Appointment) => void, 
    updateAppointments : () => void, 

    nurse : boolean, 
    patientList : UserClinicRelationship[], 
    patientName : string | undefined, 
    practicionerList : UserClinicRelationship[], 
    appointmentTypes : AppointmentType[], 

}


export default function AppointmentEditModal({
    showClinicSelector, 
    // clinic sauce 
    clinicList, 
    selectedClinic, 
    setSelectedClinic,  

    // UPDATE : form for UI and submission | display it 
    showAptUpdateForm, 
    setShowAptUpdateForm,  
    updateForm, 
    setUpdateForm, 

    // UPDATE : STATUS and MESSAGE 
    updateStatus,
    setUpdateStatus,
    updateMessage ,
    setUpdateMessage, 

    // openUpdateForm, dont need to open it from in here 
    updateAppointments,

    nurse,
    patientList,
    patientName,
    practicionerList,
    appointmentTypes,
    
}:updateFormProp){
 

    const apptStatusTypes : any[] = [ 
        'pending',  // patient needs to make changes 
        'unseen',   // nurse/clinic has not seen it 
        'canceled', // appointment was canceled 
        'deserted',  // patient did not show up 
        'active',   // active = APPOINTMENTS 
        'completed' // Appointment successfully closed 
    ] // [ 'Both', 'Requests', 'Hide'] 
  
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
        // setUpdateForm((f) => ({}))
        setShowAptUpdateForm(false)
    }


    return(<>
        
        
          {/* CREATION / EDITING FORM */}
          <div className="info-box-content">    
            {/* FORMS */}
            {!showAptUpdateForm ? (
              <>
              </>
            ) : (
              <div className="form-overlay" onClick={handleClose}>
                <div className="form-modal" onClick={e => e.stopPropagation()}> 
                  {/* STATUS MESSAGE */}
                  {updateStatus === 'idle' && (
                    <p className="small-label font-bold">Edit Appointment Details</p>
                  )}
                  {updateStatus === 'loading' && (
                    <p className="small-label">Creating appointment...</p>
                  )}
                  {updateStatus === 'success' && (
                    <p className="success-message" style={{color: 'green' }}>{updateMessage}</p>
                  )}
                  {updateStatus === 'failed' && (
                    <p className="error-message" style={{color: 'red' }}>{updateMessage}</p>
                  )}
                  
                  
                  {/* THE FORM */}
                  <form className="portal-form"
                        onSubmit={(e) => {
                        e.preventDefault()
                        updateAppointments()
                        }}> 

                    {/* PATIENT SELECT */}
                    <div className="flex justify-between">
                      <label 
                        className='p-3 w-40 '
                            >Patient name</label>
                        {nurse ? 
                        (<select
                            className='p-3 w-full bg-[#F5F3EE] rounded-lg border border-solid text-end'
                            value={updateForm.patientId}
                            onChange={(e) =>
                                setUpdateForm((f) => ({ ...f, patientId: e.target.value }))
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


                    {/* DATE SET */}
                    <div className="flex justify-between">
                      <label
                        className='p-3 w-40 '
                            >Date</label>
                      <input
                        className='p-3 w-40 bg-[#F5F3EE] rounded-lg border border-solid text-end'
                        type="date"
                        value={updateForm.date}
                        //min={getNowForDateTimeInput().date} redundant, and mismatching style. but may still be useful
                        onChange={(e) => setUpdateForm((f) => ({ ...f, date: e.target.value }))}
                        required
                      />
                    </div>


                    {/* TIME SET */}
                    <div  className="flex justify-between">
                      <label
                        className='p-3 w-40 '
                            >Time</label>
                      <input
                        className='p-3 w-40 bg-[#F5F3EE] rounded-lg border border-solid text-end'
                        type="time"
                        value={updateForm.time}
                        onChange={(e) => setUpdateForm((f) => ({ ...f, time: e.target.value }))}
                        required
                      />
                    </div>


                    {/* PROVIDER SELECT */}
                    <div  className="flex justify-between">
                      <label
                        className='p-3 w-30 '
                            >Provider</label>
                      <select
                        className='p-3 w-full bg-[#F5F3EE] rounded-lg border border-solid text-end'
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


                    {/* VISIT TYPE */}
                    <div  className="flex justify-between">
                      <label
                        className='p-3 w-40 '
                            >Visit type</label>
                      <select
                        className='p-3 w-70 bg-[#F5F3EE] rounded-lg border border-solid text-end'
                        name="type"
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


                    {/* APPT STATUS */}
                    <div  className="flex justify-between">
                      <label
                        className='p-3 w-70 '
                            >Appointment Status</label>
                      <select
                        className='p-3 w-50 bg-[#F5F3EE] rounded-lg border border-solid text-end'
                        name="type"
                        value={updateForm.appointment_status}
                        onChange={(e) => setUpdateForm((f) => ({ ...f, appointment_status: e.target.value as AppointmentType, }))}
                      >
                        {apptStatusTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>


                    {/* Patient Note */}
                    <div  className="flex justify-between">
                      <label
                        className='p-3 w-70 '
                            >Appointment Status</label>
                      <select
                        className='p-3 w-50 bg-[#F5F3EE] rounded-lg border border-solid text-end'
                        name="type"
                        value={updateForm.appointment_status}
                        onChange={(e) => setUpdateForm((f) => ({ ...f, appointment_status: e.target.value as AppointmentType, }))}
                      >
                        {apptStatusTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>


                    {/* Nurse Note */} 
                    <div  className="flex justify-between">
                      <label
                        className='p-3 w-70 '
                            >Appointment Status</label>
                      <select
                        className='p-3 w-50 bg-[#F5F3EE] rounded-lg border border-solid text-end'
                        name="type"
                        value={updateForm.appointment_status}
                        onChange={(e) => setUpdateForm((f) => ({ ...f, appointment_status: e.target.value as AppointmentType, }))}
                      >
                        {apptStatusTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                      
                    
                    {/* CLINIC SELECT */}
                    { showClinicSelector ? (
                    <div  className="flex justify-between">
                      <label
                        className='p-3 w-40 '
                            >Clinic</label> 
                      <select 
                            className='p-2 w-full bg-[#F5F3EE] rounded-lg border border-solid'
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
                        <div  className="flex justify-between">
                            <label className='p-3 w-40 '>
                                Clinic</label> 
                            <label className='p-3 w-40 '>
                                {clinicNameById} </label> 
                            
                        </div>
                    </>)}


                    <div className="flex form-actions justify-end">
                      <Button type="submit" className="btn-primary bg-green-600">
                        Save
                      </Button>
                      <Button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setShowAptUpdateForm(false)
                          setUpdateStatus('idle')
                          setUpdateMessage('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
          </div>
        
        </>)
}




