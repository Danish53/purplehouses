import { NextResponse } from "next/server";
import {
  updateBookingStatus,
  getPropertyForBookingEmail,
} from "@/lib/queries";
import { sendEmail } from "@/lib/email";
import { getSession } from "@/lib/session";
import {
  showingApprovedCustomerEmail,
  showingDeclinedCustomerEmail,
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
      const siteBase = (
        process.env.NEXT_PUBLIC_SITE_URL || "https://purplehousing.com"
      ).replace(/\/$/, "");
      const propRow = await getPropertyForBookingEmail(booking.property_name);
      const address =
        propRow?.property_map_address?.trim() || booking.property_name;
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
        property_name: booking.property_name,
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
        full_name: `${booking.first_name} ${booking.last_name}`.trim(),
        email: booking.email,
        phone: booking.phone,
        booking_date: booking.date,
        booking_time: booking.time,
        status,
        reason: status === "Disapproved" ? reason : "",
      };

      const isApproved = status === "Approved";
      const customerSubject = isApproved
        ? `Showing Request Approved - ${address}`
        : `Showing Request Declined - ${address}`;
      const customerHtml = isApproved
        ? showingApprovedCustomerEmail(ctx)
        : showingDeclinedCustomerEmail(ctx);

      // Customer only: approved / declined (admin acted from dashboard)
      let customerSent = false;
      try {
        customerSent = await sendEmail({
          to: booking.email,
          subject: customerSubject,
          html: customerHtml,
        });
      } catch (emailErr) {
        console.error("Customer status email failed:", emailErr);
      }

      return NextResponse.json({
        success: true,
        status,
        email_sent: { customer: customerSent },
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
