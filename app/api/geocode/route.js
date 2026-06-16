import { NextResponse } from "next/server";

const USER_AGENT = "PurpleHousing/1.0 (property dashboard)";

export async function GET(request) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", q);

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Geocode failed" }, { status: res.status });
    }

    const data = await res.json();
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
