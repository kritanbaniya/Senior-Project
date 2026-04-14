import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { supabase } from '../../../../lib/supabase'
import { useAuth } from '../../../../context/AuthContext'
import { useClinicContext } from '../../../../context/ClinicContext'
import type { UserRole } from '../../../../lib/getHomePath'
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

function formatClinicAddressLine(c: ClinicRow): string | null {
    const parts = [c.address_line1, c.address_line2, c.city, c.state, c.zip_code].filter(Boolean)
    return parts.length ? parts.join(', ') : null
}

type PopupActionHandlers = {
    navigate: ReturnType<typeof useNavigate>
    profile: { role: UserRole } | null
    setSelectedClinicId: (id: string) => void
    setSelectedClinicName: (name: string) => void
}

function createClinicMapPopupElement(clinic: ClinicRow, h: PopupActionHandlers): HTMLDivElement {
    const root = document.createElement('div')
    root.className = 'cd-map-popup'
    root.addEventListener('click', (e) => e.stopPropagation())

    const title = document.createElement('h3')
    title.className = 'cd-map-popup-title'
    title.textContent = clinic.clinic_name ?? 'Clinic'
    root.appendChild(title)

    if (clinic.specialty) {
        const spec = document.createElement('span')
        spec.className = 'cd-map-popup-specialty'
        spec.textContent = clinic.specialty
        root.appendChild(spec)
    }

    const addr = formatClinicAddressLine(clinic)
    if (addr) {
        const p = document.createElement('p')
        p.className = 'cd-map-popup-address'
        p.textContent = addr
        root.appendChild(p)
    }

    const actions = document.createElement('div')
    actions.className = 'cd-map-popup-actions'

    const checkBtn = document.createElement('button')
    checkBtn.type = 'button'
    checkBtn.className = 'cd-btn'
    checkBtn.textContent = 'Check'
    checkBtn.addEventListener('click', () => {
        h.navigate('/clinic', { state: { clinicId: clinic.clinic_id, clinic } })
    })
    actions.appendChild(checkBtn)

    if (h.profile?.role === 'patient') {
        const selBtn = document.createElement('button')
        selBtn.type = 'button'
        selBtn.className = 'cd-btn'
        selBtn.textContent = 'Select clinic'
        selBtn.addEventListener('click', () => {
            h.setSelectedClinicId(clinic.clinic_id)
            h.setSelectedClinicName(clinic.clinic_name ?? 'Clinic')
            h.navigate('/dashboard/patient', { state: { clinicId: clinic.clinic_id } })
        })
        actions.appendChild(selBtn)
    }

    root.appendChild(actions)
    return root
}

export default function ClinicDiscoveryPage() {
    const navigate = useNavigate()
    const { profile } = useAuth()
    const { setSelectedClinicId, setSelectedClinicName } = useClinicContext()
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const markersRef = useRef<maplibregl.Marker[]>([])
    const popupRef = useRef<maplibregl.Popup | null>(null)
    const didFitBoundsRef = useRef(false)
    const actionHandlersRef = useRef<PopupActionHandlers>({
        navigate,
        profile: null,
        setSelectedClinicId,
        setSelectedClinicName,
    })
    actionHandlersRef.current = {
        navigate,
        profile: profile ?? null,
        setSelectedClinicId,
        setSelectedClinicName,
    }

    const [mapReady, setMapReady] = useState(false)
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
            attributionControl: false,
        })
        mapRef.current.on('error', (evt) => {
            console.error('maplibre style or tile load error', evt.error)
        })
        mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
        mapRef.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-left')

        mapRef.current.once('load', () => {
            setMapReady(true)
        })

        return () => {
            setMapReady(false)
            didFitBoundsRef.current = false
            mapRef.current?.remove()
            mapRef.current = null
        }
    }, [])

    const clinicsWithCoords = useMemo(
        () =>
            clinics.filter(
                (c) =>
                    c.latitude != null &&
                    c.longitude != null &&
                    Number.isFinite(c.latitude) &&
                    Number.isFinite(c.longitude),
            ),
        [clinics],
    )

    useEffect(() => {
        const map = mapRef.current
        if (!map || !mapReady) {
            return
        }

        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []
        popupRef.current?.remove()
        popupRef.current = null

        const onMapClick = () => {
            popupRef.current?.remove()
            popupRef.current = null
        }
        map.on('click', onMapClick)

        const h = actionHandlersRef.current

        for (const clinic of clinicsWithCoords) {
            const lng = clinic.longitude as number
            const lat = clinic.latitude as number
            const el = document.createElement('div')
            el.className = 'cd-map-pin'
            el.textContent = '📍'
            el.tabIndex = 0
            el.setAttribute('role', 'button')
            el.setAttribute('aria-label', `Open details for ${clinic.clinic_name ?? 'clinic'}`)

            const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map)

            el.addEventListener('click', (ev) => {
                ev.stopPropagation()
                popupRef.current?.remove()
                popupRef.current = null
                const popup = new maplibregl.Popup({
                    offset: 20,
                    closeButton: true,
                    maxWidth: 'min(320px, 92vw)',
                })
                    .setLngLat([lng, lat])
                    .setDOMContent(createClinicMapPopupElement(clinic, h))
                    .addTo(map)
                popupRef.current = popup
                popup.on('close', () => {
                    if (popupRef.current === popup) {
                        popupRef.current = null
                    }
                })
            })

            markersRef.current.push(marker)
        }

        if (clinicsWithCoords.length > 0 && !didFitBoundsRef.current) {
            const bounds = new maplibregl.LngLatBounds()
            clinicsWithCoords.forEach((c) => {
                bounds.extend([c.longitude as number, c.latitude as number])
            })
            try {
                map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 500 })
            } catch {
                // ignore
            }
            didFitBoundsRef.current = true
        }

        return () => {
            map.off('click', onMapClick)
            markersRef.current.forEach((m) => m.remove())
            markersRef.current = []
            popupRef.current?.remove()
            popupRef.current = null
        }
    }, [mapReady, clinicsWithCoords])

    const formatAddress = (c: ClinicRow) => formatClinicAddressLine(c)

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
            <Link
                to="/dashboard/patient"
                className={`cd-back cd-back-floating ${isPanelOpen ? 'is-panel-open' : ''}`}
            >
                ← Back to Dashboard
            </Link>
        </div>
    )
}