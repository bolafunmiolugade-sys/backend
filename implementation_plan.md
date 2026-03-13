# Password Reset Flow Plan

This plan details the addition of "Forget Password" and "Reset Password" functionalities for both Students (Users) and Lecturers.

## Proposed Changes

### Database
#### [NEW] `create_password_resets.sql` (file:///c:/Users/USER 1/Desktop/backend/db/create_password_resets.sql)
Instead of modifying the existing `users` and `lecturers` schemas, we will create a generic `password_resets` table to store the 6-digit codes.
- `id` (Serial)
- `email` (String, indexed)
- `user_type` (Enum or String: 'user' or 'lecturer')
- `code` (String, 6 digits)
- `expires_at` (Timestamp)

### Utilities
#### [NEW] `emailUtils.js` (file:///c:/Users/USER 1/Desktop/backend/utils/emailUtils.js)
We will install `nodemailer` and create a utility service to send emails containing the 6-digit OTP. For local testing, we'll configure it to simply log the code to the console or use a mock transport so it doesn't fail without real SMTP credentials.

### Models
#### [NEW] `passwordResetModel.js` (file:///c:/Users/USER 1/Desktop/backend/models/passwordResetModel.js)
Methods: `saveCode(email, user_type, code, expires_in_mins)`, `verifyCode(email, user_type, code)`, and `deleteCode(email, user_type)`.

#### [MODIFY] [userModel.js](file:///c:/Users/USER%201/Desktop/backend/models/userModel.js) (file:///c:/Users/USER 1/Desktop/backend/models/userModel.js)
Add `updatePassword(email, newHashedPassword)` method.

#### [MODIFY] [lecturerModel.js](file:///c:/Users/USER%201/Desktop/backend/models/lecturerModel.js) (file:///c:/Users/USER 1/Desktop/backend/models/lecturerModel.js)
Add `updatePassword(email, newHashedPassword)` method.

### Controllers
#### [MODIFY] [authController.js](file:///c:/Users/USER%201/Desktop/backend/controllers/authController.js) (file:///c:/Users/USER 1/Desktop/backend/controllers/authController.js)
Add:
- `forgotPassword`: Accepts `matric_number` and `email`. Verifies they match, generates a 6-digit code, saves it, and "sends" the email.
- `resetPassword`: Accepts `email`, `code`, and `new_password`. Verifies the code, hashes the new password, updates the DB, and clears the code.

#### [MODIFY] [lecturerAuthController.js](file:///c:/Users/USER%201/Desktop/backend/controllers/lecturerAuthController.js) (file:///c:/Users/USER 1/Desktop/backend/controllers/lecturerAuthController.js)
Add:
- `forgotPassword`: Accepts `email`. Verifies it exists, generates a 6-digit code, saves it, and "sends" the email.
- `resetPassword`: Accepts `email`, `code`, and `new_password`. Verifies the code, hashes the new password, updates the DB, and clears the code.

### Routes
#### [MODIFY] [api.js](file:///c:/Users/USER%201/Desktop/backend/routes/api.js) (file:///c:/Users/USER 1/Desktop/backend/routes/api.js)
Register the following public endpoints:
- `POST /users/forgot-password` (or `/forgot-password`) -> authController
- `POST /users/reset-password` (or `/reset-password`) -> authController
- `POST /lecturers/forgot-password` -> lecturerAuthController
- `POST /lecturers/reset-password` -> lecturerAuthController

## Verification Plan
1. Send a POST to `/forgot-password` for a valid student (matric number + email). Verify the OTP generation is logged/mock-sent.
2. Send a POST to `/reset-password` with the mock OTP and a new password. Verify success.
3. Attempt to login with the new password. Ensure it succeeds.
4. Repeat the process for `/lecturers/forgot-password` (email only) and `/lecturers/reset-password`.
