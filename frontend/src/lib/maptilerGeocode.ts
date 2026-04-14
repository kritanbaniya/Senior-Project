import type { ClinicFormData } from '../pages/Dashboard/Clinic/clinicFormTypes'

// nyc five boroughs bounding box (w, s, e, n) for maptiler bbox= query
export const MAPTILER_NYC_BBOX = '-74.2591,40.4774,-73.7002,40.9176'
const NYC_BBOX = MAPTILER_NYC_BBOX

// stricter bar for persisting coordinates (reject vague / junk matches)
const SAVE_MIN_RELEVANCE = 0.62
const SAVE_ROAD_MIN_RELEVANCE = 0.84

const NYC_PROXIMITY = '-73.9712,40.7831'

type GeocodeFeature = {
    id?: string
    text?: string
    place_name?: string
    address?: string
    center?: [number, number]
    relevance?: number
    place_type?: string[]
    context?: { id?: string; text?: string; short_code?: string }[]
}

type GeocodeResponse = {
    features?: GeocodeFeature[]
}

function pointInsideNycBbox(lng: number, lat: number): boolean {
    return lng >= -74.2591 && lng <= -73.7002 && lat >= 40.4774 && lat <= 40.9176
}

/** used only when saving to db: must look like a real street-level hit, not a random city match */
function isStrongSaveFeature(f: GeocodeFeature): boolean {
    const rel = f.relevance ?? 0
    const types = f.place_type ?? []
    if (types.includes('address') && rel >= SAVE_MIN_RELEVANCE) {
        return true
    }
    if (types.includes('road') && rel >= SAVE_ROAD_MIN_RELEVANCE) {
        return true
    }
    return false
}

function pickBestFeatureForSave(features: GeocodeFeature[]): GeocodeFeature | null {
    const ranked = features
        .filter((f) => {
            const c = f.center
            if (!c || c.length < 2) {
                return false
            }
            return pointInsideNycBbox(c[0], c[1]) && isStrongSaveFeature(f)
        })
        .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0))
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
        limit: '10',
        country: 'us',
        bbox: NYC_BBOX,
        fuzzyMatch: 'true',
        proximity: NYC_PROXIMITY,
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
    let best = pickBestFeatureForSave(data.features ?? [])

    if (!best) {
        res = await fetch(url({}))
        if (!res.ok) {
            throw new Error(`geocoding request failed (${res.status})`)
        }
        data = (await res.json()) as GeocodeResponse
        best = pickBestFeatureForSave(data.features ?? [])
    }

    if (!best?.center || best.center.length < 2) {
        throw new Error(
            'could not verify that address. pick a suggested address or enter a full street address in new york city.',
        )
    }

    const [lng, lat] = best.center
    if (!pointInsideNycBbox(lng, lat)) {
        throw new Error('address must be located within new york city (five boroughs).')
    }

    return { latitude: lat, longitude: lng }
}
