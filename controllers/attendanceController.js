const pool = require("../db/config");
const { calculateDistance } = require("../utils/haversine");
const classScheduleModel = require("../models/classScheduleModel");

const A_MAX = 15; // Max allowed GPS accuracy (meters)
const GEOFENCE_MAX_M = 50; // Maximum allowed distance from class location (meters)

exports.markAttendance = async (req, res) => {
  const {
    course_code,
    device_uuid,
    latitude,
    longitude,
    accuracy,
    is_mock_location_enabled,
    schedule_id,
  } = req.body;

  const userId = req.user.id;
  const matric_number = req.user.matric_number;

  try {
    // App-level anti-spoof and accuracy checks (fast rejects)
    if (is_mock_location_enabled) {
      return res.status(403).json({
        success: false,
        message: "Fraud detected: Mock locations enabled.",
      });
    }
    if (accuracy > A_MAX) {
      return res.status(403).json({
        success: false,
        message: "GPS signal too weak. Ensure you are in an open area.",
      });
    }

    if (!schedule_id) {
      return res.status(400).json({
        success: false,
        message: "Schedule ID is required.",
      });
    }

    // 1. Course Validation
    const courseQuery = await pool.query(
      "SELECT * FROM courses WHERE course_id = $1",
      [course_code],
    );
    if (courseQuery.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found." });
    }

    // 2. Schedule Discovery
    const schedule =
      await classScheduleModel.findActiveScheduleForCourse(course_code);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "No active schedule found for this course.",
      });
    }

    const now = new Date();
    const classStart = new Date(schedule.class_start_time);
    const classEnd = new Date(schedule.class_end_time);

    // ============================================================
    // 3. Time Window & Camping Gate Check
    // ============================================================

    // A. Standard Check: Is the class currently happening?
    if (now < classStart) {
      return res
        .status(403)
        .json({ success: false, message: "Class hasn't started yet." });
    }
    if (now > classEnd) {
      return res
        .status(403)
        .json({ success: false, message: "Attendance window has expired." });
    }

    // B. "Camping" Gate Logic
    // Fetch the minutes set by the lecturer (e.g., 10). If null, this check is skipped.
    const minutesBeforeEnd = schedule.attendance_window_minutes;

    if (minutesBeforeEnd) {
      // Calculate the exact time the "Gate" opens
      // Gate Time = Class End Time - (Minutes * 60,000 milliseconds)
      const gateOpenTime = new Date(
        classEnd.getTime() - minutesBeforeEnd * 60000,
      );

      // If right now is BEFORE that Gate Time, block them.
      if (now < gateOpenTime) {
        const minutesLeft = Math.ceil((gateOpenTime - now) / 60000);
        return res.status(403).json({
          success: false,
          message: `Attendance is locked. The lecturer requires you to wait. Opening in ${minutesLeft} minutes.`,
        });
      }
    }
    // ============================================================

    // 4. Geofencing Check using Haversine
    const distance = calculateDistance(
      schedule.location_lat,
      schedule.location_long,
      latitude,
      longitude,
    );
    if (distance > GEOFENCE_MAX_M) {
      // Log rejected attempt for auditing
      await pool.query(
        "INSERT INTO attendance_logs (user_id, matric_number, course_id, schedule_id, device_uuid, status, distance_m, accuracy_m) VALUES ($1, $2, $3, $4, $5, 'OUTSIDE_RANGE', $6, $7)",
        [
          userId,
          matric_number,
          course_code,
          schedule_id,
          device_uuid,
          "OUTSIDE_RANGE", // Fixed string literal for status
          distance.toFixed(2),
          accuracy,
        ],
      );
      return res.status(403).json({
        success: false,
        message: `You are too far from the class location (${distance.toFixed(
          0,
        )}m).`,
      });
    }

    // 5. Duplicate Check
    const dup = await pool.query(
      "SELECT * FROM attendance_logs WHERE user_id = $1 AND schedule_id = $2 AND status = 'VALID'",
      [userId, schedule_id],
    );
    if (dup.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "You have already marked attendance for this class.",
      });
    }

    // 6. Device Lock Check
    const deviceCheck = await pool.query(
      "SELECT * FROM attendance_logs WHERE device_uuid = $1 AND schedule_id = $2 AND course_id = $3 AND log_date = CURRENT_DATE AND status = 'VALID'",
      [device_uuid, schedule_id, course_code],
    );
    if (deviceCheck.rows.length > 0) {
      return res.status(403).json({
        success: false,
        message:
          "Security violation: This device has already been used for this classs today.",
      });
    }

    // Success: insert valid attendance log
    await pool.query(
      "INSERT INTO attendance_logs (user_id, matric_number, course_id, schedule_id, device_uuid, status, distance_m, accuracy_m) VALUES ($1, $2, $3, $4, $5, 'VALID', $6, $7)",
      [
        userId,
        matric_number,
        course_code,
        schedule_id,
        device_uuid,
        distance.toFixed(2),
        accuracy,
      ],
    );

    return res
      .status(200)
      .json({ success: true, message: "Attendance successfully marked!" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getAllAttendanceRecords = async (req, res) => {
  try {
    const query = `
      SELECT 
        al.matric_number,
        al.course_id,
        al.status,
        al.log_date,
        al.distance_m,
        al.accuracy_m,
        u.full_name as student_name,
        c.course_name
      FROM attendance_logs al
      LEFT JOIN users u ON al.matric_number = u.matric_number
      LEFT JOIN courses c ON al.course_id = c.course_id
      ORDER BY al.log_date DESC
    `;
    const result = await pool.query(query);
    return res.status(200).json({ success: true, attendance: result.rows });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getAttendanceByLogId = async (req, res) => {
  const { log_id } = req.params;
  try {
    const query = `
      SELECT 
        al.*,
        u.full_name as student_name,
        c.course_name
      FROM attendance_logs al
      LEFT JOIN users u ON al.matric_number = u.matric_number
      LEFT JOIN courses c ON al.course_id = c.course_id
      WHERE al.log_id::text = $1::text
    `;
    const result = await pool.query(query, [log_id]);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found" });
    }
    return res.status(200).json({ success: true, attendance: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getAttendanceByScheduleId = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        al.*,
        u.full_name as student_name,
        u.full_name,
        u.matric_number,
        u.department
      FROM attendance_logs al
      LEFT JOIN users u ON al.user_id = u.id OR al.user_id::text = u.user_id::text
      WHERE al.schedule_id::text = $1::text
      AND al.status = 'VALID'
      ORDER BY al.log_date DESC
    `;
    const result = await pool.query(query, [id]);
    return res.status(200).json({ success: true, attendance: result.rows });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getStudentAttendanceHistory = async (req, res) => {
  const userId = req.user.id;
  const matric_number = req.user.matric_number;

  try {
    const query = `
      SELECT 
        cs.id AS schedule_id,
        cs.course_code,
        c.course_name,
        cs.class_start_time,
        cs.class_end_time,
        al.status AS attendance_status,
        al.log_date,
        CASE 
          WHEN al.status = 'VALID' THEN 'Present'
          WHEN NOW() > cs.class_end_time THEN 'Absent'
          ELSE 'Upcoming'
        END AS display_status
      FROM class_schedules cs
      JOIN courses c ON cs.course_code = c.course_id
      JOIN student_courses sc ON cs.course_code = ANY(sc.courses)
      LEFT JOIN attendance_logs al ON cs.id = al.schedule_id AND al.user_id = $1 AND al.status = 'VALID'
      WHERE sc.matric_number = $2
      ORDER BY cs.class_start_time DESC
    `;
    const result = await pool.query(query, [userId, matric_number]);
    return res.status(200).json({ success: true, history: result.rows });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

