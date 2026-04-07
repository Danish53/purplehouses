import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Property ID required." },
        { status: 400 },
      );
    }

    const existing = await prisma.Property.findUnique({
      where: { id: BigInt(id) },
      select: { status: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Property not found." },
        { status: 404 },
      );
    }

    const newStatus = existing.status === "expire" ? "approved" : "expire";
    await prisma.Property.update({
      where: { id: BigInt(id) },
      data: { status: newStatus },
    });

    return NextResponse.json({ status: newStatus });
  } catch (error) {
    console.error("Expire toggle error:", error);
    return NextResponse.json(
      { error: "Failed to toggle property status." },
      { status: 500 },
    );
  }
}
