const courseModel = require("../models/courseModel");

exports.listCourses = async (req, res) => {
  try {
    const courses = await courseModel.getAllCourses();
    return res.status(200).json({ success: true, courses });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await courseModel.getCourseById(id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    return res.status(200).json({ success: true, course });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getCourseByCourseCode = async (req, res) => {
  const { course_code } = req.params;
  try {
    const course = await courseModel.getCourseByCourseCode(course_code);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    return res.status(200).json({ success: true, course });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.createCourse = async (req, res) => {
  const { course_id, course_name, center_lat, center_lon, radius_m } = req.body;

  if (!course_id || !course_name || !center_lat || !center_lon || !radius_m) {
    return res.status(400).json({
      success: false,
      message:
        "course_id, course_name, center_lat, center_lon, and radius_m are required.",
    });
  }
  try {
    const course = await courseModel.createCourse({
      course_id,
      course_name,
      center_lat,
      center_lon,
      radius_m,
    });
    return res.status(201).json({ success: true, course });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const { course_name, center_lat, center_lon, radius_m } = req.body;

  if (
    course_name === undefined &&
    center_lat === undefined &&
    center_lon === undefined &&
    radius_m === undefined
  ) {
    return res.status(400).json({
      success: false,
      message:
        "At least one of course_name, center_lat, center_lon, or radius_m must be provided to update.",
    });
  }

  try {
    const updatedCourse = await courseModel.updateCourse(id, {
      course_name,
      center_lat,
      center_lon,
      radius_m,
    });

    if (!updatedCourse)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    return res.status(200).json({ success: true, course: updatedCourse });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.deleteCourse = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCourse = await courseModel.deleteCourse(id);

    if (!deletedCourse) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    return res.status(200).json({ success: true, course: deletedCourse, message: "Course deleted successfully" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
