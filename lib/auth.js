import bcrypt from "bcryptjs";
import prisma from "./prisma";

export async function hashPassword(raw) {
  return bcrypt.hash(raw, 12);
}

export async function checkPassword(raw, hashed) {
  // Django uses pbkdf2_sha256 by default. bcryptjs won't match Django hashes.
  // If migrating from Django, passwords need to be re-hashed on first login.
  // For new users, use bcrypt.
  if (hashed.startsWith("$2")) {
    return bcrypt.compare(raw, hashed);
  }
  // Fallback: try Django-style pbkdf2_sha256 if needed
  // For now, return false for unrecognized formats
  return false;
}

export async function getUserByUsername(username) {
  const row = await prisma.frontend_customuser.findUnique({
    where: { username },
  });
  if (!row) return null;
  return { ...row, id: Number(row.id) };
}
