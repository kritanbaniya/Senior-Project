import type { ClinicFormData } from '../pages/Dashboard/Clinic/clinicFormTypes'

export type AddressSuggestionPatch = Partial<
    Pick<ClinicFormData, 'address_line1' | 'city' | 'state' | 'zip_code'>
>

export type GoogleAddressSuggestion = {
    id: string
    label: string
    placeId: string
}

export type GooglePlaceResolvedAddress = {
    placeId: string
    patch: AddressSuggestionPatch
    latitude: number
    longitude: number
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? ''
const MIN_QUERY_LEN = 3
const NYC_CENTER = { lat: 40.7831, lng: -73.9712 }
const NYC_RADIUS_METERS = 35000
const NYC_BOUNDS = {
    west: -74.2591,
    south: 40.4774,
    east: -73.7002,
    north: 40.9176,
}

let googleMapsScriptPromise: Promise<void> | null = null
let placesServiceContainer: HTMLDivElement | null = null

function pointInsideNycBbox(lng: number, lat: number): boolean {
    return (
        lng >= NYC_BOUNDS.west &&
        lng <= NYC_BOUNDS.east &&
        lat >= NYC_BOUNDS.south &&
        lat <= NYC_BOUNDS.north
    )
}

function looksLikeNycPrediction(description: string): boolean {
    const value = description.toLowerCase()
    return (
        value.includes(', ny') ||
        value.includes(' new york') ||
        value.includes('brooklyn') ||
        value.includes('queens') ||
        value.includes('bronx') ||
        value.includes('staten island') ||
        value.includes('manhattan')
    )
}

function componentByType(
    components: google.maps.GeocoderAddressComponent[],
    type: string,
): google.maps.GeocoderAddressComponent | undefined {
    return components.find((c) => c.types.includes(type))
}

function mapAddressComponentsToPatch(components: google.maps.GeocoderAddressComponent[]): AddressSuggestionPatch {
    const streetNumber = componentByType(components, 'street_number')?.long_name?.trim() ?? ''
    const route = componentByType(components, 'route')?.long_name?.trim() ?? ''
    const city =
        componentByType(components, 'locality')?.long_name?.trim() ??
        componentByType(components, 'sublocality')?.long_name?.trim() ??
        componentByType(components, 'sublocality_level_1')?.long_name?.trim() ??
        componentByType(components, 'postal_town')?.long_name?.trim() ??
        ''
    const state = componentByType(components, 'administrative_area_level_1')?.short_name?.trim() ?? ''
    const zip = componentByType(components, 'postal_code')?.long_name?.trim() ?? ''

    const addressLine1 = [streetNumber, route].filter(Boolean).join(' ').trim()
    return {
        address_line1: addressLine1,
        city,
        state: state.toUpperCase(),
        zip_code: zip,
    }
}

function hasAddressComponent(
    components: google.maps.GeocoderAddressComponent[],
    type: string,
): boolean {
    return components.some((c) => c.types.includes(type))
}

export function createGoogleAutocompleteSessionToken(): google.maps.places.AutocompleteSessionToken | null {
    if (!window.google?.maps?.places?.AutocompleteSessionToken) {
        return null
    }
    return new window.google.maps.places.AutocompleteSessionToken()
}

export async function loadGooglePlacesLibrary(): Promise<void> {
    if (window.google?.maps?.places) {
        return
    }
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('google maps api key is not configured')
    }
    if (!googleMapsScriptPromise) {
        googleMapsScriptPromise = new Promise<void>((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]')
            if (existing) {
                existing.addEventListener('load', () => resolve(), { once: true })
                existing.addEventListener('error', () => reject(new Error('failed to load google maps script')), {
                    once: true,
                })
                return
            }

            const script = document.createElement('script')
            script.setAttribute('data-google-maps', 'true')
            script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
                GOOGLE_MAPS_API_KEY,
            )}&libraries=places`
            script.async = true
            script.defer = true
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('failed to load google maps script'))
            document.head.appendChild(script)
        })
    }
    await googleMapsScriptPromise
}

export async function fetchGoogleAddressSuggestions(
    query: string,
    sessionToken?: google.maps.places.AutocompleteSessionToken | null,
): Promise<GoogleAddressSuggestion[]> {
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LEN || !GOOGLE_MAPS_API_KEY) {
        return []
    }

    await loadGooglePlacesLibrary()

    const service = new window.google.maps.places.AutocompleteService()
    const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
        service.getPlacePredictions(
            {
                input: trimmed,
                componentRestrictions: { country: 'us' },
                locationBias: new window.google.maps.Circle({
                    center: NYC_CENTER,
                    radius: NYC_RADIUS_METERS,
                }),
                sessionToken: sessionToken ?? undefined,
            },
            (result, status) => {
                if (
                    status !== window.google.maps.places.PlacesServiceStatus.OK ||
                    !Array.isArray(result)
                ) {
                    resolve([])
                    return
                }
                resolve(result)
            },
        )
    })

    return predictions
        .filter((prediction) => looksLikeNycPrediction(prediction.description))
        .slice(0, 10)
        .map((prediction) => ({
            id: prediction.place_id,
            label: prediction.description,
            placeId: prediction.place_id,
        }))
}

function getPlacesService(): google.maps.places.PlacesService {
    if (!placesServiceContainer) {
        placesServiceContainer = document.createElement('div')
    }
    return new window.google.maps.places.PlacesService(placesServiceContainer)
}

export async function fetchGooglePlaceAddressDetails(
    placeId: string,
    sessionToken?: google.maps.places.AutocompleteSessionToken | null,
): Promise<GooglePlaceResolvedAddress> {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('google maps api key is not configured')
    }
    await loadGooglePlacesLibrary()

    const service = getPlacesService()
    const details = await new Promise<google.maps.places.PlaceResult | null>((resolve) => {
        service.getDetails(
            {
                placeId,
                fields: ['place_id', 'address_components', 'geometry'],
                sessionToken: sessionToken ?? undefined,
            },
            (result, status) => {
                if (
                    status !== window.google.maps.places.PlacesServiceStatus.OK ||
                    !result ||
                    !result.address_components ||
                    !result.geometry?.location
                ) {
                    resolve(null)
                    return
                }
                resolve(result)
            },
        )
    })

    if (!details?.address_components || !details.geometry?.location || !details.place_id) {
        throw new Error('could not load selected address details')
    }

    const latitude = details.geometry.location.lat()
    const longitude = details.geometry.location.lng()
    if (!pointInsideNycBbox(longitude, latitude)) {
        throw new Error('address must be located within new york city (five boroughs).')
    }

    const patch = mapAddressComponentsToPatch(details.address_components)
    const country = componentByType(details.address_components, 'country')?.short_name?.trim().toUpperCase() ?? ''
    const hasStreetNumber = hasAddressComponent(details.address_components, 'street_number')
    const hasRoute = hasAddressComponent(details.address_components, 'route')
    const hasCity =
        hasAddressComponent(details.address_components, 'locality') ||
        hasAddressComponent(details.address_components, 'sublocality') ||
        hasAddressComponent(details.address_components, 'sublocality_level_1')

    if (country !== 'US') {
        throw new Error('entered address is invalid. please select a full street address from suggestions.')
    }
    if (!hasStreetNumber || !hasRoute || !hasCity || !patch.zip_code) {
        throw new Error('entered address is invalid. please select a full street address from suggestions.')
    }
    if (!patch.address_line1 || patch.state !== 'NY') {
        throw new Error('please select a full new york city street address.')
    }

    return {
        placeId: details.place_id,
        patch,
        latitude,
        longitude,
    }
}
