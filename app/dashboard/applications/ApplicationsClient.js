"use client";
import { useState } from "react";
import Link from "next/link";

export default function ApplicationsClient({ applications: initial }) {
  const [apps, setApps] = useState(initial);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.ceil(apps.length / perPage);
  const paginated = apps.slice((page - 1) * perPage, page * perPage);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState(null);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  const openPhotoViewer = (photoId) => {
    if (!photoId) return;
    setActivePhotoId(photoId);
    if (verified) {
      setShowViewer(true);
      return;
    }
    setShowPasswordModal(true);
    setError("");
    setPassword("");
  };

  const verifyPassword = async () => {
    const res = await fetch("/api/auth/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.success || data.verified) {
      setVerified(true);
      setShowPasswordModal(false);
      setShowViewer(true);
    } else {
      setError("Wrong password");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    const res = await fetch("/api/applications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setApps(apps.filter((a) => a.id !== id));
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US");
  };

  return (
    <div className="dashboardHome">
      <div className="inner">
        <div className="top d-flex align-items-center justify-content-between">
          <p className="m-0 title">All Applying List</p>
        </div>

        <hr />

        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>#</th>
              <th>Photo ID</th>
              <th>Move In Date</th>
              <th>Applicant Type</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Submitted At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* if payment_status = paid then list display */}
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center">
                  No applications found.
                </td>
              </tr>
            ) : ( 
              paginated.map((app, i) => (
                app.payment_status === "paid" && (
                  <tr key={app.id}>
                    <td>{(page - 1) * perPage + i + 1}</td>
                    <td>
                      {app.photo_id ? (
                        <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => openPhotoViewer(app.photo_id)}
                      >
                        View ID
                      </button>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>{formatDate(app.move_in_date)}</td>
                  <td>
                    {app.applicant_type
                      ? app.applicant_type.charAt(0).toUpperCase() +
                        app.applicant_type.slice(1)
                      : ""}
                  </td>
                  <td>
                    {app.first_name} {app.last_name}
                  </td>
                  <td>{app.email}</td>
                  <td>{app.phone}</td>
                  <td>{formatDate(app.submitted_at)}</td>
                  <td className="d-flex p-2 py-3">
                    <Link
                      href={`/dashboard/applications/${app.id}`}
                      className="btn btn-sm me-1"
                    >
                      View
                    </Link>
                    <button
                      className="btn btn-sm"
                      onClick={() => handleDelete(app.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                    )
              ))
            )}
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

        {showPasswordModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.6)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: "20px",
                maxWidth: "400px",
                width: "90%",
                borderRadius: "5px",
              }}
            >
              <h5>Security Check</h5>
              <p>Please enter your account password</p>
              <div className="position-relative mb-2">
                <input
                  type={showPw ? "text" : "password"}
                  className="form-control pe-5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-decoration-none"
                  onClick={() => setShowPw(!showPw)}
                >
                  <i className={showPw ? "fa fa-eye-slash" : "fa fa-eye"}></i>
                </button>
              </div>
              <button
                className="btn me-2"
                style={{ backgroundColor: "#43086b", color: "white" }}
                onClick={verifyPassword}
              >
                Verify
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              {error && (
                <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
              )}
            </div>
          </div>
        )}

        {showViewer && activePhotoId && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.8)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                maxWidth: "90%",
                maxHeight: "90%",
                background: "#fff",
                padding: "10px",
                borderRadius: "5px",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "15px",
                  cursor: "pointer",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
                onClick={() => setShowViewer(false)}
              >
                &times;
              </span>
              <div
                style={{
                  textAlign: "center",
                  maxHeight: "80vh",
                  overflow: "auto",
                }}
              >
                {activePhotoId &&
                (String(activePhotoId).toLowerCase().endsWith(".png") ||
                  String(activePhotoId).toLowerCase().endsWith(".jpg") ||
                  String(activePhotoId).toLowerCase().endsWith(".jpeg")) ? (
                  <img
                    src={`/media/${activePhotoId}`}
                    style={{ maxWidth: "100%", maxHeight: "80vh" }}
                    alt="Photo ID"
                  />
                ) : (
                  <iframe
                    src={`/media/${activePhotoId}`}
                    style={{ width: "100%", height: "80vh" }}
                    title="Photo ID"
                    frameBorder="0"
                  ></iframe>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
