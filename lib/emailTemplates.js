const LOGO_URL =
  "https://purplehousing.com/images/Logo-1.png";

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SHOW_PURPLE = "#551A8B";
const SHOW_ORANGE = "#E67E22";
const SHOW_LINK = "#0056b3";
const SHOW_GREY_BG = "#F4F4F4";
const SHOW_YELLOW = "#FFF200";

function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || "https://purplehousing.com"
  ).replace(/\/$/, "");
}

function parseBookingDate(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatShowingDateLong(value) {
  const d = parseBookingDate(value);
  if (!d) return "";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShowingDateShort(value) {
  const d = parseBookingDate(value);
  if (!d) return "";
  const mo = [
    "Jan.",
    "Feb.",
    "Mar.",
    "Apr.",
    "May",
    "Jun.",
    "Jul.",
    "Aug.",
    "Sep.",
    "Oct.",
    "Nov.",
    "Dec.",
  ];
  return `${mo[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function telHref(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? `tel:+${digits}` : "";
}

function showingDefaults(c) {
  const company_phone =
    c.company_phone || "(817) 585-1354";
  const company_email =
    c.company_email || "admin@purplehousing.com";
  return {
    property_name: c.property_name || "",
    property_address: c.property_address || c.property_name || "",
    property_page_url: c.property_page_url || siteOrigin(),
    property_image_url: c.property_image_url || "",
    listing_status_label: c.listing_status_label || "ACTIVE",
    showing_agent_name: c.showing_agent_name || "Purple Housing",
    company_name: c.company_name || "Purple Housing",
    company_phone,
    company_email,
    full_name: c.full_name || "",
    email: c.email || "",
    phone: c.phone || "",
    booking_date: c.booking_date,
    booking_time: c.booking_time || "",
    reason: c.reason || "",
    status: c.status || "",
  };
}

/** Purple header with centered logo + overlapping white card (all emails). */
function brandedEmailShell(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${SHOW_GREY_BG};font-family:Helvetica,Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${SHOW_GREY_BG};">
  <tr>
    <td align="center" style="background:${SHOW_PURPLE};padding:22px 16px 28px 16px;">
      <img src="${LOGO_URL}" alt="Purple Housing" width="168" style="display:block;margin:0 auto;border:0;max-width:100%;height:auto;">
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:0 16px 36px 16px;background:${SHOW_GREY_BG};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;margin-top:-28px;background:#ffffff;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,0.12);">
        <tr>
          <td style="padding:28px 26px 26px 26px;color:#333333;font-size:14px;line-height:1.55;">
            ${bodyHtml}
          </td>
        </tr>
      </table>
      <p style="margin:18px 0 0;font-size:11px;color:#9a9a9a;max-width:560px;text-align:center;">&copy; ${new Date().getFullYear()} Purple Housing &middot; All rights reserved</p>
    </td>
  </tr>
</table>
</body></html>`;
}

function showingShell(innerHtml) {
  return brandedEmailShell(innerHtml);
}

function dottedRule() {
  return `<div style="border-top:1px dotted #cccccc;margin:18px 0;"></div>`;
}

function propertyHeroTwoCol(ctx, includeShowingAgent = true) {
  const img = esc(ctx.property_image_url) || `${esc(siteOrigin())}/images/1.jpg`;
  const link = esc(ctx.property_page_url);
  const addr = esc(ctx.property_address);
  const statusLine = esc(ctx.listing_status_label);
  const company = esc(ctx.company_name);
  const agent = esc(ctx.showing_agent_name);
  const agentBlock = includeShowingAgent
    ? `<p style="margin:8px 0 0;font-size:12px;color:#666666;">Showing Agent: ${agent}</p>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td width="40%" valign="top" style="padding-right:14px;">
        <img src="${img}" alt="" width="220" style="display:block;width:100%;max-width:220px;height:auto;border-radius:10px;border:1px solid #eeeeee;">
      </td>
      <td valign="top">
        <a href="${link}" style="color:${SHOW_LINK};font-size:17px;font-weight:bold;text-decoration:underline;">${addr}</a>
        <p style="margin:10px 0 0;font-size:13px;color:#666666;">${statusLine}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#777777;">Presented by: ${company}</p>
        ${agentBlock}
      </td>
    </tr>
  </table>`;
}

function appointmentIconBlock(ctx, dateFormatter) {
  const dateStr = esc(dateFormatter(ctx.booking_date));
  const timeStr = esc(ctx.booking_time);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">
    <tr>
      <td valign="top" style="width:40px;border-right:2px solid #e5e5e5;padding-right:12px;text-align:center;font-size:18px;line-height:1.2;">
        <div style="padding:2px 0 8px;">&#127968;</div>
        <div style="padding:4px 0 8px;">&#128197;</div>
        <div style="padding:4px 0 0;">&#128339;</div>
      </td>
      <td valign="top" style="padding-left:14px;">
        <p style="margin:0;color:${SHOW_ORANGE};font-weight:bold;font-size:14px;">Showing</p>
        <p style="margin:18px 0 0;color:#333333;font-size:14px;">${dateStr}</p>
        <p style="margin:18px 0 0;color:#333333;font-size:14px;">${timeStr}</p>
      </td>
    </tr>
  </table>`;
}

function sectionTitle(text) {
  return `<p style="margin:0 0 10px;font-size:16px;font-weight:bold;color:${SHOW_ORANGE};">${esc(text)}</p>`;
}

function customerDetailsBlock(ctx) {
  return `${sectionTitle("Customer Details")}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;color:#444444;">
    <tr><td style="padding:5px 0;width:88px;color:#666666;"><strong>Name</strong></td><td style="padding:5px 0;">${esc(ctx.full_name)}</td></tr>
    <tr><td style="padding:5px 0;color:#666666;"><strong>Email</strong></td><td style="padding:5px 0;"><a href="mailto:${esc(ctx.email)}" style="color:${SHOW_LINK};">${esc(ctx.email)}</a></td></tr>
    <tr><td style="padding:5px 0;color:#666666;"><strong>Phone</strong></td><td style="padding:5px 0;"><a href="${esc(telHref(ctx.phone))}" style="color:${SHOW_LINK};">${esc(ctx.phone)}</a></td></tr>
  </table>`;
}

function listingPresentedBlock(ctx) {
  const tel = esc(telHref(ctx.company_phone));
  const phone = esc(ctx.company_phone);
  const em = esc(ctx.company_email);
  const name = esc(ctx.company_name);
  return `${sectionTitle("Listing Presented By")}
  ${dottedRule()}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td valign="middle" style="padding-right:14px;">
        <img src="${LOGO_URL}" alt="" width="72" style="display:block;border:0;">
      </td>
      <td valign="middle">
        <p style="margin:0;font-size:17px;font-weight:bold;color:#0a2463;">${name}</p>
        <p style="margin:6px 0 0;font-size:14px;"><a href="${tel}" style="color:${SHOW_LINK};text-decoration:none;">${phone}</a></p>
        <p style="margin:4px 0 0;font-size:14px;"><a href="mailto:${em}" style="color:${SHOW_LINK};">${em}</a></p>
      </td>
    </tr>
  </table>
  <p style="margin:20px 0 0;font-size:12px;color:#888888;text-align:center;line-height:1.5;">
    For questions regarding this appointment, please contact ${name} at ${phone}.
  </p>`;
}

function statusHeadlineHtml(statusWord) {
  const w = esc(statusWord);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
    <tr>
      <td valign="middle" style="padding-right:10px;font-size:26px;line-height:1;">&#9989;</td>
      <td valign="middle" style="font-size:20px;font-weight:bold;color:#222222;">
        <span style="background:${SHOW_YELLOW};padding:2px 8px;border-radius:2px;">Showing Request</span>
        &nbsp;${w}
      </td>
    </tr>
  </table>`;
}

function statusHeadlineDeclinedHtml() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
    <tr>
      <td valign="middle" style="padding-right:10px;font-size:26px;line-height:1;">&#9989;</td>
      <td valign="middle" style="font-size:20px;font-weight:bold;color:#222222;">
        <span style="background:${SHOW_YELLOW};padding:2px 8px;border-radius:2px;">Showing Request</span>
        &nbsp;Declined
      </td>
    </tr>
  </table>`;
}

function statusDecisionAddressBlock(ctx, declined) {
  const headline = declined
    ? statusHeadlineDeclinedHtml()
    : statusHeadlineHtml("Approved");
  const link = esc(ctx.property_page_url);
  const addr = esc(ctx.property_address);
  const company = esc(ctx.company_name);
  return `${headline}
    <p style="margin:8px 0 4px;"><a href="${link}" style="color:${SHOW_LINK};font-size:18px;font-weight:bold;text-decoration:underline;">${addr}</a></p>
    <p style="margin:0;font-size:12px;color:#666666;">Presented by: ${company}</p>`;
}

function wrap(bodyHtml) {
  return brandedEmailShell(bodyHtml);
}

/** Admin: someone scheduled a showing (property image + visitor details). */
export function showingNewRequestAdminEmail(raw) {
  const ctx = showingDefaults(raw);
  const inner = `<p style="margin:0 0 16px;text-align:center;font-size:22px;font-weight:bold;color:${SHOW_ORANGE};">New Showing Request</p>
    ${propertyHeroTwoCol(ctx, true)}
    ${dottedRule()}
    ${sectionTitle("Appointment Details")}
    <p style="margin:0 0 14px;color:#444444;font-size:14px;">
      A visitor submitted the following date and time. Please review it in the dashboard and approve or decline when ready.
    </p>
    ${appointmentIconBlock(ctx, formatShowingDateLong)}
    ${dottedRule()}
    ${customerDetailsBlock(ctx)}`;
  return showingShell(inner);
}

/** Customer: admin approved the showing. */
export function showingApprovedCustomerEmail(raw) {
  const ctx = showingDefaults(raw);
  const inner = `${statusDecisionAddressBlock(ctx, false)}
    ${dottedRule()}
    ${sectionTitle("Appointment Details")}
    <p style="margin:0 0 14px;color:#444444;font-size:14px;">
      Your showing has been approved. Please arrive on time. If you need to reschedule, contact us as soon as possible.
    </p>
    ${appointmentIconBlock(ctx, formatShowingDateShort)}
    ${dottedRule()}
    ${listingPresentedBlock(ctx)}`;
  return showingShell(inner);
}

/** Customer: admin declined the showing. */
export function showingDeclinedCustomerEmail(raw) {
  const ctx = showingDefaults(raw);
  const reasonBlock = ctx.reason
    ? `<p style="margin:0 0 14px;color:#333333;font-size:14px;"><strong>Reason:</strong> ${esc(ctx.reason)}</p>`
    : "";
  const inner = `${statusDecisionAddressBlock(ctx, true)}
    ${dottedRule()}
    ${sectionTitle("Appointment Details")}
    ${reasonBlock}
    ${appointmentIconBlock(ctx, formatShowingDateShort)}
    ${dottedRule()}
    ${listingPresentedBlock(ctx)}`;
  return showingShell(inner);
}

export function contactNotificationEmail({
  name,
  email,
  work_phone,
  subject,
  message,
}) {
  return wrap(`
    <p style="margin:0 0 16px;text-align:center;font-size:22px;font-weight:bold;color:${SHOW_ORANGE};">Contact Us</p>
    <p style="margin:0 0 6px;color:#666666;font-size:13px;text-align:center;">New message from the website contact form</p>
    ${sectionTitle("Sender details")}
    <table role="presentation" style="width:100%;border-spacing:0;font-size:14px;color:#444444;">
      <tr><td style="padding:6px 0;width:100px;color:#666666;vertical-align:top;"><strong>Name</strong></td><td style="padding:6px 0;">${esc(name)}</td></tr>
      <tr><td style="padding:6px 0;color:#666666;vertical-align:top;"><strong>Email</strong></td><td style="padding:6px 0;"><a href="mailto:${esc(email)}" style="color:${SHOW_LINK};">${esc(email)}</a></td></tr>
      <tr><td style="padding:6px 0;color:#666666;vertical-align:top;"><strong>Phone</strong></td><td style="padding:6px 0;">${esc(work_phone) || "N/A"}</td></tr>
      <tr><td style="padding:6px 0;color:#666666;vertical-align:top;"><strong>Subject</strong></td><td style="padding:6px 0;">${esc(subject) || "N/A"}</td></tr>
    </table>
    ${dottedRule()}
    ${sectionTitle("Message")}
    <p style="color:#333333;margin:0;line-height:1.6;">${esc(message || "").replace(/\n/g, "<br/>")}</p>
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
    <p style="margin:0 0 16px;text-align:center;font-size:22px;font-weight:bold;color:${SHOW_ORANGE};">New Application Submitted</p>
    ${sectionTitle("Summary")}
    <table role="presentation" style="width:100%;border-spacing:0;font-size:14px;color:#444444;">
      <tr><td style="padding:6px 0;color:#666666;width:140px;vertical-align:top;"><strong>Application ID</strong></td><td style="padding:6px 0;">${esc(applicationId)}</td></tr>
      <tr><td style="padding:6px 0;color:#666666;vertical-align:top;"><strong>Name</strong></td><td style="padding:6px 0;">${esc(first_name)} ${esc(last_name)}</td></tr>
      <tr><td style="padding:6px 0;color:#666666;vertical-align:top;"><strong>Email</strong></td><td style="padding:6px 0;"><a href="mailto:${esc(email)}" style="color:${SHOW_LINK};">${esc(email)}</a></td></tr>
      <tr><td style="padding:6px 0;color:#666666;vertical-align:top;"><strong>Phone</strong></td><td style="padding:6px 0;">${esc(phone)}</td></tr>
      <tr><td style="padding:6px 0;color:#666666;vertical-align:top;"><strong>Property ID</strong></td><td style="padding:6px 0;">${esc(property_id)}</td></tr>
      <tr><td style="padding:6px 0;color:#666666;vertical-align:top;"><strong>Move-in Date</strong></td><td style="padding:6px 0;">${esc(move_in_date)}</td></tr>
      <tr><td style="padding:6px 0;color:#666666;vertical-align:top;"><strong>Payment</strong></td><td style="padding:6px 0;">${esc(payment_method)} (${esc(payment_status)})</td></tr>
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
    <h3 style="color:${SHOW_ORANGE};margin:24px 0 8px 0;font-size:16px;">${esc(title)}</h3>
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
    <p style="margin:0 0 16px;text-align:center;font-size:22px;font-weight:bold;color:${SHOW_ORANGE};">New paid application — full details</p>
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
    <p style="margin:0 0 16px;text-align:center;font-size:22px;font-weight:bold;color:${SHOW_ORANGE};">Thank you for applying</p>
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
