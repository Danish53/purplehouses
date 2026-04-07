import crypto from "crypto";

const CAPTCHA_SECRET =
  process.env.CAPTCHA_SECRET ||
  process.env.SESSION_SECRET ||
  "captcha_fallback_secret_32chars!!";

export function signAnswer(answer) {
  const ts = Date.now();
  const payload = `${answer}:${ts}`;
  const hmac = crypto
    .createHmac("sha256", CAPTCHA_SECRET)
    .update(payload)
    .digest("hex");
  return `${hmac}:${ts}`;
}

export function verifyAnswer(userAnswer, token) {
  if (!userAnswer || !token) return false;
  const parts = token.split(":");
  if (parts.length !== 2) return false;
  const [hmac, ts] = parts;
  // Expire tokens after 10 minutes
  if (Date.now() - Number(ts) > 10 * 60 * 1000) return false;
  const expected = crypto
    .createHmac("sha256", CAPTCHA_SECRET)
    .update(`${String(userAnswer).trim()}:${ts}`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
}
