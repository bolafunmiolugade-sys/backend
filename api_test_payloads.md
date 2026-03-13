# Dummy JSON Payloads for API Testing

Here are some dummy JSON payloads you can use in Postman, cURL, or ThunderClient to test the newly created backend routes.

---

### 1. Admin Login

**Endpoint:** `POST /api/admin/login`

```json
{
  "email": "admin@university.edu",
  "password": "adminpassword"
}
```

_(Returns an Admin JWT token. Use this token in the `Authorization` header as `Bearer <token>` for restricted Admin routes, such as creating courses.)_

---

### 2. Lecturer Sign Up (Register)

**Endpoint:** `POST /api/lecturers/register`

```json
{
  "email": "dr.smith@university.edu",
  "password": "securepassword123",
  "full_name": "Dr. John Smith",
  "department": "Computer Science",
  "qualifications": "Ph.D, M.Sc"
}
```

---

### 3. Lecturer Login

**Endpoint:** `POST /api/lecturers/login`

```json
{
  "email": "dr.smith@university.edu",
  "password": "securepassword123"
}
```

_(Returns a Lecturer JWT token. Use this token in the `Authorization` header as `Bearer <token>` for the next two requests.)_

---

### 4. Create Class Schedule (Lecturer Only)

**Endpoint:** `POST /api/classes/schedule`
**Headers:** `Authorization: Bearer <LECTURER_JWT_TOKEN>`

```json
{
  "course_id": "CSC101",
  "lecturer_name": "Dr. John Smith",
  "location_lat": 6.5244,
  "location_long": 3.3792,
  "class_start_time": "2026-03-12T08:00:00Z",
  "class_end_time": "2026-03-12T10:00:00Z",
  "attendance_window_minutes": 15
}
```

_(Note: Ensure that the `course_id` provided already exists in the `courses` database table. An admin might need to create it first!)_

---

### 5. Update Attendance Window (Lecturer Only)

**Endpoint:** `PATCH /api/classes/schedule/:id/attendance-window`
**Headers:** `Authorization: Bearer <LECTURER_JWT_TOKEN>`
_(Replace `:id` in the URL with the actual Schedule ID returned from the creation step above)_

```json
{
  "attendance_window": 30
}
```

---

### 6. Create Course (Admin Only)

**Endpoint:** `POST /api/courses`
**Headers:** `Authorization: Bearer <ADMIN_JWT_TOKEN>`

```json
{
  "course_id": "CSC101",
  "course_name": "Introduction to Computer Science",
  "center_lat": 6.5244,
  "center_lon": 3.3792,
  "radius_m": 50
}
```

---

### 7. Update Course (Admin Only)

**Endpoint:** `PUT /api/courses/CSC101`
**Headers:** `Authorization: Bearer <ADMIN_JWT_TOKEN>`
_(Replace `CSC101` in the URL with the `course_id` you want to update)_

```json
{
  "course_name": "Advanced Computer Science Principles",
  "radius_m": 75
}
```

---

### 8. Delete Course (Admin Only)

**Endpoint:** `DELETE /api/courses/CSC101`
**Headers:** `Authorization: Bearer <ADMIN_JWT_TOKEN>`
_(Replace `CSC101` in the URL with the `course_id` you want to delete)_

```json
{}
```
