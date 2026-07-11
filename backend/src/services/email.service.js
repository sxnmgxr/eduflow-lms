const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendVerificationEmail = async (email, name) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to EduFlow — Verify your email',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2>Welcome to EduFlow, ${name}! 🎓</h2>
        <p>Start learning from hundreds of expert-taught courses.</p>
        <p>Your account has been created successfully.</p>
        <a href="${process.env.CLIENT_URL}/dashboard" 
           style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
          Go to Dashboard
        </a>
      </div>
    `,
  });
};

const sendEnrollmentEmail = async (email, name, courseTitle) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `You're enrolled in ${courseTitle}!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2>Enrollment Confirmed! 🎉</h2>
        <p>Hi ${name}, you're now enrolled in <strong>${courseTitle}</strong>.</p>
        <a href="${process.env.CLIENT_URL}/dashboard/my-courses"
           style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
          Start Learning
        </a>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendEnrollmentEmail };