"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { friendlyFeatureLabel, friendlyLabel } from "@/lib/constants";

export default function PropertyEditClient({
  prop,
  galleryImages,
  propFeatures,
  attachments,
  propertyTypes,
  allFeatures,
  purposeOptions,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [features, setFeatures] = useState(propFeatures);
  const [existingImages, setExistingImages] = useState(galleryImages);
  const [removedImages, setRemovedImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState(attachments);
  const [removedAttachments, setRemovedAttachments] = useState([]);
  const [featuredIndex, setFeaturedIndex] = useState(prop.featured_image || 0);
  const initialLat = String(prop.lat ?? prop.latitude ?? "").trim();
  const initialLng = String(prop.lng ?? prop.longitude ?? "").trim();
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const syncMarkerToLatLng = (latStr, lngStr) => {
    const la = parseFloat(latStr);
    const lo = parseFloat(lngStr);
    if (
      mapRef.current &&
      markerRef.current &&
      !Number.isNaN(la) &&
      !Number.isNaN(lo)
    ) {
      markerRef.current.setLatLng([la, lo]);
      mapRef.current.setView([la, lo], Math.max(mapRef.current.getZoom(), 14));
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.L && !mapRef.current) {
      const la = parseFloat(lat) || 32.7295;
      const lo = parseFloat(lng) || -97.3664;
      const map = window.L.map("edit-map").setView([la, lo], 13);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      markerRef.current = window.L.marker([la, lo], { draggable: true }).addTo(
        map,
      );
      markerRef.current.on("dragend", (e) => {
        const pos = e.target.getLatLng();
        setLat(pos.lat.toFixed(6));
        setLng(pos.lng.toFixed(6));
      });
      map.on("click", (e) => {
        setLat(e.latlng.lat.toFixed(6));
        setLng(e.latlng.lng.toFixed(6));
        markerRef.current.setLatLng(e.latlng);
      });
      mapRef.current = map;
    }
  }, []);

  const geocodeAddress = async () => {
    const address = document.getElementById("e-address")?.value || "";
    const city = document.getElementById("e-city")?.value || "";
    const state = document.getElementById("e-state")?.value || "";
    const zip = document.getElementById("e-zip")?.value || "";
    const country = document.getElementById("e-country")?.value || "";
    const q = [address, city, state, zip, country].filter(Boolean).join(", ");
    if (!q.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      );
      const data = await res.json();
      if (data && data.length) {
        const la = parseFloat(data[0].lat);
        const lo = parseFloat(data[0].lon);
        setLat(la.toFixed(6));
        setLng(lo.toFixed(6));
        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([la, lo]);
          mapRef.current.setView([la, lo], 15);
        }
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  const toggleFeature = (f) => {
    setFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );
  };

  const removeExistingImage = (img) => {
    const idx = existingImages.indexOf(img);
    setExistingImages((prev) => prev.filter((x) => x !== img));
    setRemovedImages((prev) => [...prev, img]);
    setFeaturedIndex((prev) => {
      if (idx < 0) return prev;
      if (prev === idx) return 0;
      if (prev > idx) return prev - 1;
      return prev;
    });
  };

  const removeNewImage = (index) => {
    const absIdx = existingImages.length + index;
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setFeaturedIndex((prev) => {
      if (prev === absIdx) return 0;
      if (prev > absIdx) return prev - 1;
      return prev;
    });
  };

  const removeAttachment = (att) => {
    setExistingAttachments((prev) => prev.filter((x) => x !== att));
    setRemovedAttachments((prev) => [...prev, att]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target;
    const fd = new FormData();
    fd.append("id", String(prop.id));
    fd.append("prop_title", form.prop_title.value);
    fd.append("prop_des", form.prop_des.value);
    fd.append("category", form.category.value);
    fd.append("purpose", form.purpose.value);
    fd.append("prop_price", form.prop_price.value);
    fd.append("available_date", form.available_date.value);
    fd.append("prop_beds", form.prop_beds.value);
    fd.append("prop_baths", form.prop_baths.value);
    fd.append("prop_size", form.prop_size.value);
    fd.append("prop_year_built", form.prop_year_built.value);
    features.forEach((f) => fd.append("prop_features[]", f));
    fd.append("property_map_address", form.property_map_address.value);
    fd.append("city", form.city.value);
    fd.append(
      "administrative_area_level_1",
      form.administrative_area_level_1.value,
    );
    fd.append("country", form.country.value);
    fd.append("zip_code", form.zip_code.value);
    fd.append("lat", lat);
    fd.append("lng", lng);
    fd.append("featured_image", featuredIndex);
    fd.append("prop_featured", form.prop_featured.value);
    fd.append("youtube_url", form.youtube_url.value);
    fd.append("existing_gallery", JSON.stringify(existingImages));
    fd.append("removed_gallery", JSON.stringify(removedImages));
    fd.append("existing_attachments", JSON.stringify(existingAttachments));
    fd.append("removed_attachments", JSON.stringify(removedAttachments));

    newFiles.forEach((f) => fd.append("gallery_images", f));

    const videoFile = form.video_file?.files?.[0];
    if (videoFile) fd.append("video_file", videoFile);

    const attachFiles = form.attachments?.files;
    if (attachFiles) {
      for (const f of attachFiles) fd.append("attachments", f);
    }

    try {
      const res = await fetch("/api/properties", { method: "PUT", body: fd });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
      } else {
        alert(data.error || "Failed to update property.");
      }
    } catch {
      alert("Error updating property.");
    } finally {
      setLoading(false);
    }
  };

  const availableDate = prop.available_date
    ? new Date(prop.available_date).toISOString().split("T")[0]
    : prop.created_at
      ? new Date(prop.created_at).toISOString().split("T")[0]
      : "";

  return (
    <div className="dashboardHome">
      <div className="inner">
        <h4 className="mb-4">Edit Property</h4>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="container">
            {/* Gallery */}
            <div className="dashboard-content-block-wrap active p-4 bg-light rounded mb-4">
              <h2 className="mb-3">Property Images</h2>
              <input
                type="file"
                multiple
                accept="image/*"
                className="form-control mb-3"
                onChange={(e) =>
                  setNewFiles((prev) =>
                    [...prev, ...Array.from(e.target.files)].slice(0, 50),
                  )
                }
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {existingImages.map((img, i) => (
                  <div
                    key={`e-${i}`}
                    style={{
                      position: "relative",
                      width: "170px",
                      border:
                        i === featuredIndex
                          ? "2px solid #4f2378"
                          : "1px solid #e7dff0",
                      borderRadius: "18px",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={`/media/${img}`}
                      style={{
                        width: "100%",
                        height: "150px",
                        objectFit: "cover",
                      }}
                      alt=""
                    />
                    <div
                      style={{ display: "flex", gap: "4px", padding: "8px" }}
                    >
                      <button
                        type="button"
                        className="btn btn-sm btn-dark"
                        onClick={() => setFeaturedIndex(i)}
                      >
                        Featured
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeExistingImage(img)}
                      >
                        Remove
                      </button>
                    </div>
                    {i === featuredIndex && (
                      <span
                        style={{
                          position: "absolute",
                          top: "8px",
                          left: "8px",
                          background: "rgba(59,23,89,0.88)",
                          color: "#fff",
                          padding: "4px 8px",
                          borderRadius: "999px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                        }}
                      >
                        FEATURED
                      </span>
                    )}
                  </div>
                ))}
                {newFiles.map((file, i) => {
                  const absIndex = existingImages.length + i;
                  return (
                    <div
                      key={`n-${i}`}
                      style={{
                        position: "relative",
                        width: "170px",
                        border:
                          absIndex === featuredIndex
                            ? "2px solid #4f2378"
                            : "1px solid #e7dff0",
                        borderRadius: "18px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        style={{
                          width: "100%",
                          height: "150px",
                          objectFit: "cover",
                        }}
                        alt=""
                      />
                      <div
                        style={{ display: "flex", gap: "4px", padding: "8px" }}
                      >
                        <button
                          type="button"
                          className="btn btn-sm btn-dark"
                          onClick={() => setFeaturedIndex(absIndex)}
                        >
                          Featured
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeNewImage(i)}
                        >
                          Remove
                        </button>
                      </div>
                      {absIndex === featuredIndex && (
                        <span
                          style={{
                            position: "absolute",
                            top: "8px",
                            left: "8px",
                            background: "rgba(59,23,89,0.88)",
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: "999px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                          }}
                        >
                          FEATURED
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="dashboard-content-block-wrap active p-4 bg-light rounded mb-4">
              <h2 className="mb-3">Description</h2>
              <div className="mb-3">
                <label className="form-label">Property Title *</label>
                <input
                  type="text"
                  className="form-control"
                  name="prop_title"
                  defaultValue={prop.prop_title || ""}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Content</label>
                <textarea
                  className="form-control"
                  name="prop_des"
                  rows="8"
                  defaultValue={prop.prop_des || ""}
                ></textarea>
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Type</label>
                  <select
                    name="category"
                    className="form-select"
                    defaultValue={prop.category || ""}
                  >
                    <option value="">Select Type</option>
                    {propertyTypes.map((t) => (
                      <option key={t} value={t}>
                        {friendlyLabel(t)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <select
                    name="purpose"
                    className="form-select"
                    defaultValue={prop.purpose || ""}
                  >
                    <option value="">Select Status</option>
                    {purposeOptions.map((p) => (
                      <option key={p} value={p}>
                        {friendlyLabel(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Price *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="prop_price"
                    defaultValue={prop.prop_price || ""}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Available From</label>
                  <input
                    type="date"
                    className="form-control"
                    name="available_date"
                    defaultValue={availableDate}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Area Size *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="prop_size"
                    defaultValue={prop.prop_size || ""}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="dashboard-content-block-wrap active p-4 bg-light rounded mb-4">
              <h2 className="mb-3">Details</h2>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Bedrooms</label>
                  <input
                    type="number"
                    className="form-control"
                    name="prop_beds"
                    defaultValue={prop.prop_beds || ""}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Bathrooms</label>
                  <input
                    type="number"
                    className="form-control"
                    name="prop_baths"
                    defaultValue={prop.prop_baths || ""}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Year Built</label>
                  <input
                    type="text"
                    className="form-control"
                    name="prop_year_built"
                    defaultValue={prop.prop_year_built || ""}
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="dashboard-content-block-wrap active p-4 bg-light rounded mb-4">
              <h2 className="mb-3">Features</h2>
              <div className="row g-3">
                {allFeatures.map((f) => (
                  <div key={f} className="col-md-3 col-6">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={features.includes(f)}
                        onChange={() => toggleFeature(f)}
                      />
                      <label className="form-check-label">
                        {friendlyFeatureLabel(f)}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="dashboard-content-block-wrap active p-4 bg-light rounded mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0">Location</h2>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={geocodeAddress}
                >
                  Update Pin From Address
                </button>
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="e-address"
                    name="property_map_address"
                    defaultValue={prop.property_map_address || ""}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-control"
                    id="e-city"
                    name="city"
                    defaultValue={prop.city || ""}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">State / County</label>
                  <input
                    type="text"
                    className="form-control"
                    id="e-state"
                    name="administrative_area_level_1"
                    defaultValue={prop.administrative_area_level_1 || ""}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-control"
                    id="e-country"
                    name="country"
                    defaultValue={prop.country || ""}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Zip / Postal Code</label>
                  <input
                    type="text"
                    className="form-control"
                    id="e-zip"
                    name="zip_code"
                    defaultValue={prop.zip_code || ""}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Latitude</label>
                  <input
                    type="text"
                    className="form-control"
                    inputMode="decimal"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    onBlur={() => syncMarkerToLatLng(lat, lng)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Longitude</label>
                  <input
                    type="text"
                    className="form-control"
                    inputMode="decimal"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    onBlur={() => syncMarkerToLatLng(lat, lng)}
                  />
                </div>
              </div>
              <div className="mt-3">
                <div
                  id="edit-map"
                  style={{ height: "420px", borderRadius: "18px" }}
                ></div>
              </div>
            </div>

            {/* Attachments */}
            <div className="dashboard-content-block-wrap active p-4 bg-light rounded mb-4">
              <h2 className="mb-3">Property Documents</h2>
              {existingAttachments.length > 0 && (
                <div className="mb-3">
                  {existingAttachments.map((att, i) => {
                    const name =
                      typeof att === "string" ? att.split("/").pop() : att;
                    return (
                      <div
                        key={i}
                        className="d-flex align-items-center justify-content-between border rounded p-2 mb-2"
                      >
                        <div>
                          <strong>{name}</strong>{" "}
                          <a
                            href={`/media/${att}`}
                            target="_blank"
                            rel="noopener"
                          >
                            Open
                          </a>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeAttachment(att)}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <input
                type="file"
                name="attachments"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.zip,.doc,.docx"
                className="form-control"
              />
            </div>

            {/* Video */}
            <div className="dashboard-content-block-wrap active p-4 bg-light rounded mb-4">
              <h2 className="mb-3">Video</h2>
              <div className="mb-3">
                <label className="form-label">YouTube Link</label>
                <input
                  type="url"
                  className="form-control"
                  name="youtube_url"
                  defaultValue={prop.youtube_url || ""}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Upload Video</label>
                <input
                  type="file"
                  className="form-control"
                  name="video_file"
                  accept="video/*"
                />
              </div>
              {prop.video_file && (
                <video width="360" controls className="rounded border">
                  <source src={`/media/${prop.video_file}`} type="video/mp4" />
                </video>
              )}
            </div>

            {/* Settings */}
            <div className="dashboard-content-block-wrap active p-4 bg-light rounded mb-4">
              <h2 className="mb-3">Settings</h2>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold d-block mb-2">
                    Featured Property
                  </label>
                  <div className="d-flex gap-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="prop_featured"
                        value="1"
                        defaultChecked={!!prop.featured}
                      />
                      <label className="form-check-label">Featured</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="prop_featured"
                        value="0"
                        defaultChecked={!prop.featured}
                      />
                      <label className="form-check-label">
                        Remove Featured
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-end mb-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Property"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
