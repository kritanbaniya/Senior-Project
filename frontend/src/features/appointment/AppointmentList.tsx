import { useEffect, useMemo, useState } from "react";
import type { Appointment } from "./types.ts";

type Props = {
  appointments: Appointment[]
  onSelectAppointment?: (apt: Appointment) => void
  onDeleteAppointment?: (apt: Appointment) => void
  onSelectSlot?: (start: Date) => void
}

export default function AppointmentList({
  appointments,
  onSelectAppointment,
  onDeleteAppointment,
}: Props) {
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const totalPages = Math.max(1, Math.ceil(appointments.length / rowsPerPage))

  const pagedAppointments = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    return appointments.slice(startIndex, endIndex)
  }, [appointments, page, rowsPerPage])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return (
    <div className="nurse-appointment-list">
      <p className="small-label">Appointments (today & upcoming)</p>

      <ul className="appointment-list">
        <div className="grid grid-cols-[120px_100px_1fr_1fr_1fr_140px] items-center px-2 py-1 text-sm font-semibold text-slate-500">
          <span>Date</span>
          <span>Time</span>
          <span>Provider</span>
          <span>Type</span>
          <span>Patient</span>
          <span>Actions</span>
        </div>

        {pagedAppointments.map((apt) => {
          const dt = new Date(apt.appointment_date)

          const dateText = Number.isNaN(dt.getTime())
            ? apt.appointment_date
            : dt.toLocaleDateString()

          const timeText = Number.isNaN(dt.getTime())
            ? ''
            : dt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })

          return (
            <li
              key={apt.Appointment_id}
              className="grid grid-cols-[120px_100px_1fr_1fr_1fr_140px] items-center px-2 py-1 text-sm text-slate-700"
            >
              <span>{dateText}</span>
              <span>{timeText}</span>
              <span>{apt.clinician_name}</span>
              <span>{apt.visit_type}</span>
              <span>{apt.patient_name}</span>

              <span className="flex gap-2">
                {onSelectAppointment && (
                  <button
                    type="button"
                    className="btn-small"
                    onClick={() => onSelectAppointment(apt)}
                  >
                    Edit
                  </button>
                )}

                {onDeleteAppointment && (
                  <button
                    type="button"
                    className="btn-small"
                    onClick={() => onDeleteAppointment(apt)}
                  >
                    Delete
                  </button>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="form-actions" style={{ marginTop: "12px" }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>

        <span style={{ alignSelf: "center" }}>
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>

        <label className="flex items-center gap-2" style={{ marginLeft: "12px" }}>
          <span>Rows per page</span>
          <input
            type="number"
            min={5}
            max={100}
            value={rowsPerPage}
            onChange={(e) => {
              const value = Number(e.target.value)
              if (!Number.isNaN(value) && value >= 1) {
                setRowsPerPage(value)
              }
            }}
            className="w-20 rounded border px-2 py-1"
          />
        </label>


        
      </div>
    </div>
  )
}