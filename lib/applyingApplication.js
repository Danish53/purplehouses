import { insert } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const APPLICATION_FEE_DOLLARS = "50.00";
export const APPLICATION_FEE_CENTS = 5000;

export async function savePhotoId(file) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `applying_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const dir = path.join(process.cwd(), "public", "media", "photo_ids");
  await mkdir(dir, { recursive: true });
  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);
  return `photo_ids/${filename}`;
}

function buildDate(year, month, day) {
  if (!year || !month || !day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function toJsonOrNull(val) {
  if (!val) return null;
  if (Array.isArray(val)) return JSON.stringify(val);
  try {
    JSON.parse(val);
    return val;
  } catch {
    return JSON.stringify([val]);
  }
}

export function toBool(val) {
  return ["true", "1", "on", "yes"].includes(String(val).toLowerCase()) ? 1 : 0;
}

/**
 * Parse multipart form into fields + optional photo file (not saved yet).
 */
export function parseApplyingFormEntries(formData) {
  const fields = {};
  let photoFile = null;
  for (const [key, value] of formData.entries()) {
    if (key === "photo_id" && value instanceof File && value.size > 0) {
      photoFile = value;
    } else {
      if (fields[key] !== undefined) {
        if (!Array.isArray(fields[key])) fields[key] = [fields[key]];
        fields[key].push(value);
      } else {
        fields[key] = value;
      }
    }
  }
  return { fields, photoFile };
}

/**
 * Returns { ok: true, fields, photoPath } or { ok: false, error: string }.
 */
export async function validateApplyingAndSavePhoto(fields, photoFile) {
  let photoPath = "";
  if (photoFile) {
    if (photoFile.size > 10 * 1024 * 1024) {
      return { ok: false, error: "Photo ID must be 10 MB or smaller." };
    }
    photoPath = await savePhotoId(photoFile);
  }

  const requiredChecks = [
    [fields.property_id, "Property"],
    [fields.move_in_date, "Desired move-in date"],
    [fields.first_name, "First name"],
    [fields.last_name, "Last name"],
    [fields.email, "Email"],
    [fields.confirm_email, "Confirm email"],
    [fields.phone, "Phone"],
    [fields.ssn, "SSN"],
    [fields.billing_first_name, "Billing first name"],
    [fields.billing_last_name, "Billing last name"],
    [fields.billing_address1, "Billing address"],
    [fields.billing_city, "Billing city"],
    [fields.billing_state, "Billing state"],
    [fields.billing_zip, "Billing zip"],
  ];
  const missing = requiredChecks
    .filter(([value]) => !value || String(value).trim() === "")
    .map(([, label]) => label);

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Please complete required fields: ${missing.join(", ")}.`,
    };
  }

  if (!photoPath) {
    return { ok: false, error: "Photo ID is required." };
  }

  if (String(fields.email).trim() !== String(fields.confirm_email).trim()) {
    return { ok: false, error: "Email and Confirm Email must match." };
  }

  if (!toBool(fields.agree_terms)) {
    return { ok: false, error: "You must agree to the terms before payment." };
  }

  return { ok: true, fields, photoPath };
}

function buildInsertValues(fields, photoPath, paymentMethod, paymentStatus, stripePaymentIntent = null, stripeChargeId = null) {
  const dob = buildDate(fields.dob_year, fields.dob_month, fields.dob_day);
  const dependentDob = buildDate(
    fields.dep_year,
    fields.dep_month,
    fields.dep_day,
  );

  let petDetails = null;
  const petNames = Array.isArray(fields.pet_names)
    ? fields.pet_names
    : fields.pet_names
      ? [fields.pet_names]
      : [];
  const petBreeds = Array.isArray(fields.pet_breeds)
    ? fields.pet_breeds
    : fields.pet_breeds
      ? [fields.pet_breeds]
      : [];
  const petWeights = Array.isArray(fields.pet_weights)
    ? fields.pet_weights
    : fields.pet_weights
      ? [fields.pet_weights]
      : [];
  const petAges = Array.isArray(fields.pet_ages)
    ? fields.pet_ages
    : fields.pet_ages
      ? [fields.pet_ages]
      : [];
  if (petNames.length > 0) {
    petDetails = JSON.stringify(
      petNames.map((name, i) => ({
        name,
        breed: petBreeds[i] || "",
        weight: petWeights[i] || "",
        age: petAges[i] || "",
      })),
    );
  }

  const adultNames = Array.isArray(fields.adult_names)
    ? fields.adult_names
    : fields.adult_names
      ? [fields.adult_names]
      : [];
  const adultEmails = Array.isArray(fields.adult_emails)
    ? fields.adult_emails
    : fields.adult_emails
      ? [fields.adult_emails]
      : [];
  const adultPhones = Array.isArray(fields.adult_phones)
    ? fields.adult_phones
    : fields.adult_phones
      ? [fields.adult_phones]
      : [];

  return [
    fields.property_id || null,
    fields.move_in_date || null,
    fields.applicant_type || "tenant",
    fields.first_name || "",
    fields.last_name || "",
    fields.email || "",
    fields.confirm_email || "",
    fields.phone || "",
    fields.hear_about || "",
    fields.address1 || "",
    fields.address2 || "",
    fields.city || "",
    fields.state || "",
    fields.zipcode || "",
    fields.reside_from_month || "",
    fields.reside_from_year || "",
    fields.monthly_rent || 0,
    fields.monthly_mortgage || 0,
    fields.landlord_name || "",
    fields.landlord_phone || "",
    fields.landlord_email || "",
    fields.home_email || "",
    fields.reason_for_leaving || "",
    toBool(fields.has_adults),
    parseInt(fields.adult_count, 10) || 0,
    toJsonOrNull(adultNames.length > 0 ? adultNames : null),
    toJsonOrNull(adultEmails.length > 0 ? adultEmails : null),
    toJsonOrNull(adultPhones.length > 0 ? adultPhones : null),
    toBool(fields.has_dependents),
    fields.dependent_first_name || "",
    fields.dependent_last_name || "",
    fields.dependent_relation || "",
    dependentDob,
    toBool(fields.has_pets),
    parseInt(fields.pet_count, 10) || 0,
    petDetails,
    dob,
    fields.license_number || "",
    fields.license_state || "",
    fields.personal_email || "",
    fields.personal_phone || "",
    fields.emergency_name || "",
    fields.emergency_phone || "",
    fields.emergency_relation || "",
    fields.ssn || "",
    toBool(fields.has_vehicle),
    fields.vehicle_make || "",
    fields.vehicle_color || "",
    fields.vehicle_license || "",
    fields.vehicle_modal || "",
    fields.vehicle_year || "",
    fields.employer_name || "",
    fields.employer_address1 || "",
    fields.employer_address2 || "",
    fields.employer_city || "",
    fields.employer_state || "",
    fields.employer_zip || "",
    fields.employer_phone || "",
    fields.monthly_salary || 0,
    fields.position || "",
    fields.years_worked || 0,
    fields.supervisor_name || "",
    fields.eviction_history || "no",
    fields.eviction_explain || "",
    fields.criminal_history || "no",
    fields.criminal_explain || "",
    fields.income_3x || "yes",
    fields.income_explain || "",
    fields.employment_history || "yes",
    fields.employment_explain || "",
    fields.residency_history || "yes",
    fields.residency_explain || "",
    fields.billing_first_name || "",
    fields.billing_last_name || "",
    fields.billing_address1 || "",
    fields.billing_address2 || "",
    fields.billing_city || "",
    fields.billing_state || "",
    fields.billing_zip || "",
    photoPath,
    paymentMethod,
    paymentStatus,
    APPLICATION_FEE_DOLLARS,
    stripePaymentIntent,
    stripeChargeId,
    toBool(fields.agree_terms),
    fields.authorized_name ||
      `${fields.first_name || ""} ${fields.last_name || ""}`.trim(),
    new Date().toISOString().slice(0, 19).replace("T", " "),
  ];
}

export async function insertFullApplication(
  fields,
  photoPath,
  { paymentMethod, paymentStatus, stripePaymentIntent = null, stripeChargeId = null },
) {
  const insertValues = buildInsertValues(
    fields,
    photoPath,
    paymentMethod,
    paymentStatus,
    stripePaymentIntent,
    stripeChargeId,
  );
  return insert(
    `INSERT INTO frontend_applying (
        property_id, move_in_date, applicant_type,
        first_name, last_name, email, confirm_email, phone, hear_about,
        address1, address2, city, state, zipcode,
        reside_from_month, reside_from_year, monthly_rent, monthly_mortgage,
        landlord_name, landlord_phone, landlord_email, home_email, reason_for_leaving,
        other_adults, adult_count, adult_names, adult_emails, adult_phones,
        dependents_under_18, dependent_first_name, dependent_last_name,
        dependent_relation, dependent_dob,
        has_pets, pet_count, pet_details,
        dob, license_number, license_state,
        personal_email, personal_phone,
        emergency_name, emergency_phone, emergency_relation, ssn,
        has_vehicle, vehicle_make, vehicle_color, vehicle_license, vehicle_modal, vehicle_year,
        employer_name, employer_address1, employer_address2, employer_city, employer_state, employer_zip,
        employer_phone, monthly_salary, position, years_worked, supervisor_name,
        eviction_history, eviction_explain, criminal_history, criminal_explain,
        income_3x_rent, income_explain, employment_history, employment_explain,
        residency_history, residency_explain,
        billing_first_name, billing_last_name, billing_address1, billing_address2,
        billing_city, billing_state, billing_zip,
        photo_id, payment_method, payment_status, amount,
        stripe_payment_intent, stripe_charge_id,
        agree_terms, authorized_name, submitted_at
      ) VALUES (${Array(insertValues.length).fill("?").join(", ")})`,
    insertValues,
  );
}

/**
 * After a paid application row is inserted: notify admin (full form) and applicant (thank you).
 */
export async function sendApplyingNotificationEmail(
  fields,
  applicationId,
  paymentMethod = "card",
  paymentStatus = "paid",
  photoPath = "",
) {
  const {
    applicationAdminFullFormEmail,
    applicationThankYouEmail,
  } = await import("@/lib/emailTemplates");
  const adminTo = process.env.DEFAULT_FROM_EMAIL;

  if (adminTo) {
    try {
      await sendEmail({
        to: adminTo,
        subject: `New Application Received (ID: ${applicationId}) — paid`,
        html: applicationAdminFullFormEmail({
          fields,
          applicationId,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          photoPath: photoPath || "",
        }),
      });
    } catch (err) {
      console.error("Application admin email failed:", err);
    }
  }

  const applicantTo = String(fields?.email || "").trim();
  if (applicantTo) {
    try {
      await sendEmail({
        to: applicantTo,
        subject: "Thank you for your application — Purple Housing",
        html: applicationThankYouEmail({
          first_name: fields.first_name,
          last_name: fields.last_name,
          applicationId,
          property_id: fields.property_id,
          move_in_date: fields.move_in_date,
          payment_method: paymentMethod,
        }),
      });
    } catch (err) {
      console.error("Application thank-you email failed:", err);
    }
  }
}
