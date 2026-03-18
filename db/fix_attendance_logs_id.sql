-- Fix log_id to be auto-incrementing
-- 1. Create a sequence
CREATE SEQUENCE IF NOT EXISTS attendance_logs_log_id_seq;

-- 2. Alter the column to use the sequence and set NOT NULL
ALTER TABLE attendance_logs 
  ALTER COLUMN log_id SET DEFAULT nextval('attendance_logs_log_id_seq'),
  ALTER COLUMN log_id SET NOT NULL;

-- 3. Own the sequence
ALTER SEQUENCE attendance_logs_log_id_seq OWNED BY attendance_logs.log_id;

-- 4. Sync the sequence if there are existing rows
SELECT setval('attendance_logs_log_id_seq', COALESCE((SELECT MAX(log_id) FROM attendance_logs), 0) + 1);
