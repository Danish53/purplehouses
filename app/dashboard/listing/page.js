"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PROPERTY_TYPES,
  PROPERTY_FEATURES,
  friendlyLabel,
  friendlyFeatureLabel,
} from "@/lib/constants";

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

export default function ListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [features, setFeatures] = useState([]);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const galleryRef = useRef(null);

  // Map state (Leaflet loads via dashboard layout Script — afterInteractive; wait for window.L)
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const placePinRef = useRef(null);
  const geocodeTimerRef = useRef(null);
  const geocodeAbortRef = useRef(null);
  const lastGeocodeQueryRef = useRef("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let intervalId = null;
    let map = null;

    function initMap() {
      if (cancelled || mapRef.current) return true;
      const el = mapContainerRef.current;
      if (!el || !window.L) return false;
      try {
        map = window.L.map(el).setView([31.9686, -99.9018], 6);
        window.L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          { attribution: "© OpenStreetMap contributors" },
        ).addTo(map);
        mapRef.current = map;

        function placePin(latVal, lngVal, zoom) {
          const m = mapRef.current;
          if (!m || !window.L) return;
          const la = parseFloat(latVal);
          const lo = parseFloat(lngVal);
          if (Number.isNaN(la) || Number.isNaN(lo)) return;
          setLat(String(la.toFixed(6)));
          setLng(String(lo.toFixed(6)));
          if (markerRef.current) m.removeLayer(markerRef.current);
          markerRef.current = window.L.marker([la, lo], {
            draggable: true,
          }).addTo(m);
          markerRef.current.on("dragend", (e) => {
            const pos = e.target.getLatLng();
            setLat(String(Number(pos.lat).toFixed(6)));
            setLng(String(Number(pos.lng).toFixed(6)));
          });
          if (zoom != null && zoom !== false) {
            m.setView([la, lo], zoom);
          } else {
            m.panTo([la, lo]);
            if (m.getZoom() < 14) m.setZoom(15);
          }
        }

        placePinRef.current = placePin;

        map.on("click", (e) => {
          placePin(e.latlng.lat, e.latlng.lng, false);
        });

        requestAnimationFrame(() => {
          if (mapRef.current) mapRef.current.invalidateSize();
        });
        return true;
      } catch (e) {
        console.error("Leaflet map init failed:", e);
        return false;
      }
    }

    if (initMap()) {
      return () => {
        cancelled = true;
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        markerRef.current = null;
        placePinRef.current = null;
      };
    }

    let attempts = 0;
    const maxAttempts = 100;
    intervalId = setInterval(() => {
      if (cancelled) {
        clearInterval(intervalId);
        return;
      }
      attempts++;
      if (initMap() || attempts >= maxAttempts) {
        clearInterval(intervalId);
      }
    }, 100);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
      placePinRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
      if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
    };
  }, []);

  const getLocationInputValue = (id, fallback = "") =>
    (document.getElementById(id)?.value || fallback || "").trim();

  const geocodeAddress = async (overrides = {}) => {
    const address = (overrides.address ?? getLocationInputValue("c-address")).trim();
    const city = (overrides.city ?? getLocationInputValue("c-city")).trim();
    const state = (overrides.state ?? getLocationInputValue("c-state")).trim();
    const zip = (overrides.zip ?? getLocationInputValue("c-zip")).trim();
    const country = (overrides.country ?? getLocationInputValue("c-country")).trim();

    // Address + city/state/country required for better and more precise results.
    if (!address || (!city && !state && !country)) return;

    const q = [address, city, state, zip, country].filter(Boolean).join(", ");
    if (!q || q === lastGeocodeQueryRef.current) return;
    lastGeocodeQueryRef.current = q;

    try {
      if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
      const controller = new AbortController();
      geocodeAbortRef.current = controller;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { signal: controller.signal },
      );
      const data = await res.json();
      if (data && data.length && placePinRef.current) {
        const la = parseFloat(data[0].lat);
        const lo = parseFloat(data[0].lon);
        if (!Number.isNaN(la) && !Number.isNaN(lo)) {
          placePinRef.current(la, lo, 17);
        }
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Geocoding error:", err);
      }
    }
  };

  const scheduleGeocode = (overrides = {}) => {
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    geocodeTimerRef.current = setTimeout(() => {
      geocodeAddress(overrides);
    }, 700);
  };

  const handleLocationInputChange = (field, value) => {
    const map = {
      address: "address",
      city: "city",
      state: "state",
      zip: "zip",
      country: "country",
    };
    scheduleGeocode({ [map[field]]: value });
  };

  const toggleFeature = (f) => {
    setFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    setGalleryFiles((prev) => {
      const next = [...prev, ...files].slice(0, 50);
      return next;
    });
  };

  const removeGalleryImage = (index) => {
    setGalleryFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (featuredIndex === index) setFeaturedIndex(0);
      else if (featuredIndex > index) setFeaturedIndex(featuredIndex - 1);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target;
    const fd = new FormData();

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
    fd.append("country", form.country?.value || "");
    fd.append(
      "administrative_area_level_1",
      document.getElementById("c-state")?.value || "",
    );
    fd.append("city", form.locality?.value || "");
    fd.append("zip_code", form.postal_code?.value || "");
    fd.append("lat", lat);
    fd.append("lng", lng);
    fd.append("featured_image", featuredIndex);
    fd.append("featured", form.prop_featured.value);
    fd.append("youtube_url", form.youtube_url.value);

    if (galleryFiles.length === 0) {
      alert("Please add at least one property image.");
      setLoading(false);
      return;
    }
    galleryFiles.forEach((f) => fd.append("gallery_images", f));

    const videoFile = form.video_file?.files?.[0];
    if (videoFile) fd.append("video_file", videoFile);

    const attachFiles = form.attachments?.files;
    if (attachFiles) {
      for (const f of attachFiles) fd.append("attachments", f);
    }

    try {
      const res = await fetch("/api/properties", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
      } else {
        alert(data.error || "Failed to create property.");
      }
    } catch {
      alert("Error submitting property.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboardHome">
      <div className="inner">
        <h4 className="mb-4">Create a list</h4>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="container">
            {/* Description & Price */}
            <div className="dashboard-content-block-wrap active p-4 bg-light rounded mb-4">
              <h2 className="mb-3">Description</h2>
              <div className="mb-3">
                <label className="form-label">Property Title *</label>
                <input
                  type="text"
                  className="form-control"
                  name="prop_title"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Content</label>
                <textarea
                  className="form-control"
                  name="prop_des"
                  rows="10"
                ></textarea>
              </div>

              <div className="row mb-4 g-3">
                <div className="col-md-6">
                  <label className="form-label">Type</label>
                  <select className="form-select mb-3" name="category">
                    <option value="">Select</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {friendlyLabel(t)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <select className="form-select mb-3" name="purpose">
                    <option value="">Select</option>
                    {PURPOSE_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {friendlyLabel(p)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <h2 className="mb-3">Price</h2>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Sale or Rent Price *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="prop_price"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Available From</label>
                  <input
                    type="date"
                    className="form-control"
                    name="available_date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="dashboard-content-block-wrap active p-4 bg-light rounded mb-4">
              <h2 className="mb-3">Details</h2>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Bedrooms</label>
                  <input
                    type="number"
                    className="form-control"
                    name="prop_beds"
                    min="1"
                    max="500"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Bathrooms</label>
                  <input
                    type="number"
                    className="form-control"
                    name="prop_baths"
                    min="1"
                    max="500"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Area Size *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="prop_size"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Year Built</label>
                  <input
                    type="text"
                    className="form-control"
                    name="prop_year_built"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="dashboard-content-block-wrap active p-4 bg-light rounded mb-4">
              <h2 className="mb-3">Features</h2>
              <div className="row g-3">
                {PROPERTY_FEATURES.map((f) => (
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
            <div className="dashboard-content-block p-4 bg-light rounded mb-4">
              <h2>Location</h2>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="property_map_address"
                    id="c-address"
                    required
                    onChange={(e) =>
                      handleLocationInputChange("address", e.target.value)
                    }
                    onBlur={() =>
                      geocodeAddress({ address: getLocationInputValue("c-address") })
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-control"
                    name="country"
                    id="c-country"
                    onChange={(e) =>
                      handleLocationInputChange("country", e.target.value)
                    }
                    onBlur={() =>
                      geocodeAddress({ country: getLocationInputValue("c-country") })
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">State / County</label>
                  <input
                    type="text"
                    className="form-control"
                    name="administrative_area_level_1"
                    id="c-state"
                    onChange={(e) =>
                      handleLocationInputChange("state", e.target.value)
                    }
                    onBlur={() =>
                      geocodeAddress({ state: getLocationInputValue("c-state") })
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-control"
                    name="locality"
                    id="c-city"
                    onChange={(e) =>
                      handleLocationInputChange("city", e.target.value)
                    }
                    onBlur={() =>
                      geocodeAddress({ city: getLocationInputValue("c-city") })
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Zip / Postal Code</label>
                  <input
                    type="text"
                    className="form-control"
                    name="postal_code"
                    id="c-zip"
                    onChange={(e) =>
                      handleLocationInputChange("zip", e.target.value)
                    }
                    onBlur={() =>
                      geocodeAddress({ zip: getLocationInputValue("c-zip") })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="dashboard-content-block p-4 bg-light rounded mb-4">
              <h2>Map</h2>
              <div className="row g-4">
                <div className="col-md-6">
                  <div
                    ref={mapContainerRef}
                    className="rounded border"
                    style={{ height: "400px", minHeight: "280px" }}
                  />
                  <p className="small text-muted mt-2 mb-0">
                    Click anywhere on the map to set latitude and longitude, or
                    drag the pin. Use the button below to place the pin from the
                    address fields.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary w-100 mt-3"
                    onClick={geocodeAddress}
                  >
                    Place the pin in address above
                  </button>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Latitude</label>
                    <input
                      type="text"
                      className="form-control"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Longitude</label>
                    <input
                      type="text"
                      className="form-control"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div className="dashboard-content-block p-4 bg-light rounded mb-4">
              <label>Property Images (Max 50)</label>
              <input
                ref={galleryRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleGalleryChange}
                className="form-control mt-2"
              />
              <div
                className="mt-2"
                style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
              >
                {galleryFiles.map((file, i) => (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      width: "100px",
                      height: "100px",
                    }}
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                      alt=""
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(i)}
                      style={{
                        position: "absolute",
                        bottom: "2px",
                        right: "2px",
                        padding: "0 6px",
                        background: "red",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeaturedIndex(i)}
                      style={{
                        position: "absolute",
                        bottom: "2px",
                        left: "2px",
                        padding: "0 4px",
                        background: "rgba(0,0,0,0.6)",
                        color: "gold",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {i === featuredIndex ? "⭐" : "☆"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments */}
            <div className="dashboard-content-block-wrap active mt-4 mb-4">
              <h2 className="mb-3">Property Documents</h2>
              <div className="p-4 bg-light rounded">
                <input
                  type="file"
                  name="attachments"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,.zip"
                  className="form-control"
                />
              </div>
            </div>

            {/* Video */}
            <div className="mb-4">
              <input
                type="url"
                name="youtube_url"
                className="form-control mb-2"
                placeholder="YouTube Video Link (optional)"
              />
              <input
                type="file"
                name="video_file"
                accept="video/*"
                className="form-control"
              />
            </div>

            {/* Settings */}
            <div className="dashboard-content-block-wrap active p-4 bg-light rounded mb-4">
              <h2 className="mb-3">Property Settings</h2>
              <div className="pb-3 mb-3 border-bottom d-flex justify-content-between">
                <label className="form-label fw-semibold">
                  Mark property as featured?
                </label>
                <div className="d-flex gap-4 mt-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="prop_featured"
                      value="1"
                    />
                    <label className="form-check-label">Yes</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="prop_featured"
                      value="0"
                      defaultChecked
                    />
                    <label className="form-check-label">No</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between mt-4 mb-4">
              <a href="/dashboard" className="btn btn-outline-primary">
                Cancel
              </a>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Property"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
