import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import {
  StatCard,
  Card,
  DataTable,
  Badge,
  Button,
  Spinner,
  Chatbot,
} from "../../components/UI";
import { patientAPI } from "../../api/client";
import { PaymentModal } from "./PatientPages";

export default function PatientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState(null);

  const reload = async () => {
    const [d, a, b] = await Promise.all([
      patientAPI.dashboard(),
      patientAPI.appointments(),
      patientAPI.billing(),
    ]);
    setData({ ...d.data, appointments: a.data || [], invoices: b.data || [] });
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([
      patientAPI.dashboard(),
      patientAPI.appointments(),
      patientAPI.billing(),
    ])
      .then(([d, a, b]) => {
        if (!mounted) return;
        setData({
          ...d.data,
          appointments: a.data || [],
          invoices: b.data || [],
        });
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // fetch full lists to compute accurate counts (kept for manual refreshes)
  useEffect(() => {
    let mounted = true;
    Promise.all([patientAPI.appointments(), patientAPI.billing()])
      .then(([aRes, bRes]) => {
        if (!mounted) return;
        const appts = aRes.data || [];
        const bills = bRes.data || [];
        const now = Date.now();
        const apptCount = appts.filter((a) => {
          const t = a?.scheduled_datetime
            ? new Date(a.scheduled_datetime).getTime()
            : 0;
          return (
            a.status === "completed" || (a.status === "scheduled" && t >= now)
          );
        }).length;
        const unpaidCount = bills.filter((i) => i.status === "unpaid").length;
        setData((prev) => ({
          ...(prev || {}),
          appointments: appts,
          invoices: bills,
          __counts: { apptCount, unpaidCount },
        }));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const cancelAppt = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await patientAPI.cancelAppointment(id);
      reload();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel appointment.");
    }
  };

  if (loading)
    return (
      <DashboardLayout title="Dashboard">
        <Spinner />
      </DashboardLayout>
    );

  const unpaid =
    data?.__counts?.unpaidCount ??
    (data?.invoices?.filter((i) => i.status === "unpaid").length || 0);
  const apptCnt =
    data?.__counts?.apptCount ?? (data?.appointments?.length || 0);

  return (
    <DashboardLayout title="Patient Dashboard">
      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          onSuccess={() => {
            setPayingInvoice(null);
            reload();
          }}
          onClose={() => setPayingInvoice(null)}
        />
      )}
      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <StatCard value={apptCnt} label="Appointments" delay={0} />
        <StatCard
          value={unpaid}
          label="Unpaid Invoices"
          color="#ff4444"
          delay={1}
        />
        <StatCard
          value={data?.records?.length || 0}
          label="Medical Records"
          color="#00e676"
          delay={2}
        />
        <StatCard
          value={data?.patient?.blood_type || "—"}
          label="Blood Type"
          color="#fbbf24"
          delay={3}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 24,
        }}
      >
        {/* Appointments */}
        <Card
          title="Recent Appointments"
          titleRight={
            <Link to="/patient/book" style={{ textDecoration: "none" }}>
              <Button size="sm" variant="cyan">
                + Book
              </Button>
            </Link>
          }
        >
          <DataTable
            columns={[
              {
                key: "scheduled_datetime",
                label: "Date",
                render: (v) =>
                  v
                    ? new Date(v).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—",
              },
              { key: "modality", label: "Modality" },
              { key: "staff_name", label: "Technician", muted: true },
              { key: "radiologist_name", label: "Radiologist", muted: true },
              {
                key: "status",
                label: "Status",
                render: (v) => <Badge status={v} />,
              },
            ]}
            data={(data?.appointments || [])
              .filter(
                (a) =>
                  a.status === "completed" ||
                  (a.status === "scheduled" &&
                    new Date(a.scheduled_datetime).getTime() >= Date.now()),
              )
              .sort(
                (x, y) =>
                  new Date(y.scheduled_datetime).getTime() -
                  new Date(x.scheduled_datetime).getTime(),
              )
              .slice(0, 5)}
            emptyMsg="No appointments yet"
            actions={(row) =>
              row.status === "scheduled" ? (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => cancelAppt(row.appointment_id)}
                >
                  Cancel
                </Button>
              ) : null
            }
          />
        </Card>

        {/* Invoices */}
        <Card
          title="Recent Invoices"
          titleRight={
            <Link to="/patient/billing" style={{ textDecoration: "none" }}>
              <Button size="sm" variant="ghost">
                View All
              </Button>
            </Link>
          }
        >
          <DataTable
            columns={[
              {
                key: "total_amount",
                label: "Amount",
                render: (v) => `${v} EGP`,
              },
              { key: "due_date", label: "Due Date", muted: true },
              {
                key: "status",
                label: "Status",
                render: (v) => <Badge status={v} />,
              },
            ]}
            data={(data?.invoices || [])
              .slice()
              .sort((a, b) => {
                const aUn = a.status === "unpaid";
                const bUn = b.status === "unpaid";
                if (aUn !== bUn) return aUn ? -1 : 1;
                const aDue = a?.due_date
                  ? new Date(a.due_date).getTime()
                  : Number.POSITIVE_INFINITY;
                const bDue = b?.due_date
                  ? new Date(b.due_date).getTime()
                  : Number.POSITIVE_INFINITY;
                return aDue - bDue;
              })
              .slice(0, 5)}
            emptyMsg="No invoices"
            actions={(row) =>
              row.status === "unpaid" ? (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => setPayingInvoice(row)}
                >
                  Pay
                </Button>
              ) : null
            }
          />
        </Card>
      </div>

      {/* Medical Records */}
      <Card
        title="Recent Medical Records"
        titleRight={
          <Link to="/patient/records" style={{ textDecoration: "none" }}>
            <Button size="sm" variant="ghost">
              View All
            </Button>
          </Link>
        }
      >
        <DataTable
          columns={[
            { key: "record_type", label: "Type" },
            { key: "date_created", label: "Date", muted: true },
            {
              key: "description",
              label: "Description",
              wrap: true,
              render: (v) =>
                (v || "").slice(0, 80) + ((v || "").length > 80 ? "…" : ""),
            },
            {
              key: "signed",
              label: "Status",
              render: (v) => <Badge status={v ? "completed" : "pending"} />,
            },
          ]}
          data={data?.records || []}
          emptyMsg="No medical records yet"
        />
      </Card>

      <Chatbot />
    </DashboardLayout>
  );
}
