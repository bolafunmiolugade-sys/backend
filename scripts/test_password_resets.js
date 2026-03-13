const http = require("http");
const pool = require("../db/config");

function request(method, path, body) {
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

async function testPasswordReset() {
  try {
    console.log("Starting Password Reset Tests...");

    const userEmail = `student${Date.now()}@university.edu`;
    const userMatric = `M${Date.now()}`;
    const userPass = "oldpassword";
    
    const lecturerEmail = `prof${Date.now()}@university.edu`;
    const lecturerPass = "oldpassword";

    // 1. Setup Data - Register a User and Lecturer
    console.log(">> Setting up Data...");
    await request("POST", "/api/register", {
      matric_number: userMatric,
      email: userEmail,
      password: userPass,
      full_name: "Test Student",
      level: "100",
      department: "Science"
    });
    
    // Slight pause to ensure DB connection yields
    await new Promise(r => setTimeout(r, 500));

    await request("POST", "/api/lecturers/register", {
      email: lecturerEmail,
      password: lecturerPass,
      full_name: "Test Professor",
      department: "Science",
      qualifications: "Ph.D"
    });

    // 2. Test User Forgot Password
    console.log(">> Testing User Forgot Password...");
    const userForgotRes = await request("POST", "/api/users/forgot-password", {
      matric_number: userMatric,
      email: userEmail
    });
    console.log("Response:", userForgotRes.status);
    if (userForgotRes.status !== 200) throw new Error("User Forgot Password failed");

    // Retrieve OTP from DB for testing
    let otpRes = await pool.query("SELECT code FROM password_resets WHERE email = $1 AND user_type = 'user'", [userEmail]);
    const userOtp = otpRes.rows[0].code;

    // 3. Test User Reset Password
    console.log(">> Testing User Reset Password...");
    const userResetRes = await request("POST", "/api/users/reset-password", {
      email: userEmail,
      code: userOtp,
      new_password: "newuserpassword"
    });
    console.log("Response:", userResetRes.status);
    if (userResetRes.status !== 200) throw new Error("User Reset Password failed");

    // 4. Test User Login with New Password
    console.log(">> Testing User Login with New Password...");
    const userLoginRes = await request("POST", "/api/login", {
      matric_number: userMatric,
      password: "newuserpassword"
    });
    console.log("Response:", userLoginRes.status);
    if (userLoginRes.status !== 200) throw new Error("User Login after reset failed");

    // -------------------------------------------------------------

    // 5. Test Lecturer Forgot Password
    console.log(">> Testing Lecturer Forgot Password...");
    const lecturerForgotRes = await request("POST", "/api/lecturers/forgot-password", {
      email: lecturerEmail
    });
    console.log("Response:", lecturerForgotRes.status);
    if (lecturerForgotRes.status !== 200) throw new Error("Lecturer Forgot Password failed");

    // Retrieve OTP from DB for testing
    otpRes = await pool.query("SELECT code FROM password_resets WHERE email = $1 AND user_type = 'lecturer'", [lecturerEmail]);
    const lecturerOtp = otpRes.rows[0].code;

    // 6. Test Lecturer Reset Password
    console.log(">> Testing Lecturer Reset Password...");
    const lecturerResetRes = await request("POST", "/api/lecturers/reset-password", {
      email: lecturerEmail,
      code: lecturerOtp,
      new_password: "newlecturerpassword"
    });
    console.log("Response:", lecturerResetRes.status);
    if (lecturerResetRes.status !== 200) throw new Error("Lecturer Reset Password failed");

    // 7. Test Lecturer Login with New Password
    console.log(">> Testing Lecturer Login with New Password...");
    const lecturerLoginRes = await request("POST", "/api/lecturers/login", {
      email: lecturerEmail,
      password: "newlecturerpassword"
    });
    console.log("Response:", lecturerLoginRes.status);
    if (lecturerLoginRes.status !== 200) throw new Error("Lecturer Login after reset failed");

    console.log(">> All password reset tests passed!");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err.message || err);
    process.exit(1);
  }
}

testPasswordReset();
