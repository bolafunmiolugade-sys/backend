-- Create class_schedules table
CREATE TABLE IF NOT EXISTS class_schedules (
  id SERIAL PRIMARY KEY,
  course_code TEXT NOT NULL,
  lecturer_name TEXT,
  location_lat DOUBLE PRECISION NOT NULL,
  location_long DOUBLE PRECISION NOT NULL,
  class_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  class_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  attendance_window_minutes INTEGER NULL DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Optional index for lookups by course_code and active schedules
CREATE INDEX IF NOT EXISTS idx_class_schedules_course_active ON class_schedules(course_code, is_active, class_start_time);
