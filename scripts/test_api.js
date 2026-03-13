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

async function testAll() {
  try {
    console.log("Starting tests...");

    const uniqueEmail = `dr.smith${Date.now()}@university.edu`;
    const pwd = "password123";

    // 1. Register Lecturer
    console.log(">> Testing Registration...");
    const regRes = await request("POST", "/api/lecturers/register", {
      email: uniqueEmail,
      password: pwd,
      full_name: "Dr. Smith",
      department: "Computer Science",
      qualifications: "Ph.D",
    });
    console.log("Registration Response:", regRes.status, regRes.data);
    if (regRes.status !== 201) throw new Error("Registration failed");

    // 2. Login Lecturer
    console.log(">> Testing Login...");
    const loginRes = await request("POST", "/api/lecturers/login", {
      email: uniqueEmail,
      password: pwd,
    });
    console.log("Login Response:", loginRes.status);
    if (loginRes.status !== 200 || !loginRes.data.token)
      throw new Error("Login failed");

    const token = loginRes.data.token;

    // We can't easily test schedule update without creating a course first, but we can try 
    // retrieving courses, creating a course, and then creating a schedule, or test failing gracefully.
    
    console.log(">> All lecturer auth tests passed!");
  } catch (err) {
    console.error("Test failed:", err.message || err);
    process.exit(1);
  }
}

testAll();
