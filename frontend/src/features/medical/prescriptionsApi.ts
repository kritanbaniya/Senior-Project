import { supabase } from '../../lib/supabase'

export type PrescriptionData = {
  patientId: string
  doctorId: string
  visitId?: string
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  doctorName: string
}

export type PrescriptionRecord = {
  id: string
  patient_id: string
  doctor_id: string
  visit_id: string | null
  medication_name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string | null
  prescribed_date: string
  status: string
  doctor_name: string
  created_at: string
  updated_at: string
}

/**
 * Save a new prescription
 */
export async function savePrescription(data: PrescriptionData) {
  const { error } = await supabase
    .from('prescriptions')
    .insert({
      patient_id: data.patientId,
      doctor_id: data.doctorId,
      visit_id: data.visitId || null,
      medication_name: data.medicationName,
      dosage: data.dosage,
      frequency: data.frequency,
      duration: data.duration,
      instructions: data.instructions || null,
      prescribed_date: new Date().toISOString().split('T')[0],
      status: 'active',
      doctor_name: data.doctorName,
    })

  return { error }
}

/**
 * Fetch active prescriptions for a patient
 */
export async function fetchActivePrescriptions(patientId: string) {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('patient_id', patientId)
    .eq('status', 'active')
    .order('prescribed_date', { ascending: false })

  return { data: data as PrescriptionRecord[] | null, error }
}

/**
 * Fetch all prescriptions for a patient
 */
export async function fetchAllPrescriptions(patientId: string) {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('patient_id', patientId)
    .order('prescribed_date', { ascending: false })

  return { data: data as PrescriptionRecord[] | null, error }
}

/**
 * Update prescription status
 */
export async function updatePrescriptionStatus(
  prescriptionId: string,
  status: 'active' | 'completed' | 'discontinued'
) {
  const { error } = await supabase
    .from('prescriptions')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', prescriptionId)

  return { error }
}