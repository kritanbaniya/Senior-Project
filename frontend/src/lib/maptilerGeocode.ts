import type { ClinicFormData } from '../pages/Dashboard/Clinic/ClinicCreation'

// nyc five boroughs bounding box (w, s, e, n) for maptiler bbox= query
const NYC_BBOX = '-74.2591,40.4774,-73.7002,40.9176'

const MIN_RELEVANCE = 0.55
const ROAD_MIN_RELEVANCE = 0.72

type GeocodeFeature = {
    center?: [number, number]
    relevance?: number
    place_type?: string[]
}

type GeocodeResponse = {
    features?: GeocodeFeature[]
}

function pointInsideNycBbox(lng: number, lat: number): boolean {
    return lng >= -74.2591 && lng <= -73.7002 && lat >= 40.4774 && lat <= 40.9176
}

function isAcceptableFeature(f: GeocodeFeature): boolean {
    const rel = f.relevance ?? 0
    if (rel < MIN_RELEVANCE) {
        return false
    }
    const types = f.place_type ?? []
    if (types.includes('address')) {
        return true
    }
    if (types.includes('road') && rel >= ROAD_MIN_RELEVANCE) {
        return true
    }
    return false
}

function pickBestFeature(features: GeocodeFeature[]): GeocodeFeature | null {
    const ranked = features.filter((f) => {
        const c = f.center
        if (!c || c.length < 2) {
            return false
        }
        return pointInsideNycBbox(c[0], c[1]) && isAcceptableFeature(f)
    })
    return ranked[0] ?? null
}

function buildQuery(form: ClinicFormData): string {
    const parts = [
        form.address_line1.trim(),
        form.address_line2.trim(),
        form.city.trim(),
        form.state,
        form.zip_code.trim(),
        'USA',
    ].filter(Boolean)
    return parts.join(', ')
}

/**
 * forward geocode clinic address via maptiler (same key as map tiles).
 * throws an error message suitable for user-facing copy on failure.
 */
export async function geocodeClinicAddress(form: ClinicFormData): Promise<{ latitude: number; longitude: number }> {
    const key = import.meta.env.VITE_MAPTILER_KEY?.trim()
    if (!key) {
        throw new Error('maptiler key is not configured')
    }

    if (form.state !== 'NY') {
        throw new Error('clinic address must be in new york state (nyc service area).')
    }

    const query = buildQuery(form)
    const base = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json`

    const params = new URLSearchParams({
        key,
        autocomplete: 'false',
        limit: '5',
        country: 'us',
        bbox: NYC_BBOX,
        fuzzyMatch: 'true',
    })

    const url = (extra: Record<string, string>) => {
        const p = new URLSearchParams(params)
        for (const [k, v] of Object.entries(extra)) {
            p.set(k, v)
        }
        return `${base}?${p.toString()}`
    }

    let res = await fetch(url({ types: 'address' }))
    if (!res.ok) {
        throw new Error(`geocoding request failed (${res.status})`)
    }
    let data = (await res.json()) as GeocodeResponse
    let best = pickBestFeature(data.features ?? [])

    if (!best) {
        res = await fetch(url({}))
        if (!res.ok) {
            throw new Error(`geocoding request failed (${res.status})`)
        }
        data = (await res.json()) as GeocodeResponse
        best = pickBestFeature(data.features ?? [])
    }

    if (!best?.center || best.center.length < 2) {
        throw new Error(
            'could not verify that address. use a real street address in new york city and check spelling.',
        )
    }

    const [lng, lat] = best.center
    if (!pointInsideNycBbox(lng, lat)) {
        throw new Error('address must be located within new york city (five boroughs).')
    }

    return { latitude: lat, longitude: lng }
}
