import { getPublicProperties, enrichProperty } from "@/lib/queries";
import { parseDateOnly } from "@/lib/dateOnly";

/** Year a listing becomes available (from available_date). Null if not set/invalid. */
function moveInYear(property) {
  const d = parseDateOnly(property?.available_date);
  return d ? d.getUTCFullYear() : null;
}

/**
 * Public listings grouped by move-in year (current year onwards), earliest
 * available date first. Returns [{ year, properties }] sorted by year asc.
 */
export async function getMoveInGroups() {
  const rows = await getPublicProperties();
  const thisYear = new Date().getFullYear();
  const byYear = new Map();

  for (const row of rows) {
    const year = moveInYear(row);
    if (!year || year < thisYear) continue;
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(enrichProperty(row));
  }

  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, properties]) => ({
      year,
      properties: properties.sort((a, b) => {
        // admin drag order first; same order value -> earliest available date
        const oa = Number(a.sort_order) || 0;
        const ob = Number(b.sort_order) || 0;
        if (oa !== ob) return oa - ob;
        const da = parseDateOnly(a.available_date)?.getTime() || 0;
        const db = parseDateOnly(b.available_date)?.getTime() || 0;
        return da - db;
      }),
    }));
}