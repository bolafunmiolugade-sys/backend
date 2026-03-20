const courseModel = require("../models/courseModel");

exports.listCourses = async (req, res) => {
  try {
    let courses;
    // If lecturer is logged in, only show their assigned courses
    if (req.user && req.user.role === "lecturer") {
      courses = await courseModel.getCoursesByLecturerId(req.user.id);
    } else {
      // Otherwise (admin or student), show all courses
      courses = await courseModel.getAllCourses();
    }
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
    
    // Security: Lecturers can only view their own courses in detail if they are not admin
    if (req.user && req.user.role === "lecturer" && course.lecturer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "Access Denied. This course is not assigned to you." });
    }

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
    
    // Security: Lecturers can only view their own courses in detail
    if (req.user && req.user.role === "lecturer" && course.lecturer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "Access Denied. This course is not assigned to you." });
    }

    return res.status(200).json({ success: true, course });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.createCourse = async (req, res) => {
  const { course_id, course_name, center_lat, center_lon, radius_m, department, department_code, lecturer_id } = req.body;

  if (!course_id || !course_name || !center_lat || !center_lon || !radius_m || !department || !department_code) {
    return res.status(400).json({
      success: false,
      message:
        "course_id, course_name, center_lat, center_lon, radius_m, department, and department_code are required.",
    });
  }
  try {
    const course = await courseModel.createCourse({
      course_id,
      course_name,
      center_lat,
      center_lon,
      radius_m,
      department,
      department_code,
      lecturer_id,
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
  const { course_name, center_lat, center_lon, radius_m, department, department_code, lecturer_id } = req.body;

  if (
    course_name === undefined &&
    center_lat === undefined &&
    center_lon === undefined &&
    radius_m === undefined &&
    department === undefined &&
    department_code === undefined &&
    lecturer_id === undefined
  ) {
    return res.status(400).json({
      success: false,
      message:
        "At least one field must be provided to update.",
    });
  }

  try {
    const updatedCourse = await courseModel.updateCourse(id, {
      course_name,
      center_lat,
      center_lon,
      radius_m,
      department,
      department_code,
      lecturer_id,
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

exports.assignLecturer = async (req, res) => {
    const { id } = req.params;
    const { lecturer_id } = req.body;

    if (!lecturer_id) {
        return res.status(400).json({ success: false, message: "lecturer_id is required." });
    }

    try {
        const course = await courseModel.assignLecturer(id, lecturer_id);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });
        return res.status(200).json({ success: true, course, message: "Lecturer assigned successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
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
exports.getAdminDepartments = async (req, res) => {
  try {
    const departments = await courseModel.getUniqueDepartments();
    return res.status(200).json({ success: true, departments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
exports.getCourseMembers = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await courseModel.getCourseById(id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    // Security: Lecturers can only view members of their own courses
    if (req.user.role === "lecturer" && course.lecturer_id !== req.user.id) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Access Denied. This course is not assigned to you.",
        });
    }

    const members = await courseModel.getCourseMembers(id);
    return res.status(200).json({ success: true, members });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
