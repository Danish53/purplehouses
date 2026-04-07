import { NextResponse } from "next/server";
import { createBooking } from "@/lib/queries";
import { sendEmail } from "@/lib/email";
import {
  bookingReceivedEmail,
  bookingConfirmationEmail,
} from "@/lib/emailTemplates";

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
    const ctx = {
      property_name: property,
      property_address: property,
      full_name: fullName,
      email,
      phone,
      booking_date: date,
      booking_time: time,
    };

    // Send confirmation to customer
    try {
      await sendEmail({
        to: email,
        subject: "Showing request received",
        html: bookingConfirmationEmail(ctx),
      });
    } catch (emailErr) {
      console.error("Customer email notification failed:", emailErr);
    }

    // Send notification to admin
    const notifyEmail =
      process.env.BOOKING_NOTIFICATION_EMAIL || process.env.DEFAULT_FROM_EMAIL;
    try {
      await sendEmail({
        to: notifyEmail,
        subject: `New Showing Request – ${property}`,
        html: bookingReceivedEmail(ctx),
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
