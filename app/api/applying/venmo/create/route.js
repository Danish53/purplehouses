import { NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const APPLICATION_FEE = "50.00";

function toBool(val) {
  return ["true", "1", "on", "yes"].includes(String(val).toLowerCase()) ? 1 : 0;
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
  await writeFile(path.join(dir, filename), buffer);
  return `photo_ids/${filename}`;
}

async function getPayPalAccessToken() {
  const clientId = getPayPalClientId();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    throw new Error("PayPal credentials not configured");

  const base =
    process.env.PAYPAL_ENV === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to obtain PayPal token");
  return { token: data.access_token, base };
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
        continue;
      }
      if (fields[key] !== undefined) {
        if (!Array.isArray(fields[key])) fields[key] = [fields[key]];
        fields[key].push(value);
      } else {
        fields[key] = value;
      }
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

    if (!photoFile) {
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

    const photoPath = await savePhotoId(photoFile);

    const fundingSource = fields.payment_method || "venmo";
    if (fundingSource !== "venmo") {
      return NextResponse.json(
        { error: "Only Venmo uses the native SDK checkout flow." },
        { status: 400 },
      );
    }

    // Create a complete application record with all non-null columns.
    const result = await insert(
      `INSERT INTO frontend_applying (
        property_id, move_in_date, applicant_type,
        first_name, last_name, email, confirm_email, phone, hear_about,
        other_adults, dependents_under_18, has_pets,
        ssn, has_vehicle,
        eviction_history, criminal_history, income_3x_rent,
        employment_history, residency_history,
        photo_id,
        billing_first_name, billing_last_name, billing_address1,
        billing_city, billing_state, billing_zip,
        agree_terms, authorized_name,
        payment_method, payment_status, amount, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        fields.property_id,
        fields.move_in_date,
        fields.applicant_type || "tenant",
        fields.first_name,
        fields.last_name,
        fields.email,
        fields.confirm_email,
        fields.phone,
        fields.hear_about || "Agent/Broker",
        toBool(fields.has_adults),
        toBool(fields.has_dependents),
        toBool(fields.has_pets),
        fields.ssn,
        toBool(fields.has_vehicle),
        fields.eviction_history || "no",
        fields.criminal_history || "no",
        fields.income_3x || "yes",
        fields.employment_history || "yes",
        fields.residency_history || "yes",
        photoPath,
        fields.billing_first_name,
        fields.billing_last_name,
        fields.billing_address1,
        fields.billing_city,
        fields.billing_state,
        fields.billing_zip,
        toBool(fields.agree_terms),
        fields.authorized_name ||
          `${fields.first_name || ""} ${fields.last_name || ""}`.trim(),
        fundingSource,
        "pending",
        APPLICATION_FEE,
      ],
    );

    const applicationId = result.insertId;

    // Create PayPal order (no redirect URLs for SDK flow)
    const { token, base } = await getPayPalAccessToken();

    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: APPLICATION_FEE },
            description: `Rental application fee (ID: ${applicationId})`,
          },
        ],
      }),
    });

    const order = await orderRes.json();
    const orderId = order.id;

    if (!orderRes.ok || !orderId) {
      return NextResponse.json(
        { error: order?.message || "Failed to create PayPal order." },
        { status: 502 },
      );
    }

    // Store order ID for later capture
    await query(
      "UPDATE frontend_applying SET stripe_charge_id = ? WHERE id = ?",
      [orderId, applicationId],
    );

    return NextResponse.json({
      status: "created",
      order_id: orderId,
      application_id: applicationId,
    });
  } catch (error) {
    console.error("Venmo create-order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Venmo order." },
      { status: 500 },
    );
  }
}
