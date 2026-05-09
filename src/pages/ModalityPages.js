import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ModalityPage({ title, subtitle, icon, color, specs, description }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--nova-deep)",
        color: "var(--text-primary)",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          padding: "20px 40px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            width:
              "min(var(--page-max), calc(100% - (var(--page-gutter) * 2)))",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
              style={{
                width: 220,
                height: 68,
                objectFit: "contain",
                filter: "drop-shadow(0 0 10px rgba(0,212,245,0.26))",
              }}
            />
          </Link>
          <div style={{ display: "flex", gap: 12 }}>
            {user ? (
              <button
                onClick={() =>
                  navigate(
                    user.role === "patient"
                      ? "/patient/dashboard"
                      : user.role === "admin"
                        ? "/admin/dashboard"
                        : "/staff/dashboard",
                  )
                }
                style={{
                  padding: "10px 22px",
                  background: "var(--nova-blue)",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                }}
              >
                Dashboard →
              </button>
            ) : (
              <Link
                to="/login"
                style={{
                  padding: "10px 22px",
                  background: "var(--nova-blue)",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div
        style={{
          padding: "80px 0 60px",
          textAlign: "center",
          background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${color}18 0%, transparent 70%)`,
        }}
      >
        <div
          style={{
            width:
              "min(var(--page-max), calc(100% - (var(--page-gutter) * 2)))",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontSize: "5rem",
              marginBottom: 20,
              filter: `drop-shadow(0 0 30px ${color})`,
              height: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {typeof icon === "string" &&
            (icon.includes("/") || icon.includes(".")) ? (
              <img
                src={icon}
                alt={title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  filter: `drop-shadow(0 0 30px ${color})`,
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              icon
            )}
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: 12,
            }}
          >
            Diagnostic Imaging
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "3.5rem",
              marginBottom: 16,
              color: "var(--text-primary)",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              maxWidth: 600,
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}
          >
            {subtitle}
          </p>
          <Link
            to="/register"
            style={{
              padding: "14px 32px",
              background: `linear-gradient(135deg, ${color}, ${color}aa)`,
              border: "none",
              borderRadius: 12,
              color: "#020b18",
              fontWeight: 700,
              fontSize: "0.95rem",
              textDecoration: "none",
              display: "inline-block",
              fontFamily: "var(--font-body)",
              boxShadow: `0 8px 30px ${color}40`,
            }}
          >
            Book {title} →
          </Link>
        </div>
      </div>

      {/* Info Grid */}
      <div
        style={{
          padding: "60px 0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 40,
          width: "min(var(--page-max), calc(100% - (var(--page-gutter) * 2)))",
          margin: "0 auto",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.8rem",
              color: "var(--text-primary)",
              marginBottom: 20,
            }}
          >
            About This Service
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.9,
              fontSize: "0.95rem",
            }}
          >
            {description}
          </p>
        </div>
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.8rem",
              color: "var(--text-primary)",
              marginBottom: 20,
            }}
          >
            Technical Specs
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {specs.map(([label, val]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                }}
              >
                <span
                  style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
                >
                  {label}
                </span>
                <span style={{ color, fontWeight: 600, fontSize: "0.85rem" }}>
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MRIPage() {
  return (
    <ModalityPage
      title="MRI Imaging"
      subtitle="High-resolution magnetic resonance imaging using powerful magnetic fields and radio waves to produce detailed images of organs and tissues."
      icon="/machines.png"
      color="#00d4f5"
      specs={[
        ["Tesla Strength", "3.0T"],
        ["Resolution", "Sub-millimeter"],
        ["Scan Time", "20-60 min"],
        ["Contrast Agent", "Optional"],
        ["Radiation", "None"],
      ]}
      description="MRI (Magnetic Resonance Imaging) is a non-invasive diagnostic tool that uses magnetic fields and radio wave pulses to generate detailed images of the body's internal structures. It is especially effective for soft tissue imaging — brain, spinal cord, muscles, ligaments — making it indispensable for neurological, musculoskeletal, and oncological assessment. Our 3.0T wide-bore MRI ensures exceptional clarity with minimal patient discomfort."
    />
  );
}

export function CTPage() {
  return (
    <ModalityPage
      title="CT Scan"
      subtitle="Computed tomography providing rapid, cross-sectional X-ray images to diagnose complex conditions across all body systems."
      icon="/ct-scan.png"
      color="#a78bfa"
      specs={[
        ["Detector Rows", "128-slice"],
        ["Scan Speed", "< 10 seconds"],
        ["Resolution", "0.5mm isotropic"],
        ["Radiation", "Low-dose protocol"],
        ["Contrast", "IV available"],
      ]}
      description="CT scanning uses multiple X-ray measurements from different angles to produce cross-sectional images. NovaRad's 128-slice CT scanner delivers exceptional detail in seconds, critical for emergency trauma assessment, cardiac imaging, and pulmonary evaluation. Our advanced low-dose protocols minimize radiation exposure while maintaining diagnostic quality."
    />
  );
}

export function XRayPage() {
  return (
    <ModalityPage
      title="Digital X-Ray"
      subtitle="Instant digital radiography providing clear skeletal and chest imaging with superior quality and minimal radiation exposure."
      icon="/x-ray.png"
      color="#34d399"
      specs={[
        ["Technology", "Digital (DR)"],
        ["Processing", "Instant"],
        ["Resolution", "3.4 lp/mm"],
        ["Dose", "Ultra-low"],
        ["Formats", "DICOM / JPEG"],
      ]}
      description="Digital X-Ray (DR) represents the evolution of traditional film radiography — producing instant, high-resolution images that can be enhanced, shared, and archived digitally. Our direct radiography systems provide superior diagnostic quality with significantly reduced radiation compared to conventional X-ray. Ideal for bone fractures, chest infections, and joint assessments."
    />
  );
}

export function UltrasoundPage() {
  return (
    <ModalityPage
      title="Ultrasound"
      subtitle="Real-time sonographic imaging using sound waves — safe, non-invasive, and effective for abdominal, vascular, and obstetric imaging."
      icon="/ultrasound.png"
      color="#fbbf24"
      specs={[
        ["Frequency", "2-18 MHz"],
        ["Mode", "B-mode, Doppler, 3D"],
        ["Real-time", "Yes"],
        ["Radiation", "None"],
        ["Prep Required", "Varies"],
      ]}
      description="Ultrasound imaging uses high-frequency sound waves to generate real-time images of internal structures. Completely radiation-free, it's the modality of choice for abdominal organs, obstetric monitoring, vascular studies, and guided procedures. Our advanced systems offer 3D/4D imaging and colour Doppler for comprehensive vascular assessment."
    />
  );
}

/* ─── Founders Page ─────────────────────────────────────────────── */
const TEAM = [
  { name: "Caroline El-baiady", id: "4230163", role: "Backend Engineer" },
  {
    name: "Mohamed Mostafa",
    id: "4230197",
    role: "Backend Engineer",
  },
  { name: "Khadija Ali", id: "4230337", role: "Frontend Engineer" },
  { name: "Reem Khaled", id: "4230145", role: "Frontend Engineer" },
  {
    name: "Omar Walid Mohamed",
    id: "1210269",
    role: "Frontend Engineer"
  },
];

export function FoundersPage() {
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
          padding: "20px 40px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width:
              "min(var(--page-max), calc(100% - (var(--page-gutter) * 2)))",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
              style={{
                width: 220,
                height: 68,
                objectFit: "contain",
                filter: "drop-shadow(0 0 10px rgba(0,212,245,0.26))",
              }}
            />
          </Link>
          <Link
            to="/"
            style={{
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </nav>
      <div
        style={{
          width: "min(var(--page-max), calc(100% - (var(--page-gutter) * 2)))",
          margin: "0 auto",
          padding: "80px 0",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "0.72rem",
            color: "var(--nova-cyan)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: 12,
          }}
        >
          Cairo University · Faculty of Engineering
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "3rem",
            marginBottom: 8,
          }}
        >
          The Team
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
          SBES171 – HealthCare Information Systems · Spring 2026
        </p>
        <div
          style={{
            display: "inline-block",
            padding: "6px 18px",
            background: "rgba(0,212,245,0.08)",
            border: "1px solid rgba(0,212,245,0.2)",
            borderRadius: 40,
            fontSize: "0.8rem",
            color: "var(--nova-cyan)",
            marginBottom: 60,
          }}
        >
          NovaRad Center — Group 3
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            justifyContent: "center",
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          {TEAM.map((member, i) => (
            <div
              key={i}
              style={{
                width: 200,
                background:
                  "linear-gradient(135deg, rgba(10,34,64,0.8), rgba(2,14,31,0.9))",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: 28,
                textAlign: "center",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,212,245,0.3)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1rem",
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {member.name}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--nova-cyan)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}
              >
                {member.role}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  fontFamily: "monospace",
                }}
              >
                ID: {member.id}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
