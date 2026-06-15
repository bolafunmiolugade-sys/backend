-- Migration: add shared/borrowed course eligibility support
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS eligible_departments TEXT[];

CREATE INDEX IF NOT EXISTS idx_courses_eligible_departments
  ON courses USING GIN (eligible_departments);
