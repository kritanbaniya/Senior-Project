-- Create prescriptions table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id TEXT NOT NULL,
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES medical_history(id) ON DELETE
    SET NULL,
        -- Medication Details
        medication_name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        frequency TEXT NOT NULL,
        duration TEXT NOT NULL,
        instructions TEXT,
        -- Dates
        prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
        -- Status
        status TEXT DEFAULT 'active' CHECK (
            status IN ('active', 'completed', 'discontinued')
        ),
        -- Metadata
        doctor_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
);
-- Create indexes
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_visit ON prescriptions(visit_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_date ON prescriptions(prescribed_date DESC);
-- Enable Row Level Security
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
-- RLS Policies
CREATE POLICY "Doctors can insert prescriptions" ON prescriptions FOR
INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors can view own prescriptions" ON prescriptions FOR
SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can update own prescriptions" ON prescriptions FOR
UPDATE USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can delete own prescriptions" ON prescriptions FOR DELETE USING (auth.uid() = doctor_id);