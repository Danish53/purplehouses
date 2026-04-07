import { NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import Stripe from "stripe";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const APPLICATION_FEE_DOLLARS = "50.00";
const APPLICATION_FEE_CENTS = 5000;

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured.");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function getPayPalClientId() {
  return (
    process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  );
}

async function savePhotoId(file) {
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

function toJsonOrNull(val) {
  if (!val) return null;
  if (Array.isArray(val)) return JSON.stringify(val);
  try {
    JSON.parse(val);
    return val;
  } catch {
    return JSON.stringify([val]);
  }
}

function toBool(val) {
  return ["true", "1", "on", "yes"].includes(String(val).toLowerCase()) ? 1 : 0;
}

export async function POST(request) {
  try {
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid form payload. Please submit using the application form.",
        },
        { status: 400 },
      );
    }
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

    const paymentMethod = fields.payment_method || "card";
    let photoPath = "";
    if (photoFile) {
      if (photoFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Photo ID must be 10 MB or smaller." },
          { status: 400 },
        );
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
      return NextResponse.json(
        { error: `Please complete required fields: ${missing.join(", ")}.` },
        { status: 400 },
      );
    }

    if (!photoPath) {
      return NextResponse.json(
        { error: "Photo ID is required." },
        { status: 400 },
      );
    }

    if (String(fields.email).trim() !== String(fields.confirm_email).trim()) {
      return NextResponse.json(
        { error: "Email and Confirm Email must match." },
        { status: 400 },
      );
    }

    if (!toBool(fields.agree_terms)) {
      return NextResponse.json(
        { error: "You must agree to the terms before payment." },
        { status: 400 },
      );
    }

    // Build dates
    const dob = buildDate(fields.dob_year, fields.dob_month, fields.dob_day);
    const dependentDob = buildDate(
      fields.dep_year,
      fields.dep_month,
      fields.dep_day,
    );

    // Build pet details JSON
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

    // Build adult arrays
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

    const insertValues = [
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
      parseInt(fields.adult_count) || 0,
      toJsonOrNull(adultNames.length > 0 ? adultNames : null),
      toJsonOrNull(adultEmails.length > 0 ? adultEmails : null),
      toJsonOrNull(adultPhones.length > 0 ? adultPhones : null),
      toBool(fields.has_dependents),
      fields.dependent_first_name || "",
      fields.dependent_last_name || "",
      fields.dependent_relation || "",
      dependentDob,
      toBool(fields.has_pets),
      parseInt(fields.pet_count) || 0,
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
      "pending",
      APPLICATION_FEE_DOLLARS,
      toBool(fields.agree_terms),
      fields.authorized_name ||
        `${fields.first_name || ""} ${fields.last_name || ""}`.trim(),
      new Date().toISOString().slice(0, 19).replace("T", " "),
    ];

    // Insert application with ALL fields
    const result = await insert(
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
        agree_terms, authorized_name, submitted_at
      ) VALUES (${Array(insertValues.length).fill("?").join(", ")})`,
      insertValues,
    );

    const applicationId = result.insertId;

    // Process payment
    if (paymentMethod === "card") {
      const stripePaymentMethodId = fields.stripe_payment_method_id;
      if (!stripePaymentMethodId) {
        return NextResponse.json(
          { error: "No payment method provided." },
          { status: 400 },
        );
      }

      const paymentIntent = await getStripe().paymentIntents.create({
        amount: APPLICATION_FEE_CENTS, // $50.00
        currency: "usd",
        payment_method: stripePaymentMethodId,
        confirm: true,
        payment_method_types: ["card"],
        description: `Application fee (ID: ${applicationId})`,
        metadata: { application_id: String(applicationId) },
      });

      if (paymentIntent.status === "requires_action") {
        await query(
          "UPDATE frontend_applying SET payment_status = ? WHERE id = ?",
          ["action", applicationId],
        );
        return NextResponse.json({
          status: "requires_action",
          payment_intent_client_secret: paymentIntent.client_secret,
        });
      } else if (paymentIntent.status === "succeeded") {
        await query(
          "UPDATE frontend_applying SET payment_status = ? WHERE id = ?",
          ["paid", applicationId],
        );
        sendNotificationEmail(fields, applicationId, "card", "paid");
        return NextResponse.json({
          status: "succeeded",
          redirect_url: "/success",
        });
      } else {
        return NextResponse.json(
          { error: "Payment failed. Status: " + paymentIntent.status },
          { status: 400 },
        );
      }
    } else if (paymentMethod === "paypal") {
      // PayPal redirect flow
      const PAYPAL_API =
        process.env.PAYPAL_ENV === "live"
          ? "https://api-m.paypal.com"
          : "https://api-m.sandbox.paypal.com";
      const paypalClientId = getPayPalClientId();
      if (!paypalClientId || !process.env.PAYPAL_CLIENT_SECRET) {
        return NextResponse.json(
          { error: "PayPal is not configured." },
          { status: 500 },
        );
      }

      const authResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${paypalClientId}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });
      const authData = await authResponse.json();
      if (!authResponse.ok || !authData.access_token) {
        return NextResponse.json(
          {
            error:
              authData.error_description || "PayPal authentication failed.",
          },
          { status: 502 },
        );
      }
      const accessToken = authData.access_token;

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: { currency_code: "USD", value: APPLICATION_FEE_DOLLARS },
              description: `Application fee (ID: ${applicationId})`,
            },
          ],
          application_context: {
            return_url: `${siteUrl}/api/applying/paypal/capture?application_id=${applicationId}`,
            cancel_url: `${siteUrl}/applying`,
          },
        }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) {
        return NextResponse.json(
          { error: order?.message || "Failed to create PayPal order." },
          { status: 502 },
        );
      }
      const approvalUrl = order.links?.find((l) => l.rel === "approve")?.href;

      if (approvalUrl) {
        await query(
          "UPDATE frontend_applying SET payment_status = ? WHERE id = ?",
          ["pending", applicationId],
        );
        return NextResponse.json({
          status: "paypal_redirect",
          redirect_url: approvalUrl,
        });
      } else {
        return NextResponse.json(
          { error: "Failed to create PayPal order." },
          { status: 500 },
        );
      }
    } else {
      // Venmo or other - save as pending
      await query(
        "UPDATE frontend_applying SET payment_status = ? WHERE id = ?",
        ["pending", applicationId],
      );
      return NextResponse.json({ status: "saved", redirect_url: "/success" });
    }
  } catch (error) {
    console.error("Applying error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process application." },
      { status: 500 },
    );
  }
}

async function sendNotificationEmail(
  fields,
  applicationId,
  paymentMethod = "card",
  paymentStatus = "pending",
) {
  const { applicationNotificationEmail } = await import("@/lib/emailTemplates");
  try {
    await sendEmail({
      to: process.env.DEFAULT_FROM_EMAIL,
      subject: `New Application Received (ID: ${applicationId})`,
      html: applicationNotificationEmail({
        applicationId,
        first_name: fields.first_name,
        last_name: fields.last_name,
        email: fields.email,
        phone: fields.phone,
        property_id: fields.property_id,
        move_in_date: fields.move_in_date,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
      }),
    });
  } catch (err) {
    console.error("Application notification email failed:", err);
  }
}
