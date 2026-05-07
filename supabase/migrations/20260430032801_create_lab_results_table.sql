-- Create lab_results table
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id TEXT NOT NULL,
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES medical_history(id) ON DELETE
    SET NULL,
        -- Test Information
        test_type TEXT NOT NULL,
        test_category TEXT,
        test_date DATE NOT NULL DEFAULT CURRENT_DATE,
        -- Results
        result TEXT NOT NULL,
        result_details TEXT,
        notes TEXT,
        -- Metadata
        ordered_by_doctor_name TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
);
-- Create indexes
CREATE INDEX idx_lab_results_patient ON lab_results(patient_id);
CREATE INDEX idx_lab_results_doctor ON lab_results(doctor_id);
CREATE INDEX idx_lab_results_visit ON lab_results(visit_id);
CREATE INDEX idx_lab_results_date ON lab_results(test_date DESC);
CREATE INDEX idx_lab_results_type ON lab_results(test_type);
-- Enable Row Level Security
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
-- RLS Policies
CREATE POLICY "Doctors can insert lab results" ON lab_results FOR
INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors can view own lab results" ON lab_results FOR
SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can update own lab results" ON lab_results FOR
UPDATE USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can delete own lab results" ON lab_results FOR DELETE USING (auth.uid() = doctor_id);