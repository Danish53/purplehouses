import prisma from "./prisma";

// Serialize BigInt values (Prisma returns BigInt for auto-increment IDs)
function serializeRows(rows) {
  return rows.map(serializeRow);
}

function serializeRow(row) {
  if (!row || typeof row !== "object") return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "bigint") out[k] = Number(v);
    else if (v instanceof Date) out[k] = v.toISOString();
    else out[k] = v;
  }
  return out;
}

export async function query(sql, params = []) {
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return serializeRows(rows);
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function insert(sql, params = []) {
  let insertId = 0;
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(sql, ...params);
    const [{ id }] = await tx.$queryRawUnsafe("SELECT LAST_INSERT_ID() as id");
    insertId = Number(id);
  });
  return { insertId };
}

export default prisma;
