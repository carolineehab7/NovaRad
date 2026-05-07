import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, Button, Alert, Spinner } from '../../components/UI';
import { patientAPI } from '../../api/client';

export default function PatientProfile() {
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    patientAPI.profile().then(r => {
      setPatient(r.data);
      setForm({ phone: r.data.phone || '', address: r.data.address || '', blood_type: r.data.blood_type || '', medical_history: r.data.medical_history || '' });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await patientAPI.updateProfile(form);
      setMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch {
      setMsg({ text: 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)',
    borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem',
    fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 };
  const infoBox = { padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 10, border: '1px solid var(--border)' };

  if (loading) return <DashboardLayout title="My Profile"><Spinner /></DashboardLayout>;

  return (
    <DashboardLayout title="My Profile">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Info */}
        <Card title="Account Info">
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 12px',
                background: 'linear-gradient(135deg, var(--nova-blue), var(--nova-cyan))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontFamily: 'var(--font-display)', color: '#fff',
                boxShadow: '0 0 30px rgba(0,212,245,0.3)',
              }}>
                {(patient?.p_full_name || 'P')[0]}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{patient?.p_full_name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--nova-cyan)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Patient</div>
            </div>
            {[
              ['Date of Birth', patient?.dob],
              ['Gender', patient?.gender === 'M' ? 'Male' : patient?.gender === 'F' ? 'Female' : '—'],
              ['SSN', patient?.ssn],
            ].map(([label, val]) => (
              <div key={label}>
                <label style={labelStyle}>{label}</label>
                <div style={infoBox}><span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{val || '—'}</span></div>
              </div>
            ))}
          </div>
        </Card>

        {/* Editable */}
        <Card title="Edit Profile">
          <div style={{ padding: 28 }}>
            <Alert message={msg.text} type={msg.type} onClose={() => setMsg({ text: '', type: '' })} />
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Blood Type</label>
                  <select value={form.blood_type} onChange={e => setForm({ ...form, blood_type: e.target.value })} style={{ ...fieldStyle, appearance: 'none' }}>
                    <option value="" style={{ background: '#061628' }}>Select...</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt} value={bt} style={{ background: '#061628' }}>{bt}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Address</label>
                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Medical History</label>
                <textarea value={form.medical_history} onChange={e => setForm({ ...form, medical_history: e.target.value })} rows={5} style={{ ...fieldStyle, resize: 'vertical' }} />
              </div>
              <div>
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
