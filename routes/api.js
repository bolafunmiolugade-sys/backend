const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const isLecturer = require("../middleware/isLecturer");
const isAdmin = require("../middleware/isAdmin");
const authController = require("../controllers/authController");
const adminAuthController = require("../controllers/adminAuthController");
const attendanceController = require("../controllers/attendanceController");
const userCourseController = require("../controllers/userCourseController");
const coursesController = require("../controllers/coursesController");
const schedulesController = require("../controllers/schedulesController");
const lecturerAuthController = require("../controllers/lecturerAuthController");

// Public auth endpoints
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/users/forgot-password", authController.forgotPassword);
router.post("/users/reset-password", authController.resetPassword);

// Public Lecturer auth endpoints
router.post("/lecturers/register", lecturerAuthController.register);
router.post("/lecturers/login", lecturerAuthController.login);
router.post("/lecturers/forgot-password", lecturerAuthController.forgotPassword);
router.post("/lecturers/reset-password", lecturerAuthController.resetPassword);

// Public Admin auth endpoint
router.post("/admin/login", adminAuthController.login);

// Secure route: Student must be logged in to mark attendance
router.post("/mark-attendance", auth, attendanceController.markAttendance);

// Lecturer/rep route: create a class schedule
router.get("/classes/schedules", auth, schedulesController.getallSchedules);
router.post("/classes/schedule", auth, isLecturer, schedulesController.createSchedule);
// Update attendance window during class hour
router.patch(
  "/classes/schedule/:id/attendance-window",
  auth,
  isLecturer,
  schedulesController.updateAttendanceWindow
);
router.get("/classes/schedule/:id", auth, schedulesController.getScheduleById);
// General update to a class schedule (for lecturers)

router.put("/classes/schedule/:id", auth, isLecturer, schedulesController.updateSchedule);
// Get attendance list for a specific schedule (for lecturers)
router.get("/classes/schedule/:id/attendance", auth, isLecturer, attendanceController.getAttendanceByScheduleId);

// Student course registration (must be logged in)
router.post("/register-courses", auth, userCourseController.registerCourses);
router.get("/my-courses", auth, userCourseController.getMyCourses);

// Public course listing
router.get("/courses", coursesController.listCourses);
router.get("/courses/:id", coursesController.getCourse);
router.get("/courses/code/:course_code", coursesController.getCourseByCourseCode);

// Secure route: Create, Update, Delete a course (admin only)
router.post("/courses", auth, isAdmin, coursesController.createCourse);
router.put("/courses/:id", auth, isAdmin, coursesController.updateCourse);
router.delete("/courses/:id", auth, isAdmin, coursesController.deleteCourse);
router.get("/admin/attendance", auth, isAdmin, attendanceController.getAllAttendanceRecords);
router.get("/admin/attendance/:log_id", auth, isAdmin, attendanceController.getAttendanceByLogId);
router.get("/admin/students", auth, isAdmin, adminAuthController.getAllStudents);

module.exports = router;
