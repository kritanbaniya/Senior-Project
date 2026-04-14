import { useEffect, useId, useRef, useState } from 'react'
import type { ClinicFormData } from './clinicFormTypes'
import {
    createGoogleAutocompleteSessionToken,
    fetchGoogleAddressSuggestions,
    fetchGooglePlaceAddressDetails,
    loadGooglePlacesLibrary,
    type GoogleAddressSuggestion,
} from '../../../lib/googlePlaces'
import { US_STATES } from './ClinicADashBoard'

const DEBOUNCE_MS = 300

type Props = {
    form: ClinicFormData
    setForm: React.Dispatch<React.SetStateAction<ClinicFormData>>
    disabled?: boolean
}

export default function ClinicAddressAutocompleteSection({ form, setForm, disabled }: Props) {
    const uid = useId()
    const wrapRef = useRef<HTMLDivElement | null>(null)
    const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
    const noticeTimerRef = useRef<number | null>(null)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [suggestions, setSuggestions] = useState<GoogleAddressSuggestion[]>([])
    const [activeIndex, setActiveIndex] = useState(-1)
    const [transientNotice, setTransientNotice] = useState('')

    useEffect(() => {
        const onDocDown = (e: MouseEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', onDocDown)
        return () => document.removeEventListener('mousedown', onDocDown)
    }, [])

    useEffect(() => {
        return () => {
            if (noticeTimerRef.current != null) {
                window.clearTimeout(noticeTimerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        const q = form.address_line1.trim()
        if (q.length < 3 || disabled) {
            sessionTokenRef.current = null
            setSuggestions([])
            setOpen(false)
            setLoading(false)
            return
        }

        setLoading(true)
        const t = window.setTimeout(() => {
            void (async () => {
                try {
                    await loadGooglePlacesLibrary()
                    if (!sessionTokenRef.current) {
                        sessionTokenRef.current = createGoogleAutocompleteSessionToken()
                    }
                    const list = await fetchGoogleAddressSuggestions(q, sessionTokenRef.current)
                    setSuggestions(list)
                    setOpen(list.length > 0)
                    setActiveIndex(-1)
                } catch {
                    setSuggestions([])
                    setOpen(false)
                } finally {
                    setLoading(false)
                }
            })()
        }, DEBOUNCE_MS)

        return () => window.clearTimeout(t)
    }, [form.address_line1, disabled])

    const applySuggestion = async (s: GoogleAddressSuggestion) => {
        if (disabled) {
            return
        }
        setLoading(true)
        try {
            const details = await fetchGooglePlaceAddressDetails(s.placeId, sessionTokenRef.current)
            setForm((f) => ({
                ...f,
                address_line1: details.patch.address_line1?.trim() ?? f.address_line1,
                city: details.patch.city?.trim() ?? f.city,
                zip_code: details.patch.zip_code?.trim() ?? f.zip_code,
                state: details.patch.state?.trim() || 'NY',
            }))
            setOpen(false)
            setSuggestions([])
            setActiveIndex(-1)
            sessionTokenRef.current = null
            setTransientNotice('')
        } catch (e) {
            const text = e instanceof Error ? e.message : ''
            if (text.includes('within new york city')) {
                setTransientNotice('currently only serving nyc area only')
                if (noticeTimerRef.current != null) {
                    window.clearTimeout(noticeTimerRef.current)
                }
                noticeTimerRef.current = window.setTimeout(() => {
                    setTransientNotice('')
                }, 1800)
            }
            setOpen(false)
            setSuggestions([])
        } finally {
            setLoading(false)
        }
    }

    const preventSubmitOnEnter = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
        }
    }

    const onAddr1KeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown' && open && suggestions.length > 0) {
            e.preventDefault()
            setActiveIndex((i) => (i + 1) % suggestions.length)
            return
        }
        if (e.key === 'ArrowUp' && open && suggestions.length > 0) {
            e.preventDefault()
            setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
            return
        }
        if (e.key === 'Escape' && open) {
            e.preventDefault()
            setOpen(false)
            return
        }
        if (e.key === 'Enter') {
            e.preventDefault()
            if (open && suggestions.length > 0) {
                const idx = activeIndex >= 0 ? activeIndex : 0
                void applySuggestion(suggestions[idx])
            }
            return
        }
    }

    return (
        <>
            <div className="pd-form-row">
                <label htmlFor={`${uid}-addr1`}>Address line 1</label>
                <p className="caa-hint">
                  type your street address and pick a suggestion, or finish the fields and use save below. enter will not submit the form from these fields (new york city only).
                </p>
                <div className="caa-wrap" ref={wrapRef}>
                    <input
                        id={`${uid}-addr1`}
                        type="text"
                        autoComplete="off"
                        value={form.address_line1}
                        onChange={(e) => setForm((f) => ({ ...f, address_line1: e.target.value }))}
                        onFocus={() => suggestions.length > 0 && setOpen(true)}
                        onKeyDown={onAddr1KeyDown}
                        placeholder="Street number and name"
                        required
                        disabled={disabled}
                        aria-autocomplete="list"
                        aria-expanded={open}
                        aria-controls={`${uid}-addr-suggest`}
                    />
                    {loading && <span className="caa-loading">searching…</span>}
                    {transientNotice && <p className="caa-notice">{transientNotice}</p>}
                    {open && suggestions.length > 0 && (
                        <ul id={`${uid}-addr-suggest`} className="caa-list" role="listbox">
                            {suggestions.map((s, i) => (
                                <li key={s.id} role="option" aria-selected={i === activeIndex}>
                                    <button
                                        type="button"
                                        className={i === activeIndex ? 'caa-item is-active' : 'caa-item'}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            void applySuggestion(s)
                                        }}
                                    >
                                        {s.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <div className="pd-form-row">
                <label htmlFor={`${uid}-addr2`}>Address line 2</label>
                <input
                    id={`${uid}-addr2`}
                    type="text"
                    value={form.address_line2}
                    onChange={(e) => setForm((f) => ({ ...f, address_line2: e.target.value }))}
                    onKeyDown={preventSubmitOnEnter}
                    placeholder="Suite, floor, unit (optional)"
                    disabled={disabled}
                />
            </div>
            <div className="pd-form-row">
                <label htmlFor={`${uid}-city`}>City</label>
                <input
                    id={`${uid}-city`}
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    onKeyDown={preventSubmitOnEnter}
                    placeholder="City"
                    required
                    disabled={disabled}
                />
            </div>
            <div className="pd-form-row">
                <label htmlFor={`${uid}-state`}>State</label>
                <select
                    id={`${uid}-state`}
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    required
                    disabled={disabled}
                >
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
            <div className="pd-form-row">
                <label htmlFor={`${uid}-zip`}>Zip code</label>
                <input
                    id={`${uid}-zip`}
                    type="text"
                    value={form.zip_code}
                    onChange={(e) => setForm((f) => ({ ...f, zip_code: e.target.value }))}
                    onKeyDown={preventSubmitOnEnter}
                    placeholder="Zip code"
                    required
                    disabled={disabled}
                />
            </div>
        </>
    )
}
