/**
 * ReportViewPage — Public verification page opened when a QR code is scanned.
 * No authentication required. No sidebar. Completely isolated.
 * Route: /report-view?token=<uuid>
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer, Loader2, AlertCircle, ShieldCheck, School, CheckCircle2 } from 'lucide-react';
import { TEMPLATE_MAP } from './ReportTemplatesPage';
import ReportCardSalah from './ReportCardSalah';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api');

function toSerial(token) {
  if (!token || token === 'preview') return 'N/A';
  return token.toString().replace(/-/g, '').slice(0, 8).toUpperCase().replace(/(.{4})(.{4})/, '$1-$2');
}

export default function ReportViewPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('No report token provided.'); setLoading(false); return; }
    fetch(`${API}/school/generated-reports/by-token/?token=${encodeURIComponent(token)}`)
      .then(r => { if (!r.ok) throw new Error('Report not found or has been removed.'); return r.json(); })
      .then(d => { setReport(d); setLoading(false); })
      .catch(e => { setError(e.message || 'Failed to load report.'); setLoading(false); });
  }, [token]);

  if (loading) return (
    <div style={styles.fullCenter}>
      <Loader2 style={{ width: 36, height: 36, color: '#1e3a8a', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: 12, color: '#475569', fontSize: 14 }}>Loading report…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={styles.fullCenter}>
      <div style={styles.errorCard}>
        <AlertCircle style={{ width: 48, height: 48, color: '#ef4444', marginBottom: 12 }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>Report Not Found</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 6px' }}>{error}</p>
        <p style={{ fontSize: 11, color: '#94a3b8' }}>The QR code may be invalid or the report may have been removed.</p>
      </div>
    </div>
  );

  const templateId = report.template || 'salah';
  const PreviewComponent = TEMPLATE_MAP[templateId] || ReportCardSalah;
  const data = report.report_data;
  const serial = toSerial(report.secure_token || token);
  const generatedAt = report.generated_at
    ? new Date(report.generated_at).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Verification banner (hidden on print) ── */}
      <div className="no-print" style={styles.banner}>
        <div style={styles.bannerInner}>
          {/* Left: verified badge */}
          <div style={styles.verifiedBadge}>
            <ShieldCheck style={{ width: 28, height: 28, color: '#fff' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>VERIFIED REPORT</div>
              <div style={{ fontSize: 10, color: '#bbf7d0', letterSpacing: '0.5px' }}>Authentic document</div>
            </div>
          </div>

          {/* Centre: student + school info */}
          <div style={styles.bannerMeta}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <School style={{ width: 14, height: 14, color: '#93c5fd' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {data?.school?.name || 'School Report Card'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#bfdbfe' }}>
              {data?.student?.full_name} &nbsp;·&nbsp; {data?.student?.class_or_grade} &nbsp;·&nbsp;
              {data?.metadata?.term} {data?.metadata?.academic_year}
            </div>
          </div>

          {/* Right: serial + generated date */}
          <div style={styles.serialBox}>
            <div style={{ fontSize: 9, color: '#93c5fd', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>
              Serial No.
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fbbf24', letterSpacing: '2px', fontFamily: 'monospace' }}>
              {serial}
            </div>
            <div style={{ fontSize: 9, color: '#93c5fd', marginTop: 2 }}>
              Generated: {generatedAt}
            </div>
          </div>
        </div>

        {/* Verified tick strip */}
        <div style={styles.tickStrip}>
          <CheckCircle2 style={{ width: 13, height: 13, color: '#4ade80' }} />
          <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 600 }}>
            This report card has been verified against school records. Serial: {serial}
          </span>
        </div>
      </div>

      {/* ── Print toolbar ── */}
      <div className="no-print" style={styles.toolbar}>
        <div style={styles.toolbarInner}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Viewing official report card &mdash; <strong style={{ color: '#1e3a8a' }}>{data?.student?.full_name}</strong>
          </span>
          <button onClick={() => window.print()} style={styles.printBtn}>
            <Printer style={{ width: 15, height: 15 }} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── Report card ── */}
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '16px 12px 40px' }}>
        <PreviewComponent data={data} />
      </main>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  fullCenter: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: '#f1f5f9',
  },
  errorCard: {
    background: '#fff', borderRadius: 16, padding: '36px 32px',
    maxWidth: 360, width: '100%', textAlign: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,.08)',
  },
  banner: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #1e40af 100%)',
    borderBottom: '3px solid #d4af37',
  },
  bannerInner: {
    maxWidth: 780, margin: '0 auto', padding: '12px 16px',
    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
  },
  verifiedBadge: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,0.12)', borderRadius: 8,
    padding: '6px 12px', flexShrink: 0,
  },
  bannerMeta: { flex: 1, minWidth: 180 },
  serialBox: {
    textAlign: 'right', flexShrink: 0,
    background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '6px 14px',
  },
  tickStrip: {
    background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 6, padding: '4px 16px',
  },
  toolbar: {
    background: '#fff', borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
  },
  toolbarInner: {
    maxWidth: 780, margin: '0 auto', padding: '8px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  printBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 16px', background: '#1e3a8a', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer',
  },
};
