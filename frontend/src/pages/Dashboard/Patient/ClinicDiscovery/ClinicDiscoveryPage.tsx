import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../../../lib/supabase'
import { useAuth } from '../../../../context/AuthContext'
import { useClinicContext } from '../../../../context/ClinicContext'
import type { ClinicRow } from '../../Clinic/ClinicADashBoard'

const PAGE_SIZE = 5

export default function ClinicDiscoveryPage() {
    const navigate = useNavigate()
    const { profile } = useAuth()
    const { setSelectedClinicId, setSelectedClinicName } = useClinicContext()
    const [clinics, setClinics] = useState<ClinicRow[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        const loadClinics = async () => {
            const { data, error } = await supabase
                .from('clinics')
                .select('*')
                .eq('approved', true)
                .order('clinic_name')
            if (!error && data) {
                setClinics(data as ClinicRow[])
            }
            setLoading(false)
        }
        void loadClinics()
    }, [])

    const formatAddress = (c: ClinicRow) => {
        const parts = [c.address_line1, c.address_line2, c.city, c.state, c.zip_code].filter(Boolean)
        return parts.length ? parts.join(', ') : null
    }

    const totalPages = Math.max(1, Math.ceil(clinics.length / PAGE_SIZE))
    const start = (currentPage - 1) * PAGE_SIZE
    const clinicsOnPage = clinics.slice(start, start + PAGE_SIZE)

    return (
        <div className="clinic-discovery">
            <h1 className="cd-title">Clinics Nearby</h1>
            <p className="cd-subtitle">Find and choose a clinic to book an appointment</p>
            {loading ? (
                <p className="cd-loading cd-loading-dots">Loading</p>
            ) : clinics.length === 0 ? (
                <p className="cd-empty">No clinics available.</p>
            ) : (
                <>
                    <ul className="cd-list">
                        {clinicsOnPage.map((clinic) => (
                            <li key={clinic.clinic_id} className="cd-card">
                                <h2 className="cd-card-name">{clinic.clinic_name ?? 'Clinic'}</h2>
                                {clinic.specialty && (
                                    <span className="cd-card-specialty">{clinic.specialty}</span>
                                )}
                                {formatAddress(clinic) && (
                                    <p className="cd-card-address">{formatAddress(clinic)}</p>
                                )}
                                {(clinic.phone || clinic.email || clinic.website) && (
                                    <div className="cd-card-meta">
                                        {clinic.phone && <span>📞 {clinic.phone}</span>}
                                        {clinic.email && (
                                            <a href={`mailto:${clinic.email}`}>{clinic.email}</a>
                                        )}
                                        {clinic.website && (
                                            <a href={clinic.website.startsWith('http') ? clinic.website : `https://${clinic.website}`} target="_blank" rel="noopener noreferrer">
                                                Website
                                            </a>
                                        )}
                                    </div>
                                )}
                                <div className="cd-card-actions">
                                    <button
                                        type="button"
                                        className="cd-btn"
                                        onClick={() => navigate('/clinic', { state: { clinicId: clinic.clinic_id, clinic } })}
                                    >
                                        Check
                                    </button>
                                    {profile?.role === 'patient' && (
                                        <button
                                            type="button"
                                            className="cd-btn"
                                            onClick={() => {
                                                setSelectedClinicId(clinic.clinic_id)
                                                setSelectedClinicName(clinic.clinic_name ?? 'Clinic')
                                                navigate('/dashboard/patient', { state: { clinicId: clinic.clinic_id } })
                                            }}
                                        >
                                            Select clinic
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                    {totalPages > 1 && (
                        <div className="cd-pagination">
                            <button
                                type="button"
                                className="cd-btn"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                            >
                                Previous
                            </button>
                            <span className="cd-page-info">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                type="button"
                                className="cd-btn"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
            {!loading && (
                <Link to="/" className="cd-back">← Back to Home</Link>
            )}
        </div>
    )
}