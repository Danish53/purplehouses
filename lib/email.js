import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.ionos.com",
      port: parseInt(process.env.EMAIL_PORT || "587", 10),
      secure: false,
      auth: {
        user: process.env.EMAIL_HOST_USER || "",
        pass: process.env.EMAIL_HOST_PASSWORD || "",
      },
      tls: { rejectUnauthorized: false },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const from =
    process.env.DEFAULT_FROM_EMAIL ||
    process.env.EMAIL_HOST_USER ||
    "no-reply@purplehousing.com";
  try {
    await getTransporter().sendMail({
      from,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}
