// clinic management / pending-approval view (state 3 of the three-state flow).
//
// this component is rendered by ClinicADashBoard after the admin has created
// their clinic (clinic_created = true in public.clinic_admin). it receives
// the full clinics row as a prop and switches between two sub-states:
//
//   state 3a (clinicRow.approved = false):
//     shows a read-only summary of the submitted clinic details with a
//     prominent "pending approval" notice. the system admin will manually
//     flip approved to true in supabase (or later via a system admin ui).
//
//   state 3b (clinicRow.approved = true):
//     shows the clinic details with an "approved" badge. this is currently
//     a placeholder; future features like queue management, staff management,
//     and clinic settings will be added here.
//
// this component is purely presentational -- no form state, no supabase calls.
// it imports the ClinicRow type from the orchestrator for prop typing.
//
// props received from ClinicADashBoard:
//   clinicRow - the full public.clinics row; guaranteed non-null by the orchestrator

import type { ClinicRow } from './ClinicADashBoard'

interface ClinicManagementProps {
  clinicRow: ClinicRow
}

// renders the clinic overview after creation. switches between two views based
// on clinicRow.approved. no internal state or side effects -- purely driven by props.
export default function ClinicManagement({ clinicRow }: ClinicManagementProps) {
  // state 3a: clinic exists but a system admin has not approved it yet.
  // shows a read-only summary with a pending notice.
  if (!clinicRow.approved) {
    return (
      <section className="pd-card">
        <h2 className="pd-card-title">{clinicRow.clinic_name}</h2>
        <div className="pd-alert pd-alert-info" style={{ marginBottom: '1rem' }}>
          Your clinic is pending approval. A system administrator will review and approve it.
        </div>
        <p className="pd-card-desc">Here is what you submitted:</p>
        <div className="pd-overview-grid">
          <div className="pd-overview-item">
            <span className="pd-overview-label">Specialty</span>
            <span className="pd-overview-value">{clinicRow.specialty ?? '-'}</span>
          </div>
          <div className="pd-overview-item">
            <span className="pd-overview-label">Phone</span>
            <span className="pd-overview-value">{clinicRow.phone ?? '-'}</span>
          </div>
          <div className="pd-overview-item">
            <span className="pd-overview-label">Email</span>
            <span className="pd-overview-value">{clinicRow.email ?? '-'}</span>
          </div>
          <div className="pd-overview-item">
            <span className="pd-overview-label">Address</span>
            <span className="pd-overview-value">
              {[clinicRow.address_line1, clinicRow.address_line2].filter(Boolean).join(', ')}
            </span>
          </div>
          <div className="pd-overview-item">
            <span className="pd-overview-label">City / State / Zip</span>
            <span className="pd-overview-value">
              {[clinicRow.city, clinicRow.state, clinicRow.zip_code].filter(Boolean).join(', ')}
            </span>
          </div>
          {clinicRow.website && (
            <div className="pd-overview-item">
              <span className="pd-overview-label">Website</span>
              <span className="pd-overview-value">{clinicRow.website}</span>
            </div>
          )}
          {clinicRow.description && (
            <div className="pd-overview-item">
              <span className="pd-overview-label">Description</span>
              <span className="pd-overview-value">{clinicRow.description}</span>
            </div>
          )}
        </div>
      </section>
    )
  }

  // state 3b: clinic is approved and active. shows full details including
  // the clinic_id (which will be the fk for queue_entries, staff, etc.).
  // this section will expand as management features are built out.
  return (
    <section className="pd-card">
      <h2 className="pd-card-title">{clinicRow.clinic_name}</h2>
      <p className="pd-card-desc">Your clinic is approved and active.</p>
      <div className="pd-overview-grid">
        <div className="pd-overview-item">
          <span className="pd-overview-label">Clinic ID</span>
          <span className="pd-overview-value pd-mono">{clinicRow.clinic_id}</span>
        </div>
        <div className="pd-overview-item">
          <span className="pd-overview-label">Specialty</span>
          <span className="pd-overview-value">{clinicRow.specialty ?? '-'}</span>
        </div>
        <div className="pd-overview-item">
          <span className="pd-overview-label">Phone</span>
          <span className="pd-overview-value">{clinicRow.phone ?? '-'}</span>
        </div>
        <div className="pd-overview-item">
          <span className="pd-overview-label">Email</span>
          <span className="pd-overview-value">{clinicRow.email ?? '-'}</span>
        </div>
        <div className="pd-overview-item">
          <span className="pd-overview-label">Address</span>
          <span className="pd-overview-value">
            {[clinicRow.address_line1, clinicRow.address_line2].filter(Boolean).join(', ')}
          </span>
        </div>
        <div className="pd-overview-item">
          <span className="pd-overview-label">City / State / Zip</span>
          <span className="pd-overview-value">
            {[clinicRow.city, clinicRow.state, clinicRow.zip_code].filter(Boolean).join(', ')}
          </span>
        </div>
        <div className="pd-overview-item">
          <span className="pd-overview-label">Status</span>
          <span className="pd-overview-value pd-status-badge">Approved</span>
        </div>
      </div>
    </section>
  )
}
