import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type ClinicContextValue = {
  selectedClinicId: string | null
  selectedClinicName: string | null
  setSelectedClinicId: (clinicId: string | null) => void
  setSelectedClinicName: (clinicName: string | null) => void
}

const ClinicContext = createContext<ClinicContextValue | null>(null)

export function useClinicContext(): ClinicContextValue {
  const ctx = useContext(ClinicContext)
  if (!ctx) throw new Error('useClinicContext must be used inside ClinicProvider')
  return ctx
}

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null)
  const [selectedClinicName, setSelectedClinicName] = useState<string | null>(null)

  const value = useMemo(
    () => ({
      selectedClinicId,
      selectedClinicName,
      setSelectedClinicId,
      setSelectedClinicName,
    }),
    [selectedClinicId, selectedClinicName]
  )

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
}
