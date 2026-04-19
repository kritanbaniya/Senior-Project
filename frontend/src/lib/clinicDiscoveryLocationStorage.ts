const STORAGE_KEY = 'clinic-discovery-patient-location'
const TTL_MS = 15 * 60 * 1000

type StoredPayload = {
    lat: number
    lng: number
    savedAt: number
}

function isValidPayload(v: unknown): v is StoredPayload {
    if (!v || typeof v !== 'object') {
        return false
    }
    const o = v as Record<string, unknown>
    const lat = o.lat
    const lng = o.lng
    const savedAt = o.savedAt
    return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        typeof savedAt === 'number' &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Number.isFinite(savedAt)
    )
}

/** persisted wgs84 point for clinic discovery map; null if missing or expired */
export function readPatientMapLocation(): { lat: number; lng: number } | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) {
            return null
        }
        const parsed: unknown = JSON.parse(raw)
        if (!isValidPayload(parsed)) {
            return null
        }
        if (Date.now() - parsed.savedAt > TTL_MS) {
            return null
        }
        return { lat: parsed.lat, lng: parsed.lng }
    } catch {
        return null
    }
}

export function writePatientMapLocation(lat: number, lng: number): void {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return
    }
    try {
        const payload: StoredPayload = {
            lat,
            lng,
            savedAt: Date.now(),
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
        // private mode or quota
    }
}

/** great-circle distance in meters on a sphere */
export function distanceMetersLl(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
): number {
    const R = 6371000
    const p1 = (lat1 * Math.PI) / 180
    const p2 = (lat2 * Math.PI) / 180
    const dp = ((lat2 - lat1) * Math.PI) / 180
    const dl = ((lng2 - lng1) * Math.PI) / 180
    const a =
        Math.sin(dp / 2) * Math.sin(dp / 2) +
        Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

/** great-circle distance in miles (same sphere model as distanceMetersLl) */
export function distanceMilesLl(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
): number {
    return distanceMetersLl(lat1, lng1, lat2, lng2) * 0.000621371
}
