

import {  useEffect, useState } from 'react' 
import type { 
    UpdateApptForm, 
    UserClinicRelationship, 
    AppointmentType , 
    Appointment
} from "@/features/appointment/types.ts"; 
import { Button } from '@/components/ui/button'; 


 
 
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


export default function ApptEditModal({
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
        'requested',   // nurse/clinic has not seen it 
        'canceled', // appointment was canceled 
        'deserted',  // patient did not show up 
        'active',   // active = APPOINTMENTS 
        'completed' // Appointment successfully closed 
    ]  
  
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
                  <h2 className='font-bold'>Edit Appointment </h2>

                  
                  
                  
                  {/* THE FORM */}
                  <form className="portal-form"
                        onSubmit={(e) => {
                        e.preventDefault()
                        updateAppointments()
                        }}> 
                      
                    
                    {/* CLINIC SELECT */}
                    { showClinicSelector ? (
                    <div  className="flex justify-between">
                      <label
                        className='p-3 w-40 '
                            >Clinic</label> 
                      <select 
                            className='p-2 w-full bg-[#F5F3EE] rounded-lg border border-solid text-end'
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
                            <label className='p-3 w-40 text-end'>
                                {clinicNameById} </label> 
                            
                        </div>
                    </>)}


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
                    {nurse? (<>
                        <div  className="flex flex-col justify-between">
                        <label
                            className='p-3 w-70 '
                                >Patient Note</label>
                        <p className='p-3 w-full max-h-30 overflow-y-auto border rounded-lg border border-solid' > 
                            { updateForm.patient_note || 'Empty'}  
                        </p>
                        </div> 
                    </>):(<>
                        <div  className="flex flex-col justify-between">
                        <label
                            className='p-3 w-70 '
                                >Patient Note</label>
                        <textarea
                            className='p-3 w-full bg-[#F5F3EE] rounded-lg border border-solid'
                            name="type" 
                            value={updateForm.patient_note}
                            onChange={(e) => setUpdateForm((f) => ({ ...f, patient_note: e.target.value as AppointmentType, }))}
                        > 
                        </textarea>
                        </div>
                    </>)}


                    {/* Nurse Note */} 
                    {nurse? (<>
                        <div  className="flex flex-col justify-between">
                        <label
                            className='p-3 w-70 '
                                >Nurse Note</label>
                        <textarea
                            className='p-3 w-full bg-[#F5F3EE] rounded-lg border border-solid '
                            name="type" 
                            value={updateForm.nurse_note}
                            onChange={(e) => setUpdateForm((f) => ({ ...f, nurse_note: e.target.value as AppointmentType, }))}
                        > 
                        </textarea>
                        </div>
                    </>):(<>
                        <div  className="flex flex-col justify-between">
                        <label
                            className='p-3 w-70 '
                                >Nurse Note</label>
                        <p className='p-3 w-full max-h-30 overflow-y-auto bg-[#F5F3EE] rounded-lg border border-solid' > 
                            {updateForm.nurse_note}
                        </p>
                        </div> 
                    </>)}

                    <div className='flex justify-between'>
                        <div>
                            {/* STATUS MESSAGE */}
                            {updateStatus === 'idle' && (
                                <p className="small-label font-bold"> </p>
                            )}
                            {updateStatus === 'loading' && (
                                <p className="small-label">Editing appointment...</p>
                            )}
                            {updateStatus === 'success' && (
                                <p className="success-message" style={{color: 'green' }}>{updateMessage}</p>
                            )}
                            {updateStatus === 'failed' && (
                                <p className="error-message" style={{color: 'red' }}>{updateMessage}</p>
                            )}
                        </div>

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
                    </div>
                  </form>
                </div>
              </div>
            )}
            
          </div>
        
        </>)
}




