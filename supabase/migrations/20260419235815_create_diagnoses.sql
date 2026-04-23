CREATE TABLE diagnoses (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES doctor_info(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);