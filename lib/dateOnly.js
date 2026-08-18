/**
 * Treat available_date as a calendar date (no timezone shift).
 * HTML date inputs send "YYYY-MM-DD"; Date("YYYY-MM-DD") is UTC midnight,
 * which becomes the previous day in US timezones.
 */

function dateParts(value) {
  if (!value) return null;
  const s = String(value).trim();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function parseDateOnly(value) {
  const parts = dateParts(value);
  if (!parts) return null;
  const mm = String(parts.month).padStart(2, "0");
  const dd = String(parts.day).padStart(2, "0");
  return new Date(`${parts.year}-${mm}-${dd}T12:00:00.000Z`);
}

export function toDateOnlyInputValue(value) {
  const parts = dateParts(value);
  if (!parts) return "";
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function formatDateOnlyUS(value) {
  const parts = dateParts(value);
  if (!parts) return "";
  return `${parts.month}/${parts.day}/${parts.year}`;
}

export function todayDateOnlyInputValue() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
