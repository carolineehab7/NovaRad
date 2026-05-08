import React from "react";
import { Link } from "react-router-dom";

const CONTACT_ROWS = [
  ["Address", "123 Nile Axis, New Cairo, Cairo, Egypt"],
  ["Phone", "+20 2 1234 5678"],
  ["Email", "contact@novarad.com"],
  ["Hours", "Daily 9:00 AM – 9:00 PM"],
];

export default function FindUsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--nova-deep)",
        color: "var(--text-primary)",
      }}
    >
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "16px 28px",
          backdropFilter: "blur(18px)",
          background:
            "linear-gradient(180deg, rgba(2,11,24,0.88), rgba(2,11,24,0.75))",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            width:
              "min(var(--page-max), calc(100% - (var(--page-gutter) * 2)))",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <img
              src="/final-logo.png"
              alt="NovaRad"
              style={{ width: 210, height: 62, objectFit: "contain" }}
            />
          </Link>
          <div style={{ display: "flex", gap: 10 }}>
            <Link
              to="/why-novarad"
              style={{
                color: "var(--text-secondary)",
                textDecoration: "none",
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                fontSize: "0.85rem",
              }}
            >
              Why NovaRad
            </Link>
            <Link
              to="/register"
              style={{
                textDecoration: "none",
                padding: "10px 16px",
                borderRadius: 999,
                border: "none",
                background:
                  "linear-gradient(135deg, var(--nova-blue), var(--nova-cyan))",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.82rem",
              }}
            >
              Book Now →
            </Link>
          </div>
        </div>
      </nav>

      <main
        style={{
          width: "min(var(--page-max), calc(100% - (var(--page-gutter) * 2)))",
          margin: "0 auto",
          padding: "72px 0 88px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontSize: "0.74rem",
              color: "var(--nova-cyan)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              marginBottom: 14,
            }}
          >
            Visit NovaRad
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem,5vw,3.5rem)",
              margin: 0,
            }}
          >
            Find Us
          </h1>
          <p
            style={{
              margin: "16px auto 0",
              color: "var(--text-secondary)",
              maxWidth: 740,
              lineHeight: 1.8,
            }}
          >
            We are located in a central, easy-to-access area with dedicated
            patient support and clear directions for your appointment day.
          </p>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1.4fr",
            gap: 22,
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(150deg, rgba(10,34,64,0.82), rgba(2,14,31,0.94))",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: 24,
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 18,
                fontFamily: "var(--font-display)",
                fontSize: "1.6rem",
              }}
            >
              Contact & Directions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {CONTACT_ROWS.map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    background: "rgba(0,0,0,0.22)",
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--nova-cyan)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 4,
                    }}
                  >
                    {k}
                  </div>
                  <div
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "0.92rem",
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid var(--border)",
              minHeight: 420,
              background: "#021128",
            }}
          >
            <iframe
              title="NovaRad Location"
              src="https://maps.google.com/maps?q=New%20Cairo%20Egypt&t=&z=13&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 420 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
