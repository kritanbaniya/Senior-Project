import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type ClinicContextValue = {
  selectedClinicId: string | null
  setSelectedClinicId: (clinicId: string | null) => void
}

const ClinicContext = createContext<ClinicContextValue | null>(null)

export function useClinicContext(): ClinicContextValue {
  const ctx = useContext(ClinicContext)
  if (!ctx) throw new Error('useClinicContext must be used inside ClinicProvider')
  return ctx
}

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null)

  const value = useMemo(
    () => ({
      selectedClinicId,
      setSelectedClinicId,
    }),
    [selectedClinicId]
  )

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
}
