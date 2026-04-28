

import type {  
    Appointment
} from "@/features/appointment/types.ts"; 
import { Button } from '@/components/ui/button'; 
import { statusColor } from "./ApptUtil";

 
  
type ApptDetailProp = { 
    AppointmentDetails : Appointment | undefined, 
    
    // UPDATE : form for UI and submission | display it 
    showApptDetails : boolean, 
    setShowApptDetails : (a : boolean) => void,   


    nurse : boolean,  

}


export default function ApptDetailModal({ 
    AppointmentDetails,

    // UPDATE : form for UI and submission | display it 
    showApptDetails, 
    setShowApptDetails,   
 
  

}:ApptDetailProp){
 
 
   
  


    const handleClose = () => { 
        setShowApptDetails(false)
    }


    return(<> 
          {/* CREATION / EDITING FORM */}
          <div className="info-box-content">    
            {/* FORMS */}
            {!showApptDetails ? (
              <>
              </>
            ) : (
              <div className="form-overlay" onClick={handleClose}>
                


                {AppointmentDetails ? 
                (<div className="form-modal" onClick={e => e.stopPropagation()}> 
                  <h2 className='font-bold'>Appointment Details</h2>

                  
                  {/* THE FORM */}
                  <div className="portal-form"> 
                      

                    {/* DATE SET */}
                    <div className="flex justify-between">
                      <label
                        className='p-2 w-40 '
                            >Date Time</label>
                        <p>{AppointmentDetails.appointment_date}</p> 
                    </div>
 
                    {/* CLINIC SELECT */}
                    <div className="flex justify-between">
                      <label 
                        className='p-2 w-40 '
                            >Clinic Name</label>
                        <p>{AppointmentDetails.clinic_name}</p> 
                    </div>

                    {/* PATIENT SELECT */}
                    <div className="flex justify-between">
                      <label 
                        className='p-2 w-40 '
                            >Patient name</label>
                        <p>{AppointmentDetails.patient_name}</p> 
                    </div>

                    {/* PROVIDER SELECT */}
                    <div  className="flex justify-between">
                      <label
                        className='p-2 w-30 '
                            >Provider</label>
                        <p>{AppointmentDetails.clinician_name}</p> 
                    </div>


                    {/* VISIT TYPE */}
                    <div  className="flex justify-between">
                      <label
                        className='p-2 w-40 '
                            >Visit type</label>
                        <p>{AppointmentDetails.visit_type}</p> 
                    </div>


                    {/* APPT STATUS */}
                    <div  className="flex justify-between">
                      <label
                        className='p-2 w-70 '
                            >Appointment Status</label>
                        <p className="flex items-center">
                            <span
                            className="inline-block h-3 w-3 mr-1 rounded-full border border-solid"
                            style={{
                            backgroundColor: statusColor(AppointmentDetails.appointment_status),
                            }}
                            />{AppointmentDetails.appointment_status}</p> 
                    </div>
  

                    <div className='flex justify-between'>
                        <div> 
                        </div>

                        <div className="flex form-actions justify-end"> 
                            <Button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                setShowApptDetails(false) 
                                }}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                  </div>
                </div>):
                (<>
                    <div className="form-modal" onClick={e => e.stopPropagation()}>
                        <p>Could not find Appointment ... </p>
                        <div className='flex justify-between'>
                        <div> 
                        </div>

                            <div className="flex form-actions justify-end"> 
                                <Button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => {
                                    setShowApptDetails(false) 
                                    }}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </>)}
              </div>
            )}
            
          </div>
        
        </>)
}




