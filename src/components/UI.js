import React, { useState } from 'react';

/* ─── StatCard ─────────────────────────────────────────────── */
export function StatCard({ value, label, icon, color = 'var(--nova-cyan)', delay = 0 }) {
  return (
    <div className={`fade-up fade-up-${delay + 1}`} style={{
      background: 'linear-gradient(135deg, rgba(10,34,64,0.8), rgba(2,14,31,0.9))',
      border: `1px solid ${color}22`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--radius-lg)',
      padding: '24px 28px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: `0 4px 30px ${color}10`,
    }}>
      <div style={{ position: 'absolute', top: 16, right: 20, fontSize: '1.8rem', opacity: 0.15 }}>{icon}</div>
      <div style={{ fontSize: '2.2rem', fontWeight: 800, color, lineHeight: 1, fontFamily: 'var(--font-body)' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* ─── DataTable ─────────────────────────────────────────────── */
export function DataTable({ columns, data, emptyMsg = 'No data found', actions }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map(c => (
              <th key={c.key} style={{
                padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)',
                fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                whiteSpace: 'nowrap',
              }}>{c.label}</th>
            ))}
            {actions && <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{emptyMsg}</td></tr>
          ) : data.map((row, i) => (
            <tr key={i} style={{
              borderBottom: '1px solid rgba(0,212,245,0.05)',
              transition: 'var(--transition)',
              cursor: 'default',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,245,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map(c => (
                <td key={c.key} style={{ padding: '14px 16px', color: c.muted ? 'var(--text-muted)' : 'var(--text-primary)', whiteSpace: c.wrap ? 'normal' : 'nowrap' }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key] ?? '—'}
                </td>
              ))}
              {actions && <td style={{ padding: '14px 16px' }}>{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Card ─────────────────────────────────────────────────── */
export function Card({ children, title, titleRight, style = {} }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(10,34,64,0.7), rgba(2,14,31,0.8))',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      ...style,
    }}>
      {title && (
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', letterSpacing: '0.02em' }}>{title}</span>
          {titleRight}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Badge ─────────────────────────────────────────────────── */
export function Badge({ status }) {
  return <span className={`badge badge-${status?.replace(' ', '_')}`}>{status?.replace('_', ' ')}</span>;
}

/* ─── Button ─────────────────────────────────────────────────── */
export function Button({ children, onClick, variant = 'primary', size = 'md', type = 'button', disabled = false, style = {} }) {
  const base = {
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 10, fontFamily: 'var(--font-body)', fontWeight: 600,
    transition: 'var(--transition)', display: 'inline-flex', alignItems: 'center',
    gap: 6, opacity: disabled ? 0.5 : 1,
    padding: size === 'sm' ? '6px 14px' : size === 'lg' ? '14px 28px' : '10px 20px',
    fontSize: size === 'sm' ? '0.78rem' : size === 'lg' ? '1rem' : '0.875rem',
  };
  const variants = {
    primary: { background: 'linear-gradient(135deg, var(--nova-blue), var(--nova-mid))', color: '#fff', boxShadow: '0 4px 15px rgba(13,79,168,0.4)' },
    cyan: { background: 'linear-gradient(135deg, var(--nova-cyan), var(--nova-teal))', color: '#020b18', boxShadow: '0 4px 15px rgba(0,212,245,0.35)' },
    ghost: { background: 'rgba(0,212,245,0.08)', color: 'var(--nova-cyan)', border: '1px solid rgba(0,212,245,0.2)' },
    danger: { background: 'rgba(255,68,68,0.15)', color: 'var(--danger)', border: '1px solid rgba(255,68,68,0.3)' },
    success: { background: 'rgba(0,230,118,0.15)', color: 'var(--success)', border: '1px solid rgba(0,230,118,0.3)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

/* ─── Input ─────────────────────────────────────────────────── */
export function Input({ label, name, type = 'text', value, onChange, required, placeholder, options, rows, style = {} }) {
  const fieldStyle = {
    width: '100%', padding: '11px 14px',
    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
    borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem',
    fontFamily: 'var(--font-body)', outline: 'none', transition: 'var(--transition)',
    ...style,
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}{required && ' *'}</label>}
      {type === 'select' ? (
        <select name={name} value={value} onChange={onChange} required={required} style={{ ...fieldStyle, appearance: 'none' }}>
          {options?.map(o => <option key={o.value} value={o.value} style={{ background: '#061628' }}>{o.label}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} rows={rows || 4} style={{ ...fieldStyle, resize: 'vertical' }} />
      ) : (
        <input name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} style={fieldStyle} />
      )}
    </div>
  );
}

/* ─── Modal ─────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, #061628, #020e1f)',
        border: '1px solid var(--border)', borderRadius: 20,
        padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.3rem' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Spinner ─────────────────────────────────────────────────── */
export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{
        width: 40, height: 40, border: '3px solid var(--border)',
        borderTop: '3px solid var(--nova-cyan)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Alert ─────────────────────────────────────────────────── */
export function Alert({ message, type = 'error', onClose }) {
  if (!message) return null;
  const colors = {
    error: { bg: 'rgba(255,68,68,0.1)', border: 'rgba(255,68,68,0.3)', color: '#ff6b6b' },
    success: { bg: 'rgba(0,230,118,0.1)', border: 'rgba(0,230,118,0.3)', color: '#00e676' },
    info: { bg: 'rgba(0,212,245,0.1)', border: 'rgba(0,212,245,0.3)', color: 'var(--nova-cyan)' },
  };
  const c = colors[type] || colors.error;
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      borderRadius: 10, padding: '12px 16px', marginBottom: 20,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: '0.875rem',
    }}>
      <span>{message}</span>
      {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>}
    </div>
  );
}

/* ─── Chatbot ─────────────────────────────────────────────────── */
export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: 'assistant', content: 'Hi! I\'m Nova, your NovaRad AI assistant. I can help you book appointments, check prices, understand billing, or navigate the portal. How can I help?' }]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, thinking]);

  const send = async () => {
    if (!input.trim() || thinking) return;
    const userMsg = input.trim();
    setInput('');
    const next = [...msgs, { role: 'user', content: userMsg }];
    setMsgs(next);
    setThinking(true);
    try {
      const history = next.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history }),
      });
      const data = await res.json();
      setMsgs(m => [...m, { role: 'assistant', content: data.reply }]);
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: 'Sorry, I could not connect right now. Call 01117151930 for help.' }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 999 }}>
      {open && (
        <div style={{
          width: 340, marginBottom: 12,
          background: 'linear-gradient(135deg, #061628, #020e1f)',
          border: '1px solid var(--border)', borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          <div style={{ background: 'linear-gradient(135deg, var(--nova-blue), var(--nova-mid))', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e676', boxShadow: '0 0 6px #00e676' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>✦ Nova — AI Assistant</div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>NovaRad Smart Assistant</div>
            </div>
          </div>
          <div style={{ height: 280, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  padding: '9px 13px', borderRadius: 14, maxWidth: '82%', fontSize: '0.82rem', lineHeight: 1.5,
                  background: m.role === 'user' ? 'var(--nova-blue)' : 'rgba(0,212,245,0.08)',
                  color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                  border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                }}>{m.content}</div>
              </div>
            ))}
            {thinking && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '9px 14px', borderRadius: 14, background: 'rgba(0,212,245,0.08)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ animation: 'pulse 1s infinite' }}>●</span>
                  <span style={{ animation: 'pulse 1s infinite 0.2s' }}>●</span>
                  <span style={{ animation: 'pulse 1s infinite 0.4s' }}>●</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about booking, prices, results..."
              disabled={thinking}
              style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 10, padding: '8px 12px', fontSize: '0.82rem', outline: 'none', opacity: thinking ? 0.6 : 1 }}
            />
            <Button onClick={send} size="sm" variant="cyan" disabled={thinking}>↑</Button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setOpen(o => !o)} style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--nova-blue), var(--nova-cyan))',
          border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: '#fff',
          boxShadow: '0 0 25px rgba(0,212,245,0.4)', transition: 'var(--transition)',
        }}>
          {open ? '✕' : '✦'}
        </button>
      </div>
    </div>
  );
}

/* ─── Navbar for public pages ─────────────────────────────────── */
export function PublicNav() {
  const { user } = require('../context/AuthContext').useAuth?.() || {};
  return null; // Handled inline in pages
}
