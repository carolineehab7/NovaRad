import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'MRI', path: '/mri' },
  { label: 'CT Scan', path: '/ct' },
  { label: 'X-Ray', path: '/x-ray' },
  { label: 'Ultrasound', path: '/ultrasound' },
  { label: 'Our Team', path: '/founders' },
];

const SERVICES = [
  { title: 'MRI Imaging', icon: '◎', desc: 'High-resolution magnetic resonance imaging for soft tissue diagnosis.', path: '/mri', color: '#00d4f5' },
  { title: 'CT Scan', icon: '◈', desc: 'Advanced computed tomography for rapid, detailed cross-sectional views.', path: '/ct', color: '#a78bfa' },
  { title: 'Digital X-Ray', icon: '◷', desc: 'Instant digital radiography with superior clarity and low dosage.', path: '/x-ray', color: '#34d399' },
  { title: 'Ultrasound', icon: '⬡', desc: 'Real-time ultrasonic imaging — safe, non-invasive, precise.', path: '/ultrasound', color: '#fbbf24' },
];

const STATS = [
  { value: '15,000+', label: 'Patients Served' },
  { value: '98%', label: 'Diagnostic Accuracy' },
  { value: '24 hrs', label: 'Report Turnaround' },
  { value: '4', label: 'Imaging Modalities' },
];

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'patient') return '/patient/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/staff/dashboard';
  };

  const styles = {
    root: { background: 'var(--nova-deep)', minHeight: '100vh', color: 'var(--text-primary)', overflowX: 'hidden' },
    nav: {
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(2,11,24,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : 'none',
      transition: 'all 0.4s ease',
    },
    logo: { fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--nova-cyan)', textDecoration: 'none', letterSpacing: '-0.02em' },
    navLinks: { display: 'flex', alignItems: 'center', gap: 32 },
    navLink: { color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.2s', letterSpacing: '0.02em' },
    hero: {
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      padding: '120px 40px 80px',
      background: `
        radial-gradient(ellipse 70% 50% at 60% 50%, rgba(13,79,168,0.25) 0%, transparent 70%),
        radial-gradient(ellipse 40% 60% at 80% 30%, rgba(0,212,245,0.12) 0%, transparent 60%),
        var(--nova-deep)
      `,
      position: 'relative',
    },
    heroContent: { maxWidth: 680, position: 'relative', zIndex: 2 },
    chip: {
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: 'rgba(0,212,245,0.08)', border: '1px solid rgba(0,212,245,0.2)',
      borderRadius: 40, padding: '6px 16px', marginBottom: 28,
      fontSize: '0.78rem', color: 'var(--nova-cyan)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
    },
    h1: {
      fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontFamily: 'var(--font-display)',
      fontWeight: 400, lineHeight: 1.1, marginBottom: 24, color: 'var(--text-primary)',
    },
    accent: { color: 'var(--nova-cyan)', fontStyle: 'italic' },
    heroSub: { fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40, maxWidth: 520 },
    ctaGroup: { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' },
    btnPrimary: {
      padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
      background: 'linear-gradient(135deg, var(--nova-blue), var(--nova-cyan))',
      color: '#fff', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-body)',
      boxShadow: '0 8px 30px rgba(0,212,245,0.3)', transition: 'all 0.3s', letterSpacing: '0.02em',
    },
    btnGhost: {
      padding: '14px 32px', borderRadius: 12, cursor: 'pointer',
      background: 'transparent', color: 'var(--text-primary)',
      border: '1px solid rgba(255,255,255,0.15)', fontWeight: 600, fontSize: '0.95rem',
      fontFamily: 'var(--font-body)', transition: 'all 0.3s',
    },
    heroVisual: {
      position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    },
    grid: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 24, padding: '80px 40px',
      background: 'rgba(0,0,0,0.3)',
    },
    serviceCard: {
      background: 'linear-gradient(135deg, rgba(10,34,64,0.7), rgba(2,14,31,0.9))',
      border: '1px solid var(--border)', borderRadius: 20, padding: 32,
      textDecoration: 'none', display: 'block', transition: 'all 0.3s',
      cursor: 'pointer',
    },
    statsRow: {
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      padding: '60px 40px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
      background: 'rgba(0,212,245,0.02)',
    },
    footer: {
      padding: '40px', borderTop: '1px solid var(--border)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      background: 'rgba(0,0,0,0.3)',
    },
  };

  return (
    <div style={styles.root}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <Link to="/" style={styles.logo}>NovaRad</Link>
        <div style={styles.navLinks}>
          {NAV_LINKS.map(l => (
            <Link key={l.path} to={l.path} style={styles.navLink}
              onMouseEnter={e => e.target.style.color = 'var(--nova-cyan)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
            >{l.label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {user ? (
            <button onClick={() => navigate(getDashboardPath())} style={{ ...styles.btnPrimary, padding: '10px 22px', fontSize: '0.85rem' }}>
              Dashboard →
            </button>
          ) : (
            <>
              <Link to="/login" style={{ ...styles.btnGhost, padding: '10px 22px', fontSize: '0.85rem', textDecoration: 'none' }}>Sign In</Link>
              <Link to="/register" style={{ ...styles.btnPrimary, padding: '10px 22px', fontSize: '0.85rem', textDecoration: 'none' }}>Register</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div className="fade-up" style={styles.chip}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--nova-cyan)', display: 'inline-block' }} />
            Advanced Radiology Since 2010
          </div>
          <h1 className="fade-up fade-up-1" style={styles.h1}>
            Precision Imaging.<br />
            <span style={styles.accent}>Faster Answers.</span>
          </h1>
          <p className="fade-up fade-up-2" style={styles.heroSub}>
            NovaRad Center delivers cutting-edge diagnostic imaging — MRI, CT, X-Ray, and Ultrasound — 
            through a fully integrated healthcare information system trusted by thousands of patients.
          </p>
          <div className="fade-up fade-up-3" style={styles.ctaGroup}>
            {user ? (
              <button style={styles.btnPrimary} onClick={() => navigate(getDashboardPath())}>
                Go to Dashboard →
              </button>
            ) : (
              <>
                <button style={styles.btnPrimary} onClick={() => navigate('/register')}>
                  Book an Appointment →
                </button>
                <button style={styles.btnGhost} onClick={() => navigate('/login')}>
                  Patient Login
                </button>
              </>
            )}
          </div>
          <div className="fade-up fade-up-4" style={{ marginTop: 48, display: 'flex', gap: 32 }}>
            {['MRI', 'CT', 'X-Ray', 'Ultrasound'].map(m => (
              <div key={m} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m}</div>
                <div style={{ width: 40, height: 2, background: 'linear-gradient(90deg, var(--nova-cyan), transparent)', marginTop: 4, borderRadius: 1 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Decorative visual */}
        <div style={styles.heroVisual}>
          <div style={{ position: 'relative', width: 400, height: 400 }}>
            {[280, 340, 400].map((s, i) => (
              <div key={i} style={{
                position: 'absolute', inset: `${(400 - s) / 2}px`,
                border: `1px solid rgba(0,212,245,${0.3 - i * 0.08})`,
                borderRadius: '50%',
                animation: `spin ${20 + i * 8}s linear infinite ${i % 2 ? 'reverse' : ''}`,
              }} />
            ))}
            <div style={{
              position: 'absolute', inset: '25%',
              background: 'radial-gradient(circle, rgba(0,212,245,0.15), transparent)',
              borderRadius: '50%',
              animation: 'pulse-glow 3s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: '5rem', color: 'rgba(0,212,245,0.2)',
            }}>✦</div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </section>

      {/* Stats */}
      <div style={styles.statsRow}>
        {STATS.map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--nova-cyan)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Services */}
      <section>
        <div style={{ textAlign: 'center', padding: '64px 40px 0' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--nova-cyan)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Our Services</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--text-primary)' }}>Diagnostic Imaging</h2>
        </div>
        <div style={styles.grid}>
          {SERVICES.map(s => (
            <Link key={s.path} to={s.path} style={styles.serviceCard}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + '44'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 40px ${s.color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 16, color: s.color }}>{s.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: 10 }}>{s.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 20 }}>{s.desc}</p>
              <span style={{ fontSize: '0.8rem', color: s.color, fontWeight: 600 }}>Learn more →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{
        margin: '0 40px 80px', borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(13,79,168,0.4), rgba(0,212,245,0.15))',
        border: '1px solid rgba(0,212,245,0.2)',
        padding: '60px 48px', textAlign: 'center',
        boxShadow: 'inset 0 0 60px rgba(0,212,245,0.05)',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', marginBottom: 16 }}>Ready to get started?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
          Register as a patient and book your first appointment in minutes. Fast results, expert radiologists.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={styles.btnPrimary} onClick={() => navigate('/register')}>Create Account →</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <span>📞</span> 01117151930
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={{ fontFamily: 'var(--font-display)', color: 'var(--nova-cyan)', fontSize: '1.2rem' }}>NovaRad Center</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>© 2026 NovaRad. Advanced Radiology Healthcare.</div>
        <div style={{ display: 'flex', gap: 20 }}>
          {NAV_LINKS.map(l => <Link key={l.path} to={l.path} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem' }}>{l.label}</Link>)}
        </div>
      </footer>
    </div>
  );
}
