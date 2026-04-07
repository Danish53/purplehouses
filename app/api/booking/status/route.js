import { NextResponse } from "next/server";
import { updateBookingStatus } from "@/lib/queries";
import { sendEmail } from "@/lib/email";
import { getSession } from "@/lib/session";
import {
  bookingConfirmationEmail,
  bookingReceivedEmail,
} from "@/lib/emailTemplates";

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, reason } = await request.json();
    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    if (!["Approved", "Disapproved"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid booking status." },
        { status: 400 },
      );
    }

    const booking = await updateBookingStatus(id, status, reason || "");

    if (booking && booking.email) {
      const ctx = {
        property_name: booking.property_name,
        property_address: booking.property_name,
        full_name: `${booking.first_name} ${booking.last_name}`.trim(),
        email: booking.email,
        phone: booking.phone,
        booking_date: booking.date,
        booking_time: booking.time,
        status,
        reason: status === "Disapproved" ? reason : "",
      };

      // Send to customer
      let customerSent = false;
      try {
        customerSent = await sendEmail({
          to: booking.email,
          subject: `Your Purple Housing showing request was ${status.toLowerCase()}`,
          html: bookingConfirmationEmail(ctx),
        });
      } catch (emailErr) {
        console.error("Customer status email failed:", emailErr);
      }

      // Send to admin
      let adminSent = false;
      const notifyEmail =
        process.env.BOOKING_NOTIFICATION_EMAIL ||
        process.env.DEFAULT_FROM_EMAIL;
      try {
        adminSent = await sendEmail({
          to: notifyEmail,
          subject: `Showing request ${status.toLowerCase()}`,
          html: bookingReceivedEmail(ctx),
        });
      } catch (emailErr) {
        console.error("Admin status email failed:", emailErr);
      }

      return NextResponse.json({
        success: true,
        status,
        email_sent: { customer: customerSent, admin: adminSent },
      });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Booking status error:", error);
    return NextResponse.json(
      { error: "Failed to update booking status." },
      { status: 500 },
    );
  }
}
