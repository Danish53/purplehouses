/**
 * Loads .env then .env.local (same override order as Next.js) and tries Prisma connect.
 * Run: node scripts/check-db.js
 */
const fs = require("fs");
const path = require("path");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const root = path.join(__dirname, "..");
const base = parseEnvFile(path.join(root, ".env"));
const local = parseEnvFile(path.join(root, ".env.local"));
const merged = { ...base, ...local };
for (const [k, v] of Object.entries(merged)) {
  process.env[k] = v;
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing after loading .env + .env.local");
  process.exit(1);
}

const masked = url.replace(/:\/\/([^:]+):([^@]*)@/, "://$1:***@");
console.log("Effective DATABASE_URL (masked):", masked);

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

prisma
  .$connect()
  .then(() => {
    console.log("Prisma: connected OK.");
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error("Prisma: connect failed:", e.message);
    process.exit(1);
  });
