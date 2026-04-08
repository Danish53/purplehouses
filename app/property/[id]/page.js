export const dynamic = "force-dynamic";
import { enrichProperty, getPropertyById } from "@/lib/queries";
import PropertyDetailsClient from "./PropertyDetailsClient";
import { notFound } from "next/navigation";

function formatDisplayDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US");
}

export default async function PropertyDetailsPage({ params }) {
  const { id } = await params;
  const row = await getPropertyById(id);
  if (!row) return notFound();
  const enrichedRow = enrichProperty(row);

  const galleryImages = enrichedRow.gallery_urls || [];
  const features = enrichedRow.feature_labels || [];
  const attachments = enrichedRow.attachment_urls || [];

  const property = {
    id: row.id,
    prop_title: row.prop_title,
    prop_des: row.prop_des,
    prop_price: row.prop_price,
    prop_beds: row.prop_beds,
    prop_baths: row.prop_baths,
    prop_size: row.prop_size,
    prop_year_built: row.prop_year_built,
    featured: row.featured,
    status: row.status,
    purpose: row.purpose,
    category: row.category,
    property_map_address: row.property_map_address,
    city: row.city || "",
    administrative_area_level_1: row.administrative_area_level_1 || "",
    zip_code: row.zip_code || "",
    country: row.country || "",
    lat: row.latitude || row.lat || "",
    lng: row.longitude || row.lng || "",
    available_date: formatDisplayDate(enrichedRow.available_date),
    created_at: formatDisplayDate(row.created_at),
  };

  return (
    <PropertyDetailsClient
      property={property}
      galleryImages={galleryImages}
      features={features}
      attachments={attachments}
    />
  );
}
