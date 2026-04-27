"use client";
import { useState, useEffect, useCallback } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    work_phone: "",
    subject: "",
    message: "",
  });
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaUrl, setCaptchaUrl] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCaptcha = useCallback(async () => {
    try {
      const res = await fetch("/api/contact/captcha?t=" + Date.now());
      const data = await res.json();
      setCaptchaUrl(data.svg);
      setCaptchaToken(data.token);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  function refreshCaptcha() {
    loadCaptcha();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        work_phone: "+1" + formData.work_phone.replace(/\D/g, "").slice(0, 10),
        captcha_answer: captchaAnswer,
        captcha_token: captchaToken,
      }),
    });
    const data = await res.json();

    if (data.success) {
      setMessageType("success");
      setMessage(
        "Your message has been sent. We will get back to you shortly.",
      );
      setFormData({
        name: "",
        email: "",
        work_phone: "",
        subject: "",
        message: "",
      });
      setCaptchaAnswer("");
      refreshCaptcha();
    } else {
      setMessageType("error");
      setMessage(data.error || "Failed to send message.");
      refreshCaptcha();
    }
    setSubmitting(false);
  }

  return (
    <div className="contactPage">
      <div className="ph-page-shell">
        <div className="ph-page-hero">
          <div className="ph-page-hero__inner">
            <p className="ph-page-hero__title">Contact Us</p>
            <div className="ph-page-hero__crumbs">
              <span>Home</span>
              <i className="fas fa-angle-right"></i>
              <span>Contact Us</span>
            </div>
            <p className="ph-page-hero__sub">
              Find the best Houses for rent near Tcu with Purple Housing.
            </p>
          </div>
        </div>
        <div className="content position-relative">
          <div className="container mt-5">
            <div className="row align-items-start justify-content-center">
              <div className="col-12 col-md-8 mb-4">
                <h3 className="contactHeading">Request a Call Back</h3>
                <div className="dividerContact"></div>

                {message && (
                  <div
                    className={`alert ${messageType === "error" ? "alert-danger" : "alert-success"} mb-3`}
                  >
                    {message}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="Enter Your Name"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="Enter Your Email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="text"
                        name="work_phone"
                        className="form-control"
                        placeholder="Enter Your Phone Number"
                        required
                        value={formData.work_phone}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, "");
                          value = value.slice(0, 10);

                          setFormData({
                            ...formData,
                            work_phone: value,
                          });
                        }}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="text"
                        name="subject"
                        className="form-control"
                        placeholder="Enter Your Subject"
                        required
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <textarea
                        name="message"
                        rows="4"
                        className="form-control"
                        placeholder="Message"
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                      ></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Verification Code
                      </label>
                      <div className="contact-captcha-box">
                        <img
                          src={captchaUrl}
                          alt="Verification code"
                          className="contact-captcha-box__image"
                        />
                        <button
                          type="button"
                          className="btn contact-captcha-box__refresh"
                          onClick={refreshCaptcha}
                        >
                          <i className="fa fa-refresh" aria-hidden="true"></i>{" "}
                          <span>Refresh</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        name="captcha_answer"
                        className="form-control"
                        placeholder="Enter the code shown above"
                        autoComplete="off"
                        required
                        value={captchaAnswer}
                        onChange={(e) => setCaptchaAnswer(e.target.value)}
                      />
                      <small className="text-muted d-block mt-2">
                        This helps block automated spam submissions.
                      </small>
                    </div>
                    <div className="col-12 d-flex justify-content-center">
                      <button
                        type="submit"
                        className="btn btn-contactSubmit"
                        disabled={submitting}
                      >
                        {submitting ? "Sending..." : "Submit"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* <div className="col-12 col-md-4">
                <div className="contact-side-media">
                  <img
                    src="/images/about-us.png"
                    alt="Image"
                    className="img-fluid rounded contact-side-image"
                  />
                </div>
              </div> */}
            </div>
          </div>

          <div className="container py-4 pb-0">
            <div className="row mt-5">
              <div className="col-12 col-md-6">
                <h3 className="contactHeading">Contact Details:</h3>
                <div className="dividerContact"></div>

                <div className="d-flex align-items-center my-4">
                  <i className="fa fa-phone"></i>
                  <p className="mb-0 ms-3">
                    <a
                      href="tel:+18175851354"
                      className="text-dark fw-semibold socialLink"
                    >
                      (817) 585-1354
                    </a>
                  </p>
                </div>
                <div className="d-flex align-items-center my-4">
                  <i className="fa fa-envelope"></i>
                  <p className="mb-0 ms-3">
                    <a
                      href="mailto:admin@purplehousing.com"
                      className="text-dark fw-semibold socialLink"
                    >
                      admin@purplehousing.com
                    </a>
                  </p>
                </div>
                <div className="d-flex align-items-center my-4">
                  <i className="fa fa-map-marker"></i>
                  <p className="mb-0 ms-3 fw-semibold text-dark socialLink">
                    3124 Sandage Ave Fort Worth, TX 76109
                  </p>
                </div>

                <div className="d-flex mt-4 gap-1">
                  <a
                    href="https://www.facebook.com/purplehousing"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="contact-social-icon">
                      <i className="fab fa-facebook-f"></i>
                    </span>
                  </a>
                  <a
                    href="https://www.instagram.com/purplehousing/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="contact-social-icon">
                      <i className="fab fa-instagram"></i>
                    </span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/jonathan-rothchild-17556822"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="contact-social-icon">
                      <i className="fab fa-linkedin-in"></i>
                    </span>
                  </a>
                  <a
                    href="https://twitter.com/PurpleHousing"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="contact-social-icon">
                      <i className="fab fa-twitter"></i>
                    </span>
                  </a>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="ratio ratio-16x9 mb-3">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d429732.53177326475!2d-97.354789!3d32.705043!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864e721f7a43cc3f%3A0x9a5bfd38f89a3edc!2s3124%20Sandage%20Ave%2C%20Fort%20Worth%2C%20TX%2076109!5e0!3m2!1sen!2sus!4v1763726793946!5m2!1sen!2sus"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
