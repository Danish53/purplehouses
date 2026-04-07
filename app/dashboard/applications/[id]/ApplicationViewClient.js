"use client";
import { useState } from "react";
import Link from "next/link";

export default function ApplicationViewClient({ app }) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US");
  };

  const yesNo = (v) => (v ? "Yes" : "No");

  const openPhotoViewer = () => {
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

  return (
    <div className="dashboardHome">
      <div className="inner">
        <div className="top d-flex align-items-center justify-content-between">
          <p className="m-0 title">Application Details</p>
          <Link
            href="/dashboard/applications"
            className="btn btn-secondary btn-sm"
          >
            Back
          </Link>
        </div>

        <hr />

        {/* Step 1 */}
        <h5 className="mb-3">Step 1: Property Info</h5>
        <table className="table table-bordered">
          <tbody>
            <tr>
              <th>Property ID</th>
              <td>{app.property_id}</td>
            </tr>
            <tr>
              <th>Move In Date</th>
              <td>{formatDate(app.move_in_date)}</td>
            </tr>
            <tr>
              <th>Applicant Type</th>
              <td>
                {app.applicant_type
                  ? app.applicant_type.charAt(0).toUpperCase() +
                    app.applicant_type.slice(1)
                  : ""}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Step 2 */}
        <h5 className="mb-3 mt-4">Step 2: Contact Info</h5>
        <table className="table table-bordered">
          <tbody>
            <tr>
              <th>Name</th>
              <td>
                {app.first_name} {app.last_name}
              </td>
            </tr>
            <tr>
              <th>Email</th>
              <td>{app.email}</td>
            </tr>
            <tr>
              <th>Phone</th>
              <td>{app.phone}</td>
            </tr>
            <tr>
              <th>Hear About</th>
              <td>{app.hear_about}</td>
            </tr>
          </tbody>
        </table>

        {/* Step 3 */}
        <h5 className="mb-3 mt-4">Step 3: Previous Residence</h5>
        <table className="table table-bordered">
          <tbody>
            <tr>
              <th>Address</th>
              <td>
                {app.address1} {app.address2}
              </td>
            </tr>
            <tr>
              <th>City</th>
              <td>{app.city}</td>
            </tr>
            <tr>
              <th>State</th>
              <td>{app.state}</td>
            </tr>
            <tr>
              <th>Zipcode</th>
              <td>{app.zipcode}</td>
            </tr>
            <tr>
              <th>Reside From</th>
              <td>
                {app.reside_from_month}/{app.reside_from_year}
              </td>
            </tr>
            <tr>
              <th>Monthly Rent</th>
              <td>{app.monthly_rent}</td>
            </tr>
            <tr>
              <th>Mortgage</th>
              <td>{app.monthly_mortgage}</td>
            </tr>
            <tr>
              <th>Landlord</th>
              <td>{app.landlord_name}</td>
            </tr>
            <tr>
              <th>Landlord Phone</th>
              <td>{app.landlord_phone}</td>
            </tr>
            <tr>
              <th>Reason For Leaving</th>
              <td>{app.reason_for_leaving}</td>
            </tr>
          </tbody>
        </table>

        {/* Step 4 */}
        <h5 className="mb-3 mt-4">Step 4: Housemates</h5>
        <table className="table table-bordered">
          <tbody>
            <tr>
              <th>Other Adults</th>
              <td>{yesNo(app.other_adults)}</td>
            </tr>
            <tr>
              <th>Adult Count</th>
              <td>{app.adult_count}</td>
            </tr>
            {app.adult_names && Array.isArray(app.adult_names) && (
              <tr>
                <th>Adult Names</th>
                <td>
                  <ul>
                    {app.adult_names.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            )}
            <tr>
              <th>Dependents Under 18</th>
              <td>{yesNo(app.dependents_under_18)}</td>
            </tr>
            <tr>
              <th>Dependent Name</th>
              <td>
                {app.dependent_first_name} {app.dependent_last_name}
              </td>
            </tr>
            <tr>
              <th>Relation</th>
              <td>{app.dependent_relation}</td>
            </tr>
            <tr>
              <th>DOB</th>
              <td>{formatDate(app.dependent_dob)}</td>
            </tr>
            <tr>
              <th>Has Pets</th>
              <td>{yesNo(app.has_pets)}</td>
            </tr>
            <tr>
              <th>Pet Count</th>
              <td>{app.pet_count}</td>
            </tr>
            {app.pet_details && Array.isArray(app.pet_details) && (
              <tr>
                <th>Pet Details</th>
                <td>
                  <ul>
                    {app.pet_details.map((p, i) => (
                      <li key={i}>
                        {p.name} - {p.breed} ({p.age} yrs)
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Step 5 */}
        <h5 className="mb-3 mt-4">Step 5: Personal Info</h5>
        <table className="table table-bordered">
          <tbody>
            <tr>
              <th>DOB</th>
              <td>{formatDate(app.dob)}</td>
            </tr>
            <tr>
              <th>SSN</th>
              <td>{app.ssn}</td>
            </tr>
            <tr>
              <th>License</th>
              <td>{app.license_number}</td>
            </tr>
            <tr>
              <th>Emergency Contact</th>
              <td>
                {app.emergency_name} ({app.emergency_phone})
              </td>
            </tr>
          </tbody>
        </table>

        {/* Step 6 */}
        <h5 className="mb-3 mt-4">Step 6: Employment</h5>
        <table className="table table-bordered">
          <tbody>
            <tr>
              <th>Employer</th>
              <td>{app.employer_name}</td>
            </tr>
            <tr>
              <th>Position</th>
              <td>{app.position}</td>
            </tr>
            <tr>
              <th>Monthly Salary</th>
              <td>{app.monthly_salary}</td>
            </tr>
            <tr>
              <th>Years Worked</th>
              <td>{app.years_worked}</td>
            </tr>
          </tbody>
        </table>

        {/* Step 7 */}
        <h5 className="mb-3 mt-4">Step 7: Background Questions</h5>
        <table className="table table-bordered">
          <tbody>
            <tr>
              <th>Eviction History</th>
              <td>{app.eviction_history}</td>
            </tr>
            <tr>
              <th>Criminal History</th>
              <td>{app.criminal_history}</td>
            </tr>
            <tr>
              <th>Income 3x Rent</th>
              <td>{app.income_3x_rent}</td>
            </tr>
          </tbody>
        </table>

        {/* Step 8 */}
        <h5 className="mb-3 mt-4">Step 8: Photo ID</h5>
        {app.photo_id ? (
          <button className="btn btn-danger btn-sm" onClick={openPhotoViewer}>
            View Secure Document
          </button>
        ) : (
          <p>No document uploaded</p>
        )}

        {/* Step 9 */}
        <h5 className="mb-3 mt-4">Billing Info</h5>
        <table className="table table-bordered">
          <tbody>
            <tr>
              <th>Name</th>
              <td>
                {app.billing_first_name} {app.billing_last_name}
              </td>
            </tr>
            <tr>
              <th>Address</th>
              <td>{app.billing_address1}</td>
            </tr>
            <tr>
              <th>City</th>
              <td>{app.billing_city}</td>
            </tr>
            <tr>
              <th>State</th>
              <td>{app.billing_state}</td>
            </tr>
            <tr>
              <th>Zip</th>
              <td>{app.billing_zip}</td>
            </tr>
          </tbody>
        </table>

        {/* Step 10 */}
        <h5 className="mb-3 mt-4">Authorization</h5>
        <table className="table table-bordered">
          <tbody>
            <tr>
              <th>Agreed to Terms</th>
              <td>{yesNo(app.agree_terms)}</td>
            </tr>
            <tr>
              <th>Authorized Name</th>
              <td>{app.authorized_name}</td>
            </tr>
            <tr>
              <th>Submitted At</th>
              <td>{formatDate(app.submitted_at)}</td>
            </tr>
          </tbody>
        </table>

        {/* Password Modal */}
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

        {/* Photo Viewer Modal */}
        {showViewer && (
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
                {app.photo_id &&
                (app.photo_id.toLowerCase().endsWith(".png") ||
                  app.photo_id.toLowerCase().endsWith(".jpg") ||
                  app.photo_id.toLowerCase().endsWith(".jpeg")) ? (
                  <img
                    src={`/media/${app.photo_id}`}
                    style={{ maxWidth: "100%", maxHeight: "80vh" }}
                    alt="Photo ID"
                  />
                ) : (
                  <iframe
                    src={`/media/${app.photo_id}`}
                    style={{ width: "100%", height: "80vh" }}
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
