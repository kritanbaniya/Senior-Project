import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'




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
    // C: CREATE NEW APPOINTMENT 
    const [scheduleForm, setScheduleForm] = useState({
        patientId: '',
        date: '',
        time: '',
        doctorId: '',
        type: MOCK_APPOINTMENT_TYPES[0],
    })

    const [appointmentResponse, setAppointmentResponse ] = useState<Response>("Loading"); 
    const createAppointment = async () => {
        // 1. treat the input 
        // let patientid = patientList.user_id patientName
        setAppointmentResponse("Loading");
        console.log( appointmentResponse);
        console.log("FORMSUBMITTED", scheduleForm );
        
        if((scheduleForm.patientId != null) && (scheduleForm.doctorId != null)){
            const appointmentDate = `${scheduleForm.date} ${scheduleForm.time}:00`;
            // console.log("appointmentDate:", appointmentDate);

            // 2. insert to supabase 
            const { data, error } = 
                await supabase
                    .schema("public")
                    .from("Appointments")
                    .insert([
                        {
                            appointment_date: appointmentDate, // creates a random serial successfully 
                            patient_id: scheduleForm.patientId, 
                            clinic_id: clinicThis, 
                            clinician_id: scheduleForm.doctorId, 
                            created_at: "2026-03-20 14:32:00", // null, 
                            checkin_at: null, 
                            seen_at: null, 
                            visit_type: null,
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

        } else{
            setAppointmentResponse("Failed")
            console.log("ERROR: APPOINTMENT CREATION FAILED");
        }
    }

    // R: READ APPOINTMENT 
    const [appointmentsList, setAppointmentsList] = useState<NewAppointment[]>([]); // useState<Record<string, unknown>[]>([]);
    const readAppointments = async () => {
        const { data, error } = 
            await supabase
                .schema("public")
                .from("appointmentlist_display2")
                .select('*')
                .eq('clinic_id', await thisNursesClinic());
                //.order("appointment_date", { ascending: false });      FUTURE: ADJUST ORDER BY THIS 
        // console.log("APPOINTMENT DATA:", data);
        // console.log("ERROR:", error);

        if (error) {
            setAppointmentsList([]); 
            return;
        }

        setAppointmentsList(data ?? []); 
    }
    










    ////////////////////////////////////////////////////////////////////////////////////////////////
    //// TO BE EDITTED/REMOVED AFTER SUPABASE IMPLEMENTATION IS COMPLETE 
    const [showScheduleForm, setShowScheduleForm] = useState(false)
    const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null)

    const handleEditAppointment = (apt: Appointment) => {
        setScheduleForm({
        date: apt.date,
        time: apt.time,
        doctor: apt.doctor,
        type: apt.type,
        patientName: apt.patientName,
        })
        setEditingAppointmentId(apt.id)
    }
    /* U the original UPDATING FUNCTIONS 
        // UPDATE APPOINTMENT 
    const [appointments, setAppointments] = useState<Appointment[]>([
        { id: '1', date: '2025-02-15', time: '10:00', doctor: 'Dr. Smith', type: 'General Check-up', status: 'checked_in', patientName: 'Jane Doe' },
        { id: '2', date: '2025-02-15', time: '10:30', doctor: 'Dr. Lee', type: 'Follow-up', status: 'checked_in', patientName: 'John Smith' },
        { id: '3', date: '2025-02-15', time: '11:00', doctor: 'Dr. Johnson', type: 'Consultation', status: 'checked_in', patientName: 'Maria Garcia' },
        { id: '4', date: '2025-02-15', time: '14:00', doctor: 'Dr. Smith', type: 'Vaccination', status: 'confirmed', patientName: 'Alex Chen' },
    ])

    const handleUpdateAppointment = (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingAppointmentId) return
        setAppointments((prev) =>
        prev.map((a) =>
            a.id === editingAppointmentId
            ? {
                ...a,
                date: scheduleForm.date,
                time: scheduleForm.time,
                doctor: scheduleForm.doctor,
                type: scheduleForm.type,
                patientName: scheduleForm.patientName,
                }
            : a
        )
        )
        setEditingAppointmentId(null)
        setScheduleForm({ date: '', time: '', doctor: MOCK_DOCTORS[0], type: MOCK_APPOINTMENT_TYPES[0], patientName: '' })
    }
    const cancelEdit = () => {
        setEditingAppointmentId(null)
        setScheduleForm({ date: '', time: '', doctor: MOCK_DOCTORS[0], type: MOCK_APPOINTMENT_TYPES[0], patientName: '' })
    }*/ 
    ////////////////////////////////////////////////////////////////////////////////////////////////

  









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
                <div className="info-box-content">
                    {/* <h3><pre>{JSON.stringify(doctorList, null, 2)}</pre></h3> */}
                    <p>View, create, and modify appointments.</p>
                    {editingAppointmentId ? ( 
                        // EDIT APPOINTMENTS 
                        <p>not currently working:</p>
                        /*<form className="portal-form" onSubmit={handleUpdateAppointment}>
                            <div className="form-row"><label>Patient name</label>
                                <input type="text" value={scheduleForm.patientName} onChange={(e) => setScheduleForm((f) => ({ ...f, patientName: e.target.value }))} required />
                                </div>
                            <div className="form-row"><label>Date</label>
                                <input type="date" value={scheduleForm.date} onChange={(e) => setScheduleForm((f) => ({ ...f, date: e.target.value }))} required />
                                </div>
                            <div className="form-row"><label>Time</label>
                                <input type="time" value={scheduleForm.time} onChange={(e) => setScheduleForm((f) => ({ ...f, time: e.target.value }))} required />
                                </div>
                            <div className="form-row"><label>Provider</label>
                                <select value={scheduleForm.doctor} onChange={(e) => setScheduleForm((f) => ({ ...f, doctor: e.target.value }))}>{MOCK_DOCTORS.map((d) => <option key={d} value={d}>{d}</option>)}</select>
                                </div>
                            <div className="form-row"><label>Visit type</label>
                                <select value={scheduleForm.type} onChange={(e) => setScheduleForm((f) => ({ ...f, type: e.target.value }))}>{MOCK_APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                                </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-primary">Save changes</button>
                                <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                                </div>
                        </form>*/
                    ) : (
                        <>
                            
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
                                    </li>
                                ))}
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}




