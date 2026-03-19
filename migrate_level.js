const pool = require('./db/config');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'db', 'add_level_to_courses.sql'), 'utf8');
    await pool.query(sql);
    console.log('Migration successful: level column added to courses');
    
    // Optional: Auto-populate level from course_id first digit
    // e.g., CSC 101 -> 100
    const populateSql = `
      UPDATE courses 
      SET level = SUBSTRING(course_id FROM '[0-9]') || '00' 
      WHERE level IS NULL AND course_id ~ '[0-9]';
    `;
    await pool.query(populateSql);
    console.log('Auto-populated levels based on course codes');
    
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
