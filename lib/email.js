import nodemailer from "nodemailer";

let transporter;
let contactTransporter;

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
      // tls: { rejectUnauthorized: false },
    });
  }
  return transporter;
}

function getContactTransporter() {
  if (!contactTransporter) {
    contactTransporter = nodemailer.createTransport({
      host:
        process.env.CONTACT_EMAIL_HOST ||
        process.env.EMAIL_HOST ||
        "smtp.ionos.com",
      port: parseInt(
        process.env.CONTACT_EMAIL_PORT || process.env.EMAIL_PORT || "587",
        10,
      ),
      secure: false,
      auth: {
        user: process.env.CONTACT_EMAIL_HOST_USER || "",
        pass: process.env.CONTACT_EMAIL_HOST_PASSWORD || "",
      },
      // tls: { rejectUnauthorized: false },
    });
  }
  return contactTransporter;
}

function contactSmtpConfigured() {
  return !!(
    process.env.CONTACT_EMAIL_HOST_USER && process.env.CONTACT_EMAIL_HOST_PASSWORD
  );
}

/** "Name <addr@x.com>" or bare addr@x.com → addr@x.com */
function emailFromDisplayOrBare(s) {
  if (!s || typeof s !== "string") return null;
  const trimmed = s.trim();
  const inner = trimmed.match(/<([^>]+)>/);
  if (inner) return inner[1].trim();
  if (/^[^\s<>]+@[^\s<>]+\.[^\s<>]+$/.test(trimmed)) return trimmed;
  return null;
}

/**
 * MAIL FROM must match SMTP auth user; using another address in From often gets rejected.
 * If CONTACT_DEFAULT_FROM_EMAIL parses to the same mailbox as CONTACT_EMAIL_HOST_USER, use that full string.
 */
function contactSmtpFromHeader() {
  const authUser = (process.env.CONTACT_EMAIL_HOST_USER || "").trim();
  const display = process.env.CONTACT_DEFAULT_FROM_EMAIL?.trim();
  const parsed = display ? emailFromDisplayOrBare(display) : null;
  if (display && parsed && authUser && parsed.toLowerCase() === authUser.toLowerCase()) {
    return display;
  }
  if (authUser) {
    return `Purple Housing <${authUser}>`;
  }
  return display || "no-reply@purplehousing.com";
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

/**
 * Contact form notifications: optional separate SMTP (CONTACT_EMAIL_*).
 * Recipient: email parsed from CONTACT_DEFAULT_FROM_EMAIL first, then CONTACT_NOTIFICATION_EMAIL, etc.
 */
export async function sendContactNotificationEmail({ subject, html, text }) {
  const useContactMailbox = contactSmtpConfigured();
  const transport = useContactMailbox
    ? getContactTransporter()
    : getTransporter();

  const to =
    emailFromDisplayOrBare(process.env.CONTACT_DEFAULT_FROM_EMAIL) ||
    process.env.CONTACT_NOTIFICATION_EMAIL ||
    (useContactMailbox ? process.env.CONTACT_EMAIL_HOST_USER : null) ||
    emailFromDisplayOrBare(process.env.DEFAULT_FROM_EMAIL) ||
    process.env.EMAIL_HOST_USER;

  if (!to) {
    console.error(
      "Contact notification: no recipient (set CONTACT_DEFAULT_FROM_EMAIL, CONTACT_NOTIFICATION_EMAIL, or email env).",
    );
    return false;
  }

  const from = useContactMailbox
    ? contactSmtpFromHeader()
    : process.env.DEFAULT_FROM_EMAIL ||
      process.env.EMAIL_HOST_USER ||
      "no-reply@purplehousing.com";

  try {
    await transport.sendMail({
      from,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });
    return true;
  } catch (err) {
    console.error("Contact notification email failed:", err?.message || err, {
      to,
      from,
    });
    return false;
  }
}
