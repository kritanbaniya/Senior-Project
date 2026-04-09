import { Link } from 'react-router-dom'
import type { QueueEntryRow } from '../types'

type PatientQueueCardProps = {
  clinicSelected: boolean
  selectedClinicName: string | null
  loading: boolean
  row: QueueEntryRow | null
  activePosition: number | null
  peopleAhead: number | null
  exitState: 'left' | 'removed_from_active' | null
  onJoin: () => void
  onLeave: () => void
  onClearClinic: () => void
}

export default function PatientQueueCard({
  clinicSelected,
  selectedClinicName,
  loading,
  row,
  activePosition,
  peopleAhead,
  exitState,
  onJoin,
  onLeave,
  onClearClinic,
}: PatientQueueCardProps) {
  const hasActiveQueueEntry = row?.is_active === true

  return (
    <section
      id="queue"
      className="min-h-[400px] w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-[0px_4px_14px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all duration-300 ease-out motion-reduce:transition-none hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0px_20px_40px_rgba(15,23,42,0.14)]"
    >
      <div className="border-b border-slate-200/80 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-800">Check-in & queue</h2>
      </div>

      <div className="px-6 py-5">
        {loading ? (
          <p className="text-sm text-slate-500">Loading queue status...</p>
        ) : hasActiveQueueEntry ? (
          <>
            {row?.status === 'pending' ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm leading-6 text-slate-500">
                  Queue request submitted. Waiting for nurse approval.
                </p>

                <div>
                  <button
                    type="button"
                    onClick={onLeave}
                    className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                  >
                    Leave Queue
                  </button>
                </div>
              </div>
            ) : row?.status === 'waiting' ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm leading-6 text-slate-500">You are in active queue.</p>

                <div className="flex flex-wrap gap-4">
                  <div className="min-w-[120px] rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Position
                    </div>
                    <div className="mt-1 text-2xl font-bold text-sky-700">
                      {activePosition ?? '-'}
                    </div>
                  </div>

                  <div className="min-w-[140px] rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      People ahead
                    </div>
                    <div className="mt-1 text-2xl font-bold text-sky-700">
                      {peopleAhead ?? '-'}
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={onLeave}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    leave queue
                  </button>
                </div>
              </div>
            ) : row?.status === 'called' ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm leading-6 text-slate-500">
                  You have been called! Please proceed to the front desk.
                </p>

                <div className="flex flex-wrap gap-4">
                  <div className="min-w-[120px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Position
                    </div>
                    <div className="mt-1 text-2xl font-bold text-amber-700">
                      {activePosition ?? '-'}
                    </div>
                  </div>
                </div>
              </div>
            ) : row?.status === 'in_progress' ? (
              <p className="text-sm leading-6 text-slate-500">Your visit is in progress.</p>
            ) : (
              <p className="text-sm leading-6 text-slate-500">You have an active queue entry.</p>
            )}
          </>
        ) : !clinicSelected ? (
          <div className="flex flex-col gap-4">
            {exitState && (
              <p className="text-sm leading-6 text-slate-500">
                {exitState === 'left'
                  ? 'You have left the queue.'
                  : 'You were called and moved out of active queue.'}
              </p>
            )}

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Choose a clinic first to join queue.
            </p>

            <div>
              <Link
                to="/clinic-discovery"
                className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Browse Clinics
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {exitState && (
              <p className="text-sm leading-6 text-slate-500">
                {exitState === 'left'
                  ? 'You have left the queue.'
                  : 'You were called and moved out of active queue.'}
              </p>
            )}

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Selected clinic: {selectedClinicName ?? 'Clinic selected'}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onClearClinic}
                className="rounded-lg bg-red-400 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-red-600"
              >
                Remove Selected Clinic
              </button>

              <Link
                to="/clinic-discovery"
                className="inline-flex rounded-lg bg-yellow-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-yellow-400"
              >
                Browse Clinics
              </Link>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Join this clinic queue to get started.
            </p>

            <div>
              <button
                type="button"
                onClick={onJoin}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Join Queue
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}