

import {  useEffect, useState } from 'react' 
import type { 
    UserClinicRelationship, 
    CreateApptForm, 
    AppointmentType 
} from "@/features/appointment/types.ts"; 
import { Button } from '@/components/ui/button'; 




type AppointmentCreateStatus = 'idle' | 'loading' | 'success' | 'failed'

type apptFormProp = {
    showClinicSelector : boolean,
    // display and change selected clinic 
    clinicList : UserClinicRelationship[], 
    selectedClinic : string,
    setSelectedClinic : (s:string) => void, 

    // CREATE : form for UI and submission | display it 
    showCreateForm : boolean, 
    setShowCreateForm : (a : boolean) => void,  
    createForm : CreateApptForm, 
    setCreateForm: React.Dispatch<React.SetStateAction<CreateApptForm>>,  

    // CREATE : STATUS and MESSAGE 
    createStatus : AppointmentCreateStatus,
    setCreateStatus : (s: AppointmentCreateStatus) => void,
    createMessage : string, 
    setCreateMessage : (m : string) => void, 

    // CREATE callback functions 
    openCreateForm : (start: Date) => void, 
    createAppointment : () => void, 

    nurse : boolean, 
    patientList : UserClinicRelationship[], 
    patientName : string | undefined,  
    practicionerList : UserClinicRelationship[], 
    appointmentTypes : AppointmentType[], 

}


export default function ApptCreateModal({
    showClinicSelector,
    // clinic sauce 
    clinicList, 
    selectedClinic, 
    setSelectedClinic, 

    // CREATE : form for UI and submission | display it 
    showCreateForm, 
    setShowCreateForm,  
    createForm, 
    setCreateForm, 

    // CREATE : STATUS and MESSAGE 
    createStatus,
    setCreateStatus,
    createMessage ,
    setCreateMessage,

    openCreateForm,
    createAppointment,

    nurse,
    patientList,
    patientName, 
    practicionerList,
    appointmentTypes,
    
}:apptFormProp){
 
 
    const apptStatusTypes : any[] = [ 
        'pending',  // patient needs to make changes 
        'unseen',   // nurse/clinic has not seen it 
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
      setShowCreateForm(false)
  }


    return(<> 
          {/* CREATION / EDITING FORM */}
          <div className="info-box-content">   
            <Button
                type="button" 
                onClick={() => openCreateForm(new Date())}
              >
                Create appointment
              </Button> 
            {/* FORMS */}
            {!showCreateForm ? (
              <>
              </>
            ) : (
              <div className="form-overlay" onClick={handleClose}>
                <div className="form-modal" onClick={e => e.stopPropagation()}> 
                  {/* STATUS MESSAGE */}
                  {createStatus === 'idle' && (
                    <p className="small-label">Create Appointment </p>
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
                  <form className="portal-form"
                    onSubmit={(e) => {
                        e.preventDefault()
                        createAppointment()
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
                            value={createForm.patientId}
                            onChange={(e) =>
                                setCreateForm((f) => ({ ...f, patientId: e.target.value }))
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
                        value={createForm.date}
                        //min={getNowForDateTimeInput().date} redundant, and mismatching style. but may still be useful
                        onChange={(e) => setCreateForm((f) => ({ ...f, date: e.target.value }))}
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
                        value={createForm.time}
                        onChange={(e) => setCreateForm((f) => ({ ...f, time: e.target.value }))}
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
                        value={createForm.doctorId}
                        onChange={(e) =>
                          setCreateForm((f) => ({ ...f, doctorId: e.target.value }))
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
                        value={createForm.type}
                        onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as AppointmentType, }))}
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
                        value={createForm.appointment_status}
                        onChange={(e) => setCreateForm((f) => ({ ...f, appointment_status: e.target.value as AppointmentType, }))}
                      >
                        {apptStatusTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>


                    {/* Patient Note */}
                    {nurse? (<></>):(<>
                        <div  className="flex flex-col justify-between">
                        <label
                            className='p-3 w-70 '
                                >Patient Note</label>
                        <textarea
                            className='p-3 w-full max-h-30 overflow-y-auto bg-[#F5F3EE] rounded-lg border border-solid text-end'
                            name="type" 
                            value={createForm.patient_note}
                            onChange={(e) => setCreateForm((f) => ({ ...f, patient_note: e.target.value as AppointmentType, }))}
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
                            className='p-3 w-full  text-wrap bg-[#F5F3EE] rounded-lg border border-solid '
                            name="type" 
                            value={createForm.nurse_note}
                            onChange={(e) => setCreateForm((f) => ({ ...f, nurse_note: e.target.value as AppointmentType, }))}
                        > 
                        </textarea>
                        </div>
                    </>):(<></>)}
                    
                    


                    <div className="flex form-actions justify-end">
                      <Button type="submit" className="btn-primary bg-green-600">
                        Create
                      </Button>
                      <Button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setShowCreateForm(false)
                          setCreateStatus('idle')
                          setCreateMessage('')
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




