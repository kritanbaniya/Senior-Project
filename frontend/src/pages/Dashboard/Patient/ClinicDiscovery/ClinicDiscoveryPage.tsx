import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { supabase } from '../../../../lib/supabase'
import { useAuth } from '../../../../context/AuthContext'
import { useClinicContext } from '../../../../context/ClinicContext'
import type { ClinicRow } from '../../Clinic/ClinicADashBoard'

const PAGE_SIZE = 5
const NYC_CENTER: [number, number] = [-73.9712, 40.7831]
const NYC_BOUNDS: [[number, number], [number, number]] = [
    [-74.2591, 40.4774],
    [-73.7002, 40.9176],
]
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY?.trim() ?? ''
const MAP_STYLE_URL = MAPTILER_KEY
    ? `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`
    : null

export default function ClinicDiscoveryPage() {
    const navigate = useNavigate()
    const { profile } = useAuth()
    const { setSelectedClinicId, setSelectedClinicName } = useClinicContext()
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const [clinics, setClinics] = useState<ClinicRow[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [isPanelOpen, setIsPanelOpen] = useState(true)
    const [searchText, setSearchText] = useState('')

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

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) {
            return
        }
        if (!MAP_STYLE_URL) {
            console.error('missing VITE_MAPTILER_KEY. map initialization skipped.')
            return
        }

        mapRef.current = new maplibregl.Map({
            container: mapContainerRef.current,
            style: MAP_STYLE_URL,
            center: NYC_CENTER,
            zoom: 10.3,
            minZoom: 9.7,
            maxZoom: 16,
            maxBounds: NYC_BOUNDS,
        })
        mapRef.current.on('error', (evt) => {
            console.error('maplibre style or tile load error', evt.error)
        })
        mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

        return () => {
            mapRef.current?.remove()
            mapRef.current = null
        }
    }, [])

    const formatAddress = (c: ClinicRow) => {
        const parts = [c.address_line1, c.address_line2, c.city, c.state, c.zip_code].filter(Boolean)
        return parts.length ? parts.join(', ') : null
    }

    const totalPages = Math.max(1, Math.ceil(clinics.length / PAGE_SIZE))
    const start = (currentPage - 1) * PAGE_SIZE
    const clinicsOnPage = clinics.slice(start, start + PAGE_SIZE)

    return (
        <div className="clinic-discovery clinic-discovery-map">
            <div className="cd-map" ref={mapContainerRef} aria-label="nyc clinics map" />

            <div className={`cd-overlay ${isPanelOpen ? 'is-open' : 'is-closed'}`}>
                <button
                    type="button"
                    className="cd-toggle-btn cd-toggle-hide"
                    onClick={() => setIsPanelOpen(false)}
                    aria-expanded={isPanelOpen}
                    aria-controls="clinic-discovery-panel"
                >
                    Hide list
                </button>

                <section id="clinic-discovery-panel" className="cd-panel">
                    <h1 className="cd-title">Clinics Nearby</h1>
                    <p className="cd-subtitle">Find and choose a clinic to book an appointment</p>

                    <div className="cd-search">
                        <label htmlFor="clinic-search" className="cd-search-label">Search clinics</label>
                        <input
                            id="clinic-search"
                            type="search"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="cd-search-input"
                            placeholder="Search coming soon"
                        />
                        <p className="cd-search-note">Search will be enabled when backend fuzzy search is added.</p>
                    </div>

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
                                                {clinic.phone && <span>Phone: {clinic.phone}</span>}
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
                </section>
            </div>

            {!isPanelOpen && (
                <button
                    type="button"
                    className="cd-toggle-btn cd-toggle-show"
                    onClick={() => setIsPanelOpen(true)}
                    aria-expanded={false}
                    aria-controls="clinic-discovery-panel"
                >
                    Show clinics
                </button>
            )}
            <Link to="/" className="cd-back cd-back-floating">← Back to Home</Link>
        </div>
    )
}