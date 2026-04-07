"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/login"))
    return null;
  return (
    <footer className="footer-section mt-5">
      <div className="container py-2">
        <div className="row">
          {/* Column 1 */}
          <div className="col-md-3 col-sm-6 mb-4 mt-5">
            <Link className="navbar-brand" href="/">
              <img
                src="/images/footer-logo.png"
                alt="Purple Housing Logo"
                width="200"
                height="100"
              />
            </Link>
            <p className="m-0 footer-para mt-3">
              &ldquo;Purple Housing was created to make finding off-campus
              housing easier for TCU students. The creator of purple housing, a
              TCU student himself, recognized that TCU students didn&rsquo;t
              have an easy or efficient way to find off campus housing&rdquo;
            </p>
          </div>

          {/* Column 2 */}
          <div className="col-md-3 col-sm-6 mb-4 mt-5">
            <h5 className="footer-title">Contact Us:</h5>
            <div className="footer-divider"></div>
            <ul className="list-unstyled footer-links">
              <li className="textList">
                3124 Sandage Ave Fort Worth, TX 76109
              </li>
              <li className="textList">
                <a style={{ color: "white" }} href="tel:+18175851354">
                  (817) 585-1354
                </a>
              </li>
              <li className="textList">
                <a
                  style={{ color: "white" }}
                  href="mailto:admin@purplehousing.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  admin@purplehousing.com
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div className="col-md-3 col-sm-6 mb-4 mt-5">
            <h5 className="footer-title">Find Us:</h5>
            <div className="footer-divider2"></div>
            <div className="footer-map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d429732.53177326475!2d-97.354789!3d32.705043!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864e721f7a43cc3f%3A0x9a5bfd38f89a3edc!2s3124%20Sandage%20Ave%2C%20Fort%20Worth%2C%20TX%2076109!5e0!3m2!1sen!2sus!4v1763726793946!5m2!1sen!2sus"
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* Column 4 */}
          <div className="col-md-3 col-sm-6 mb-4 mt-5">
            <h5 className="footer-title">Newsletter:</h5>
            <div className="footer-divider"></div>
            <ul className="list-unstyled footer-links">
              <li className="textList">Subscribe newsletter to get updates.</li>
            </ul>
            <div className="subscribe-box">
              <input
                type="email"
                className="subscribe-input"
                placeholder="Enter your email"
              />
              <button className="subscribe-btn">
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="footer-divider-bottom mt-5"></div>

        <div className="copyright-list pt-4">
          <ul>
            <li>
              <Link href="/contact" className="text-decoration-none text-white">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/" className="text-decoration-none text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-decoration-none text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link
                href="/applying"
                className="text-decoration-none text-white"
              >
                Applying
              </Link>
            </li>
            <li>
              <Link href="/blog" className="text-decoration-none text-white">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/booking" className="text-decoration-none text-white">
                Schedule a Showing
              </Link>
            </li>
            <li>
              <Link href="/iab" className="text-decoration-none text-white">
                IABS
              </Link>
            </li>
            <li>
              <Link
                href="/consumer-prediction"
                className="text-decoration-none text-white"
              >
                Consumer Protection Notice
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-center py-2 text-white copyright">
          Purple Housing - All Rights Reserved | Designed &amp; Developed by:
          Fauonix
        </div>
      </div>
    </footer>
  );
}
