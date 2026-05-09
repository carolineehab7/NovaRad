import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { StatCard, Card, DataTable, Badge, Button, Modal, Alert, Spinner, Input } from '../../components/UI';
import { adminAPI } from '../../api/client';

/* ─── Admin Dashboard ─────────────────────────────────────────── */
export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.dashboard().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Admin Dashboard"><Spinner /></DashboardLayout>;

  return (
    <DashboardLayout title="System Overview">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 32 }}>
        <StatCard value={data?.total_patients || 0} label="Total Patients" icon="/patients.png" delay={0} />
        <StatCard value={data?.total_staff || 0} label="Staff Members" icon="/staff.png" color="#a78bfa" delay={1} />
        <StatCard value={data?.pending_appts || 0} label="Scheduled Appointments" icon="/appointments.png" color="#fbbf24" delay={2} />
        <StatCard value={data?.unpaid_invoices || 0} label="Unpaid Invoices" icon="/invoices.png" color="#ff4444" delay={3} />
        <StatCard value={`${(data?.total_revenue || 0).toLocaleString()} EGP`} label="Revenue Collected" icon="/revenue.png" color="#00e676" delay={4} />
      </div>

      <Card title="Recent Appointments">
        <DataTable
          columns={[
            { key: 'patient_name', label: 'Patient' },
            { key: 'staff_name', label: 'Technician', muted: true },
            { key: 'radiologist_name', label: 'Radiologist', muted: true },
            { key: 'modality', label: 'Modality' },
            { key: 'scheduled_datetime', label: 'Date', render: v => v ? new Date(v).toLocaleDateString('en-GB') : '—', muted: true },
            { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
          ]}
          data={data?.recent_appts || []}
          emptyMsg="No appointments"
        />
      </Card>
    </DashboardLayout>
  );
}

/* ─── Admin Staff ─────────────────────────────────────────────── */
export function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', role: 'radiologist', department: '', username: '', email: '', password: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });

  const load = () => adminAPI.staff().then(r => setStaff(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addStaff(form);
      setMsg({ text: 'Staff member added!', type: 'success' });
      setShowModal(false);
      setForm({ full_name: '', role: 'radiologist', department: '', username: '', email: '', password: '' });
      load();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Failed to add staff.', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this staff member?')) return;
    await adminAPI.deleteStaff(id);
    load();
  };

  if (loading) return <DashboardLayout title="Staff Management"><Spinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Staff Management">
      <Alert message={msg.text} type={msg.type} onClose={() => setMsg({ text: '', type: '' })} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Button variant="cyan" onClick={() => setShowModal(true)}>+ Add Staff Member</Button>
      </div>

      <Card title={`Staff Directory (${staff.length})`}>
        <DataTable
          columns={[
            { key: 'staff_id', label: '#', muted: true },
            { key: 's_full_name', label: 'Full Name' },
            { key: 'role', label: 'Role', render: v => <Badge status={v} /> },
            { key: 'department', label: 'Department', muted: true },
            { key: 'email', label: 'Email', muted: true },
            { key: 'username', label: 'Username', muted: true },
          ]}
          data={staff}
          emptyMsg="No staff members yet"
          actions={(row) => (
            <Button size="sm" variant="danger" onClick={() => handleDelete(row.staff_id)}>Remove</Button>
          )}
        />
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Staff Member">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Full Name', key: 'full_name', type: 'text' },
            { label: 'Department', key: 'department', type: 'text' },
            { label: 'Username', key: 'username', type: 'text' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'Password', key: 'password', type: 'password' },
          ].map(f => (
            <Input key={f.key} label={f.label} type={f.type} value={form[f.key]} required
              onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
          ))}
          <Input label="Role" type="select" value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            options={['radiologist','technician','receptionist','admin'].map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button type="submit" variant="cyan" style={{ flex: 1, justifyContent: 'center' }}>Add Staff Member</Button>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

/* ─── Admin Patients ─────────────────────────────────────────── */
export function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminAPI.patients().then(r => setPatients(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    (p.p_full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <DashboardLayout title="Patients"><Spinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Patient Directory">
      <div style={{ marginBottom: 20 }}>
        <input
          type="text" placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: 320, padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', outline: 'none' }}
        />
      </div>
      <Card title={`All Patients (${filtered.length})`}>
        <DataTable
          columns={[
            { key: 'patient_id', label: '#', muted: true },
            { key: 'p_full_name', label: 'Full Name' },
            { key: 'dob', label: 'Date of Birth', muted: true },
            { key: 'gender', label: 'Gender', render: v => v === 'M' ? 'Male' : v === 'F' ? 'Female' : '—' },
            { key: 'phone', label: 'Phone', muted: true },
            { key: 'blood_type', label: 'Blood', render: v => v ? <span style={{ color: '#ff6b6b', fontWeight: 600 }}>{v}</span> : '—' },
            { key: 'email', label: 'Email', muted: true },
          ]}
          data={filtered}
          emptyMsg="No patients found"
        />
      </Card>
    </DashboardLayout>
  );
}

/* ─── Admin Billing ─────────────────────────────────────────── */
export function AdminBilling() {
  const [data, setData] = useState({ invoices: [], paid: 0, unpaid: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.billing().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Billing"><Spinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Billing Overview">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
        <StatCard value={`${(data.paid || 0).toLocaleString()} EGP`} label="Revenue Collected" color="#00e676" />
        <StatCard value={`${(data.unpaid || 0).toLocaleString()} EGP`} label="Outstanding Balance" color="#ff4444" delay={1} />
        <StatCard value={data.invoices?.length || 0} label="Total Invoices" delay={2} />
      </div>
      <Card title="All Invoices">
        <DataTable
          columns={[
            { key: 'invoice_id', label: 'Invoice #', render: v => `INV-${v}`, muted: true },
            { key: 'p_full_name', label: 'Patient' },
            { key: 'modality', label: 'Service' },
            { key: 'scheduled_datetime', label: 'Date', render: v => v ? new Date(v).toLocaleDateString('en-GB') : '—', muted: true },
            { key: 'total_amount', label: 'Amount', render: v => `${(v || 0).toLocaleString()} EGP` },
            { key: 'due_date', label: 'Due Date', muted: true },
            { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
          ]}
          data={data.invoices || []}
          emptyMsg="No invoices"
        />
      </Card>
    </DashboardLayout>
  );
}

/* ─── Admin Reports ─────────────────────────────────────────── */
export function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.reports().then(r => setReports(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Radiology Reports"><Spinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Radiology Reports">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.4 }}>▤</div>
            <div>No radiology reports yet</div>
          </div>
        ) : reports.map((r) => (
          <div key={r.report_id} style={{
            background: 'linear-gradient(135deg, rgba(10,34,64,0.7), rgba(2,14,31,0.8))',
            border: '1px solid var(--border)', borderRadius: 16, padding: 28,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{r.modality} – {r.body_part || 'N/A'}</span>
                  <Badge status={r.signed ? 'completed' : 'pending'} />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Patient: <span style={{ color: 'var(--text-secondary)' }}>{r.patient_name}</span>
                  {' '} · Radiologist: <span style={{ color: 'var(--nova-cyan)' }}>{r.radiologist_name}</span>
                  {' '} · Date: {r.report_date}
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{r.report_id}</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 16, borderLeft: '2px solid var(--nova-cyan)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{r.findings_and_impression}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
