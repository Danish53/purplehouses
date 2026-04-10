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

function fmtVal(v) {
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) {
    const s = v.map((x) => String(x).trim()).filter(Boolean).join(", ");
    return s;
  }
  return String(v).trim();
}

function adminRow(label, value) {
  const s = fmtVal(value);
  if (!s) return "";
  return `<tr><td style="padding:6px 0;color:#5f5f5f;width:200px;vertical-align:top;"><strong>${esc(label)}</strong></td><td style="padding:6px 0;">${esc(s)}</td></tr>`;
}

function adminSection(title, innerRows) {
  if (!innerRows || !innerRows.includes("<tr")) return "";
  return `
    <h3 style="color:#43086b;margin:24px 0 8px 0;font-size:16px;">${esc(title)}</h3>
    <table style="width:100%;border-spacing:0;font-size:14px;">${innerRows}</table>`;
}

/** Full application payload for admin (after successful paid insert). */
export function applicationAdminFullFormEmail({
  fields,
  applicationId,
  payment_method,
  payment_status,
  photoPath,
}) {
  const f = fields || {};
  const dob =
    f.dob_year && f.dob_month && f.dob_day
      ? `${f.dob_year}-${String(f.dob_month).padStart(2, "0")}-${String(f.dob_day).padStart(2, "0")}`
      : "";
  const depDob =
    f.dep_year && f.dep_month && f.dep_day
      ? `${f.dep_year}-${String(f.dep_month).padStart(2, "0")}-${String(f.dep_day).padStart(2, "0")}`
      : "";

  const petNames = Array.isArray(f.pet_names)
    ? f.pet_names
    : f.pet_names
      ? [f.pet_names]
      : [];
  const petBreeds = Array.isArray(f.pet_breeds)
    ? f.pet_breeds
    : f.pet_breeds
      ? [f.pet_breeds]
      : [];
  const petWeights = Array.isArray(f.pet_weights)
    ? f.pet_weights
    : f.pet_weights
      ? [f.pet_weights]
      : [];
  const petAges = Array.isArray(f.pet_ages)
    ? f.pet_ages
    : f.pet_ages
      ? [f.pet_ages]
      : [];
  let petsBlock = "";
  if (petNames.length) {
    petsBlock = petNames
      .map((name, i) => {
        const line = [
          name,
          petBreeds[i] && `Breed: ${petBreeds[i]}`,
          petWeights[i] && `Weight: ${petWeights[i]}`,
          petAges[i] && `Age: ${petAges[i]}`,
        ]
          .filter(Boolean)
          .join(" · ");
        return adminRow(`Pet ${i + 1}`, line);
      })
      .join("");
  }

  const adultNames = Array.isArray(f.adult_names)
    ? f.adult_names
    : f.adult_names
      ? [f.adult_names]
      : [];
  const adultEmails = Array.isArray(f.adult_emails)
    ? f.adult_emails
    : f.adult_emails
      ? [f.adult_emails]
      : [];
  const adultPhones = Array.isArray(f.adult_phones)
    ? f.adult_phones
    : f.adult_phones
      ? [f.adult_phones]
      : [];
  let adultsBlock = "";
  if (adultNames.length) {
    adultsBlock = adultNames
      .map((name, i) => {
        const parts = [name];
        if (adultEmails[i]) parts.push(`Email: ${adultEmails[i]}`);
        if (adultPhones[i]) parts.push(`Phone: ${adultPhones[i]}`);
        return adminRow(`Adult ${i + 1}`, parts.join(" · "));
      })
      .join("");
  }

  const summary = `
    <h2 style="color:#43086b;margin-top:0;">New paid application — full details</h2>
    <p style="color:#333;margin:0 0 12px 0;">Payment completed; record saved in the database.</p>
    <table style="width:100%;border-spacing:0;font-size:14px;">
      ${adminRow("Application ID", applicationId)}
      ${adminRow("Payment method", payment_method)}
      ${adminRow("Payment status", payment_status)}
      ${adminRow("Photo ID file (server path)", photoPath)}
    </table>`;

  const s1 = adminSection(
    "Application & property",
    [
      adminRow("Property ID", f.property_id),
      adminRow("Move-in date", f.move_in_date),
      adminRow("Applicant type", f.applicant_type),
      adminRow("How did you hear about us", f.hear_about),
    ].join(""),
  );

  const s2 = adminSection(
    "Primary applicant",
    [
      adminRow("First name", f.first_name),
      adminRow("Last name", f.last_name),
      adminRow("Email", f.email),
      adminRow("Confirm email", f.confirm_email),
      adminRow("Phone", f.phone),
      adminRow("Personal email", f.personal_email),
      adminRow("Personal phone", f.personal_phone),
    ].join(""),
  );

  const s3 = adminSection(
    "Current / previous address",
    [
      adminRow("Address line 1", f.address1),
      adminRow("Address line 2", f.address2),
      adminRow("City", f.city),
      adminRow("State", f.state),
      adminRow("ZIP", f.zipcode),
      adminRow("Reside from (month/year)", `${fmtVal(f.reside_from_month)} / ${fmtVal(f.reside_from_year)}`),
      adminRow("Monthly rent", f.monthly_rent),
      adminRow("Monthly mortgage", f.monthly_mortgage),
      adminRow("Landlord name", f.landlord_name),
      adminRow("Landlord phone", f.landlord_phone),
      adminRow("Landlord email", f.landlord_email),
      adminRow("Home email", f.home_email),
      adminRow("Reason for leaving", f.reason_for_leaving),
    ].join(""),
  );

  const s4 = adminSection(
    "Other adults in household",
    [
      adminRow("Other adults (yes/no)", f.has_adults),
      adminRow("Adult count", f.adult_count),
      adultsBlock,
    ].join(""),
  );

  const s5 = adminSection(
    "Dependents & pets",
    [
      adminRow("Dependents under 18", f.has_dependents),
      adminRow("Dependent first name", f.dependent_first_name),
      adminRow("Dependent last name", f.dependent_last_name),
      adminRow("Relation", f.dependent_relation),
      adminRow("Dependent DOB", depDob),
      adminRow("Has pets", f.has_pets),
      adminRow("Pet count", f.pet_count),
      petsBlock,
    ].join(""),
  );

  const s6 = adminSection(
    "ID, SSN & vehicle",
    [
      adminRow("Date of birth", dob),
      adminRow("License number", f.license_number),
      adminRow("License state", f.license_state),
      adminRow("SSN", f.ssn),
      adminRow("Emergency contact name", f.emergency_name),
      adminRow("Emergency phone", f.emergency_phone),
      adminRow("Emergency relation", f.emergency_relation),
      adminRow("Has vehicle", f.has_vehicle),
      adminRow("Vehicle make", f.vehicle_make),
      adminRow("Vehicle model", f.vehicle_modal),
      adminRow("Vehicle year", f.vehicle_year),
      adminRow("Vehicle color", f.vehicle_color),
      adminRow("Vehicle license", f.vehicle_license),
    ].join(""),
  );

  const s7 = adminSection(
    "Employment",
    [
      adminRow("Employer name", f.employer_name),
      adminRow("Employer address 1", f.employer_address1),
      adminRow("Employer address 2", f.employer_address2),
      adminRow("City", f.employer_city),
      adminRow("State", f.employer_state),
      adminRow("ZIP", f.employer_zip),
      adminRow("Employer phone", f.employer_phone),
      adminRow("Monthly salary", f.monthly_salary),
      adminRow("Position", f.position),
      adminRow("Years worked", f.years_worked),
      adminRow("Supervisor name", f.supervisor_name),
    ].join(""),
  );

  const s8 = adminSection(
    "Screening questions",
    [
      adminRow("Eviction history", f.eviction_history),
      adminRow("Eviction explanation", f.eviction_explain),
      adminRow("Criminal history", f.criminal_history),
      adminRow("Criminal explanation", f.criminal_explain),
      adminRow("Income 3x rent", f.income_3x),
      adminRow("Income explanation", f.income_explain),
      adminRow("Employment history", f.employment_history),
      adminRow("Employment explanation", f.employment_explain),
      adminRow("Residency history", f.residency_history),
      adminRow("Residency explanation", f.residency_explain),
    ].join(""),
  );

  const s9 = adminSection(
    "Billing",
    [
      adminRow("Billing first name", f.billing_first_name),
      adminRow("Billing last name", f.billing_last_name),
      adminRow("Billing address 1", f.billing_address1),
      adminRow("Billing address 2", f.billing_address2),
      adminRow("Billing city", f.billing_city),
      adminRow("Billing state", f.billing_state),
      adminRow("Billing ZIP", f.billing_zip),
      adminRow("Authorized name", f.authorized_name),
      adminRow("Agreed to terms", f.agree_terms),
    ].join(""),
  );

  return wrap(
    summary + s1 + s2 + s3 + s4 + s5 + s6 + s7 + s8 + s9,
  );
}

/** Applicant confirmation after payment succeeds and application is saved. */
export function applicationThankYouEmail({
  first_name,
  last_name,
  applicationId,
  property_id,
  move_in_date,
  payment_method,
}) {
  const name = `${fmtVal(first_name)} ${fmtVal(last_name)}`.trim() || "there";
  return wrap(`
    <h2 style="color:#43086b;margin-top:0;">Thank you for applying</h2>
    <p style="color:#333;font-size:15px;line-height:1.6;">
      Hi ${esc(name)},
    </p>
    <p style="color:#333;font-size:15px;line-height:1.6;">
      We have received your rental application and your <strong>$50 application fee</strong> payment was successful.
      Your application ID is <strong>${esc(applicationId)}</strong>.
    </p>
    <table style="width:100%;border-spacing:0;font-size:14px;margin-top:16px;">
      ${adminRow("Property ID", property_id)}
      ${adminRow("Desired move-in", move_in_date)}
      ${adminRow("Payment method", payment_method)}
    </table>
    <p style="color:#5f5f5f;font-size:14px;margin-top:20px;">
      Our team will review your submission and follow up if anything else is needed.
    </p>
  `);
}
