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

export type AddressSuggestionPatch = Partial<
    Pick<ClinicFormData, 'address_line1' | 'city' | 'state' | 'zip_code'>
>

export type AddressSuggestion = {
    id: string
    label: string
    patch: AddressSuggestionPatch
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

export function mapGeocodeFeatureToAddressFields(feature: GeocodeFeature): AddressSuggestionPatch {
    const ctx = feature.context ?? []
    const byPrefix = (prefix: string) => ctx.find((c) => c.id?.startsWith(prefix))

    const postcode = byPrefix('postcode')
    const place = byPrefix('place') ?? byPrefix('locality')
    const region = byPrefix('region')

    const num = feature.address?.trim() ?? ''
    const street = (feature.text ?? '').trim()
    const line1 =
        [num, street].filter(Boolean).join(' ').trim() ||
        (feature.place_name ?? '').split(',')[0]?.trim() ||
        ''

    let state = ''
    if (region?.short_code) {
        state = region.short_code.replace(/^US-/i, '').toUpperCase()
    } else if (region?.text && region.text.length === 2) {
        state = region.text.toUpperCase()
    }

    const zipRaw = postcode?.text?.trim() ?? ''
    const zip = zipRaw.split(/\s+/)[0] ?? ''

    return {
        address_line1: line1,
        city: place?.text?.trim() ?? '',
        state,
        zip_code: zip,
    }
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

const SUGGEST_MIN_QUERY_LEN = 2
const SUGGEST_MIN_RELEVANCE = 0.12

function suggestionTypeOk(types: string[]): boolean {
    return types.some((t) => t === 'address' || t === 'road' || t === 'poi')
}

/**
 * debounced callers should pass trimmed query; returns [] if query too short or key missing.
 * uses proximity + client-side nyc filter (no bbox on api) so partial street queries still rank well.
 */
export async function fetchAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
    const key = import.meta.env.VITE_MAPTILER_KEY?.trim()
    if (!key || query.length < SUGGEST_MIN_QUERY_LEN) {
        return []
    }

    const base = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json`
    const params = new URLSearchParams({
        key,
        autocomplete: 'true',
        limit: '12',
        country: 'us',
        fuzzyMatch: 'true',
        proximity: NYC_PROXIMITY,
    })

    const res = await fetch(`${base}?${params.toString()}`)
    if (!res.ok) {
        return []
    }

    const data = (await res.json()) as GeocodeResponse
    const scored = (data.features ?? [])
        .map((f) => ({ f, rel: f.relevance ?? 0 }))
        .filter(({ f, rel }) => {
            if (rel < SUGGEST_MIN_RELEVANCE) {
                return false
            }
            const c = f.center
            if (!c || c.length < 2) {
                return false
            }
            if (!pointInsideNycBbox(c[0], c[1])) {
                return false
            }
            const types = f.place_type ?? []
            if (!suggestionTypeOk(types)) {
                return false
            }
            return true
        })
        .sort((a, b) => b.rel - a.rel)

    const out: AddressSuggestion[] = []

    for (const { f } of scored) {
        const basePatch = mapGeocodeFeatureToAddressFields(f)
        let line1 = basePatch.address_line1?.trim() ?? ''
        if (!line1 && (f.place_name ?? '').trim()) {
            line1 = (f.place_name ?? '').split(',')[0]?.trim() ?? ''
        }
        if (!line1) {
            continue
        }
        const patch: AddressSuggestionPatch = {
            ...basePatch,
            address_line1: line1,
        }

        const id = f.id ?? `${line1}-${out.length}`
        const label = f.place_name ?? line1
        out.push({ id, label, patch })
        if (out.length >= 10) {
            break
        }
    }

    return out
}
