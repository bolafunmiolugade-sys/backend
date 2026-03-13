-- Migration: add matric_number to attendance_logs
-- Run this with psql or your preferred Postgres client

ALTER TABLE attendance_logs
  ADD COLUMN IF NOT EXISTS matric_number VARCHAR(64);

-- Optional index for faster lookups by matric_number
CREATE INDEX IF NOT EXISTS idx_attendance_logs_matric_number ON attendance_logs(matric_number);
