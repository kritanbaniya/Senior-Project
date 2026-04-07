import { supabase } from '../../lib/supabase'

export type SaveMedicalHistoryData = {
  patientId: string
  doctorId: string
  doctorName: string
  diagnosis: string
  symptoms?: string
  observations?: string
  treatmentPlan?: string
  prescriptions?: string
  followUpRecommended?: boolean
  followUpNotes?: string
}

export type MedicalHistoryRecord = {
  id: string
  patient_id: string
  doctor_id: string
  visit_date: string
  diagnosis: string
  symptoms: string | null
  observations: string | null
  treatment_plan: string | null
  prescriptions: string | null
  follow_up_recommended: boolean
  follow_up_notes: string | null
  doctor_name: string
  created_at: string
}

/**
 * Save a new medical history entry (visit notes)
 */
export async function saveMedicalHistory(data: SaveMedicalHistoryData) {
  const { error } = await supabase
    .from('medical_history')
    .insert({
      patient_id: data.patientId,
      doctor_id: data.doctorId,
      visit_date: new Date().toISOString().split('T')[0],
      diagnosis: data.diagnosis,
      symptoms: data.symptoms || null,
      observations: data.observations || null,
      treatment_plan: data.treatmentPlan || null,
      prescriptions: data.prescriptions || null,
      follow_up_recommended: data.followUpRecommended || false,
      follow_up_notes: data.followUpNotes || null,
      doctor_name: data.doctorName,
    })

  return { error }
}

/**
 * Fetch medical history for a specific patient
 */
export async function fetchMedicalHistory(patientId: string) {
  const { data, error } = await supabase
    .from('medical_history')
    .select('*')
    .eq('patient_id', patientId)
    .order('visit_date', { ascending: false })

  return { data: data as MedicalHistoryRecord[] | null, error }
}