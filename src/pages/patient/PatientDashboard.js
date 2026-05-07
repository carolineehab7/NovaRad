import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { StatCard, Card, DataTable, Badge, Button, Spinner, Chatbot } from '../../components/UI';
import { patientAPI } from '../../api/client';

export default function PatientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientAPI.dashboard()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cancelAppt = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    await patientAPI.cancelAppointment(id);
    const r = await patientAPI.dashboard();
    setData(r.data);
  };

  const payInvoice = async (id) => {
    await patientAPI.payInvoice(id);
    const r = await patientAPI.dashboard();
    setData(r.data);
  };

  if (loading) return <DashboardLayout title="Dashboard"><Spinner /></DashboardLayout>;

  const unpaid = data?.invoices?.filter(i => i.status === 'unpaid').length || 0;

  return (
    <DashboardLayout title="Patient Dashboard">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
        <StatCard value={data?.appointments?.length || 0} label="Appointments" icon="◷" delay={0} />
        <StatCard value={unpaid} label="Unpaid Invoices" icon="◈" color="#ff4444" delay={1} />
        <StatCard value={data?.records?.length || 0} label="Medical Records" icon="▤" color="#00e676" delay={2} />
        <StatCard value={data?.patient?.blood_type || '—'} label="Blood Type" icon="◎" color="#fbbf24" delay={3} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Appointments */}
        <Card title="Recent Appointments" titleRight={
          <Link to="/patient/book" style={{ textDecoration: 'none' }}>
            <Button size="sm" variant="cyan">+ Book</Button>
          </Link>
        }>
          <DataTable
            columns={[
              { key: 'scheduled_datetime', label: 'Date', render: v => v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
              { key: 'modality', label: 'Modality' },
              { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
            ]}
            data={data?.appointments || []}
            emptyMsg="No appointments yet"
            actions={(row) => row.status === 'scheduled' ? (
              <Button size="sm" variant="danger" onClick={() => cancelAppt(row.appointment_id)}>Cancel</Button>
            ) : null}
          />
        </Card>

        {/* Invoices */}
        <Card title="Recent Invoices" titleRight={
          <Link to="/patient/billing" style={{ textDecoration: 'none' }}>
            <Button size="sm" variant="ghost">View All</Button>
          </Link>
        }>
          <DataTable
            columns={[
              { key: 'total_amount', label: 'Amount', render: v => `${v} EGP` },
              { key: 'due_date', label: 'Due Date', muted: true },
              { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
            ]}
            data={data?.invoices || []}
            emptyMsg="No invoices"
            actions={(row) => row.status === 'unpaid' ? (
              <Button size="sm" variant="success" onClick={() => payInvoice(row.invoice_id)}>Pay</Button>
            ) : null}
          />
        </Card>
      </div>

      {/* Medical Records */}
      <Card title="Recent Medical Records" titleRight={
        <Link to="/patient/records" style={{ textDecoration: 'none' }}>
          <Button size="sm" variant="ghost">View All</Button>
        </Link>
      }>
        <DataTable
          columns={[
            { key: 'record_type', label: 'Type' },
            { key: 'date_created', label: 'Date', muted: true },
            { key: 'description', label: 'Description', wrap: true, render: v => (v || '').slice(0, 80) + ((v || '').length > 80 ? '…' : '') },
            { key: 'signed', label: 'Status', render: v => <Badge status={v ? 'completed' : 'pending'} /> },
          ]}
          data={data?.records || []}
          emptyMsg="No medical records yet"
        />
      </Card>

      <Chatbot />
    </DashboardLayout>
  );
}
