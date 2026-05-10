import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  StatCard,
  Card,
  DataTable,
  Badge,
  Button,
  Modal,
  Alert,
  Spinner,
  Input,
} from "../../components/UI";
import { adminAPI } from "../../api/client";

/**
 * Component
 *
 * Main admin overview page showing key system metrics:
 * - Total patients and staff counts
 * - Scheduled appointments and unpaid invoices
 * - Revenue collected
 * - Recent appointments table for quick monitoring
 */
export function AdminDashboard() {
  const [data, setData] = useState(null); // Dashboard metrics data
  const [loading, setLoading] = useState(true); // Loading state for initial fetch

  // Fetch dashboard metrics on component mount
  useEffect(() => {
    adminAPI
      .dashboard()
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <DashboardLayout title="Admin Dashboard">
        <Spinner />
      </DashboardLayout>
    );

  return (
    <DashboardLayout title="System Overview">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <StatCard
          value={data?.total_patients || 0}
          label="Total Patients"
          delay={0}
        />
        <StatCard
          value={data?.total_staff || 0}
          label="Staff Members"
          color="#a78bfa"
          delay={1}
        />
        <StatCard
          value={data?.pending_appts || 0}
          label="Scheduled Appointments"
          color="#fbbf24"
          delay={2}
        />
        <StatCard
          value={data?.unpaid_invoices || 0}
          label="Unpaid Invoices"
          color="#ff4444"
          delay={3}
        />
        <StatCard
          value={`${(data?.total_revenue || 0).toLocaleString()} EGP`}
          label="Revenue Collected"
          color="#00e676"
          delay={4}
        />
      </div>

      {/* Recent appointments table for quick monitoring of recent activity */}
      <Card title="Recent Appointments">
        <DataTable
          columns={[
            { key: "patient_name", label: "Patient" },
            { key: "staff_name", label: "Technician", muted: true },
            { key: "radiologist_name", label: "Radiologist", muted: true },
            { key: "modality", label: "Modality" },
            {
              key: "scheduled_datetime",
              label: "Date",
              render: (v) =>
                v ? new Date(v).toLocaleDateString("en-GB") : "—",
              muted: true,
            },
            {
              key: "status",
              label: "Status",
              render: (v) => <Badge status={v} />,
            },
          ]}
          data={data?.recent_appts || []}
          emptyMsg="No appointments"
        />
      </Card>
    </DashboardLayout>
  );
}

/**
 * Staff management interface for admins:
 * - View complete staff directory with roles and departments
 * - Add new staff members with role assignment
 * - Remove staff members from the system
 * - Displays credentials (username, email) for record keeping
 */
export function AdminStaff() {
  const [staff, setStaff] = useState([]); // List of all staff members
  const [loading, setLoading] = useState(true); // Loading state
  const [showModal, setShowModal] = useState(false); // Controls add staff modal visibility
  // Form state for new staff member: name, role, department, credentials
  const [form, setForm] = useState({
    full_name: "",
    role: "radiologist",
    department: "",
    username: "",
    email: "",
    password: "",
  });
  const [msg, setMsg] = useState({ text: "", type: "" }); // Success/error messages

  // Load staff list from API
  const load = () =>
    adminAPI
      .staff()
      .then((r) => setStaff(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  // Add new staff member to system
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      // Submit new staff member data via API
      await adminAPI.addStaff(form);
      setMsg({ text: "Staff member added!", type: "success" });
      setShowModal(false);
      // Reset form for next entry
      setForm({
        full_name: "",
        role: "radiologist",
        department: "",
        username: "",
        email: "",
        password: "",
      });
      // Refresh staff list
      load();
    } catch (err) {
      setMsg({
        text: err.response?.data?.error || "Failed to add staff.",
        type: "error",
      });
    }
  };

  // Remove staff member from system (with confirmation)
  const handleDelete = async (id) => {
    if (!window.confirm("Remove this staff member?")) return;
    await adminAPI.deleteStaff(id);
    load();
  };

  if (loading)
    return (
      <DashboardLayout title="Staff Management">
        <Spinner />
      </DashboardLayout>
    );

  return (
    <DashboardLayout title="Staff Management">
      {/* Display success/error messages for add/delete operations */}
      <Alert
        message={msg.text}
        type={msg.type}
        onClose={() => setMsg({ text: "", type: "" })}
      />
      {/* Button to trigger add staff modal */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 20,
        }}
      >
        <Button variant="cyan" onClick={() => setShowModal(true)}>
          + Add Staff Member
        </Button>
      </div>

      {/* Table displaying all staff members with roles and contact info */}
      <Card title={`Staff Directory (${staff.length})`}>
        <DataTable
          columns={[
            { key: "staff_id", label: "#", muted: true },
            { key: "s_full_name", label: "Full Name" },
            { key: "role", label: "Role", render: (v) => <Badge status={v} /> },
            { key: "department", label: "Department", muted: true },
            { key: "email", label: "Email", muted: true },
            { key: "username", label: "Username", muted: true },
          ]}
          data={staff}
          emptyMsg="No staff members yet"
          actions={(row) => (
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(row.staff_id)}
            >
              Remove
            </Button>
          )}
        />
      </Card>

      {/* Modal dialog for adding new staff member */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Staff Member"
      >
        <form
          onSubmit={handleAdd}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Form fields for staff information */}
          {[
            { label: "Full Name", key: "full_name", type: "text" },
            { label: "Department", key: "department", type: "text" },
            { label: "Username", key: "username", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Password", key: "password", type: "password" },
          ].map((f) => (
            <Input
              key={f.key}
              label={f.label}
              type={f.type}
              value={form[f.key]}
              required
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          ))}
          {/* Role selection dropdown */}
          <Input
            label="Role"
            type="select"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={["radiologist", "technician", "receptionist", "admin"].map(
              (r) => ({
                value: r,
                label: r.charAt(0).toUpperCase() + r.slice(1),
              }),
            )}
          />
          {/* Submit and cancel buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Button
              type="submit"
              variant="cyan"
              style={{ flex: 1, justifyContent: "center" }}
            >
              Add Staff Member
            </Button>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

/**
 * AdminPatients Component
 *
 * Patient directory interface with search functionality:
 * - View all registered patients
 * - Search by name or email
 * - Display patient demographics and contact information
 */
export function AdminPatients() {
  const [patients, setPatients] = useState([]); // List of all patients
  const [loading, setLoading] = useState(true); // Loading state
  const [search, setSearch] = useState(""); // Search filter query

  // Fetch all patients on component mount
  useEffect(() => {
    adminAPI
      .patients()
      .then((r) => setPatients(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter patients by name or email (case-insensitive)
  const filtered = patients.filter(
    (p) =>
      (p.p_full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(search.toLowerCase()),
  );

  if (loading)
    return (
      <DashboardLayout title="Patients">
        <Spinner />
      </DashboardLayout>
    );

  return (
    <DashboardLayout title="Patient Directory">
      {/* Search field for filtering patients by name or email */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: 320,
            padding: "10px 14px",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            color: "var(--text-primary)",
            fontSize: "0.875rem",
            fontFamily: "var(--font-body)",
            outline: "none",
          }}
        />
      </div>
      {/* Patient directory table with demographics and contact information */}
      <Card title={`All Patients (${filtered.length})`}>
        <DataTable
          columns={[
            { key: "patient_id", label: "#", muted: true },
            { key: "p_full_name", label: "Full Name" },
            { key: "dob", label: "Date of Birth", muted: true },
            {
              key: "gender",
              label: "Gender",
              render: (v) => (v === "M" ? "Male" : v === "F" ? "Female" : "—"),
            },
            { key: "phone", label: "Phone", muted: true },
            {
              key: "blood_type",
              label: "Blood",
              render: (v) =>
                v ? (
                  <span style={{ color: "#ff6b6b", fontWeight: 600 }}>{v}</span>
                ) : (
                  "—"
                ),
            },
            { key: "email", label: "Email", muted: true },
          ]}
          data={filtered}
          emptyMsg="No patients found"
        />
      </Card>
    </DashboardLayout>
  );
}

/**
 * AdminBilling Component
 *
 * Billing and revenue overview:
 * - Total revenue collected
 * - Outstanding balance (unpaid invoices)
 * - Complete invoice list with payment status
 * - Invoice details including amounts, due dates, and patient info
 */
export function AdminBilling() {
  // State holds invoices array and paid/unpaid totals
  const [data, setData] = useState({ invoices: [], paid: 0, unpaid: 0 });
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch billing data on component mount
  useEffect(() => {
    adminAPI
      .billing()
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <DashboardLayout title="Billing">
        <Spinner />
      </DashboardLayout>
    );

  return (
    <DashboardLayout title="Billing Overview">
      {/* Key billing metrics: revenue collected, outstanding balance, and invoice count */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          marginBottom: 28,
        }}
      >
        <StatCard
          value={`${(data.paid || 0).toLocaleString()} EGP`}
          label="Revenue Collected"
          color="#00e676"
        />
        <StatCard
          value={`${(data.unpaid || 0).toLocaleString()} EGP`}
          label="Outstanding Balance"
          color="#ff4444"
          delay={1}
        />
        <StatCard
          value={data.invoices?.length || 0}
          label="Total Invoices"
          delay={2}
        />
      </div>
      {/* Complete invoice list with payment status tracking */}
      <Card title="All Invoices">
        <DataTable
          columns={[
            {
              key: "invoice_id",
              label: "Invoice #",
              render: (v) => `INV-${v}`,
              muted: true,
            },
            { key: "p_full_name", label: "Patient" },
            { key: "modality", label: "Service" },
            {
              key: "scheduled_datetime",
              label: "Date",
              render: (v) =>
                v ? new Date(v).toLocaleDateString("en-GB") : "—",
              muted: true,
            },
            {
              key: "total_amount",
              label: "Amount",
              render: (v) => `${(v || 0).toLocaleString()} EGP`,
            },
            { key: "due_date", label: "Due Date", muted: true },
            {
              key: "status",
              label: "Status",
              render: (v) => <Badge status={v} />,
            },
          ]}
          data={data.invoices || []}
          emptyMsg="No invoices"
        />
      </Card>
    </DashboardLayout>
  );
}

/**
 * AdminReports Component
 *
 * Radiology reports viewing and management:
 * - Display all signed and unsigned radiology reports
 * - Show patient info, radiologist assignment, and findings
 * - Track report signing status
 * - Visual organization of reports by modality and body part
 */
export function AdminReports() {
  const [reports, setReports] = useState([]); // Array of all radiology reports
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch all radiology reports on component mount
  useEffect(() => {
    adminAPI
      .reports()
      .then((r) => setReports(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <DashboardLayout title="Radiology Reports">
        <Spinner />
      </DashboardLayout>
    );

  return (
    <DashboardLayout title="Radiology Reports">
      {/* Display radiology reports or empty state */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {reports.length === 0 ? (
          // Empty state message
          <div
            style={{
              textAlign: "center",
              padding: "80px 40px",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 16, opacity: 0.4 }}>
              ▤
            </div>
            <div>No radiology reports yet</div>
          </div>
        ) : (
          reports.map((r) => (
            // Report card with findings and status
            <div
              key={r.report_id}
              style={{
                background:
                  "linear-gradient(135deg, rgba(10,34,64,0.7), rgba(2,14,31,0.8))",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 28,
              }}
            >
              {/* Report header with modality, body part, and signing status */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {r.modality} – {r.body_part || "N/A"}
                    </span>
                    <Badge status={r.signed ? "completed" : "pending"} />
                  </div>
                  {/* Patient, radiologist, and date information */}
                  <div
                    style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                  >
                    Patient:{" "}
                    <span style={{ color: "var(--text-secondary)" }}>
                      {r.patient_name}
                    </span>{" "}
                    · Radiologist:{" "}
                    <span style={{ color: "var(--nova-cyan)" }}>
                      {r.radiologist_name}
                    </span>{" "}
                    · Date: {r.report_date}
                  </div>
                </div>
                {/* Report ID in top right */}
                <span
                  style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                >
                  #{r.report_id}
                </span>
              </div>
              {/* Findings and impression section */}
              <div
                style={{
                  background: "rgba(0,0,0,0.25)",
                  borderRadius: 10,
                  padding: 16,
                  borderLeft: "2px solid var(--nova-cyan)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {r.findings_and_impression}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
