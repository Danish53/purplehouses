import { NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const APPLICATION_FEE = "50.00";

async function getPayPalAccessToken() {
  const clientId =
    process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
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

async function savePhotoId(file) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `applying_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const dir = path.join(process.cwd(), "public", "media", "photo_ids");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `photo_ids/${filename}`;
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
        { error: "Invalid form payload." },
        { status: 400 },
      );
    }

    const fields = {};
    let photoFile = null;
    for (const [key, value] of formData.entries()) {
      if (key === "photo_id" && value instanceof File && value.size > 0) {
        photoFile = value;
      } else {
        fields[key] = value;
      }
    }

    let photoPath = "";
    if (photoFile) {
      photoPath = await savePhotoId(photoFile);
    }

    // Save application as pending
    const applicationId = await insert(
      `INSERT INTO frontend_applying
        (property_id, first_name, last_name, email, phone, applicant_type,
         payment_method, payment_status, photo_id, submitted_at)
       VALUES (?,?,?,?,?,?,?,?,?,NOW())`,
      [
        fields.property_id || null,
        fields.first_name || "",
        fields.last_name || "",
        fields.email || "",
        fields.phone || "",
        fields.applicant_type || "tenant",
        "paypal",
        "pending",
        photoPath,
      ],
    );

    // Create PayPal order
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
            description: "Purple Housing Application Fee",
          },
        ],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/applying/paypal/capture-order?application_id=${applicationId}`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/applying?cancelled=1`,
        },
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData.id) {
      return NextResponse.json(
        { error: "Failed to create PayPal order." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      orderId: orderData.id,
      applicationId,
    });
  } catch (error) {
    console.error("PayPal create-order error:", error);
    return NextResponse.json(
      { error: "Failed to create PayPal order." },
      { status: 500 },
    );
  }
}
