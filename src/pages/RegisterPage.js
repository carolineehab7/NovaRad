import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api/client";
import { Alert } from "../components/UI";

const FIELDS = [
  {
    name: "fname",
    label: "First Name",
    type: "text",
    required: true,
    half: true,
  },
  {
    name: "lname",
    label: "Last Name",
    type: "text",
    required: true,
    half: true,
  },
  { name: "mname", label: "Middle Name", type: "text", half: true },
  {
    name: "SSN",
    label: "National ID (SSN)",
    type: "text",
    required: true,
    half: true,
  },
  { name: "email", label: "Email Address", type: "email", required: true },
  {
    name: "phone",
    label: "Phone Number",
    type: "text",
    required: true,
    half: true,
  },
  {
    name: "DOB",
    label: "Date of Birth",
    type: "date",
    required: true,
    half: true,
  },
  { name: "add", label: "Address", type: "text" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    gender: "M",
    bt: "",
    mh: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "SSN") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 14);
      setForm({ ...form, [name]: digitsOnly });
      return;
    }

    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 11);
      setForm({ ...form, [name]: digitsOnly });
      return;
    }
    
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.password !== form.confirm_password)
      return setError("Passwords do not match.");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      await authAPI.register(form);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1400);
    } catch (err) {
      setError(
        err.response?.data?.error || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    background: "rgba(0,212,245,0.06)",
    border: "1px solid rgba(0,212,245,0.14)",
    borderRadius: 10,
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    fontFamily: "var(--font-body)",
    outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle = {
    fontSize: "0.72rem",
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    display: "block",
    marginBottom: 6,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse 70% 60% at 70% 50%, rgba(13,79,168,0.18) 0%, transparent 70%), var(--nova-deep)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px",
      }}
    >
      <div
        className="fade-up"
        style={{
          width: "100%",
          maxWidth: 760,
          background: "rgba(6,22,40,0.88)",
          border: "1px solid rgba(0,212,245,0.18)",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.42), inset 0 1px 0 rgba(0,212,245,0.08)",
        }}
      >
        <div
          style={{
            padding: "36px 40px",
            borderBottom: "1px solid rgba(0,212,245,0.1)",
            background: "rgba(0,212,245,0.02)",
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
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.8rem",
              marginTop: 16,
              color: "var(--text-primary)",
              fontWeight: 400,
            }}
          >
            Patient Registration
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              marginTop: 4,
            }}
          >
            Create your NovaRad patient account
          </p>
        </div>

        <div style={{ padding: "36px 40px" }}>
          <Alert message={error} type="error" onClose={() => setError("")} />
          <Alert message={success} type="success" />

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              {FIELDS.filter((f) => f.half).map((f) => (
                <div key={f.name}>
                  <label style={labelStyle}>
                    {f.label}
                    {f.required && " *"}
                  </label>
                  <input
                    type={f.type}
                    name={f.name}
                    required={f.required}
                    value={form[f.name] || ""}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>

            {FIELDS.filter((f) => !f.half).map((f) => (
              <div key={f.name} style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  {f.label}
                  {f.required && " *"}
                </label>
                <input
                  type={f.type}
                  name={f.name}
                  required={f.required}
                  value={form[f.name] || ""}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
            ))}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <label style={labelStyle}>Gender *</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  style={{ ...inputStyle, appearance: "none" }}
                >
                  <option value="M" style={{ background: "#061628" }}>
                    Male
                  </option>
                  <option value="F" style={{ background: "#061628" }}>
                    Female
                  </option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Blood Type</label>
                <select
                  name="bt"
                  value={form.bt}
                  onChange={handleChange}
                  style={{ ...inputStyle, appearance: "none" }}
                >
                  <option value="" style={{ background: "#061628" }}>
                    Select...
                  </option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                    (bt) => (
                      <option
                        key={bt}
                        value={bt}
                        style={{ background: "#061628" }}
                      >
                        {bt}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Medical History</label>
              <textarea
                name="mh"
                value={form.mh}
                onChange={handleChange}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Any relevant medical history..."
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 28,
              }}
            >
              <div>
                <label style={labelStyle}>Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label style={labelStyle}>Confirm Password *</label>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  value={form.confirm_password}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Repeat password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background:
                  "linear-gradient(135deg, var(--nova-blue), var(--nova-mid))",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.95rem",
                fontFamily: "var(--font-body)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 8px 24px rgba(13,79,168,0.4)",
              }}
            >
              {loading ? "Creating Account..." : "Create Patient Account →"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: 20,
              color: "var(--text-muted)",
              fontSize: "0.875rem",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "var(--nova-cyan)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
