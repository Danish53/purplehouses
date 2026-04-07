"use client";
import { useState } from "react";
import Link from "next/link";

export default function ApplicationsClient({ applications: initial }) {
  const [apps, setApps] = useState(initial);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.ceil(apps.length / perPage);
  const paginated = apps.slice((page - 1) * perPage, page * perPage);

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
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center">
                  No applications found.
                </td>
              </tr>
            ) : (
              paginated.map((app, i) => (
                <tr key={app.id}>
                  <td>{(page - 1) * perPage + i + 1}</td>
                  <td>
                    {app.photo_id ? (
                      <a
                        href={`/media/${app.photo_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-secondary"
                      >
                        View ID
                      </a>
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
      </div>
    </div>
  );
}
