import { NextResponse } from "next/server";

const USER_AGENT = "PurpleHousing/1.0 (property dashboard)";

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const street = params.get("street")?.trim();
  const city = params.get("city")?.trim();
  const state = params.get("state")?.trim();
  const country = params.get("country")?.trim();
  const postalcode = params.get("postalcode")?.trim();

  const hasStructured = street || city || state || country || postalcode;
  if (!q && !hasStructured) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    if (hasStructured) {
      if (street) url.searchParams.set("street", street);
      if (city) url.searchParams.set("city", city);
      if (state) url.searchParams.set("state", state);
      if (country) url.searchParams.set("country", country);
      if (postalcode) url.searchParams.set("postalcode", postalcode);
    } else {
      url.searchParams.set("q", q);
    }

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Geocode failed" }, { status: res.status });
    }

    let data = await res.json();

    // Fallback to free-text query if structured search returned nothing
    if (!data?.length && hasStructured && q) {
      const fallback = new URL("https://nominatim.openstreetmap.org/search");
      fallback.searchParams.set("format", "json");
      fallback.searchParams.set("limit", "1");
      fallback.searchParams.set("q", q);
      const fallbackRes = await fetch(fallback.toString(), {
        headers: { "User-Agent": USER_AGENT },
        cache: "no-store",
      });
      if (fallbackRes.ok) {
        data = await fallbackRes.json();
      }
    }

    if (!data?.length) {
      return NextResponse.json({ lat: null, lng: null });
    }

    return NextResponse.json({
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    });
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json({ error: "Geocode failed" }, { status: 500 });
  }
}
