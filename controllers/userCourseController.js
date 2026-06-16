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
    let courses = await userCourseModel.getUserCourses(matricNumber);

    if (courses.length === 0) {
      courses = await courseModel.getEligibleCoursesForStudent(matricNumber);
    }

    return res.status(200).json({ success: true, courses });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
