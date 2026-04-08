function segmentContainsZip(s) {
  return /\b\d{5}(-\d{4})?\b/.test(String(s));
}

/**
 * Single-line address for cards, sliders, map popups: dedupe repeated
 * city/state/zip/country when `property_map_address` already includes them.
 *
 * @param {object} p - property with optional property_map_address, city, administrative_area_level_1, zip_code, country
 * @returns {string}
 */
export function formatPropertyCardAddress(p) {
  if (!p) return "";
  const chunks = [
    p.property_map_address,
    p.city,
    p.administrative_area_level_1,
    p.zip_code,
    p.country,
  ].filter(Boolean);
  const merged = chunks.join(", ");
  const segments = merged
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set();
  const out = [];
  let zipAlready = false;

  for (const seg of segments) {
    const key = seg.toLowerCase().replace(/\s+/g, " ");

    if (seen.has(key)) continue;
    if (/^(united states?|usa)$/i.test(seg)) continue;

    const zipOnly = /^\d{5}(-\d{4})?$/.test(seg);
    if (zipOnly) {
      if (zipAlready || out.some(segmentContainsZip)) continue;
      zipAlready = true;
    } else if (segmentContainsZip(seg)) {
      zipAlready = true;
    }

    seen.add(key);
    out.push(seg);
  }

  return out.join(", ");
}
