export const dynamic = "force-dynamic";
import { query } from "@/lib/db";
import Link from "next/link";
import { friendlyFeatureLabel } from "@/lib/constants";

export default async function PropertyStatsPage({ params }) {
  const { id } = await params;
  const rows = await query("SELECT * FROM Property WHERE id = ?", [id]);
  if (!rows.length) return <div className="p-4">Property not found.</div>;

  const prop = rows[0];

  let galleryImages = [];
  try {
    galleryImages =
      typeof prop.gallery_images === "string"
        ? JSON.parse(prop.gallery_images)
        : prop.gallery_images || [];
  } catch {
    galleryImages = [];
  }

  let features = [];
  try {
    features =
      typeof prop.prop_features === "string"
        ? JSON.parse(prop.prop_features)
        : prop.prop_features || [];
  } catch {
    features = [];
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

  // Extract YouTube embed URL
  let youtubeEmbedUrl = "";
  if (prop.youtube_url) {
    const match = prop.youtube_url.match(
      /(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    if (match) youtubeEmbedUrl = `https://www.youtube.com/embed/${match[1]}`;
  }

  return (
    <div className="dashboardHome">
      <div className="inner">
        <h4 className="mb-4">Property Stats</h4>

        <div className="card p-4 mb-4 bg-light rounded">
          <h5 className="mb-3">Basic Info</h5>
          <p>
            <strong>Title:</strong> {prop.prop_title}
          </p>
          <p>
            <strong>Description:</strong> {prop.prop_des}
          </p>
          <p>
            <strong>Type:</strong> {prop.category}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {prop.status
              ? prop.status.charAt(0).toUpperCase() + prop.status.slice(1)
              : ""}
          </p>
          <p>
            <strong>Purpose:</strong> {prop.purpose}
          </p>
          <p>
            <strong>Price:</strong> {prop.prop_price}
          </p>
          <p>
            <strong>Featured:</strong> {prop.featured ? "Yes" : "No"}
          </p>
        </div>

        <div className="card p-4 mb-4 bg-light rounded">
          <h5 className="mb-3">Property Details</h5>
          <p>
            <strong>Bedrooms:</strong> {prop.prop_beds}
          </p>
          <p>
            <strong>Bathrooms:</strong> {prop.prop_baths}
          </p>
          <p>
            <strong>Area Size:</strong> {prop.prop_size}
          </p>
          <p>
            <strong>Year Built:</strong> {prop.prop_year_built}
          </p>
        </div>

        <div className="card p-4 mb-4 bg-light rounded">
          <h5 className="mb-3">Features</h5>
          {features.length > 0 ? (
            <ul>
              {features.map((f, i) => (
                <li key={i}>{friendlyFeatureLabel(f)}</li>
              ))}
            </ul>
          ) : (
            <p>No features selected.</p>
          )}
        </div>

        <div className="card p-4 mb-4 bg-light rounded">
          <h5 className="mb-3">Location</h5>
          <p>
            <strong>Address:</strong> {prop.property_map_address}
          </p>
          <p>
            <strong>Country:</strong> {prop.country}
          </p>
          <p>
            <strong>State/County:</strong> {prop.administrative_area_level_1}
          </p>
          <p>
            <strong>City:</strong> {prop.locality || prop.city}
          </p>
          <p>
            <strong>Zip/Postal Code:</strong>{" "}
            {prop.postal_code || prop.zip_code}
          </p>
          <p>
            <strong>Latitude:</strong> {prop.lat}
          </p>
          <p>
            <strong>Longitude:</strong> {prop.lng}
          </p>
        </div>

        <div className="card p-4 mb-4 bg-light rounded">
          <h5 className="mb-3">Property Images</h5>
          {galleryImages.length > 0 ? (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {galleryImages.map((img, i) => (
                <img
                  key={i}
                  src={`/media/${img}`}
                  width="150"
                  height="100"
                  style={{ objectFit: "cover" }}
                  alt=""
                />
              ))}
            </div>
          ) : (
            <p>No images uploaded.</p>
          )}
        </div>

        <div className="card p-4 mb-4 bg-light rounded">
          <h5 className="mb-3">Documents / Attachments</h5>
          {attachments.length > 0 ? (
            <ul>
              {attachments.map((doc, i) => {
                const name =
                  typeof doc === "string" ? doc.split("/").pop() : doc;
                return (
                  <li key={i}>
                    <a href={`/media/${doc}`} target="_blank" rel="noopener">
                      {name}
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No documents uploaded.</p>
          )}
        </div>

        <div className="card p-4 mb-4 bg-light rounded">
          <h5 className="mb-3">Property Video</h5>
          {youtubeEmbedUrl && (
            <iframe
              width="100%"
              height="400"
              src={youtubeEmbedUrl}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          )}
          {prop.video_file ? (
            <video width="100%" height="400" controls>
              <source src={`/media/${prop.video_file}`} type="video/mp4" />
            </video>
          ) : !youtubeEmbedUrl ? (
            <p>No video available.</p>
          ) : null}
        </div>

        <Link href="/dashboard" className="btn btn-outline-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
