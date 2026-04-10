import crypto from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const DRAFT_DIR = path.join(process.cwd(), ".data", "applying-drafts");
const ORDER_LINK_DIR = path.join(process.cwd(), ".data", "applying-order-links");

export function generateDraftToken() {
  return crypto.randomBytes(24).toString("hex");
}

export async function saveApplyingDraft(token, payload) {
  await mkdir(DRAFT_DIR, { recursive: true });
  await writeFile(
    path.join(DRAFT_DIR, `${token}.json`),
    JSON.stringify(payload),
    "utf8",
  );
}

export async function loadApplyingDraft(token) {
  try {
    const raw = await readFile(path.join(DRAFT_DIR, `${token}.json`), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function deleteApplyingDraft(token) {
  try {
    await unlink(path.join(DRAFT_DIR, `${token}.json`));
  } catch {
    /* ignore */
  }
}

export async function saveOrderDraftLink(orderId, draftToken) {
  await mkdir(ORDER_LINK_DIR, { recursive: true });
  const safe = encodeURIComponent(orderId);
  await writeFile(
    path.join(ORDER_LINK_DIR, `${safe}.json`),
    JSON.stringify({ draft_token: draftToken }),
    "utf8",
  );
}

export async function loadDraftTokenByOrderId(orderId) {
  try {
    const safe = encodeURIComponent(orderId);
    const raw = await readFile(
      path.join(ORDER_LINK_DIR, `${safe}.json`),
      "utf8",
    );
    const data = JSON.parse(raw);
    return data.draft_token || null;
  } catch {
    return null;
  }
}

export async function deleteOrderDraftLink(orderId) {
  try {
    const safe = encodeURIComponent(orderId);
    await unlink(path.join(ORDER_LINK_DIR, `${safe}.json`));
  } catch {
    /* ignore */
  }
}
