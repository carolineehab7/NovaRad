import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const patientLinks = [
  { path: "/patient/dashboard", icon: "/dashboard.png", label: "Dashboard" },
  { path: "/patient/profile", icon: "/account.png", label: "My Profile" },
  {
    path: "/patient/appointments",
    icon: "/appointments.png",
    label: "Appointments",
  },
  { path: "/patient/book", icon: "/bookapp.png", label: "Book Appointment" },
  {
    path: "/patient/records",
    icon: "/medrecords.png",
    label: "Medical Records",
  },
  { path: "/patient/billing", icon: "/bill.png", label: "Billing" },
];

const staffLinks = {
  receptionist: [
    { path: "/staff/dashboard", icon: "/dashboard.png", label: "Dashboard" },
    {
      path: "/staff/appointments",
      icon: "/appointments.png",
      label: "Appointments",
    },
  ],
  technician: [
    { path: "/staff/dashboard", icon: "/dashboard.png", label: "Dashboard" },
    {
      path: "/staff/imaging-orders",
      icon: "/imaging-orders.png",
      label: "Imaging Orders",
    },
    { path: "/staff/machines", icon: "/machines.png", label: "Machines" },
  ],
  radiologist: [
    { path: "/staff/dashboard", icon: "/dashboard.png", label: "Dashboard" },
    {
      path: "/staff/imaging-orders",
      icon: "/imaging-orders.png",
      label: "Imaging Orders",
    },
  ],
};

const adminLinks = [
  { path: "/admin/dashboard", icon: "/dashboard.png", label: "Dashboard" },
  { path: "/admin/patients", icon: "/account.png", label: "Patients" },
  { path: "/admin/staff", icon: "/staff.png", label: "Staff Management" },
  { path: "/admin/billing", icon: "/bill.png", label: "Billing" },
  { path: "/admin/reports", icon: "/reports.png", label: "Reports" },
];

export default function DashboardLayout({ children, title }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const links =
    user?.role === "patient"
      ? patientLinks
      : user?.role === "admin"
        ? adminLinks
        : staffLinks[user?.role] || staffLinks.receptionist;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const styles = {
    layout: {
      display: "flex",
      minHeight: "100vh",
      background: "var(--nova-deep)",
      position: "relative",
    },
    sidebar: {
      width: collapsed ? 72 : 240,
      minHeight: "100vh",
      background: "linear-gradient(180deg, #020e1f 0%, #041527 100%)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 50,
      overflow: "hidden",
    },
    logoArea: {
      padding: collapsed ? "24px 0" : "28px 24px",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      justifyContent: collapsed ? "center" : "flex-start",
      overflow: "hidden",
      whiteSpace: "nowrap",
    },
    logoImage: {
      width: collapsed ? 56 : 200,
      height: collapsed ? 56 : 64,
      objectFit: "contain",
      objectPosition: collapsed ? "center" : "left center",
      borderRadius: 10,
      filter: "drop-shadow(0 0 12px rgba(0,212,245,0.28))",
    },
    nav: { flex: 1, padding: "16px 0", overflowY: "auto", overflowX: "hidden" },
    navSection: {
      padding: collapsed ? "0" : "0 12px",
      marginBottom: 4,
    },
    navLabel: {
      fontSize: "0.65rem",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "var(--text-muted)",
      padding: "8px 12px 4px",
      display: collapsed ? "none" : "block",
    },
    bottomArea: {
      padding: "16px",
      borderTop: "1px solid var(--border)",
    },
    main: {
      marginLeft: collapsed ? 72 : 240,
      flex: 1,
      display: "flex",
      flexDirection: "column",
      transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)",
    },
    topbar: {
      padding: "20px 32px",
      background: "rgba(2,14,31,0.8)",
      borderBottom: "1px solid var(--border)",
      backdropFilter: "blur(20px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 40,
    },
    content: {
      flex: 1,
      padding: "32px",
      overflowY: "auto",
    },
    contentInner: {
      width: "min(var(--page-max), calc(100% - (var(--page-gutter) * 2)))",
      margin: "0 auto",
    },
    collapseBtn: {
      background: "transparent",
      border: "1px solid var(--border)",
      color: "var(--text-secondary)",
      cursor: "pointer",
      padding: "6px 10px",
      borderRadius: 8,
      fontSize: "1rem",
      transition: "var(--transition)",
    },
    userChip: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 40,
      padding: "6px 14px",
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      background: "linear-gradient(135deg, var(--nova-blue), var(--nova-cyan))",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14,
      fontWeight: 700,
      color: "#fff",
      flexShrink: 0,
    },
  };

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <img src="/final-logo.png" alt="NovaRad" style={styles.logoImage} />
        </div>

        <nav style={styles.nav}>
          <div style={styles.navSection}>
            <div style={styles.navLabel}>Navigation</div>
            {links.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    textDecoration: "none",
                    color: active
                      ? "var(--nova-cyan)"
                      : "var(--text-secondary)",
                    background: active ? "rgba(0,212,245,0.1)" : "transparent",
                    border: `1px solid ${active ? "rgba(0,212,245,0.2)" : "transparent"}`,
                    marginBottom: 4,
                    transition: "var(--transition)",
                    fontWeight: active ? 600 : 400,
                    fontSize: "0.875rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.1rem",
                      flexShrink: 0,
                      width: 20,
                      height: 20,
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {typeof link.icon === "string" &&
                    (link.icon.includes("/") || link.icon.includes(".")) ? (
                      <img
                        src={link.icon}
                        alt={link.label}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          opacity: active ? 1 : 0.8,
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      link.icon
                    )}
                  </span>
                  {!collapsed && <span>{link.label}</span>}
                  {active && !collapsed && (
                    <div
                      style={{
                        marginLeft: "auto",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--nova-cyan)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div style={{ ...styles.navSection, marginTop: 8 }}>
            <div style={styles.navLabel}>General</div>
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                textDecoration: "none",
                color: "var(--text-muted)",
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontSize: "1.1rem",
                  flexShrink: 0,
                  width: 20,
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img src="/home.png" alt="Home" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </span>
              {!collapsed && <span>Public Site</span>}
            </Link>
          </div>
        </nav>

        <div style={styles.bottomArea}>
          {!collapsed && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(0,212,245,0.05)",
                border: "1px solid var(--border)",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Signed in as
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                {user?.username}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--nova-cyan)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginTop: 2,
                }}
              >
                {user?.role}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 10,
              background: "rgba(255,68,68,0.1)",
              border: "1px solid rgba(255,68,68,0.2)",
              color: "#ff6b6b",
              cursor: "pointer",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: 10,
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            <span></span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={styles.main}>
        <div style={styles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              style={styles.collapseBtn}
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? "▶" : "◀"}
            </button>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
              }}
            >
              {title}
            </h1>
          </div>
          <div style={styles.userChip}>
            <div style={styles.avatar}>
              {(user?.username || "U")[0].toUpperCase()}
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {user?.username}
              </div>
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "var(--nova-cyan)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {user?.role}
              </div>
            </div>
          </div>
        </div>
        <div style={styles.content}>
          <div style={styles.contentInner}>{children}</div>
        </div>
      </div>
    </div>
  );
}
