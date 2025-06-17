const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.mailtrap.io',
  port: 587,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

/**
 * Send an email
 * @param {Object} options { to, subject, text, html }
 */
const sendEmail = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: '"My App" <no-reply@myapp.com>',
    to,
    subject,
    text,
    html,
  });
};

module.exports = sendEmail;