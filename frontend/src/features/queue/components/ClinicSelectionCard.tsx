import { Link } from 'react-router-dom'

type ClinicSelectionCardProps = {
  selectedClinicName: string | null
  onClearClinic: () => void
}

export default function ClinicSelectionCard({
  selectedClinicName,
  onClearClinic,
}: ClinicSelectionCardProps) {
  const hasSelectedClinic = Boolean(selectedClinicName?.trim())

  return (
    <section className="pd-card" id="clinic-selection">
      <h2 className="pd-card-title">Clinic selection</h2>
      {!hasSelectedClinic ? (
        <>
          <p className="pd-card-desc">No clinic selected.</p>
          <Link to="/clinic-discovery" className="pd-btn pd-btn-secondary">
            browse clinics
          </Link>
        </>
      ) : (
        <>
          <p className="mb-3 text-lg font-semibold leading-snug text-slate-800 sm:text-xl">
            Selected Clinic:{' '}
            <span className="font-bold text-slate-900">
              {selectedClinicName?.trim() ?? 'Clinic selected'}
            </span>
          </p>
          <div className="pd-checkin-buttons">
            <button type="button" className="pd-btn pd-btn-secondary" onClick={onClearClinic}>
              Remove Selected Clinic
            </button>
            <Link to="/clinic-discovery" className="pd-btn pd-btn-secondary">
              browse clinics
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
