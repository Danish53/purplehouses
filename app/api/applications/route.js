import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await query(
      "SELECT id, first_name, last_name, email, phone, property_id, applicant_type, payment_status, submitted_at FROM frontend_applying ORDER BY submitted_at DESC",
    );
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Applications list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications." },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id || typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }
    await query("DELETE FROM frontend_applying WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Application delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete application." },
      { status: 500 },
    );
  }
}
