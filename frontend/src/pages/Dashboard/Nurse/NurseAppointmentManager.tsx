import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import NurseAppointmentCalendar from './NurseAppointmentCalendar'



//// TO BE REMOVED AFTER SUPABASE IMPLEMENTATION IS COMPLETE 
// NEED SUPABASE ENUM 
const MOCK_APPOINTMENT_TYPES = ['General Check-up', 'Follow-up', 'Consultation', 'Vaccination', 'Lab Work']
type AppointmentStatus = 'scheduled' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled'
type Appointment = {
  id: string
  date: string
  time: string
  doctor: string
  type: string
  status: AppointmentStatus
  patientName: string
}

 

//// USED TYPE: 
// for appointment list 
type NewAppointment = {
  Appointment_id: string; 
  appointment_date: string;  
  patient_name: string;
  patient_email: string;
  clinician_name: string;
  clinic_name: string;
  checkin_at: string | null;
  seen_at: string | null;
  visit_type: string; 
};
// for doctor list 
type MemberList = {
  clinic_name: string; 
  full_name: string;  
  role: string;
  created_at: string;
  user_id: string;
  clinic_id: string; 
};
// appointment Creation status 
type Response =
  | "Failed"
  | "Success"
  | "Loading";

export default function NurseAppointmentManager() {
    ////////////////////////////////////////////////////////////////////////////////////////////////
    //// COMPONENT RENDER VARIABLES - decides if a part of the page gets mounted 
    const [showScheduleForm, setShowScheduleForm] = useState(false)
    const [showAptUpdateForm, setShowAptUpdateForm] = useState(false)
    const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null)











    ////////////////////////////////////////////////////////////////////////////////////////////////
    //// HELPER FUNCTIONS: 
    // Retrieve list of doctors in this clinic 
    const [clinicThis, setClinicThis]  = useState<string>(); // useful for other functions 
    const [doctorList, setDoctorList]  = useState<MemberList[]>([]);
    const thisNursesClinic = async () => {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr || !authData.user) {
            console.log("AUTH ERROR:", authErr);
            return null;
        }
        const userId = authData.user.id; 
        // console.log("USER DATA:", userId)
        const { data, error } = 
                    await supabase
                        .schema("public")
                        .from("Memberships")
                        .select('clinic_id')
                        .eq('user_id', userId)
                        .single();
                // console.log("CLINIC DATA:", data);
                // console.log("CLINIC ERROR:", error);
        if (error || !data){
            console.log("CLINIC ERROR:", error);
            return null;}
        setClinicThis(data.clinic_id); 
        return data.clinic_id; 
    }
    const retrievePracticioners = async () => {
        const { data, error } = 
                    await supabase
                        .schema("public")
                        .from("membernamerole")
                        .select('*')
                        .eq('clinic_id', await thisNursesClinic())
                        .eq('role', "doctor");
                // console.log("DOCTORS DATA:", data);
                // console.log("DOCTORS ERROR:", error);

                if (error) {
                    console.log("DOCTORS ERROR:", error);
                    // setAppointmentsList([ ]);
                    return;
                }
            
            setDoctorList(data ?? []);
    }
    const [patientList, setPatientList]  = useState<MemberList[]>([]);
    const retrievePatients = async () => {
        const { data, error } = 
                    await supabase
                        .schema("public")
                        .from("membernamerole")
                        .select('*')
                        .eq('clinic_id', await thisNursesClinic())
                        .eq('role', "patient");
                //console.log("PATIENTS DATA:", data);
                //console.log("PATIENTS ERROR:", error);

                if (error) {
                    console.log("PATIENTS ERROR:", error);
                    // setAppointmentsList([ ]);
                    return;
                }
            
            setPatientList(data ?? []);
    }

    

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
    const [appointmentResponse, setAppointmentResponse ] = useState<Response>("Loading"); 
    //// C: CREATE NEW APPOINTMENT 
    const createAppointment = async () => {
        // 1. treat the input 
        // let patientid = patientList.user_id patientName
        setAppointmentResponse("Loading");
        console.log( appointmentResponse);
        console.log("FORMSUBMITTED", scheduleForm );
        
        if((scheduleForm.patientId != null) && (scheduleForm.doctorId != null)){
            let appointmentDate = `${scheduleForm.date} ${scheduleForm.time}:00`;
            // console.log("appointmentDate:", appointmentDate);

            // 2. insert to supabase 
            const { data, error } = 
                await supabase
                    .schema("public")
                    .from("Appointments")
                    .insert([
                        {
                            appointment_date: appointmentDate, 
                            patient_id: scheduleForm.patientId, 
                            clinic_id: clinicThis, 
                            clinician_id: scheduleForm.doctorId, 
                            created_at: "2026-03-20 14:32:00", // null, 
                            checkin_at: null, 
                            seen_at: null, 
                            visit_type: scheduleForm.type,
                        }])
                    .select("*")     // <-- makes PostgREST return inserted row(s)
                    .single();

            // console.log("DATA CREATE:", data);
            // console.log("ERROR CREATE:", error);
            console.log(data);
            if (error) {
                setAppointmentResponse("Failed")
                console.log("ERROR CREATE:", error);
                return;
            }
            setAppointmentResponse("Success");
            console.log( appointmentResponse);

            // Refresh list from DB
            await readAppointments();
        } else{
            setAppointmentResponse("Failed")
            console.log("ERROR: APPOINTMENT CREATION FAILED");
        }
    }


    //// R: READ APPOINTMENT 
    // pass data from backend to ui 
    const [appointmentsList, setAppointmentsList] = useState<NewAppointment[]>([]); // useState<Record<string, unknown>[]>([]);
    const readAppointments = async () => {
        const { data, error } = 
            await supabase
                .schema("public")
                .from("appointmentlist_display2")
                .select('*')
                .eq('clinic_id', await thisNursesClinic());
                //.order("appointment_date", { ascending: false });      FUTURE: ADJUST ORDER BY THIS 
        console.log("APPOINTMENT DATA:", data);
        // console.log("ERROR:", error);

        if (error) {
            setAppointmentsList([]); 
            return;
        }

        setAppointmentsList(data ?? []); 
    }
    

    //// U: UPDATE APPOINTMENT  
    // const [ aptUpdateData, setAptUpdateData ] = useState<NewAppointment>(); // what to upload as well as draw from 
    const [updateForm, setUpdateForm] = useState({
        appointmentId:'', 
        patientId: '',
        date: '',
        time: '',
        doctorId: '',
        type: MOCK_APPOINTMENT_TYPES[0],
    })
    const handleEditAppointment = async (apt: NewAppointment) => {
        const { data, error } = 
            await supabase
                // .schema("public")
                // .from("appointmentlist_display2")
                // .select('*')
                // .eq('Appointment_id', apt.Appointment_id)
                // .single();
                .schema("public")
                .from("Appointments")
                .select('*')
                .eq('Appointment_id', apt.Appointment_id)
                .single();
        if(error || !data ){
            // setAptUpdateData({
            //     Appointment_id: '', 
            //     appointment_date:  '',  
            //     patient_name:  '',  
            //     patient_email:  '',  
            //     clinician_name:  '',  
            //     clinic_name:  '',  
            //     checkin_at: null,
            //     seen_at: null,
            //     visit_type:  ''});
            return 
        }console.log(data);


        let d = new Date(data.appointment_date); // ISO -> Date
        let yyyy = d.getFullYear();
        let mm = String(d.getMonth() + 1).padStart(2, "0");
        let dd = String(d.getDate()).padStart(2, "0");
        let hh = String(d.getHours()).padStart(2, "0");
        let min = String(d.getMinutes()).padStart(2, "0");

        setUpdateForm({
            appointmentId: data.Appointment_id,
            patientId: data.patient_id ?? "",     // only if your view returns it
            doctorId: data.clinician_id ?? "",    // only if your view returns it
            date: `${yyyy}-${mm}-${dd}`,
            time: `${hh}:${min}`,
            type: data.visit_type ?? MOCK_APPOINTMENT_TYPES[0],
        });

        setShowAptUpdateForm(true);
    }
    const updateAppointments = async () => {
        console.log("UPDATEFORM SUBMITTED:", updateForm)
        if((updateForm.appointmentId != null) && (updateForm.doctorId != null)){
            let appointmentDate = `${updateForm.date} ${updateForm.time}:00`;
            const { data, error } = 
                await supabase
                    .schema("public")
                    .from("Appointments")
                    .update({
                            appointment_date: appointmentDate, 
                            patient_id: updateForm.patientId,  
                            clinician_id: updateForm.doctorId, 
                            visit_type: updateForm.type,
                        })
                    .eq('Appointment_id', updateForm.appointmentId)
                    .select()
                    .single();
            console.log("UPDATE DATA:", data);
            console.log("UPDATE ERROR:", error);

            if (error) { 
                return;
            }
        }
    }


    //// D: DELETE APPOINTMENT  
    const deleteAppointments = async (aptid : string ) => {
        const { data, error } = 
            await supabase
                .schema("public")
                .from("Appointments")
                .delete()
                .eq('Appointment_id', await aptid);
                //.order("appointment_date", { ascending: false });      FUTURE: ADJUST ORDER BY THIS 
        console.log("DELETE DATA:", data);
        console.log("DELETE ERROR:", error);

        if (error) { 
            return;
        }
 
        // Refresh list from DB
        await readAppointments();
    }





    

    







    ////////////////////////////////////////////////
    //// REACT HOOKS !
    // prob dont need to separate yet. 
    useEffect(() => {
        readAppointments(); // get newest list of appointments on initial render
        retrievePracticioners(); // get list of practicioner's from this specific clinic 
        retrievePatients(); 
        //createAppointment(); 
         
        return 
    }, []); 

    //// THESE ARE OK for now. there is def a better way; but no time 
    // when patients arrive, set default once
    useEffect(() => {
        if (patientList.length > 0 && scheduleForm.patientId === '') {
            setScheduleForm((f) => ({ ...f, patientId: patientList[0].user_id }))
        }
    }, [patientList])
    // when doctors arrive, set default once
    useEffect(() => {
        if (doctorList.length > 0 && scheduleForm.doctorId === '') {
            setScheduleForm((f) => ({ ...f, doctorId: doctorList[0].user_id }))
        }
    }, [doctorList])


    return (
        <> 
            {/* Appointment management */}
            {/* <pre>{JSON.stringify(appointmentsList, null, 2)}</pre> */}
            <div className="info-box appointments-section">
                <h2 className="info-box-title">Appointment scheduling</h2>
                
                <NurseAppointmentCalendar
  appointments={appointmentsList}
  onSelectAppointment={handleEditAppointment}
  onSelectSlot={(start) => {
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
    setShowScheduleForm(true)
  }}
/>
                <div className="info-box-content">
                    {/* <h3><pre>{JSON.stringify(doctorList, null, 2)}</pre></h3> */}
                    <p>View, create, and modify appointments.</p>
                     
                            
                            {/* C CREAT NEW Appointment */}
                            {!showScheduleForm ? (
                                <button type="button" className="btn-primary" onClick={() => setShowScheduleForm(true)}>Create appointment</button>
                            ) : (
                                <form 
                                    className="portal-form" 
                                    onSubmit={(e) => {
                                        e.preventDefault(); 
                                        createAppointment();
                                    }}>
                                        {/* Inputs */}
                                        <div className="form-row"><label>Patient name</label>
                                            <select 
                                            value={scheduleForm.patientId} 
                                            onChange={(e) => setScheduleForm((f) => ({ ...f, patientId: e.target.value }))}>
                                                {patientList.map((d) => 
                                                    <option key={d.user_id} value={d.user_id}>
                                                        {d.full_name}
                                                    </option>)}
                                            </select></div>
                                        <div className="form-row"><label>Date</label>
                                            <input 
                                            type="date" 
                                            value={scheduleForm.date} 
                                            onChange={(e) => setScheduleForm((f) => ({ ...f, date: e.target.value }))} 
                                            required /></div>
                                        <div className="form-row"><label>Time</label>
                                            <input 
                                            type="time" 
                                            value={scheduleForm.time} 
                                            onChange={(e) => setScheduleForm((f) => ({ ...f, time: e.target.value }))} 
                                            required /></div>
                                        <div className="form-row"><label>Provider</label>
                                            <select 
                                            value={scheduleForm.doctorId} 
                                            onChange={(e) => setScheduleForm((f) => ({ ...f, doctorId: e.target.value }))}>
                                                {doctorList.map((d) => 
                                                    <option key={d.user_id} value={d.user_id}>{d.full_name}
                                                    </option>)}
                                            </select></div>
                                        <div className="form-row"><label>Visit type</label>
                                            <select 
                                            name = "type" 
                                            value={scheduleForm.type} 
                                            onChange={(e) => setScheduleForm((f) => ({ ...f, type: e.target.value }))}>
                                                {MOCK_APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                            </select></div>

                                        {/* Buttons */}
                                        <div className="form-actions">
                                            <button type="submit" className="btn-primary" onClick={() => {
                                                }}>Create</button>
                                            <button type="button" className="btn-secondary" onClick={() => setShowScheduleForm(false)}>Cancel</button>
                                        </div>
                                </form>
                            )}

                            {/* R READ LIST of Appointments */}
                            <div className="nurse-appointment-list">
                                <p className="small-label">Appointments (today & upcoming)</p>
                                <ul className="appointment-list">
                                {appointmentsList
                                    /*.filter((a) => ['scheduled', 'confirmed', 'checked_in']
                                    .includes(a.status))*/
                                    .map((apt) => (
                                    <li key={apt.Appointment_id} className="appointment-item nurse-apt-item">
                                        <span className="apt-date">{apt.appointment_date}</span>
                                        {/* <span className="apt-time">{apt.time}</span> */}
                                        <span className="apt-doctor">{apt.clinician_name}</span>
                                        <span className="apt-type">{apt.visit_type}</span>
                                        <span className="apt-patient">{apt.patient_name}</span>
                                        {/* <span className={`apt-status status-${apt.status}`}>{apt.status.replace('_', ' ')}</span> */}
                                        <button type="button" className="btn-small" onClick={() => handleEditAppointment(apt)}>Edit</button>
                                        <button type="button" className="btn-small" onClick={() => deleteAppointments(apt.Appointment_id)}>Delete</button>
                                    </li> 
                                ))}
                                </ul>
                            </div>

                            {showAptUpdateForm ? 
                            (<form 
                                className="portal-form" 
                                onSubmit={(e) => { 
                                    e.preventDefault(); 
                                    updateAppointments();
                                }}>
                                {/* Inputs */}
                                <div className="form-row"><label>Patient name</label>
                                    <select 
                                    value={updateForm.patientId} 
                                    onChange={(e) => setUpdateForm((f) => ({ ...f, patientId: e.target.value }))}>
                                        {patientList.map((d) => 
                                            <option key={d.user_id} value={d.user_id}>
                                                {d.full_name}
                                            </option>)}
                                    </select> 
                                    </div>
                                <div className="form-row"><label>Date</label>
                                    <input 
                                    type="date" 
                                    value={updateForm.date} 
                                    onChange={(e) => setUpdateForm((f) => ({ ...f, date: e.target.value }))} 
                                    required />
                                    </div>
                                <div className="form-row"><label>Time</label>
                                    <input 
                                    type="time" 
                                    value={updateForm.time} 
                                    onChange={(e) => setUpdateForm((f) => ({ ...f, time: e.target.value }))} 
                                    required />
                                    </div>
                                <div className="form-row"><label>Provider</label>
                                    <select 
                                    value={updateForm.doctorId} 
                                    onChange={(e) => setUpdateForm((f) => ({ ...f, doctor: e.target.value }))}>
                                        {doctorList.map((d) => 
                                        <option key={d.user_id} value={d.user_id}>{d.full_name}</option>)}
                                    </select>
                                    </div>
                                <div className="form-row"><label>Visit type</label>
                                    <select 
                                    value={updateForm.type} 
                                    onChange={(e) => setUpdateForm((f) => ({ ...f, type: e.target.value }))}>
                                        {MOCK_APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                                    </div>

                                {/* Buttons */}
                                <div className="form-actions">
                                    <button type="submit" className="btn-primary" onClick={() => {}}>Save changes</button>
                                    <button type="button" className="btn-secondary" onClick={() => setShowAptUpdateForm(false)}>Cancel</button> 
                                    </div>
                            </form>)
                            :(<></>)}
                            
                            
                </div>
            </div>
        </>
    )
}




