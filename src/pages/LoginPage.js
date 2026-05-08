import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert } from "../components/UI";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === "patient") navigate("/patient/dashboard");
      else if (user.role === "admin") navigate("/admin/dashboard");
      else navigate("/staff/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page: {
      minHeight: "100vh",
      background: `radial-gradient(ellipse 60% 80% at 30% 50%, rgba(13,79,168,0.2) 0%, transparent 70%), var(--nova-deep)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 20px",
    },
    card: {
      width: "100%",
      maxWidth: 520,
      background: "rgba(6,22,40,0.88)",
      border: "1px solid rgba(0,212,245,0.18)",
      borderRadius: 28,
      overflow: "hidden",
      boxShadow:
        "0 20px 60px rgba(0,0,0,0.42), inset 0 1px 0 rgba(0,212,245,0.08)",
    },
    header: {
      padding: "40px 40px 28px",
      borderBottom: "1px solid rgba(0,212,245,0.1)",
      background: "rgba(0,212,245,0.02)",
    },
    body: { padding: "32px 40px 40px" },
    input: {
      width: "100%",
      padding: "13px 16px",
      background: "rgba(0,212,245,0.06)",
      border: "1px solid rgba(0,212,245,0.14)",
      borderRadius: 12,
      color: "var(--text-primary)",
      fontSize: "0.9rem",
      fontFamily: "var(--font-body)",
      outline: "none",
      boxSizing: "border-box",
      transition: "border-color 0.2s",
    },
    label: {
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "var(--text-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      display: "block",
      marginBottom: 8,
    },
    btn: {
      width: "100%",
      padding: "14px",
      background: "linear-gradient(135deg, var(--nova-blue), var(--nova-mid))",
      border: "none",
      borderRadius: 12,
      color: "#fff",
      fontWeight: 700,
      fontSize: "0.95rem",
      fontFamily: "var(--font-body)",
      cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.7 : 1,
      boxShadow: "0 8px 24px rgba(13,79,168,0.4)",
      transition: "all 0.3s",
      letterSpacing: "0.02em",
    },
  };

  return (
    <div style={s.page}>
      <div style={s.card} className="fade-up">
        <div style={s.header}>
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
              marginTop: 20,
              marginBottom: 6,
              color: "var(--text-primary)",
              fontWeight: 400,
            }}
          >
            Welcome back
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Sign in to your NovaRad account
          </p>
        </div>

        <div style={s.body}>
          <Alert message={error} type="error" onClose={() => setError("")} />
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <div>
              <label style={s.label}>Email Address</label>
              <input
                type="email"
                value={form.email}
                required
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={s.input}
                placeholder="you@example.com"
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--nova-cyan)")
                }
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            <div>
              <label style={s.label}>Password</label>
              <input
                type="password"
                value={form.password}
                required
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={s.input}
                placeholder="••••••••"
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--nova-cyan)")
                }
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            <button type="submit" style={s.btn} disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>
          <p
            style={{
              textAlign: "center",
              marginTop: 24,
              color: "var(--text-muted)",
              fontSize: "0.875rem",
            }}
          >
            No account?{" "}
            <Link
              to="/register"
              style={{
                color: "var(--nova-cyan)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Register as Patient
            </Link>
          </p>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Link
              to="/"
              style={{
                color: "var(--text-muted)",
                fontSize: "0.8rem",
                textDecoration: "none",
              }}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
