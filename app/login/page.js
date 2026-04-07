"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid credentials.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="ph-dashboard-login">
        <div className="container ph-dashboard-login__shell">
          <div className="ph-dashboard-login__card">
            <div className="ph-dashboard-login__intro">
              <span className="ph-dashboard-login__eyebrow">
                Purple Housing Dashboard
              </span>
              <h1>Sign in to manage listings, applications, and tours.</h1>
              <p>Use your Purple Housing dashboard credentials here.</p>
            </div>

            {error && (
              <div className="ph-dashboard-login__alerts">
                <div className="alert alert-danger mb-2">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="ph-dashboard-login__form">
              <div className="mb-3">
                <label htmlFor="dashboardUsername" className="form-label">
                  Username
                </label>
                <input
                  id="dashboardUsername"
                  type="text"
                  className="form-control"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="dashboardPassword" className="form-label">
                  Password
                </label>
                <div className="ph-password-field">
                  <input
                    id="dashboardPassword"
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="ph-password-toggle"
                    aria-label="Show password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i
                      className={showPassword ? "fa fa-eye-slash" : "fa fa-eye"}
                    ></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn ph-dashboard-login__submit"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <style jsx>{`
        .ph-dashboard-login {
          padding: 96px 0;
          min-height: calc(100vh - 180px);
          background:
            linear-gradient(
              180deg,
              rgba(15, 8, 23, 0.72),
              rgba(15, 8, 23, 0.88)
            ),
            url("/images/1.jpg") center/cover no-repeat;
          display: flex;
          align-items: center;
        }

        .ph-dashboard-login__shell {
          width: min(100%, 1180px);
          max-width: none;
          padding-left: clamp(18px, 3vw, 48px);
          padding-right: clamp(18px, 3vw, 48px);
        }

        .ph-dashboard-login__card {
          width: min(100%, 560px);
          padding: 32px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 30px 70px rgba(8, 5, 13, 0.34);
        }

        .ph-dashboard-login__eyebrow {
          display: inline-flex;
          margin-bottom: 14px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(77, 27, 120, 0.12);
          color: #4d1b78;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .ph-dashboard-login__intro h1 {
          margin: 0 0 12px;
          color: #241433;
          font-size: clamp(2rem, 4vw, 2.8rem);
          line-height: 1.08;
        }

        .ph-dashboard-login__intro p {
          margin: 0 0 24px;
          color: #685d75;
          line-height: 1.7;
        }

        .ph-dashboard-login__form :global(.form-label) {
          font-weight: 600;
          color: #38264a;
        }

        .ph-dashboard-login__form :global(.form-control) {
          min-height: 52px;
          border-radius: 14px;
          border: 1px solid #dacde8;
          box-shadow: none;
        }

        .ph-dashboard-login__form :global(.form-control:focus) {
          border-color: #6f3ea1;
          box-shadow: 0 0 0 0.18rem rgba(111, 62, 161, 0.16);
        }

        .ph-password-field {
          position: relative;
        }

        .ph-password-toggle {
          position: absolute;
          top: 50%;
          right: 14px;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #6f3ea1;
          padding: 0;
          cursor: pointer;
        }

        .ph-dashboard-login__submit {
          width: 100%;
          min-height: 52px;
          border: 0;
          border-radius: 14px;
          background: #4d1b78;
          color: #ffffff;
          font-weight: 700;
        }

        .ph-dashboard-login__submit:hover {
          background: #5d2391;
          color: #ffffff;
        }

        .ph-dashboard-login__submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
