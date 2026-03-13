const nodemailer = require("nodemailer");

// Create a generic transporter. 
// For production, supply SMTP credentials in .env.
// For development/testing, we log the email payload to console.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER || "dummy_user",
    pass: process.env.SMTP_PASS || "dummy_pass",
  },
});

exports.sendResetCode = async (toEmail, code) => {
  const mailOptions = {
    from: '"University System" <no-reply@university.edu>',
    to: toEmail,
    subject: "Password Reset Code",
    text: `Your password reset code is: ${code}\nThis code will expire in 15 minutes.`,
    html: `<p>Your password reset code is: <strong>${code}</strong></p><p>This code will expire in 15 minutes.</p>`,
  };

  // In a real environment, you'd await transporter.sendMail(mailOptions);
  // Here, we just log it to ensure the flow works seamlessly without configuring a real email service.
  console.log(`\n\n=== 📧 MOCK EMAIL SENT ===\nTo: ${toEmail}\nSubject: ${mailOptions.subject}\nBody:\n${mailOptions.text}\n==========================\n\n`);
  
  return true;
};
