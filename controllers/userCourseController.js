const userCourseModel = require("../models/userCourseModel");
const courseModel = require("../models/courseModel");

exports.registerCourses = async (req, res) => {
  const matricNumber = req.user.matric_number;
  const { courses } = req.body;

  if (!Array.isArray(courses) || courses.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Provide a non-empty courses array." });
  }

  try {
    const registeredCourses = await userCourseModel.assignCoursesToUser(
      matricNumber,
      courses
    );
    return res.status(200).json({
      success: true,
      message: "Courses registered successfully.",
      courses: registeredCourses,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getMyCourses = async (req, res) => {
  const matricNumber = req.user.matric_number;
  try {
    const registeredCourses = await userCourseModel.getUserCourses(matricNumber);
    const eligibleCourses =
      await courseModel.getEligibleCoursesForStudent(matricNumber);

    const coursesById = new Map();
    [...registeredCourses, ...eligibleCourses].forEach((course) => {
      if (course?.course_id) {
        coursesById.set(course.course_id, course);
      }
    });

    return res
      .status(200)
      .json({ success: true, courses: Array.from(coursesById.values()) });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
