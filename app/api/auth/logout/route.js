import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ success: true, redirect: "/" });
}

export async function GET(request) {
  const session = await getSession();
  session.destroy();
  // Redirect using the same origin as the current request (avoids hardcoded localhost in prod).
  // return NextResponse.redirect(new URL("/", request.url));
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.url;
return NextResponse.redirect(new URL("/", baseUrl));
}
