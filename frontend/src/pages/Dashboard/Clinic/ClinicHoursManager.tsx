import { useState, useEffect } from 'react'
import { useClinicDashboard } from './ClinicADashBoard'
import type { ClinicHours, DayHours } from './ClinicADashBoard'

const DAYS: { key: keyof ClinicHours; label: string }[] = [
  { key: 'monday',    label: 'Monday'    },
  { key: 'tuesday',   label: 'Tuesday'   },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday',  label: 'Thursday'  },
  { key: 'friday',    label: 'Friday'    },
  { key: 'saturday',  label: 'Saturday'  },
  { key: 'sunday',    label: 'Sunday'    },
]

const DEFAULT_HOURS: ClinicHours = {
  monday:    { open: '09:00', close: '17:00' },
  tuesday:   { open: '09:00', close: '17:00' },
  wednesday: { open: '09:00', close: '17:00' },
  thursday:  { open: '09:00', close: '17:00' },
  friday:    { open: '09:00', close: '17:00' },
  saturday:  null,
  sunday:    null,
}

function buildInitialHours(saved: ClinicHours | null): ClinicHours {
  if (!saved) return { ...DEFAULT_HOURS }
  return { ...DEFAULT_HOURS, ...saved }
}

export default function ClinicHoursManager() {
  const { clinicRow, loading, saving, message, setMessage, handleClinicHoursUpdate } =
    useClinicDashboard()

  const [hours, setHours] = useState<ClinicHours>(() =>
    buildInitialHours(clinicRow?.clinic_hours ?? null),
  )

  useEffect(() => {
    if (clinicRow) {
      setHours(buildInitialHours(clinicRow.clinic_hours))
    }
  }, [clinicRow])

  const toggleDay = (key: keyof ClinicHours, open: boolean) => {
    setHours((prev) => ({
      ...prev,
      [key]: open ? { open: '09:00', close: '17:00' } : null,
    }))
  }

  const updateTime = (key: keyof ClinicHours, field: 'open' | 'close', value: string) => {
    setHours((prev) => {
      const day = prev[key] as DayHours
      if (!day) return prev
      return { ...prev, [key]: { ...day, [field]: value } }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    for (const { key, label } of DAYS) {
      const day = hours[key]
      if (day && day.open >= day.close) {
        setMessage({
          type: 'error',
          text: `${label}: opening time must be before closing time.`,
        })
        return
      }
    }

    await handleClinicHoursUpdate(hours)
  }

  if (loading) {
    return <p className="pd-empty">Loading...</p>
  }

  if (!clinicRow) {
    return (
      <section
        className="pd-card"
        style={{ gridColumn: '1 / -1' }}
      >
        <h2 className="pd-card-title">Clinic Hours</h2>
        <div className="pd-alert pd-alert-warning">
          You need to create your clinic before setting clinic hours. Go to <strong>My Clinic</strong> to get started.
        </div>
      </section>
    )
  }

  return (
    <section
      className="pd-card"
      style={{ gridColumn: '1 / -1' }}
    >
      <h2 className="pd-card-title">Clinic Hours</h2>
      <p className="pd-card-desc">
        Set your clinic's opening and closing times. Toggle a day off to mark it as closed.
      </p>

      <form className="pd-form" onSubmit={handleSubmit}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
            <thead>
              <tr>
                <th style={thStyle}>Day</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Opens at</th>
                <th style={thStyle}>Closes at</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map(({ key, label }) => {
                const day = hours[key]
                const isOpen = day !== null
                return (
                  <tr key={key} style={trStyle(isOpen)}>
                    <td style={tdLabelStyle}>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{label}</span>
                    </td>
                    <td style={tdStyle}>
                      <label style={toggleLabelStyle}>
                        <input
                          type="checkbox"
                          checked={isOpen}
                          onChange={(e) => toggleDay(key, e.target.checked)}
                          style={{ display: 'none' }}
                        />
                        <span style={toggleTrackStyle(isOpen)}>
                          <span style={toggleThumbStyle(isOpen)} />
                        </span>
                        <span style={{ fontSize: '0.85rem', color: isOpen ? '#0f766e' : '#94a3b8', fontWeight: 500 }}>
                          {isOpen ? 'Open' : 'Closed'}
                        </span>
                      </label>
                    </td>
                    <td style={tdStyle}>
                      {isOpen ? (
                        <input
                          type="time"
                          value={day!.open}
                          onChange={(e) => updateTime(key, 'open', e.target.value)}
                          required
                          style={timeInputStyle}
                        />
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {isOpen ? (
                        <input
                          type="time"
                          value={day!.close}
                          onChange={(e) => updateTime(key, 'close', e.target.value)}
                          required
                          style={timeInputStyle}
                        />
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {message && (
          <p
            className={
              message.type === 'error' ? 'pd-alert pd-alert-warning' : 'pd-card-desc'
            }
            style={{ marginTop: '1rem' }}
          >
            {message.type === 'success' ? '✓ ' : ''}{message.text}
          </p>
        )}

        <div className="pd-form-actions" style={{ marginTop: '1.25rem' }}>
          <button type="submit" className="pd-btn pd-btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save hours'}
          </button>
        </div>
      </form>
    </section>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '0.5rem 0.75rem',
  borderBottom: '2px solid #e2e8f0',
}

const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
  verticalAlign: 'middle',
}

const tdLabelStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
  verticalAlign: 'middle',
  minWidth: '110px',
}

const trStyle = (isOpen: boolean): React.CSSProperties => ({
  borderBottom: '1px solid #f1f5f9',
  background: isOpen ? '#f8fafc' : 'transparent',
  transition: 'background 0.15s',
})

const toggleLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: 'pointer',
  userSelect: 'none',
}

const toggleTrackStyle = (isOn: boolean): React.CSSProperties => ({
  position: 'relative',
  display: 'inline-block',
  width: '36px',
  height: '20px',
  borderRadius: '999px',
  background: isOn ? '#0d9488' : '#cbd5e1',
  transition: 'background 0.2s',
  flexShrink: 0,
})

const toggleThumbStyle = (isOn: boolean): React.CSSProperties => ({
  position: 'absolute',
  top: '2px',
  left: isOn ? '18px' : '2px',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  transition: 'left 0.2s',
})

const timeInputStyle: React.CSSProperties = {
  padding: '0.3rem 0.5rem',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  fontSize: '0.9rem',
  color: '#1e293b',
  background: '#fff',
  outline: 'none',
  cursor: 'pointer',
}
