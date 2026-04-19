import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
    distanceMilesLl,
    distanceMetersLl,
    readPatientMapLocation,
    writePatientMapLocation,
} from '../../../../lib/clinicDiscoveryLocationStorage'
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

const USER_AREA_SOURCE_ID = 'cd-user-area'
const USER_AREA_LAYER_ID = 'cd-user-area-fill'
const USER_AREA_RADIUS_M = 150
const USER_AREA_SEGMENTS = 64
const USER_AREA_REOPEN_EASE_MIN_M = 45

type DiscPolygonFeature = {
    type: 'Feature'
    properties: Record<string, never>
    geometry: { type: 'Polygon'; coordinates: [number, number][][] }
}

/** wgs84 disc for small radius (meters) using spherical forward geodesic */
function approximateDiscPolygonFeature(
    centerLng: number,
    centerLat: number,
    radiusMeters: number,
    segments: number,
): DiscPolygonFeature {
    const earthM = 6371000
    const lat1 = (centerLat * Math.PI) / 180
    const lng1 = (centerLng * Math.PI) / 180
    const dR = radiusMeters / earthM
    const ring: [number, number][] = []

    for (let i = 0; i <= segments; i++) {
        const theta = (2 * Math.PI * i) / segments
        const lat2 = Math.asin(
            Math.sin(lat1) * Math.cos(dR) + Math.cos(lat1) * Math.sin(dR) * Math.cos(theta),
        )
        const lng2 =
            lng1 +
            Math.atan2(
                Math.sin(theta) * Math.sin(dR) * Math.cos(lat1),
                Math.cos(dR) - Math.sin(lat1) * Math.sin(lat2),
            )
        ring.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI])
    }

    return {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [ring],
        },
    }
}

function firstSymbolLayerId(map: maplibregl.Map): string | undefined {
    const layers = map.getStyle()?.layers
    if (!layers) {
        return undefined
    }
    return layers.find((l) => l.type === 'symbol')?.id
}

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
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchResults, setSearchResults] = useState<ClinicRow[] | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [isPanelOpen, setIsPanelOpen] = useState(true)
    const [searchText, setSearchText] = useState('')
    const searchReqRef = useRef(0)
    const geolocationRequestedRef = useRef(false)
    const userLocationGrantedRef = useRef(!!readPatientMapLocation())
    const skipInitialUserAreaEaseRef = useRef(!!readPatientMapLocation())
    const [userLngLat, setUserLngLat] = useState<{ lng: number; lat: number } | null>(() => {
        const p = readPatientMapLocation()
        return p ? { lng: p.lng, lat: p.lat } : null
    })

    const focusClinicOnMap = (clinic: ClinicRow) => {
        const map = mapRef.current
        if (
            !map ||
            clinic.latitude == null ||
            clinic.longitude == null ||
            !Number.isFinite(clinic.latitude) ||
            !Number.isFinite(clinic.longitude)
        ) {
            return
        }

        const isMobile = window.innerWidth <= 768
        const padding = isMobile
            ? { top: 24, right: 24, bottom: isPanelOpen ? 340 : 24, left: 24 }
            : { top: 24, right: 24, bottom: 24, left: isPanelOpen ? 440 : 24 }

        map.easeTo({
            center: [clinic.longitude, clinic.latitude],
            zoom: Math.max(map.getZoom(), 13),
            duration: 700,
            padding,
        })
    }

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
        setCurrentPage(1)
        const query = searchText.trim()
        if (!query) {
            setSearchResults(null)
            setSearchLoading(false)
            return
        }

        setSearchLoading(true)
        const reqId = ++searchReqRef.current
        const t = window.setTimeout(() => {
            void (async () => {
                const { data, error } = await supabase.rpc('search_clinics_by_name', {
                    q: query,
                    limit_count: 50,
                })
                if (reqId !== searchReqRef.current) {
                    return
                }
                if (error) {
                    setSearchResults([])
                } else {
                    setSearchResults((data ?? []) as ClinicRow[])
                }
                setSearchLoading(false)
            })()
        }, 300)

        return () => window.clearTimeout(t)
    }, [searchText])

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) {
            return
        }
        if (!MAP_STYLE_URL) {
            console.error('missing VITE_MAPTILER_KEY. map initialization skipped.')
            return
        }

        const persisted = readPatientMapLocation()
        const initialCenter: [number, number] = persisted
            ? [persisted.lng, persisted.lat]
            : NYC_CENTER
        const initialZoom = persisted ? 13 : 10.3

        mapRef.current = new maplibregl.Map({
            container: mapContainerRef.current,
            style: MAP_STYLE_URL,
            center: initialCenter,
            zoom: initialZoom,
            minZoom: 9.7,
            maxZoom: 16,
            maxBounds: NYC_BOUNDS,
            attributionControl: false,
        })
        mapRef.current.on('error', (evt) => {
            console.error('maplibre style or tile load error', evt.error)
        })
        // same corner: first control sits closest to the corner (attribution above zoom)
        mapRef.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-right')
        mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

        mapRef.current.once('load', () => {
            setMapReady(true)
        })

        return () => {
            didFitBoundsRef.current = false
            const m = mapRef.current
            if (m) {
                try {
                    m.stop()
                } catch {
                    // map may already be tearing down
                }
                m.remove()
            }
            mapRef.current = null
        }
    }, [])

    useEffect(() => {
        if (!mapReady) {
            return
        }
        if (geolocationRequestedRef.current) {
            return
        }
        geolocationRequestedRef.current = true

        const geo = navigator.geolocation
        if (!geo?.getCurrentPosition) {
            return
        }

        let cancelled = false

        geo.getCurrentPosition(
            (pos) => {
                if (cancelled) {
                    return
                }
                const { latitude, longitude } = pos.coords
                if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                    return
                }
                writePatientMapLocation(latitude, longitude)
                userLocationGrantedRef.current = true
                setUserLngLat({ lng: longitude, lat: latitude })
            },
            () => {
                // permission denied or timeout: keep default map behavior
            },
            { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
        )

        return () => {
            cancelled = true
        }
    }, [mapReady])

    useEffect(() => {
        const map = mapRef.current
        if (!map || !mapReady || !userLngLat) {
            return
        }

        const feature = approximateDiscPolygonFeature(
            userLngLat.lng,
            userLngLat.lat,
            USER_AREA_RADIUS_M,
            USER_AREA_SEGMENTS,
        )

        const beforeId = firstSymbolLayerId(map)
        const existing = map.getSource(USER_AREA_SOURCE_ID)

        if (existing) {
            const geoSource = existing as maplibregl.GeoJSONSource
            geoSource.setData(feature)
            if (!map.getLayer(USER_AREA_LAYER_ID)) {
                const layerSpec: maplibregl.FillLayerSpecification = {
                    id: USER_AREA_LAYER_ID,
                    type: 'fill',
                    source: USER_AREA_SOURCE_ID,
                    paint: {
                        'fill-color': '#3b82f6',
                        'fill-opacity': 0.28,
                    },
                }
                if (beforeId) {
                    map.addLayer(layerSpec, beforeId)
                } else {
                    map.addLayer(layerSpec)
                }
            }
        } else {
            map.addSource(USER_AREA_SOURCE_ID, {
                type: 'geojson',
                data: feature,
            })
            const layerSpec: maplibregl.FillLayerSpecification = {
                id: USER_AREA_LAYER_ID,
                type: 'fill',
                source: USER_AREA_SOURCE_ID,
                paint: {
                    'fill-color': '#3b82f6',
                    'fill-opacity': 0.28,
                },
            }
            if (beforeId) {
                map.addLayer(layerSpec, beforeId)
            } else {
                map.addLayer(layerSpec)
            }
        }

        const isMobile = window.innerWidth <= 768
        const padding = isMobile
            ? { top: 24, right: 24, bottom: isPanelOpen ? 340 : 24, left: 24 }
            : { top: 24, right: 24, bottom: 24, left: isPanelOpen ? 440 : 24 }

        let shouldEase = true
        if (skipInitialUserAreaEaseRef.current) {
            skipInitialUserAreaEaseRef.current = false
            shouldEase = false
        } else {
            try {
                const c = map.getCenter()
                const d = distanceMetersLl(c.lat, c.lng, userLngLat.lat, userLngLat.lng)
                if (d < USER_AREA_REOPEN_EASE_MIN_M) {
                    shouldEase = false
                }
            } catch {
                shouldEase = true
            }
        }

        try {
            if (shouldEase && map.isStyleLoaded()) {
                map.easeTo({
                    center: [userLngLat.lng, userLngLat.lat],
                    zoom: Math.max(map.getZoom(), 13),
                    duration: 700,
                    padding,
                })
            }
        } catch {
            // ignore if map is mid-teardown or center is invalid for current style
        }

        return () => {
            try {
                if (map.getStyle() && map.getLayer(USER_AREA_LAYER_ID)) {
                    map.removeLayer(USER_AREA_LAYER_ID)
                }
                if (map.getStyle() && map.getSource(USER_AREA_SOURCE_ID)) {
                    map.removeSource(USER_AREA_SOURCE_ID)
                }
            } catch {
                // style may already be destroyed during route change
            }
        }
    }, [mapReady, userLngLat])

    const displayedClinics = useMemo(() => {
        if (searchText.trim()) {
            return searchResults ?? []
        }
        return clinics
    }, [searchResults, clinics, searchText])

    const sortedDisplayedClinics = useMemo(() => {
        if (!userLngLat) {
            return displayedClinics
        }
        const { lat, lng } = userLngLat
        const withCoords: ClinicRow[] = []
        const withoutCoords: ClinicRow[] = []
        for (const c of displayedClinics) {
            if (
                c.latitude != null &&
                c.longitude != null &&
                Number.isFinite(c.latitude) &&
                Number.isFinite(c.longitude)
            ) {
                withCoords.push(c)
            } else {
                withoutCoords.push(c)
            }
        }
        withCoords.sort(
            (a, b) =>
                distanceMilesLl(lat, lng, a.latitude as number, a.longitude as number) -
                distanceMilesLl(lat, lng, b.latitude as number, b.longitude as number),
        )
        return [...withCoords, ...withoutCoords]
    }, [displayedClinics, userLngLat])

    const clinicsWithCoords = useMemo(
        () =>
            displayedClinics.filter(
                (c) =>
                    c.latitude != null &&
                    c.longitude != null &&
                    Number.isFinite(c.latitude) &&
                    Number.isFinite(c.longitude),
            ),
        [displayedClinics],
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
            if (!userLocationGrantedRef.current) {
                const bounds = new maplibregl.LngLatBounds()
                clinicsWithCoords.forEach((c) => {
                    bounds.extend([c.longitude as number, c.latitude as number])
                })
                try {
                    map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 500 })
                } catch {
                    // ignore
                }
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

    const totalPages = Math.max(1, Math.ceil(sortedDisplayedClinics.length / PAGE_SIZE))
    const start = (currentPage - 1) * PAGE_SIZE
    const clinicsOnPage = sortedDisplayedClinics.slice(start, start + PAGE_SIZE)

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
                            placeholder="Search clinic name"
                        />
                    </div>

                    {loading ? (
                        <p className="cd-loading cd-loading-dots">Loading</p>
                    ) : searchLoading ? (
                        <p className="cd-loading cd-loading-dots">Searching</p>
                    ) : sortedDisplayedClinics.length === 0 ? (
                        searchText.trim() ? (
                            <p className="cd-empty">No clinics matched "{searchText.trim()}".</p>
                        ) : (
                            <p className="cd-empty">No clinics available.</p>
                        )
                    ) : (
                        <>
                            <ul className="cd-list">
                                {clinicsOnPage.map((clinic) => {
                                    const distMi =
                                        userLngLat &&
                                        clinic.latitude != null &&
                                        clinic.longitude != null &&
                                        Number.isFinite(clinic.latitude) &&
                                        Number.isFinite(clinic.longitude)
                                            ? distanceMilesLl(
                                                  userLngLat.lat,
                                                  userLngLat.lng,
                                                  clinic.latitude,
                                                  clinic.longitude,
                                              )
                                            : null
                                    const distLabel =
                                        distMi != null
                                            ? distMi < 0.1
                                                ? '< 0.1 mi away'
                                                : `${distMi.toFixed(1)} mi away`
                                            : null
                                    return (
                                        <li
                                            key={clinic.clinic_id}
                                            className="cd-card"
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`Center map on ${clinic.clinic_name ?? 'clinic'}`}
                                            onClick={(e) => {
                                                const target = e.target as HTMLElement
                                                if (target.closest('button, a')) {
                                                    return
                                                }
                                                focusClinicOnMap(clinic)
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault()
                                                    focusClinicOnMap(clinic)
                                                }
                                            }}
                                        >
                                            <h2 className="cd-card-name">{clinic.clinic_name ?? 'Clinic'}</h2>
                                            {clinic.specialty && (
                                                <span className="cd-card-specialty">{clinic.specialty}</span>
                                            )}
                                            {distLabel && (
                                                <span className="cd-card-distance">{distLabel}</span>
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
                                    )
                                })}
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