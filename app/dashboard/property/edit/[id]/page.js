export const dynamic = "force-dynamic";
import { query } from "@/lib/db";
import PropertyEditClient from "./PropertyEditClient";
import { PROPERTY_TYPES, PROPERTY_FEATURES } from "@/lib/constants";

export default async function PropertyEditPage({ params }) {
  const { id } = await params;
  const rows = await query("SELECT * FROM Property WHERE id = ?", [id]);
  if (!rows.length) return <div className="p-4">Property not found.</div>;

  const prop = { ...rows[0] };
  // Align with DB column aliases (some rows use latitude/longitude)
  if (prop.lat == null || prop.lat === "") {
    prop.lat = prop.latitude ?? prop.lat ?? "";
  }
  if (prop.lng == null || prop.lng === "") {
    prop.lng = prop.longitude ?? prop.lng ?? "";
  }
  // Parse JSON fields
  let galleryImages = [];
  try {
    galleryImages =
      typeof prop.gallery_images === "string"
        ? JSON.parse(prop.gallery_images)
        : prop.gallery_images || [];
  } catch {
    galleryImages = [];
  }

  let propFeatures = [];
  try {
    propFeatures =
      typeof prop.prop_features === "string"
        ? JSON.parse(prop.prop_features)
        : prop.prop_features || [];
  } catch {
    propFeatures = [];
  }

  let attachments = [];
  try {
    attachments =
      typeof prop.attachments === "string"
        ? JSON.parse(prop.attachments)
        : prop.attachments || [];
  } catch {
    attachments = [];
  }

  // Serialize dates
  prop.created_at = prop.created_at
    ? new Date(prop.created_at).toISOString()
    : null;
  prop.available_date = prop.available_date
    ? new Date(prop.available_date).toISOString()
    : null;

  const PURPOSE_OPTIONS = [
    "For_Rent",
    "For_Sale",
    "Foreclosures",
    "New_Construction",
    "New_Listing",
    "Open_House",
    "Reduced_Price",
    "Resale",
  ];

  return (
    <PropertyEditClient
      prop={prop}
      galleryImages={Array.isArray(galleryImages) ? galleryImages : []}
      propFeatures={Array.isArray(propFeatures) ? propFeatures : []}
      attachments={Array.isArray(attachments) ? attachments : []}
      propertyTypes={PROPERTY_TYPES}
      allFeatures={PROPERTY_FEATURES}
      purposeOptions={PURPOSE_OPTIONS}
    />
  );
}
