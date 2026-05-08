import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PILLARS = [
  {
    title: "Clinical Precision",
    text: "Every scan workflow is standardized to reduce variability, improve consistency, and support confident diagnosis.",
    icon: "◎",
  },
  {
    title: "Fast Turnaround",
    text: "From booking to finalized report, NovaRad is optimized for speed without compromising image quality.",
    icon: "◷",
  },
  {
    title: "Patient-First Experience",
    text: "Clear pricing, transparent billing, and a simple portal help patients stay informed at every step.",
    icon: "⬡",
  },
  {
    title: "Integrated Platform",
    text: "Appointments, reports, images, and billing are connected in one secure system for smoother care delivery.",
    icon: "◈",
  },
];

export default function WhyNovaRadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goDashboard = () => {
    if (!user) return navigate("/login");
    if (user.role === "patient") return navigate("/patient/dashboard");
    if (user.role === "admin") return navigate("/admin/dashboard");
    return navigate("/staff/dashboard");
  };

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
              to="/find-us"
              style={{
                color: "var(--text-secondary)",
                textDecoration: "none",
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                fontSize: "0.85rem",
              }}
            >
              Find Us
            </Link>
            <button
              onClick={goDashboard}
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                border: "none",
                background:
                  "linear-gradient(135deg, var(--nova-blue), var(--nova-cyan))",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              {user ? "Dashboard" : "Sign In"} →
            </button>
          </div>
        </div>
      </nav>

      <main
        style={{
          width: "min(var(--page-max), calc(100% - (var(--page-gutter) * 2)))",
          margin: "0 auto",
          padding: "80px 0 90px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 54 }}>
          <div
            style={{
              fontSize: "0.74rem",
              color: "var(--nova-cyan)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              marginBottom: 14,
            }}
          >
            Why Patients Choose Us
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem,5vw,3.6rem)",
              margin: 0,
            }}
          >
            Why NovaRad
          </h1>
          <p
            style={{
              margin: "18px auto 0",
              maxWidth: 760,
              color: "var(--text-secondary)",
              lineHeight: 1.8,
              fontSize: "1rem",
            }}
          >
            NovaRad combines advanced imaging technology, expert radiology
            teams, and a seamless digital experience to deliver faster answers
            with dependable clinical quality.
          </p>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20,
          }}
        >
          {PILLARS.map((p) => (
            <article
              key={p.title}
              style={{
                background:
                  "linear-gradient(150deg, rgba(10,34,64,0.82), rgba(2,14,31,0.94))",
                border: "1px solid var(--border)",
                borderRadius: 18,
                padding: 24,
                minHeight: 210,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,212,245,0.12)",
                  color: "var(--nova-cyan)",
                  fontSize: "1.35rem",
                  marginBottom: 14,
                }}
              >
                {p.icon}
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.08rem",
                  color: "var(--text-primary)",
                }}
              >
                {p.title}
              </h3>
              <p
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                  fontSize: "0.92rem",
                }}
              >
                {p.text}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
