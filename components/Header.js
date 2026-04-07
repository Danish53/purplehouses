"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/login"))
    return null;
  const hasNoBg = pathname === "/";
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = "/dashboard";
    } else {
      setError(data.error || "Invalid username or password");
    }
  }

  return (
    <>
      <nav
        className={`navbar navbar-expand-lg${hasNoBg ? " navbar--no-bg" : " navbar--solid"}`}
      >
        <div className="container">
          <Link className="navbar-brand" href="/">
            <img
              src="/images/Logo-1.png"
              alt="Purple Housing Logo"
              width="200"
              height="100"
            />
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className="collapse navbar-collapse justify-content-center"
            id="navbarContent"
          >
            <ul className="navbar-nav mx-auto">
              <li className="nav-item">
                <Link className={`nav-link${pathname === "/" ? " active" : ""}`} href="/">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link${pathname === "/about" ? " active" : ""}`} href="/about">
                  About Us
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link${pathname === "/applying" ? " active" : ""}`} href="/applying">
                  Applying
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link${pathname === "/properties" ? " active" : ""}`} href="/properties">
                  All Properties
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link${pathname === "/booking" ? " active" : ""}`} href="/booking">
                  Schedule a showing
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link${pathname === "/contact" ? " active" : ""}`} href="/contact">
                  Contact
                </Link>
              </li>
            </ul>
            <div className="d-flex ms-auto">
              <button
                type="button"
                className="btn loginBtn"
                onClick={() => setShowModal(true)}
              >
                Admin Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div
                className="modal-header"
                style={{ backgroundColor: "#43086b" }}
              >
                <h5 className="modal-title" style={{ color: "#ffffff" }}>Admin Login</h5>
                <button
                  type="button"
                  className="btn-close"
                  style={{ filter: "invert(1)" }}
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleLogin}>
                  <div className="login-form-wrap">
                    <div className="mb-3">
                      <input
                        className="form-control"
                        name="username"
                        placeholder="Username or Email"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <div className="position-relative">
                        <input
                          className="form-control hz-password-input"
                          name="password"
                          placeholder="Password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="hz-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Show password"
                        >
                          <i
                            className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                          ></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="btn houzez-login-btn w-100">
                    Login
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
