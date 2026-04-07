import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div
      style={{
        fontFamily: "'Roboto', sans-serif",
        background: "linear-gradient(135deg, #6a11cb, #2575fc)",
        minHeight: "100vh",
        margin: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
      }}
    >
      <div
        style={{
          background: "#fff",
          color: "#333",
          padding: "40px 60px",
          borderRadius: "15px",
          textAlign: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          maxWidth: "400px",
          width: "90%",
        }}
      >
        <div
          style={{ fontSize: "4rem", color: "#28a745", marginBottom: "20px" }}
        >
          <i className="fas fa-check-circle"></i>
        </div>
        <h1
          style={{ fontSize: "2.5rem", marginBottom: "20px", color: "#2575fc" }}
        >
          Thank You!
        </h1>
        <p style={{ fontSize: "1.1rem", marginBottom: "30px", color: "#555" }}>
          Thank you for scheduling a property viewing with Purple Housing. We
          will get back to you within 24 hours to confirm or decline the
          schedule via email.
        </p>
        <Link
          href="/booking"
          style={{
            display: "inline-block",
            padding: "12px 30px",
            background: "#2575fc",
            color: "#fff",
            borderRadius: "50px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Book Another Meeting
        </Link>
      </div>
    </div>
  );
}
