import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

/** Saves the dashboard display order: body { ids: [id, id, ...] } (first = top). */
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids required." }, { status: 400 });
    }

    const clean = ids.map((id) => BigInt(id));
    await prisma.$transaction(
      clean.map(
        (id, i) =>
          prisma.$executeRaw`UPDATE Property SET sort_order = ${i + 1} WHERE id = ${id}`,
      ),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json(
      { error: "Failed to save order." },
      { status: 500 },
    );
  }
}