const http = require("http");

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };
    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testAdmin() {
  try {
    console.log("Starting Admin Tests...");

    // 1. Try to create course without auth
    console.log(">> Testing Unauthorized Course Creation...");
    const unauthRes = await request("POST", "/api/courses", {
      course_id: "TEST101",
      course_name: "Test Course",
      center_lat: 0,
      center_lon: 0,
      radius_m: 50
    });
    console.log("Response:", unauthRes.status);
    if (unauthRes.status !== 401 && unauthRes.status !== 403) throw new Error("Should have been unauthorized");

    // 2. Login Admin
    console.log(">> Testing Admin Login...");
    const loginRes = await request("POST", "/api/admin/login", {
      email: "admin@university.edu",
      password: "adminpassword",
    });
    console.log("Response:", loginRes.status);
    if (loginRes.status !== 200 || !loginRes.data.token) throw new Error("Admin login failed");

    const adminToken = loginRes.data.token;

    // 3. Create course as Admin
    console.log(">> Testing Course Creation as Admin...");
    const createRes = await request("POST", "/api/courses", {
      course_id: `ADM${Date.now()}`,
      course_name: "Admin Test Course",
      center_lat: 10.5,
      center_lon: 10.5,
      radius_m: 60
    }, adminToken);
    console.log("Response:", createRes.status);
    if (createRes.status !== 201) throw new Error("Failed to create course");

    const newCourseId = createRes.data.course.course_id;

    // 4. Update course as Admin
    console.log(">> Testing Course Update as Admin...");
    const updateRes = await request("PUT", `/api/courses/${newCourseId}`, {
      course_name: "Updated Admin Course"
    }, adminToken);
    console.log("Response:", updateRes.status);
    if (updateRes.status !== 200) throw new Error("Failed to update course");

    // 5. Delete course as Admin
    console.log(">> Testing Course Deletion as Admin...");
    const deleteRes = await request("DELETE", `/api/courses/${newCourseId}`, null, adminToken);
    console.log("Response:", deleteRes.status);
    if (deleteRes.status !== 200) throw new Error("Failed to delete course");

    console.log(">> All admin tests passed!");
  } catch (err) {
    console.error("Test failed:", err.message || err);
    process.exit(1);
  }
}

testAdmin();
