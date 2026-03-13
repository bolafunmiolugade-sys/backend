-- Alter attendance_logs to add schedule_id foreign key
ALTER TABLE attendance_logs
  ADD COLUMN IF NOT EXISTS schedule_id INTEGER;

-- Add FK constraint if not present (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'attendance_logs' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'schedule_id'
  ) THEN
    ALTER TABLE attendance_logs
      ADD CONSTRAINT fk_attendance_schedule FOREIGN KEY (schedule_id) REFERENCES class_schedules(id) ON DELETE SET NULL;
  END IF;
END$$;
