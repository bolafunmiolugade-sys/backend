-- Migration: add lecturer_id to courses table
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS lecturer_id INTEGER REFERENCES lecturers(id) ON DELETE SET NULL;

-- Optional index for faster lookups by lecturer_id
CREATE INDEX IF NOT EXISTS idx_courses_lecturer_id ON courses(lecturer_id);
