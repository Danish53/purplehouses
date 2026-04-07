import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserById } from "@/lib/queries";
import { checkPassword } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const valid = await checkPassword(password, user.password);
    return NextResponse.json({ success: valid, verified: valid });
  } catch (error) {
    console.error("Password verification error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
