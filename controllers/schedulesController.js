const courseModel = require("../models/courseModel");
const classScheduleModel = require("../models/classScheduleModel");

exports.createSchedule = async (req, res) => {
  try {
    const {
      course_id,
      lecturer_name,
      location_lat,
      location_long,
      class_start_time,
      class_end_time,
      attendance_window_minutes,
      radius_m,
    } = req.body;



    if (
      !course_id ||
      !location_lat ||
      !location_long ||
      !class_start_time ||
      !class_end_time
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    // Validate course exists ( using as course_id)
    const course = await courseModel.getCourseById(course_id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found." });
    }

    const schedule = await classScheduleModel.createSchedule({
      course_code: course_id,
      lecturer_name,
      location_lat,
      location_long,
      class_start_time,
      class_end_time,
      attendance_window_minutes,
      radius_m,
    });



    return res.status(201).json({ success: true, schedule });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getallSchedules = async (req, res) => {
  try {
    const schedules = await classScheduleModel.getAllSchedules();
    return res.status(200).json({ success: true, schedules });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Lecturer can set or update attendance window during the class hour
exports.updateAttendanceWindow = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const { attendance_window } = req.body;

    if (attendance_window == null) {
      return res
        .status(400)
        .json({ success: false, message: "attendance_window is required." });
    }

    const schedule = await classScheduleModel.getById(scheduleId);
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Schedule not found." });
    }

    if (!schedule.is_active) {
      return res.status(403).json({
        success: false,
        message: "Cannot modify attendance window for an inactive schedule.",
      });
    }

    const now = new Date();
    const start = new Date(schedule.class_start_time);
    const end = schedule.class_end_time
      ? new Date(schedule.class_end_time)
      : null;

    // Allow update only during class hour (between start and end). If end not set, allow if now >= start
    const withinClassHour = end ? now >= start && now <= end : now >= start;
    if (!withinClassHour) {
      return res.status(403).json({
        success: false,
        message:
          "Attendance window can only be set during the scheduled class hour.",
      });
    }

    const minutes = parseInt(attendance_window, 10);
    if (isNaN(minutes) || minutes < 0) {
      return res.status(400).json({
        success: false,
        message: "attendance_window must be a non-negative integer.",
      });
    }

    const updated = await classScheduleModel.updateAttendanceWindow(
      scheduleId,
      minutes,
    );

    return res.status(200).json({ success: true, schedule: updated });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const {
      location_lat,
      location_long,
      class_start_time,
      class_end_time,
      attendance_window_minutes,
      radius_m,
    } = req.body;



    const schedule = await classScheduleModel.getById(scheduleId);
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Schedule not found." });
    }

    if (!schedule.is_active) {
      return res.status(403).json({
        success: false,
        message: "Cannot modify an inactive schedule.",
      });
    }

    const updated = await classScheduleModel.updateSchedule(scheduleId, {
      location_lat,
      location_long,
      class_start_time,
      class_end_time,
      attendance_window_minutes,
      radius_m,
    });



    return res.status(200).json({ success: true, schedule: updated });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getScheduleById = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = await classScheduleModel.getById(scheduleId);
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Schedule not found." });
    }
    return res.status(200).json({ success: true, schedule });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = await classScheduleModel.getById(scheduleId);
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Schedule not found." });
    }

    await classScheduleModel.deleteSchedule(scheduleId);

    return res
      .status(200)
      .json({ success: true, message: "Schedule deleted successfully." });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

