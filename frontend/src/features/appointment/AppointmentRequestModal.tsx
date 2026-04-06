










export default function AppointmentForm({
    setShowScheduleForm
    showAptUpdateForm
    updateAppointments
    setUpdateForm
    updateForm
}){


    const handleClose = () => {
        setShowScheduleForm(false)
    }


return (
    <>
    {/* EDIT FORM : STILL NEEDS TO BE REFACTORED */}
    <div className="form-overlay" onClick={handleClose}>
        <div className="form-modal" onClick={e => e.stopPropagation()}> 
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
            ) : ( <></>)}
        </div>
    </div>
</>)}








