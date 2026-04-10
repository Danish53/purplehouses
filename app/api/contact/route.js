import { NextResponse } from "next/server";
import { createContact } from "@/lib/queries";
import { sendContactNotificationEmail } from "@/lib/email";
import { contactNotificationEmail } from "@/lib/emailTemplates";
import { verifyAnswer } from "@/lib/captcha";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      work_phone,
      subject,
      message,
      captcha_answer,
      captcha_token,
      honeypot,
    } = body;

    // Honeypot check
    if (honeypot) {
      return NextResponse.json({ success: true });
    }

    // Captcha validation using signed token
    if (
      !captcha_answer ||
      !captcha_token ||
      !verifyAnswer(captcha_answer, captcha_token)
    ) {
      return NextResponse.json(
        { error: "Invalid captcha. Please try again." },
        { status: 400 },
      );
    }

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }

    await createContact({
      name,
      email,
      work_phone: work_phone || "",
      subject: subject || "",
      message,
    });

    // Send notification email (separate admin: CONTACT_* env in lib/email.js)
    try {
      await sendContactNotificationEmail({
        subject: `Contact Form: ${subject || "No Subject"}`,
        html: contactNotificationEmail({
          name,
          email,
          work_phone,
          subject,
          message,
        }),
      });
    } catch (emailErr) {
      console.error("Contact email notification failed:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact error:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form." },
      { status: 500 },
    );
  }
}
