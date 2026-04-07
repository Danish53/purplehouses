"use client";
import { useEffect, useRef } from "react";

export default function PropertyMap({ markers = [] }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    const initMap = () => {
      if (typeof window.L === "undefined") {
        // Retry after script loads
        setTimeout(initMap, 500);
        return;
      }

      if (mapInstance.current) {
        mapInstance.current.remove();
      }

      const validMarkers = markers.filter((m) => m.lat && m.lng);
      const center =
        validMarkers.length > 0
          ? [validMarkers[0].lat, validMarkers[0].lng]
          : [32.705, -97.355];

      const map = window.L.map(mapRef.current).setView(center, 13);
      mapInstance.current = map;

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      validMarkers.forEach((m) => {
        const icon = window.L.divIcon({
          className: "homeMap__marker-wrap",
          html: '<div class="homeMap__marker"><i class="fa fa-home"></i></div>',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        });

        window.L.marker([m.lat, m.lng], { icon }).addTo(map).bindPopup(`
            <div class="homeMap__popup">
              <strong>${m.title || ""}</strong>
              <span>${m.address || ""}</span>
              <span>$${m.price || ""}</span>
              <a href="/property/${m.id}/">View Details</a>
            </div>
          `);
      });

      if (validMarkers.length > 1) {
        const bounds = window.L.latLngBounds(
          validMarkers.map((m) => [m.lat, m.lng]),
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    // Load Leaflet CSS & JS if not already loaded
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (typeof window.L === "undefined") {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [markers]);

  return (
    <div
      ref={mapRef}
      id="home-property-map"
      className="homeMap__canvas"
      style={{ width: "100%", height: "100%" }}
    ></div>
  );
}
