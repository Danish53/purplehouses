"use client";
import { useState } from "react";

export default function ScheduleClient({ bookings: initial }) {
  const [bookings, setBookings] = useState(initial);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { id, reason }
  const [loading, setLoading] = useState(null); // booking id being updated
  const [error, setError] = useState("");
  const perPage = 10;
  const totalPages = Math.ceil(bookings.length / perPage);
  const paginated = bookings.slice((page - 1) * perPage, page * perPage);

  const submitStatus = async (id, status, reason = "") => {
    setLoading(id);
    setError("");
    try {
      const res = await fetch("/api/booking/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: data.status } : b)),
        );
      } else {
        setError(data.error || "Failed to update status.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
      setModal(null);
    }
  };

  const handleDisapprove = (id) => {
    setModal({ id, reason: "" });
  };

  const renderActions = (booking) => {
    const busy = loading === booking.id;
    if (booking.status === "Approved") {
      return (
        <button
          className="btn btn-danger btn-sm"
          disabled={busy}
          onClick={() => handleDisapprove(booking.id)}
        >
          {busy ? "…" : "Disapprove"}
        </button>
      );
    }
    if (booking.status === "Disapproved") {
      return (
        <button
          className="btn btn-success btn-sm"
          disabled={busy}
          onClick={() => submitStatus(booking.id, "Approved")}
        >
          {busy ? "…" : "Approve"}
        </button>
      );
    }
    return (
      <>
        <button
          className="btn btn-success btn-sm me-1"
          disabled={busy}
          onClick={() => submitStatus(booking.id, "Approved")}
        >
          {busy ? "…" : "Approve"}
        </button>
        <button
          className="btn btn-danger btn-sm"
          disabled={busy}
          onClick={() => handleDisapprove(booking.id)}
        >
          {busy ? "…" : "Disapprove"}
        </button>
      </>
    );
  };

  return (
    <div className="dashboardHome">
      <div className="inner">
        {error && (
          <div className="alert alert-danger alert-dismissible" role="alert">
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
            />
          </div>
        )}

        {/* Disapproval reason modal */}
        {modal && (
          <div
            className="modal d-block"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setModal(null);
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Reason for Disapproval</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setModal(null)}
                  />
                </div>
                <div className="modal-body">
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Enter reason (optional)…"
                    value={modal.reason}
                    onChange={(e) =>
                      setModal({ ...modal, reason: e.target.value })
                    }
                  />
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() =>
                      submitStatus(modal.id, "Disapproved", modal.reason)
                    }
                  >
                    Confirm Disapprove
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <table className="table align-middle">
          <thead>
            <tr>
              <th>Property</th>
              <th>Date</th>
              <th>Time</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((booking) => (
              <tr key={booking.id} id={`booking-${booking.id}`}>
                <td>{booking.property_name || booking.property_id}</td>
                <td>{booking.date}</td>
                <td>{booking.time}</td>
                <td>
                  {booking.first_name} {booking.last_name}
                </td>
                <td>{booking.email}</td>
                <td>{booking.phone}</td>
                <td>
                  <span
                    className={`badge ${
                      booking.status === "Approved"
                        ? "bg-success"
                        : booking.status === "Disapproved"
                          ? "bg-danger"
                          : "bg-warning"
                    }`}
                  >
                    {booking.status || "Pending"}
                  </span>
                </td>
                <td className="text-end">{renderActions(booking)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <nav>
            <ul className="pagination justify-content-center">
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
      </div>
    </div>
  );
}
