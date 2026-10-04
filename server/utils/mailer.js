const nodemailer = require("nodemailer");

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

const isConfigured = () => Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter;
function getTransporter() {
  if (!transporter) {
    const port = Number(SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465, // 465 = SSL, 587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Sends an email. In local development, when SMTP isn't configured, the message
 * is printed to the server console instead so you can still test the flow.
 * In production a missing SMTP config is an error (never silently skip).
 */
async function sendMail({ to, subject, text, html }) {
  if (!isConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email service is not configured (set SMTP_* variables)");
    }
    console.log("\n[DEV EMAIL - SMTP not configured]");
    console.log(`To: ${to}\nSubject: ${subject}\n${text}\n`);
    return { dev: true };
  }
  return getTransporter().sendMail({
    from: MAIL_FROM || `House Rent <${SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

function otpEmail(code) {
  const text = `Your House Rent verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`;
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;padding:28px;background:#0a0e1a;color:#e2e8f0;border-radius:14px">
    <h2 style="color:#fbbf24;margin:0 0 6px">House Rent</h2>
    <p style="margin:0 0 20px;color:#94a3b8">Verify your email address</p>
    <p>Use this code to finish creating your account:</p>
    <div style="font-size:34px;letter-spacing:10px;font-weight:700;text-align:center;background:#111726;border:1px solid #1a2236;border-radius:12px;padding:16px;color:#fbbf24">${code}</div>
    <p style="color:#94a3b8;font-size:13px;margin-top:20px">This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.</p>
  </div>`;
  return { text, html };
}

module.exports = { sendMail, otpEmail, isConfigured };
