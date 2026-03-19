-- Migration: add level to courses table
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS level VARCHAR(10);

-- populate initial levels based on course code first digit
UPDATE courses SET level = SUBSTRING(course_id FROM '[0-9]') || '00' WHERE (level IS NULL OR level = '') AND course_id ~ '[0-9]';
