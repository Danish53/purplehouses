/**
 * Creates or updates dashboard login user in `frontend_customuser`.
 * Password is stored as bcrypt (required by lib/auth.js).
 *
 * Usage: npm run seed:admin
 *        node scripts/seed-admin.js myuser mypassword
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2] || "admin";
  const password = process.argv[3] || "admin1234";

  const hash = await bcrypt.hash(password, 12);
  await prisma.frontend_customuser.upsert({
    where: { username },
    create: {
      username,
      password: hash,
      is_active: true,
      created_at: new Date(),
    },
    update: {
      password: hash,
      is_active: true,
    },
  });
  console.log(`OK: user "${username}" saved (bcrypt hash in DB).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
