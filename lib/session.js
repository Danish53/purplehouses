import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

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

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession(cookieStore, sessionOptions);
}

export { sessionOptions };
