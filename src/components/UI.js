import React, { useState } from "react";

/* ─── StatCard ─────────────────────────────────────────────── */
export function StatCard({
  value,
  label,
  icon,
  color = "var(--nova-cyan)",
  delay = 0,
}) {
  return (
    <div
      className={`fade-up fade-up-${delay + 1}`}
      style={{
        background: "rgba(0,212,245,0.05)",
        border: `1px solid ${color}30`,
        borderRadius: "var(--radius-lg)",
        padding: "24px 28px",
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 4px 16px ${color}0a, inset 0 1px 0 ${color}08`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 20,
          fontSize: "1.8rem",
          opacity: 1.25,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {typeof icon === "string" && (icon.includes("/") || icon.includes(".")) ? (
          <img
            src={icon}
            alt={label}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: 1.25,
            }}
          />
        ) : (
          icon
        )}
      </div>
      <div
        style={{
          fontSize: "2.2rem",
          fontWeight: 800,
          color,
          lineHeight: 1,
          fontFamily: "var(--font-body)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          marginTop: 6,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ─── DataTable ─────────────────────────────────────────────── */
export function DataTable({
  columns,
  data,
  emptyMsg = "No data found",
  actions,
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.875rem",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(0,212,245,0.15)" }}>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  color: "var(--text-muted)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  whiteSpace: "nowrap",
                  background: "transparent",
                }}
              >
                {c.label}
              </th>
            ))}
            {actions && (
              <th
                style={{
                  padding: "12px 16px",
                  color: "var(--text-muted)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                style={{
                  textAlign: "center",
                  padding: "48px",
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                }}
              >
                {emptyMsg}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid rgba(0,212,245,0.08)",
                  transition: "var(--transition)",
                  cursor: "default",
                  background: "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(0,212,245,0.06)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      padding: "14px 16px",
                      color: c.muted
                        ? "var(--text-muted)"
                        : "var(--text-primary)",
                      whiteSpace: c.wrap ? "normal" : "nowrap",
                    }}
                  >
                    {c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}
                  </td>
                ))}
                {actions && (
                  <td style={{ padding: "14px 16px" }}>{actions(row)}</td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Card ─────────────────────────────────────────────────── */
export function Card({ children, title, titleRight, style = {} }) {
  return (
    <div
      style={{
        background: "rgba(0,212,245,0.04)",
        border: "1px solid rgba(0,212,245,0.2)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow:
          "0 4px 16px rgba(0,212,245,0.08), inset 0 1px 0 rgba(0,212,245,0.1)",
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(0,212,245,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0,212,245,0.02)",
          }}
        >
          <span
            style={{
              fontWeight: 700,
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              letterSpacing: "0.02em",
            }}
          >
            {title}
          </span>
          {titleRight}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Badge ─────────────────────────────────────────────────── */
export function Badge({ status }) {
  return (
    <span className={`badge badge-${status?.replace(" ", "_")}`}>
      {status?.replace("_", " ")}
    </span>
  );
}

/* ─── Button ─────────────────────────────────────────────────── */
export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  style = {},
}) {
  const base = {
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 10,
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    transition: "var(--transition)",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    opacity: disabled ? 0.5 : 1,
    padding:
      size === "sm" ? "6px 14px" : size === "lg" ? "14px 28px" : "10px 20px",
    fontSize: size === "sm" ? "0.78rem" : size === "lg" ? "1rem" : "0.875rem",
  };
  const variants = {
    primary: {
      background: "linear-gradient(135deg, var(--nova-blue), var(--nova-mid))",
      color: "#fff",
      boxShadow: "0 4px 15px rgba(13,79,168,0.4)",
    },
    cyan: {
      background: "linear-gradient(135deg, var(--nova-cyan), var(--nova-teal))",
      color: "#020b18",
      boxShadow: "0 4px 15px rgba(0,212,245,0.35)",
    },
    ghost: {
      background: "rgba(0,212,245,0.05)",
      color: "var(--nova-cyan)",
      border: "none",
    },
    danger: {
      background: "rgba(255,68,68,0.08)",
      color: "var(--danger)",
      border: "none",
    },
    success: {
      background: "rgba(0,230,118,0.08)",
      color: "var(--success)",
      border: "none",
    },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

/* ─── Input ─────────────────────────────────────────────────── */
export function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
  options,
  rows,
  style = {},
}) {
  const fieldStyle = {
    width: "100%",
    padding: "11px 14px",
    background: "rgba(0,212,245,0.06)",
    border: "1px solid rgba(0,212,245,0.15)",
    borderRadius: 10,
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    fontFamily: "var(--font-body)",
    outline: "none",
    transition: "var(--transition)",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
    ...style,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          style={{
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
          {required && " *"}
        </label>
      )}
      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          style={{ ...fieldStyle, appearance: "none" }}
        >
          {options?.map((o) => (
            <option
              key={o.value}
              value={o.value}
              style={{ background: "#061628" }}
            >
              {o.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          rows={rows || 4}
          style={{ ...fieldStyle, resize: "vertical" }}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          style={fieldStyle}
        />
      )}
    </div>
  );
}

/* ─── Modal ─────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(6,22,40,0.9)",
          border: "1px solid rgba(0,212,245,0.2)",
          borderRadius: 20,
          padding: 32,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow:
            "0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(0,212,245,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
              fontSize: "1.3rem",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "1.2rem",
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Spinner ─────────────────────────────────────────────────── */
export function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid var(--border)",
          borderTop: "3px solid var(--nova-cyan)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Alert ─────────────────────────────────────────────────── */
export function Alert({ message, type = "error", onClose }) {
  if (!message) return null;
  const colors = {
    error: {
      bg: "rgba(255,68,68,0.08)",
      border: "rgba(255,68,68,0.25)",
      color: "#ff6b6b",
    },
    success: {
      bg: "rgba(0,230,118,0.08)",
      border: "rgba(0,230,118,0.25)",
      color: "#00e676",
    },
    info: {
      bg: "rgba(0,212,245,0.08)",
      border: "rgba(0,212,245,0.25)",
      color: "var(--nova-cyan)",
    },
  };
  const c = colors[type] || colors.error;
  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        borderRadius: 10,
        padding: "12px 16px",
        marginBottom: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "0.875rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

/* ─── Chatbot ─────────────────────────────────────────────────── */
const INITIAL_MSG = {
  role: "assistant",
  content:
    "Hi! I'm Nova, your NovaRad AI assistant. I can help you book appointments, check prices, understand billing, or navigate the portal. How can I help?",
};

export function Chatbot() {
  const [open, setOpen] = useState(
    () => sessionStorage.getItem("chatbot_open") === "true"
  );
  const [msgs, setMsgs] = useState(() => {
    try {
      const saved = sessionStorage.getItem("chatbot_msgs");
      return saved ? JSON.parse(saved) : [INITIAL_MSG];
    } catch {
      return [INITIAL_MSG];
    }
  });
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    sessionStorage.setItem("chatbot_open", open);
  }, [open]);

  React.useEffect(() => {
    sessionStorage.setItem("chatbot_msgs", JSON.stringify(msgs));
  }, [msgs]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, thinking]);

  const send = async () => {
    if (!input.trim() || thinking) return;
    const userMsg = input.trim();
    setInput("");
    const next = [...msgs, { role: "user", content: userMsg }];
    setMsgs(next);
    setThinking(true);
    try {
      const history = next
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Sorry, I could not connect right now. Call 01117151930 for help.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 999 }}>
      {open && (
        <div
          style={{
            width: 340,
            marginBottom: 12,
            background: "rgba(6,22,40,0.9)",
            border: "1px solid rgba(0,212,245,0.2)",
            borderRadius: 20,
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(0,212,245,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(135deg, var(--nova-blue), var(--nova-mid))",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#00e676",
                boxShadow: "0 0 6px #00e676",
              }}
            />
            <div>
              <div
                style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}
              >
                ✦ Nova — AI Assistant
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "rgba(255,255,255,0.7)",
                  marginTop: 1,
                }}
              >
                NovaRad Smart Assistant
              </div>
            </div>
          </div>
          <div
            style={{
              height: 280,
              overflowY: "auto",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {msgs.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    padding: "9px 13px",
                    borderRadius: 14,
                    maxWidth: "82%",
                    fontSize: "0.82rem",
                    lineHeight: 1.5,
                    background:
                      m.role === "user"
                        ? "var(--nova-blue)"
                        : "rgba(0,212,245,0.08)",
                    color: m.role === "user" ? "#fff" : "var(--text-primary)",
                    border:
                      m.role === "assistant"
                        ? "1px solid rgba(0,212,245,0.15)"
                        : "none",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {thinking && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "9px 14px",
                    borderRadius: 14,
                    background: "rgba(0,212,245,0.08)",
                    border: "1px solid rgba(0,212,245,0.15)",
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                    display: "flex",
                    gap: 4,
                    alignItems: "center",
                  }}
                >
                  <span style={{ animation: "pulse 1s infinite" }}>●</span>
                  <span style={{ animation: "pulse 1s infinite 0.2s" }}>●</span>
                  <span style={{ animation: "pulse 1s infinite 0.4s" }}>●</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid rgba(0,212,245,0.1)",
              display: "flex",
              gap: 8,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about booking, prices, results..."
              disabled={thinking}
              style={{
                flex: 1,
                background: "rgba(0,212,245,0.06)",
                border: "1px solid rgba(0,212,245,0.15)",
                color: "var(--text-primary)",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: "0.82rem",
                outline: "none",
                opacity: thinking ? 0.6 : 1,
              }}
            />
            <Button onClick={send} size="sm" variant="cyan" disabled={thinking}>
              ↑
            </Button>
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, var(--nova-blue), var(--nova-cyan))",
            border: "none",
            cursor: "pointer",
            fontSize: "1.4rem",
            color: "#fff",
            boxShadow:
              "0 0 25px rgba(0,212,245,0.6), 0 0 50px rgba(0,212,245,0.3)",
            transition: "var(--transition)",
            animation: "breathing 2.5s ease-in-out infinite",
          }}
        >
          {open ? "✕" : "✦"}
          <style>{`
            @keyframes breathing {
              0%, 100% { 
                box-shadow: 0 0 15px rgba(0,212,245,0.4), 0 0 30px rgba(0,212,245,0.2);
                transform: scale(1);
              }
              50% { 
                box-shadow: 0 0 30px rgba(0,212,245,0.8), 0 0 60px rgba(0,212,245,0.5);
                transform: scale(1.05);
              }
            }
          `}</style>
        </button>
      </div>
    </div>
  );
}

/* ─── Navbar for public pages ─────────────────────────────────── */
export function PublicNav() {
  const { user } = require("../context/AuthContext").useAuth?.() || {};
  return null; // Handled inline in pages
}
