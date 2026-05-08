import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { StatCard, Card, DataTable, Badge, Button, Spinner, Alert, Modal } from '../../components/UI';
import { staffAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

/* ─── Staff Dashboard ─────────────────────────────────────────── */
export function StaffDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffAPI.dashboard().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Staff Dashboard"><Spinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Staff Dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
        <StatCard value={data?.appointments?.length || 0} label="Upcoming Appointments" icon="◷" />
        <StatCard value={data?.orders?.length || 0} label="Pending Orders" icon="◎" color="#ff4444" delay={1} />
        <StatCard value={(user?.role || '').toUpperCase()} label="Your Role" icon="◑" color="#00e676" delay={2} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card title="Upcoming Appointments" titleRight={
          <Link to="/staff/appointments" style={{ textDecoration: 'none' }}>
            <Button size="sm" variant="ghost">View All</Button>
          </Link>
        }>
          <DataTable
            columns={[
              { key: 'patient_name', label: 'Patient' },
              { key: 'scheduled_datetime', label: 'Date', render: v => v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—' },
              { key: 'modality', label: 'Modality' },
              { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
            ]}
            data={data?.appointments || []}
            emptyMsg="No upcoming appointments"
          />
        </Card>

        <Card title="Pending Imaging Orders" titleRight={
          <Link to="/staff/imaging-orders" style={{ textDecoration: 'none' }}>
            <Button size="sm" variant="ghost">View All</Button>
          </Link>
        }>
          <DataTable
            columns={[
              { key: 'patient_name', label: 'Patient' },
              { key: 'modality', label: 'Modality' },
              { key: 'body_part', label: 'Body Part', muted: true },
              { key: 'order_status', label: 'Status', render: v => <Badge status={v} /> },
            ]}
            data={data?.orders || []}
            emptyMsg="No pending orders"
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}

/* ─── Staff Appointments ─────────────────────────────────────────── */
export function StaffAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => staffAPI.appointments().then(r => setAppointments(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await staffAPI.updateAppointment(id, { status });
    load();
  };

  if (loading) return <DashboardLayout title="Appointments"><Spinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Appointment Management">
      <Card title={`All Appointments (${appointments.length})`}>
        <DataTable
          columns={[
            { key: 'appointment_id', label: '#', muted: true },
            { key: 'patient_name', label: 'Patient' },
            { key: 'patient_phone', label: 'Phone', muted: true },
            { key: 'scheduled_datetime', label: 'Date & Time', render: v => v ? new Date(v).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
            { key: 'modality', label: 'Modality' },
            { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
          ]}
          data={appointments}
          emptyMsg="No appointments"
          actions={(row) => (
            <select
              value={row.status}
              onChange={e => updateStatus(row.appointment_id, e.target.value)}
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 8, padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              {['scheduled', 'completed', 'cancelled', 'waiting'].map(s => (
                <option key={s} value={s} style={{ background: '#061628' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          )}
        />
      </Card>
    </DashboardLayout>
  );
}

/* ─── Imaging Orders ─────────────────────────────────────────── */
export function ImagingOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileInputRef = React.useRef(null);
  const [pendingOrderId, setPendingOrderId] = useState(null);

  const load = () => staffAPI.imagingOrders().then(r => setOrders(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const updateOrder = async (id, order_status) => {
    await staffAPI.updateOrder(id, { order_status });
    load();
  };

  const triggerUpload = (orderId) => {
    setPendingOrderId(orderId);
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !pendingOrderId) return;
    setUploadingId(pendingOrderId);
    setUploadMsg('');
    try {
      await staffAPI.uploadImage(pendingOrderId, file);
      setUploadMsg(`Image uploaded successfully for order #${pendingOrderId}`);
    } catch (err) {
      setUploadMsg(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploadingId(null);
      setPendingOrderId(null);
    }
  };

  if (loading) return <DashboardLayout title="Imaging Orders"><Spinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Imaging Order Management">
      <input
        type="file"
        ref={fileInputRef}
        accept=".dcm,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {uploadMsg && (
        <div style={{
          marginBottom: 16, padding: '10px 16px', borderRadius: 10,
          background: uploadMsg.includes('success') ? 'rgba(0,230,118,0.08)' : 'rgba(255,68,68,0.08)',
          border: `1px solid ${uploadMsg.includes('success') ? 'rgba(0,230,118,0.25)' : 'rgba(255,68,68,0.25)'}`,
          color: uploadMsg.includes('success') ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem',
        }}>
          {uploadMsg}
        </div>
      )}
      <Card title={`All Imaging Orders (${orders.length})`}>
        <DataTable
          columns={[
            { key: 'order_id', label: '#', muted: true },
            { key: 'patient_name', label: 'Patient' },
            { key: 'modality', label: 'Modality' },
            { key: 'body_part', label: 'Body Part', muted: true },
            { key: 'referring_doctor', label: 'Referring Dr.', muted: true },
            { key: 'scheduled_datetime', label: 'Date', render: v => v ? new Date(v).toLocaleDateString('en-GB') : '—', muted: true },
            { key: 'order_status', label: 'Status', render: v => <Badge status={v} /> },
            {
              key: 'report_id', label: 'Report',
              render: (v, row) => user?.role === 'radiologist'
                ? <Link to={`/staff/report/${row.order_id}`} style={{ textDecoration: 'none' }}>
                    <Button size="sm" variant={v ? 'ghost' : 'primary'}>{v ? (row.signed ? 'View' : 'Edit') : '+ Write'}</Button>
                  </Link>
                : v ? <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>✓ Done</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
            },
          ]}
          data={orders}
          emptyMsg="No imaging orders"
          actions={(row) => (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={row.order_status}
                onChange={e => updateOrder(row.order_id, e.target.value)}
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 8, padding: '6px 10px', fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}
              >
                {['pending', 'in_progress', 'completed'].map(s => (
                  <option key={s} value={s} style={{ background: '#061628' }}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
              <Button
                size="sm" variant="ghost"
                onClick={() => triggerUpload(row.order_id)}
                disabled={uploadingId === row.order_id}
              >
                {uploadingId === row.order_id ? '...' : '⬆ Image'}
              </Button>
            </div>
          )}
        />
      </Card>
    </DashboardLayout>
  );
}

/* ─── Radiology Report ─────────────────────────────────────────── */
export function RadiologyReport() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [findings, setFindings] = useState('');
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [images, setImages] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const fileInputRef = React.useRef(null);
  const [uploading, setUploading] = useState(false);

  const loadImages = () => staffAPI.getImages(orderId).then(r => setImages(r.data)).catch(() => {});

  useEffect(() => {
    staffAPI.getReport(orderId).then(r => {
      setData(r.data);
      if (r.data.report) {
        setFindings(r.data.report.findings_and_impression || '');
        setSigned(r.data.report.signed || false);
      }
    }).finally(() => setLoading(false));
    loadImages();
  }, [orderId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await staffAPI.uploadImage(orderId, file);
      await loadImages();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Upload failed.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await staffAPI.saveReport(orderId, { findings, signed });
      setMsg({ text: 'Report saved successfully!', type: 'success' });
      setTimeout(() => navigate('/staff/imaging-orders'), 1500);
    } catch {
      setMsg({ text: 'Failed to save report.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)',
    borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem',
    fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box', resize: 'vertical',
  };

  if (loading) return <DashboardLayout title="Radiology Report"><Spinner /></DashboardLayout>;

  const order = data?.order;

  return (
    <DashboardLayout title="Write Radiology Report">
      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <img src={lightbox} alt="scan" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, objectFit: 'contain' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 28, background: 'none', border: 'none', color: '#fff', fontSize: '1.8rem', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <input type="file" ref={fileInputRef} accept=".dcm,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleUpload} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Order Info + Images */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Order Details">
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['Patient', order?.patient_name],
                ['Modality', order?.modality],
                ['Body Part', order?.body_part],
                ['Referring Dr.', order?.referring_doctor],
                ['Date', order?.scheduled_datetime ? new Date(order.scheduled_datetime).toLocaleDateString('en-GB') : '—'],
                ['Order Status', order?.order_status],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {label === 'Order Status' ? <Badge status={val} /> : val || '—'}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Images panel */}
          <Card title={`Imaging Files (${images.length})`} titleRight={
            <Button size="sm" variant="ghost" onClick={() => { fileInputRef.current.value = ''; fileInputRef.current.click(); }} disabled={uploading}>
              {uploading ? '...' : '⬆ Upload'}
            </Button>
          }>
            <div style={{ padding: 16 }}>
              {images.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  No images uploaded yet.<br />Accepts DCM, JPG, PNG.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {images.map(img => (
                    <div
                      key={img.file_id}
                      onClick={() => setLightbox(img.url)}
                      style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1', background: '#000' }}
                    >
                      <img
                        src={img.url}
                        alt={img.original_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {data?.report && (
            <div style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Existing Report</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last updated: {data.report.report_date}</div>
              {data.report.signed && <Badge status="completed" />}
            </div>
          )}
        </div>

        {/* Report Form */}
        <Card title={data?.report ? 'Edit Report' : 'Write New Report'}>
          <div style={{ padding: 28 }}>
            <Alert message={msg.text} type={msg.type} onClose={() => setMsg({ text: '', type: '' })} />
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                  Findings & Clinical Impression *
                </label>
                <textarea
                  value={findings}
                  onChange={e => setFindings(e.target.value)}
                  required rows={14} style={fieldStyle}
                  placeholder="Describe radiological findings in detail...&#10;&#10;Include:&#10;• Anatomical region examined&#10;• Technique used&#10;• Findings (normal and abnormal)&#10;• Measurements&#10;• Clinical impression and recommendations"
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Provide a thorough clinical interpretation for accurate patient diagnosis.
                </div>
              </div>

              <div style={{ background: 'rgba(0,212,245,0.04)', border: '1px solid rgba(0,212,245,0.15)', borderRadius: 12, padding: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                  <div
                    onClick={() => setSigned(s => !s)}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: signed ? 'var(--nova-cyan)' : 'rgba(0,0,0,0.4)',
                      border: `1px solid ${signed ? 'var(--nova-cyan)' : 'var(--border)'}`,
                      position: 'relative', transition: 'all 0.3s', cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 2, left: signed ? 22 : 2, transition: 'left 0.3s',
                    }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Digital Sign-off</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Finalizes the report and makes it visible to the patient
                    </div>
                  </div>
                </label>
                {signed && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,179,0,0.08)', border: '1px solid rgba(255,179,0,0.2)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--warning)' }}>
                    ⚠ Signing this report will add it to the patient's medical record and make results visible.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <Button type="submit" variant={signed ? 'cyan' : 'primary'} disabled={saving} style={{ flex: 1, justifyContent: 'center', padding: '14px' }}>
                  {saving ? 'Saving...' : signed ? '✓ Sign & Save Report' : 'Save Draft'}
                </Button>
                <Button variant="ghost" onClick={() => navigate('/staff/imaging-orders')}>Cancel</Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
