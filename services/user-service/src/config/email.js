import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("Email SMTP configuration is missing");
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT || 587) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  return transporter;
}

export async function sendVerificationEmail(email, token) {
  const mailer = getTransporter();

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const verificationLink = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

  await mailer.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Verify your FixNear account",
    text: [
      "Welcome to FixNear!",
      "",
      "Verify your email by opening this link:",
      verificationLink,
      "",
      "This link expires in 15 minutes.",
      "If you did not create this account, you can ignore this email.",
    ].join("\n"),
  });
}

export async function sendPasswordResetEmail(email, token) {
  const mailer = getTransporter();

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await mailer.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Reset your FixNear password",
    text: [
      "We received a request to reset your FixNear password.",
      "",
      "Open the following link to create a new password:",
      resetLink,
      "",
      "This link expires in 15 minutes.",
      "",
      "If you did not request a password reset, ignore this email.",
    ].join("\n"),
  });
}
