const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a plain HTML email.
 * Usage: await sendEmail({ to, subject, html });
 */
const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'TomaLink <no-reply@tomalink.com>',
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
