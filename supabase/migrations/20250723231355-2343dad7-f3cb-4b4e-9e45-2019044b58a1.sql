-- Actualizar la vista appointments_view para incluir el teléfono del paciente
DROP VIEW IF EXISTS appointments_view;

CREATE VIEW appointments_view AS
SELECT 
    a.id,
    a.doctor_id,
    a.patient_id,
    a.time,
    a.duration_minutes,
    a.status,
    a.specialty,
    a.notes,
    CONCAT(pp.first_name, ' ', pp.last_name) AS patient_name,
    pp.phone AS patient_phone,
    CONCAT(dp.first_name, ' ', dp.last_name) AS doctor_name,
    d.specialty AS doctor_specialty
FROM appointments a
LEFT JOIN profiles pp ON a.patient_id = pp.id
LEFT JOIN profiles dp ON a.doctor_id = dp.id
LEFT JOIN doctors d ON a.doctor_id = d.id;