-- ============================================================================
-- FIX RLS: enforce clinic-level isolation for all medical records
-- ============================================================================
-- =========================
-- MEDICAL HISTORY
-- =========================
DROP POLICY IF EXISTS "Doctors can view all visit summaries" ON medical_history;
DROP POLICY IF EXISTS "Doctors can view notes" ON medical_history;
CREATE POLICY "Doctors can view same clinic visit summaries" ON medical_history FOR
SELECT USING (
        doctor_id IN (
            SELECT m2.user_id
            FROM "Memberships" m1
                JOIN "Memberships" m2 ON m1.clinic_id = m2.clinic_id
            WHERE m1.user_id = auth.uid()
        )
    );
-- =========================
-- PRESCRIPTIONS
-- =========================
DROP POLICY IF EXISTS "Doctors can view all prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can view own prescriptions" ON prescriptions;
CREATE POLICY "Doctors can view same clinic prescriptions" ON prescriptions FOR
SELECT USING (
        doctor_id IN (
            SELECT m2.user_id
            FROM "Memberships" m1
                JOIN "Memberships" m2 ON m1.clinic_id = m2.clinic_id
            WHERE m1.user_id = auth.uid()
        )
    );
-- =========================
-- LAB RESULTS
-- =========================
DROP POLICY IF EXISTS "Doctors can view all lab results" ON lab_results;
DROP POLICY IF EXISTS "Doctors can view own lab results" ON lab_results;
CREATE POLICY "Doctors can view same clinic lab results" ON lab_results FOR
SELECT USING (
        doctor_id IN (
            SELECT m2.user_id
            FROM "Memberships" m1
                JOIN "Memberships" m2 ON m1.clinic_id = m2.clinic_id
            WHERE m1.user_id = auth.uid()
        )
    );
-- =========================
-- PERFORMANCE INDEX (optional but good)
-- =========================
CREATE INDEX IF NOT EXISTS idx_memberships_user_clinic ON "Memberships"(user_id, clinic_id);