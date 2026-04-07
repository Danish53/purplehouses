import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }
    const rows = await query("SELECT * FROM frontend_applying WHERE id = ?", [
      id,
    ]);
    if (!rows.length) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ application: rows[0] });
  } catch (error) {
    console.error("Application detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch application." },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }
    const data = await request.json();

    const fields = [];
    const values = [];
    const allowed = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "applicant_type",
      "payment_status",
      "payment_method",
      "amount",
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update." },
        { status: 400 },
      );
    }

    values.push(id);
    await query(
      `UPDATE frontend_applying SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Application update error:", error);
    return NextResponse.json(
      { error: "Failed to update application." },
      { status: 500 },
    );
  }
}
