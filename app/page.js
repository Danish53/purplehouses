import Link from "next/link";
import HomeClient from "./HomeClient";
import {
  getPublicProperties,
  getAllBlogs,
  enrichProperty,
  enrichBlog,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let properties = [];
  let blogs = [];
  let mapMarkers = [];

  let sliderProperties = [];
  try {
    const rawProps = await getPublicProperties();
    // JSON round-trip converts Date objects → ISO strings (safe to pass to client component)
    properties = JSON.parse(
      JSON.stringify(
        rawProps
          .filter((p) => p.featured == 1 || p.featured === true)
          .slice(0, 6)
          .map(enrichProperty),
      ),
    );
    sliderProperties = JSON.parse(
      JSON.stringify(
        rawProps.filter((p) => p.featured == 1).map(enrichProperty),
      ),
    );
    blogs = JSON.parse(JSON.stringify((await getAllBlogs(8)).map(enrichBlog)));

    mapMarkers = rawProps
      .slice(0, 30)
      .map((p) => {
        const lat = parseFloat(p.latitude || p.lat) || 0;
        const lng = parseFloat(p.longitude || p.lng) || 0;
        if (!lat || !lng) return null;
        return {
          id: p.id,
          title: p.prop_title,
          address: p.property_map_address || p.city,
          price: p.prop_price,
          lat,
          lng,
          url: `/property/${p.id}/`,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error("Home page data fetch error:", err);
  }

  return (
    <HomeClient
      properties={properties}
      sliderProperties={sliderProperties}
      blogs={blogs}
      mapMarkers={mapMarkers}
    />
  );
}
