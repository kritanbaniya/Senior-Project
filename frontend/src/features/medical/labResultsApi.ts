import { supabase } from '../../lib/supabase'

export type LabResultData = {
  patientId: string
  doctorId: string
  visitId?: string
  testType: string
  testCategory?: string
  testDate?: string
  result: string
  resultDetails?: string
  notes?: string
  orderedByDoctorName: string
}

export type LabResultRecord = {
  id: string
  patient_id: string
  doctor_id: string
  visit_id: string | null
  test_type: string
  test_category: string | null
  test_date: string
  result: string
  result_details: string | null
  notes: string | null
  ordered_by_doctor_name: string
  created_at: string
  updated_at: string
}

/**
 * Save a new lab result
 */
export async function saveLabResult(data: LabResultData) {
  const { error } = await supabase
    .from('lab_results')
    .insert({
      patient_id: data.patientId,
      doctor_id: data.doctorId,
      visit_id: data.visitId || null,
      test_type: data.testType,
      test_category: data.testCategory || null,
      test_date: data.testDate || new Date().toISOString().split('T')[0],
      result: data.result,
      result_details: data.resultDetails || null,
      notes: data.notes || null,
      ordered_by_doctor_name: data.orderedByDoctorName,
    })

  return { error }
}

/**
 * Fetch lab results for a patient
 */
export async function fetchLabResults(patientId: string) {
  const { data, error } = await supabase
    .from('lab_results')
    .select('*')
    .eq('patient_id', patientId)
    .order('test_date', { ascending: false })

  return { data: data as LabResultRecord[] | null, error }
}

/**
 * Delete a lab result
 */
export async function deleteLabResult(resultId: string) {
  const { error } = await supabase
    .from('lab_results')
    .delete()
    .eq('id', resultId)

  return { error }
}