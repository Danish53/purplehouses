import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";

const sessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "complex_password_at_least_32_characters_long_replace_me",
  cookieName: "purplehousing_session",
  cookieOptions: {
    secure: process.env.COOKIE_SECURE === "true",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function middleware(request) {
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const response = NextResponse.next();
    const session = await getIronSession(request, response, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
