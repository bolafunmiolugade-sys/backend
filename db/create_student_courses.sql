-- Run this SQL to create the student_courses join table
CREATE TABLE IF NOT EXISTS student_courses (
  matric_number VARCHAR(50) REFERENCES users(matric_number) ON DELETE CASCADE,
  courses VARCHAR(20)[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (matric_number)
);

-- Example: insert initial mapping
-- INSERT INTO student_courses (matric_number, courses) VALUES ('U12345', ARRAY['CSC 401','CSC 405']);
