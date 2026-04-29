// max total visible dots (your dot + ahead dots) before showing overflow badge
const MAX_TOTAL_DOTS = 10
const WAVE_STEP_MS = 100

type QueuePositionDotsProps = {
  position: number
  status: 'waiting' | 'called'
}

export default function QueuePositionDots({ position, status }: QueuePositionDotsProps) {
  const peopleAhead = Math.max(0, position - 1)
  // total rendered dots = 1 (you) + visibleAhead; cap so mobile never overflows
  const visibleAhead = Math.min(peopleAhead, MAX_TOTAL_DOTS - 1)
  const overflow = peopleAhead - visibleAhead

  const isCalled = status === 'called'

  let statusLabel: string
  if (isCalled) {
    statusLabel = "you've been called"
  } else if (peopleAhead === 0) {
    statusLabel = "you're next!"
  } else if (peopleAhead === 1) {
    statusLabel = '1 person ahead'
  } else {
    statusLabel = `${peopleAhead} people ahead`
  }

  return (
    <div className="qpd-wrapper">
      <div className="pd-queue-stats">
        <div className="pd-queue-stat">
          <span className="pd-queue-label">Position</span>
          <span className={`pd-queue-value${isCalled ? ' pd-queue-value-called' : ''}`}>{position}</span>
        </div>
      </div>

      <div className="qpd-track" aria-label={statusLabel}>
        {/* your dot — leftmost (index 0), wave starts here */}
        <div
          className={`qpd-dot qpd-dot-you${isCalled ? ' qpd-dot-called' : ''}`}
          style={{ animationDelay: '0ms' }}
        />

        {/* dots representing people ahead, each staggered by WAVE_STEP_MS */}
        {Array.from({ length: visibleAhead }).map((_, i) => (
          <div
            key={i}
            className="qpd-dot qpd-dot-ahead"
            style={{ animationDelay: `${(i + 1) * WAVE_STEP_MS}ms` }}
          />
        ))}

        {/* overflow badge — not animated */}
        {overflow > 0 && (
          <span className="qpd-overflow">+{overflow}</span>
        )}
      </div>

      <p className="qpd-status-label">{statusLabel}</p>
    </div>
  )
}
