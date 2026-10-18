"use client";
import { useState } from "react";
import Link from "next/link";
import { formatDateOnlyUS } from "@/lib/dateOnly";

export default function DashboardIndexClient({ properties }) {
  const [props, setProps] = useState(properties);
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Reorder mode: all properties in one list, drag rows, then save
  const [reorderMode, setReorderMode] = useState(false);
  const [order, setOrder] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [saving, setSaving] = useState(false);

  const startReorder = () => {
    setOrder(props);
    setReorderMode(true);
  };

  const handleDrop = (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) return;
    const next = [...order];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, moved);
    setOrder(next);
    setDragIndex(null);
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/properties/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: order.map((p) => p.id) }),
      });
      if (res.ok) {
        setProps(order);
        setReorderMode(false);
        setPage(1);
      } else {
        alert("Could not save the order. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(props.length / perPage);
  const paginated = props.slice((page - 1) * perPage, page * perPage);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    const res = await fetch("/api/properties", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setProps(props.filter((p) => p.id !== id));
    }
  };

  const handleToggle = async (id) => {
    const res = await fetch("/api/properties/expire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.status) {
      setProps(
        props.map((p) => (p.id === id ? { ...p, status: data.status } : p)),
      );
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return formatDateOnlyUS(d) || "—";
  };

  return (
    <div className="dashboardHome">
      <div className="inner">
        <div className="top d-flex align-items-center justify-content-between">
          <p className="m-0 title">Properties</p>
          <div className="d-flex align-items-center gap-2">
          {reorderMode ? (
            <>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setReorderMode(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: "#43086b", color: "white", fontWeight: "bold" }}
                onClick={saveOrder}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save order"}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={startReorder}
              disabled={props.length < 2}
            >
              <i className="fas fa-arrows-alt-v me-1" /> Reorder
            </button>
          )}
          <Link
            href="/dashboard/listing"
            style={{
              background: "#43086b",
              color: "white",
              textDecoration: "none",
              padding: "10px",
              borderRadius: "6px",
              fontWeight: "bold",
            }}
          >
            Create a Listing
          </Link>
          </div>
        </div>

        <hr />

        {reorderMode ? (
          <div>
            <p className="text-muted small">
              Drag a row up or down, then press &quot;Save order&quot;.
            </p>
            {order.map((prop, i) => (
              <div
                key={prop.id}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => setDragIndex(null)}
                className="d-flex align-items-center gap-3 border rounded p-2 mb-2 bg-white"
                style={{
                  cursor: "grab",
                  opacity: dragIndex === i ? 0.4 : 1,
                }}
              >
                <i className="fas fa-grip-vertical text-muted" />
                <span className="fw-bold" style={{ width: 28 }}>
                  {i + 1}
                </span>
                <img
                  src={
                    prop.primary_image_url ||
                    (Array.isArray(prop.gallery_urls) && prop.gallery_urls[0]) ||
                    "/images/1.jpg"
                  }
                  width="70"
                  height="52"
                  style={{ objectFit: "cover", borderRadius: 4 }}
                  alt=""
                  draggable={false}
                />
                <div className="flex-grow-1">
                  <div className="fw-bold">{prop.prop_title}</div>
                  <div className="small text-muted">
                    {prop.property_map_address}
                  </div>
                </div>
                <strong>{prop.prop_price}</strong>
              </div>
            ))}
          </div>
        ) : (
        <>
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Thumbnail</th>
              <th>Title</th>
              <th>Status</th>
              <th>Type</th>
              <th>Listing Status</th>
              <th>Available</th>
              <th>Price</th>
              <th>Featured</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center">
                  No properties found.
                </td>
              </tr>
            ) : (
              paginated.map((prop) => (
                <tr key={prop.id}>
                  <td>
                    <img
                      src={
                        prop.primary_image_url ||
                        (Array.isArray(prop.gallery_urls) &&
                        prop.gallery_urls.length > 0
                          ? prop.gallery_urls[0]
                          : null) ||
                        "/images/1.jpg"
                      }
                      width="100"
                      height="75"
                      style={{ objectFit: "cover" }}
                      alt=""
                    />
                  </td>
                  <td className="detailProp">
                    <span className="fw-bold">{prop.prop_title}</span>
                    <br />
                    {prop.property_map_address}
                  </td>
                  <td>
                    <span
                      className={`badge ${prop.status === "approved" ? "bg-success" : prop.status === "expire" ? "bg-danger" : "bg-secondary"}`}
                    >
                      {prop.status
                        ? prop.status.charAt(0).toUpperCase() +
                          prop.status.slice(1)
                        : "N/A"}
                    </span>
                  </td>
                  <td className="common">{prop.category}</td>
                  <td className="common">{prop.purpose}</td>
                  <td className="common">
                    {formatDate(prop.available_date || prop.created_at)}
                  </td>
                  <td>
                    <strong className="fw-bold">{prop.prop_price}</strong>
                  </td>
                  <td className="common">{prop.featured ? "Yes" : "No"}</td>
                  <td className="text-end">
                    <div className="dropdown">
                      <button
                        className="btn btn-dashboardAction dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        Actions
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end actionDropdown">
                        <li>
                          <Link
                            className="dropdown-item"
                            href={`/dashboard/property/stats/${prop.id}`}
                          >
                            View Stats
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item"
                            href={`/dashboard/property/edit/${prop.id}`}
                          >
                            Edit
                          </Link>
                        </li>
                        <li>
                          <button
                            className="dropdown-item text-danger"
                            onClick={() => handleDelete(prop.id)}
                          >
                            Delete
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => handleToggle(prop.id)}
                          >
                            {prop.status === "expire" ? "Go Live" : "Expire"}
                          </button>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <nav>
            <ul className="pagination justify-content-center mt-3">
              <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => Math.abs(n - page) < 3)
                .map((n) => (
                  <li
                    key={n}
                    className={`page-item ${n === page ? "active" : ""}`}
                  >
                    <button className="page-link" onClick={() => setPage(n)}>
                      {n}
                    </button>
                  </li>
                ))}
              <li
                className={`page-item ${page >= totalPages ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        )}
        </>
        )}
      </div>
    </div>
  );
}