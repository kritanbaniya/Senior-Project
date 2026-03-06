import type { ClinicListItem } from '../types'

type ClinicSelectorItem = ClinicListItem & { manage_queue: boolean }

type ClinicSelectorProps = {
  clinics: ClinicSelectorItem[]
  selectedClinicId: string | null
  onSelect: (clinicId: string) => void
}

export default function ClinicSelector({ clinics, selectedClinicId, onSelect }: ClinicSelectorProps) {
  if (!clinics.length) {
    return <p className="no-queue">No clinic assignments found for this nurse account.</p>
  }

  return (
    <div className="add-to-queue-list">
      <p className="small-label">Select clinic:</p>
      {clinics.map((clinic) => (
        <div key={clinic.clinic_id} className="add-to-queue-row">
          <span>
            {clinic.clinic_name} ({clinic.city ?? 'city n/a'}, {clinic.state ?? 'state n/a'}) - queue permission:{' '}
            {clinic.manage_queue ? 'enabled' : 'disabled'}
          </span>
          <button
            type="button"
            className="btn-small"
            onClick={() => onSelect(clinic.clinic_id)}
            disabled={selectedClinicId === clinic.clinic_id}
          >
            {selectedClinicId === clinic.clinic_id ? 'selected' : 'open'}
          </button>
        </div>
      ))}
    </div>
  )
}
