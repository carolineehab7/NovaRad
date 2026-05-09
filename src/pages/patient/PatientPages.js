import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Card,
  DataTable,
  Badge,
  Button,
  Spinner,
  Alert,
} from "../../components/UI";
import { patientAPI } from "../../api/client";

export function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    patientAPI
      .appointments()
      .then((r) => setAppointments(r.data))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await patientAPI.cancelAppointment(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel appointment.");
    }
  };

  const now = Date.now();
  const sortedAppointments = [...appointments].sort((a, b) => {
    const aTime = a?.scheduled_datetime
      ? new Date(a.scheduled_datetime).getTime()
      : Number.POSITIVE_INFINITY;
    const bTime = b?.scheduled_datetime
      ? new Date(b.scheduled_datetime).getTime()
      : Number.POSITIVE_INFINITY;
    const aUpcoming = a.status === "scheduled" && aTime >= now;
    const bUpcoming = b.status === "scheduled" && bTime >= now;

    // Prioritize upcoming appointments, then nearest date first.
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    return aTime - bTime;
  });

  if (loading)
    return (
      <DashboardLayout title="Appointments">
        <Spinner />
      </DashboardLayout>
    );

  return (
    <DashboardLayout title="My Appointments">
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 20,
        }}
      >
        <Link to="/patient/book" style={{ textDecoration: "none" }}>
          <Button variant="cyan">+ Book New Appointment</Button>
        </Link>
      </div>
      <Card title={`All Appointments (${appointments.length})`}>
        <DataTable
          columns={[
            { key: "appointment_id", label: "#", muted: true },
            {
              key: "scheduled_datetime",
              label: "Date & Time",
              render: (v) =>
                v
                  ? new Date(v).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—",
            },
            { key: "modality", label: "Modality" },
            { key: "staff_name", label: "Technician", muted: true },
            { key: "radiologist_name", label: "Radiologist", muted: true },
            {
              key: "status",
              label: "Status",
              render: (v, row) => {
                const t = row?.scheduled_datetime
                  ? new Date(row.scheduled_datetime).getTime()
                  : 0;
                const isUpcoming = v === "scheduled" && t >= now;
                if (v === "completed") {
                  return (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: "rgba(100,181,246,0.14)",
                        border: "1px solid rgba(100,181,246,0.4)",
                        color: "#64b5f6",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Completed
                    </span>
                  );
                }
                if (!isUpcoming) return <Badge status={v} />;
                return (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "rgba(0,230,118,0.12)",
                      border: "1px solid rgba(0,230,118,0.35)",
                      color: "#00e676",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Upcoming
                  </span>
                );
              },
            },
          ]}
          data={sortedAppointments}
          emptyMsg="No appointments yet. Book your first one!"
          actions={(row) =>
            row.status === "scheduled" ? (
              <Button
                size="sm"
                variant="danger"
                onClick={() => cancel(row.appointment_id)}
              >
                Cancel
              </Button>
            ) : null
          }
        />
      </Card>
    </DashboardLayout>
  );
}

export function BookAppointment() {
  const [form, setForm] = useState({
    modality: "",
    body_part: "",
    referring_doctor: "",
    appointment_date: "",
    appointment_time: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const prices = { MRI: 1500, CT: 1200, "X-Ray": 300, Ultrasound: 500 };

  const minDate = (() => {
    const d = new Date();
    const tzAdjusted = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return tzAdjusted.toISOString().slice(0, 10);
  })();

  useEffect(() => {
    patientAPI
      .referringDoctors()
      .then((r) => setDoctors(r.data || []))
      .catch(() => setDoctors([]));
  }, []);

  useEffect(() => {
    if (!form.appointment_date) {
      setAvailableSlots([]);
      setForm((prev) => ({ ...prev, appointment_time: "" }));
      return;
    }
    setSlotsLoading(true);
    patientAPI
      .availableSlots(form.appointment_date)
      .then((r) => {
        const slots = r.data?.slots || [];
        setAvailableSlots(slots);
        setForm((prev) => ({
          ...prev,
          appointment_time: slots.includes(prev.appointment_time)
            ? prev.appointment_time
            : "",
        }));
      })
      .catch(() => {
        setAvailableSlots([]);
        setForm((prev) => ({ ...prev, appointment_time: "" }));
      })
      .finally(() => setSlotsLoading(false));
  }, [form.appointment_date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    if (!form.appointment_date || !form.appointment_time) {
      setMsg({
        text: "Please select a date and one available time slot.",
        type: "error",
      });
      return;
    }
    setLoading(true);
    const scheduled_datetime = `${form.appointment_date}T${form.appointment_time}`;
    try {
      await patientAPI.bookAppointment({ ...form, scheduled_datetime });
      setMsg({
        text: "Appointment booked successfully! An invoice has been generated.",
        type: "success",
      });
      setForm({
        modality: "",
        body_part: "",
        referring_doctor: "",
        appointment_date: "",
        appointment_time: "",
      });
      setAvailableSlots([]);
    } catch (err) {
      setMsg({
        text: err.response?.data?.error || "Booking failed.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    width: "100%",
    padding: "12px 14px",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid var(--border)",
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
    <DashboardLayout title="Book Appointment">
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <Card title="New Appointment">
          <div style={{ padding: 28 }}>
            <Alert
              message={msg.text}
              type={msg.type}
              onClose={() => setMsg({ text: "", type: "" })}
            />
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div>
                <label style={labelStyle}>Imaging Modality *</label>
                <select
                  value={form.modality}
                  onChange={(e) =>
                    setForm({ ...form, modality: e.target.value })
                  }
                  required
                  style={{ ...fieldStyle, appearance: "none" }}
                >
                  <option value="" style={{ background: "#061628" }}>
                    Select modality...
                  </option>
                  {Object.entries(prices).map(([k, v]) => (
                    <option key={k} value={k} style={{ background: "#061628" }}>
                      {k} — {v.toLocaleString()} EGP
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Body Part / Region *</label>
                <input
                  type="text"
                  value={form.body_part}
                  onChange={(e) =>
                    setForm({ ...form, body_part: e.target.value })
                  }
                  required
                  style={fieldStyle}
                  placeholder="e.g. Brain, Chest, Abdomen..."
                />
              </div>
              <div>
                <label style={labelStyle}>Referring Doctor</label>
                <select
                  value={form.referring_doctor}
                  onChange={(e) =>
                    setForm({ ...form, referring_doctor: e.target.value })
                  }
                  style={{ ...fieldStyle, appearance: "none" }}
                >
                  <option value="" style={{ background: "#061628" }}>
                    Select doctor (optional)
                  </option>
                  {doctors.map((d) => (
                    <option
                      key={d.staff_id}
                      value={d.s_full_name}
                      style={{ background: "#061628" }}
                    >
                      {d.s_full_name}
                      {d.department ? ` — ${d.department}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Appointment Date *</label>
                <input
                  type="date"
                  value={form.appointment_date}
                  onChange={(e) =>
                    setForm({ ...form, appointment_date: e.target.value })
                  }
                  required
                  min={minDate}
                  style={fieldStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Available Time Slots (09:00 - 21:00) *
                </label>
                <select
                  value={form.appointment_time}
                  onChange={(e) =>
                    setForm({ ...form, appointment_time: e.target.value })
                  }
                  required
                  disabled={
                    !form.appointment_date ||
                    slotsLoading ||
                    availableSlots.length === 0
                  }
                  style={{
                    ...fieldStyle,
                    appearance: "none",
                    opacity: !form.appointment_date || slotsLoading ? 0.85 : 1,
                  }}
                >
                  <option value="" style={{ background: "#061628" }}>
                    {!form.appointment_date
                      ? "Select a date first"
                      : slotsLoading
                        ? "Loading available slots..."
                        : availableSlots.length
                          ? "Select a time slot"
                          : "No available slots for this date"}
                  </option>
                  {availableSlots.map((slot) => (
                    <option
                      key={slot}
                      value={slot}
                      style={{ background: "#061628" }}
                    >
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                variant="cyan"
                disabled={loading}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "14px",
                }}
              >
                {loading ? "Booking..." : "Confirm Appointment →"}
              </Button>
            </form>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {form.modality && (
            <div
              style={{
                background: "rgba(0,212,245,0.06)",
                border: "1px solid rgba(0,212,245,0.2)",
                borderRadius: 14,
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--nova-cyan)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                }}
              >
                Estimated Cost
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2.5rem",
                  color: "var(--text-primary)",
                  lineHeight: 1,
                }}
              >
                {prices[form.modality]?.toLocaleString()}
                <span
                  style={{
                    fontSize: "1rem",
                    color: "var(--text-muted)",
                    marginLeft: 6,
                  }}
                >
                  EGP
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  marginTop: 8,
                }}
              >
                Invoice generated on booking. Due in 30 days.
              </div>
            </div>
          )}
          <div
            style={{
              background: "rgba(10,34,64,0.5)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 24,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 12,
                fontSize: "0.875rem",
              }}
            >
              🕘 Available Slots
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 18,
              }}
            >
              {availableSlots.length === 0 ? (
                <span
                  style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                >
                  {form.appointment_date
                    ? "No slots available for selected date."
                    : "Select a date to view hourly slots."}
                </span>
              ) : (
                availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setForm({ ...form, appointment_time: slot })}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border:
                        form.appointment_time === slot
                          ? "1px solid var(--nova-cyan)"
                          : "1px solid var(--border)",
                      background:
                        form.appointment_time === slot
                          ? "rgba(0,212,245,0.12)"
                          : "rgba(0,0,0,0.25)",
                      color:
                        form.appointment_time === slot
                          ? "var(--nova-cyan)"
                          : "var(--text-secondary)",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {slot}
                  </button>
                ))
              )}
            </div>
          </div>
          <div
            style={{
              background: "rgba(10,34,64,0.5)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 24,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 12,
                fontSize: "0.875rem",
              }}
            >
              What happens next?
            </div>
            {[
              "Appointment confirmed & invoice generated",
              "Staff assigns imaging slot",
              "Imaging performed on scheduled date",
              "Radiologist writes and signs report",
              "Results available in Medical Records",
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 10,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--nova-blue)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}
                >
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

const MAGIC_CARD = "4111111111111111";

export function PaymentModal({ invoice, onSuccess, onClose }) {
  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fieldStyle = {
    width: "100%",
    padding: "11px 14px",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid var(--border)",
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

  const formatCardNumber = (v) =>
    v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const formatExpiry = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const raw = card.number.replace(/\s/g, "");
    if (raw !== MAGIC_CARD) {
      setError("Card declined. Please check your card number and try again.");
      return;
    }
    setLoading(true);
    try {
      await patientAPI.payInvoice(invoice.invoice_id);
      onSuccess();
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #061628, #0a2240)",
          border: "1px solid rgba(0,212,245,0.25)",
          borderRadius: 20,
          padding: 36,
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card graphic */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(0,212,245,0.15), rgba(10,34,64,0.8))",
            border: "1px solid rgba(0,212,245,0.2)",
            borderRadius: 14,
            padding: "20px 24px",
            marginBottom: 28,
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              color: "var(--text-muted)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            VISA
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "1.15rem",
              color: "var(--text-primary)",
              letterSpacing: "0.2em",
              marginBottom: 16,
            }}
          >
            {card.number || "•••• •••• •••• ••••"}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.6rem",
                  color: "var(--text-muted)",
                  marginBottom: 2,
                }}
              >
                CARDHOLDER
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-primary)",
                  textTransform: "uppercase",
                }}
              >
                {card.name || "YOUR NAME"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "0.6rem",
                  color: "var(--text-muted)",
                  marginBottom: 2,
                }}
              >
                EXPIRES
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>
                {card.expiry || "MM/YY"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontWeight: 700,
              color: "var(--text-primary)",
              fontSize: "1rem",
              marginBottom: 4,
            }}
          >
            Complete Payment
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Invoice INV-{invoice.invoice_id} ·{" "}
            <span style={{ color: "var(--nova-cyan)", fontWeight: 600 }}>
              {(invoice.total_amount || 0).toLocaleString()} EGP
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(255,68,68,0.1)",
              border: "1px solid rgba(255,68,68,0.3)",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: "0.82rem",
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label style={labelStyle}>Card Number</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              value={card.number}
              onChange={(e) =>
                setCard({ ...card, number: formatCardNumber(e.target.value) })
              }
              required
              style={{
                ...fieldStyle,
                fontFamily: "monospace",
                letterSpacing: "0.1em",
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>Cardholder Name</label>
            <input
              type="text"
              placeholder="Name on card"
              value={card.name}
              onChange={(e) => setCard({ ...card, name: e.target.value })}
              required
              style={fieldStyle}
            />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label style={labelStyle}>Expiry Date</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={card.expiry}
                onChange={(e) =>
                  setCard({ ...card, expiry: formatExpiry(e.target.value) })
                }
                required
                style={fieldStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>CVV</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="•••"
                value={card.cvv}
                onChange={(e) =>
                  setCard({
                    ...card,
                    cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                  })
                }
                required
                style={fieldStyle}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <Button
              type="button"
              variant="ghost"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={loading}
              style={{ flex: 2, justifyContent: "center", padding: "13px" }}
            >
              {loading
                ? "Processing..."
                : `Pay ${(invoice.total_amount || 0).toLocaleString()} EGP`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PatientBilling() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState(null);

  const load = () =>
    patientAPI
      .billing()
      .then((r) => setInvoices(r.data))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  if (loading)
    return (
      <DashboardLayout title="Billing">
        <Spinner />
      </DashboardLayout>
    );

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalUnpaid = invoices
    .filter((i) => i.status === "unpaid")
    .reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalRefunded = invoices
    .filter((i) => i.status === "refunded")
    .reduce((s, i) => s + (i.total_amount || 0), 0);
  const sortedInvoices = [...invoices].sort((a, b) => {
    const aUnpaid = a.status === "unpaid";
    const bUnpaid = b.status === "unpaid";
    if (aUnpaid !== bUnpaid) return aUnpaid ? -1 : 1;

    const aDue = a?.due_date
      ? new Date(a.due_date).getTime()
      : Number.POSITIVE_INFINITY;
    const bDue = b?.due_date
      ? new Date(b.due_date).getTime()
      : Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;

    return (b.invoice_id || 0) - (a.invoice_id || 0);
  });

  return (
    <DashboardLayout title="Billing & Payments">
      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          onSuccess={() => {
            setPayingInvoice(null);
            load();
          }}
          onClose={() => setPayingInvoice(null)}
        />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: "rgba(0,230,118,0.06)",
            border: "1px solid rgba(0,230,118,0.2)",
            borderRadius: 14,
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--success)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 6,
            }}
          >
            Total Paid
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              color: "var(--success)",
            }}
          >
            {totalPaid.toLocaleString()}{" "}
            <span style={{ fontSize: "0.9rem" }}>EGP</span>
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,68,68,0.06)",
            border: "1px solid rgba(255,68,68,0.2)",
            borderRadius: 14,
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--danger)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 6,
            }}
          >
            Outstanding Balance
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              color: "var(--danger)",
            }}
          >
            {totalUnpaid.toLocaleString()}{" "}
            <span style={{ fontSize: "0.9rem" }}>EGP</span>
          </div>
        </div>
        <div
          style={{
            background: "rgba(156,39,176,0.06)",
            border: "1px solid rgba(156,39,176,0.2)",
            borderRadius: 14,
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "#ce93d8",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 6,
            }}
          >
            Refunded
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              color: "#ce93d8",
            }}
          >
            {totalRefunded.toLocaleString()}{" "}
            <span style={{ fontSize: "0.9rem" }}>EGP</span>
          </div>
        </div>
        <div
          style={{
            background: "rgba(0,212,245,0.06)",
            border: "1px solid rgba(0,212,245,0.2)",
            borderRadius: 14,
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--nova-cyan)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 6,
            }}
          >
            Total Invoices
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              color: "var(--nova-cyan)",
            }}
          >
            {invoices.length}
          </div>
        </div>
      </div>

      <Card title="Invoice History">
        <DataTable
          columns={[
            {
              key: "invoice_id",
              label: "Invoice #",
              render: (v) => `INV-${v}`,
              muted: true,
            },
            { key: "modality", label: "Service" },
            {
              key: "scheduled_datetime",
              label: "Service Date",
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
          data={sortedInvoices}
          emptyMsg="No invoices found"
          actions={(row) =>
            row.status === "unpaid" ? (
              <Button
                size="sm"
                variant="success"
                onClick={() => setPayingInvoice(row)}
              >
                Pay Now
              </Button>
            ) : (
              <span style={{ color: "var(--success)", fontSize: "0.85rem" }}>
                ✓ Paid
              </span>
            )
          }
        />
      </Card>
    </DashboardLayout>
  );
}

export function PatientRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [images, setImages] = useState({});
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    patientAPI
      .records()
      .then((r) => setRecords(r.data))
      .finally(() => setLoading(false));
  }, []);

  const toggleRecord = async (r) => {
    if (selected?.record_id === r.record_id) {
      setSelected(null);
      return;
    }
    setSelected(r);
    if (r.order_id && !images[r.order_id]) {
      try {
        const res = await patientAPI.getImages(r.order_id);
        setImages((prev) => ({ ...prev, [r.order_id]: res.data }));
      } catch {
        /* no images */
      }
    }
  };

  if (loading)
    return (
      <DashboardLayout title="Medical Records">
        <Spinner />
      </DashboardLayout>
    );

  return (
    <DashboardLayout title="Medical Records">
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <img
            src={lightbox}
            alt="scan"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 10,
              objectFit: "contain",
            }}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 28,
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "1.8rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {records.length === 0 ? (
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
          <div style={{ fontSize: "1.1rem" }}>No medical records yet</div>
          <div style={{ fontSize: "0.875rem", marginTop: 8 }}>
            Records appear here after your radiologist completes and signs your
            report.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {records.map((r) => {
            const isOpen = selected?.record_id === r.record_id;
            const recordImages = images[r.order_id] || [];
            return (
              <div
                key={r.record_id}
                style={{
                  background:
                    "linear-gradient(135deg, rgba(10,34,64,0.7), rgba(2,14,31,0.8))",
                  border: `1px solid ${isOpen ? "rgba(0,212,245,0.3)" : "var(--border)"}`,
                  borderRadius: 16,
                  padding: 24,
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onClick={() => toggleRecord(r)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(0,212,245,0.3)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = isOpen
                    ? "rgba(0,212,245,0.3)"
                    : "var(--border)")
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: isOpen ? 20 : 0,
                  }}
                >
                  <div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          fontSize: "0.95rem",
                        }}
                      >
                        {r.record_type}
                      </span>
                      <Badge status={r.signed ? "completed" : "pending"} />
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      {r.date_created} · {r.staff_name || "Unknown Staff"}
                    </div>
                  </div>
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "1rem",
                      transition: "transform 0.2s",
                      transform: isOpen ? "rotate(180deg)" : "none",
                    }}
                  >
                    ▾
                  </span>
                </div>

                {isOpen && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    {r.findings_and_impression && (
                      <div
                        style={{
                          background: "rgba(0,0,0,0.3)",
                          borderRadius: 10,
                          padding: 20,
                          borderLeft: "3px solid var(--nova-cyan)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--nova-cyan)",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            marginBottom: 10,
                          }}
                        >
                          Radiologist Findings & Impression
                        </div>
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
                        {r.report_date && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              marginTop: 12,
                            }}
                          >
                            Report date: {r.report_date}
                          </div>
                        )}
                      </div>
                    )}

                    {recordImages.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--nova-cyan)",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            marginBottom: 12,
                          }}
                        >
                          Imaging Scans ({recordImages.length})
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(140px, 1fr))",
                            gap: 10,
                          }}
                        >
                          {recordImages.map((img) => (
                            <div
                              key={img.file_id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightbox(img.url);
                              }}
                              style={{
                                cursor: "pointer",
                                borderRadius: 10,
                                overflow: "hidden",
                                border: "1px solid var(--border)",
                                aspectRatio: "1",
                                background: "#000",
                                position: "relative",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.borderColor =
                                  "rgba(0,212,245,0.5)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.borderColor =
                                  "var(--border)")
                              }
                            >
                              <img
                                src={img.url}
                                alt="scan"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  e.currentTarget.nextSibling.style.display =
                                    "flex";
                                }}
                              />
                              <div
                                style={{
                                  display: "none",
                                  position: "absolute",
                                  inset: 0,
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: "rgba(10,34,64,0.9)",
                                  color: "var(--text-muted)",
                                  fontSize: "0.7rem",
                                  textAlign: "center",
                                  padding: 8,
                                  gap: 6,
                                }}
                              >
                                <span
                                  style={{ fontSize: "1.4rem", opacity: 0.4 }}
                                >
                                  ⚠
                                </span>
                                <span>
                                  Re-upload
                                  <br />
                                  required
                                </span>
                              </div>
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  background: "rgba(0,0,0,0.6)",
                                  padding: "4px 8px",
                                  fontSize: "0.65rem",
                                  color: "rgba(255,255,255,0.7)",
                                }}
                              >
                                {img.file_type?.toUpperCase()}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            marginTop: 8,
                          }}
                        >
                          Click any image to view full size
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
