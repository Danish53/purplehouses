import { NextResponse } from "next/server";
import { createBooking, getPropertyForBookingEmail } from "@/lib/queries";
import { sendEmail } from "@/lib/email";
import { showingNewRequestAdminEmail } from "@/lib/emailTemplates";

export async function POST(request) {
  try {
    const body = await request.json();
    const { property, date, time, fname, lname, email, phone } = body;

    if (!property || !date || !time || !fname || !email || !phone) {
      return NextResponse.json(
        { error: "All required fields must be filled." },
        { status: 400 },
      );
    }

    const bookingId = await createBooking({
      property_name: property,
      date,
      time,
      first_name: fname,
      last_name: lname || "",
      email,
      phone,
    });

    const fullName = `${fname} ${lname || ""}`.trim();
    const siteBase = (
      process.env.NEXT_PUBLIC_SITE_URL || "https://purplehousing.com"
    ).replace(/\/$/, "");
    const propRow = await getPropertyForBookingEmail(property);
    const address =
      propRow?.property_map_address?.trim() || property;
    const propId = propRow?.id != null ? String(propRow.id) : "";
    const listingStatus = propRow?.status
      ? String(propRow.status).replace(/_/g, " ").toUpperCase()
      : "ACTIVE";
    const statusPipeId = propId ? `${listingStatus} | ${propId}` : listingStatus;
    const propertyPath = propRow?.id
      ? `${siteBase}/property/${propRow.id}`
      : `${siteBase}/`;
    const rawImg = propRow?.primary_image_url || "/images/1.jpg";
    const property_image_url = /^https?:\/\//i.test(rawImg)
      ? rawImg
      : `${siteBase}${rawImg.startsWith("/") ? rawImg : `/${rawImg}`}`;

    const ctx = {
      property_name: property,
      property_address: address,
      property_page_url: propertyPath,
      property_image_url,
      property_id: propId,
      listing_status_label: statusPipeId,
      showing_agent_name:
        process.env.BOOKING_SHOWING_AGENT_NAME || "Purple Housing",
      company_name: process.env.COMPANY_DISPLAY_NAME || "Purple Housing",
      company_phone:
        process.env.PUBLIC_CONTACT_PHONE || "(817) 585-1354",
      company_email:
        process.env.PUBLIC_CONTACT_EMAIL ||
        process.env.CONTACT_DEFAULT_FROM_EMAIL ||
        "admin@purplehousing.com",
      full_name: fullName,
      email,
      phone,
      booking_date: date,
      booking_time: time,
    };

    // Admin only: visitor already knows they submitted; notify staff
    const notifyEmail =
      process.env.BOOKING_NOTIFICATION_EMAIL || process.env.DEFAULT_FROM_EMAIL;
    try {
      await sendEmail({
        to: notifyEmail,
        subject: `New Showing Request - ${address}`,
        html: showingNewRequestAdminEmail(ctx),
      });
    } catch (emailErr) {
      console.error("Admin email notification failed:", emailErr);
    }

    return NextResponse.json({ success: true, bookingId });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking." },
      { status: 500 },
    );
  }
}
