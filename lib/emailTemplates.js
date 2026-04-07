const LOGO_URL =
  "https://purplehousing.com/wp-content/uploads/elementor/thumbs/Logo-pzslvhz2pxmpj0mlu2hcnw5kendi2t36clei2mvx7a.png";

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif;">
<table style="table-layout:fixed;width:100%;border-spacing:0;background:#43086b;" cellpadding="0" cellspacing="0" align="center">
  <tr><td style="padding:15px;" align="center">
    <table style="max-width:600px;width:100%;border-spacing:0;" align="center">
      <tr><td style="padding:15px 0;" align="left">
        <img src="${LOGO_URL}" alt="Purple Housing" width="180" style="display:inline;border:0;">
      </td></tr>
    </table>
  </td></tr>
</table>
<table style="table-layout:fixed;width:100%;border-spacing:0;background:#f0f0f0;" cellpadding="0" cellspacing="0" align="center">
  <tr><td style="padding:0 15px;" align="center">
    <div style="max-width:600px;">
      <table style="width:100%;border-spacing:0;border-collapse:separate;background:#fff;border:1px solid #bbb;border-radius:0 0 8px 8px;" align="center">
        <tr><td style="padding:30px;font-family:Arial,sans-serif;font-size:14px;color:#5f5f5f;line-height:24px;">
          ${bodyHtml}
        </td></tr>
      </table>
    </div>
  </td></tr>
  <tr><td style="padding:20px;text-align:center;font-size:12px;color:#999;">
    &copy; ${new Date().getFullYear()} Purple Housing &middot; All rights reserved
  </td></tr>
</table>
</body></html>`;
}

export function bookingReceivedEmail({
  property_name,
  property_address,
  full_name,
  email,
  phone,
  booking_date,
  booking_time,
  status,
  reason,
}) {
  const statusLine = status
    ? `<p><strong>Status:</strong> ${esc(status)}</p>`
    : "";
  const reasonLine = reason
    ? `<p><strong>Reason:</strong> ${esc(reason)}</p>`
    : "";

  return wrap(`
    <h2 style="color:#43086b;margin-top:0;">Showing Request</h2>
    <p style="font-size:18px;color:#000640;"><strong>${esc(property_name)}</strong></p>
    <p style="color:#5f5f5f;">${esc(property_address || property_name)}</p>
    <p style="font-size:12px;"><strong style="color:#000640;">Presented by:</strong> Purple Housing</p>
    <hr style="border:none;border-top:2px dotted #f0f0f0;margin:20px 0;">
    <p style="color:#f6841d;font-size:16px;">Appointment Details</p>
    ${statusLine}
    ${reasonLine}
    <table style="width:100%;border-spacing:0;font-size:14px;">
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Date:</strong></td><td>${esc(booking_date)}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Time:</strong></td><td>${esc(booking_time)}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Name:</strong></td><td>${esc(full_name)}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Email:</strong></td><td>${esc(email)}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Phone:</strong></td><td>${esc(phone)}</td></tr>
    </table>
  `);
}

export function bookingConfirmationEmail({
  property_name,
  property_address,
  full_name,
  booking_date,
  booking_time,
  status,
  reason,
}) {
  const statusText =
    status === "Approved"
      ? "Your showing request has been approved!"
      : status === "Disapproved"
        ? "Your showing request has been disapproved."
        : "Your showing request has been received.";

  const reasonLine = reason
    ? `<p><strong>Reason:</strong> ${esc(reason)}</p>`
    : "";

  return wrap(`
    <h2 style="color:#43086b;margin-top:0;">${statusText}</h2>
    <p style="font-size:18px;color:#000640;"><strong>${esc(property_name)}</strong></p>
    <p style="color:#5f5f5f;">${esc(property_address || property_name)}</p>
    ${reasonLine}
    <hr style="border:none;border-top:2px dotted #f0f0f0;margin:20px 0;">
    <table style="width:100%;border-spacing:0;font-size:14px;">
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Date:</strong></td><td>${esc(booking_date)}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Time:</strong></td><td>${esc(booking_time)}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Name:</strong></td><td>${esc(full_name)}</td></tr>
    </table>
  `);
}

export function contactNotificationEmail({
  name,
  email,
  work_phone,
  subject,
  message,
}) {
  return wrap(`
    <h2 style="color:#43086b;margin-top:0;">New Contact Message</h2>
    <table style="width:100%;border-spacing:0;font-size:14px;">
      <tr><td style="padding:6px 0;color:#5f5f5f;width:100px;"><strong>Name:</strong></td><td>${esc(name)}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Email:</strong></td><td>${esc(email)}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Phone:</strong></td><td>${esc(work_phone) || "N/A"}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Subject:</strong></td><td>${esc(subject) || "N/A"}</td></tr>
    </table>
    <hr style="border:none;border-top:2px dotted #f0f0f0;margin:20px 0;">
    <p style="color:#333;">${esc(message || "").replace(/\n/g, "<br/>")}</p>
  `);
}

export function applicationNotificationEmail({
  applicationId,
  first_name,
  last_name,
  email,
  phone,
  property_id,
  move_in_date,
  payment_method,
  payment_status,
}) {
  return wrap(`
    <h2 style="color:#43086b;margin-top:0;">New Application Submitted</h2>
    <table style="width:100%;border-spacing:0;font-size:14px;">
      <tr><td style="padding:6px 0;color:#5f5f5f;width:140px;"><strong>Application ID:</strong></td><td>${esc(applicationId)}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Name:</strong></td><td>${esc(first_name)} ${esc(last_name)}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Email:</strong></td><td>${esc(email)}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Phone:</strong></td><td>${esc(phone)}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Property ID:</strong></td><td>${esc(property_id)}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Move-in Date:</strong></td><td>${esc(move_in_date)}</td></tr>
      <tr><td style="padding:6px 0;color:#5f5f5f;"><strong>Payment:</strong></td><td>${esc(payment_method)} (${esc(payment_status)})</td></tr>
    </table>
  `);
}
