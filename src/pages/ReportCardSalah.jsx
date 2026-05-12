/**
 * ReportCardSalah — Navy Blue & Gold modern template (REDESIGNED)
 * Modern, centered layout with school header, logo, and term/year on title line
 */
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { buildStampWithDate } from '../utils/stampProcessor';
import { loadReceiptSettings } from '../services/receiptSettingsService';

/* ── inline styles scoped via className prefix "src-" ── */
const css = `
.src-page { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; }
.src-card { width:100%; background:#fff; position:relative; border:4px solid #1e3a8a; border-radius:8px; overflow:visible; }
.src-corner { position:absolute; width:26px; height:26px; z-index:10; pointer-events:none; }
.src-tl { top:7px; left:7px; border-top:3px solid #d4af37; border-left:3px solid #d4af37; border-radius:4px 0 0 0; }
.src-tr { top:7px; right:7px; border-top:3px solid #d4af37; border-right:3px solid #d4af37; border-radius:0 4px 0 0; }
.src-bl { bottom:7px; left:7px; border-bottom:3px solid #d4af37; border-left:3px solid #d4af37; border-radius:0 0 0 4px; }
.src-br { bottom:7px; right:7px; border-bottom:3px solid #d4af37; border-right:3px solid #d4af37; border-radius:0 0 4px 0; }
.src-wm { position:absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; pointer-events:none; z-index:1; }
.src-wm img { width:55%; opacity:0.07; object-fit:contain; }
.src-inner { position:relative; z-index:2; padding:5mm 8mm; display:flex; flex-direction:column; min-height:277mm; }
.src-body { flex:1; }
.src-footer-push { margin-top:auto; }

/* REDESIGNED header - centered layout */
.src-hdr { background:#fff; border-radius:6px; margin-bottom:5px; box-shadow:0 1px 4px rgba(0,0,0,.07); }
.src-hdr-bar { height:5px; background:linear-gradient(90deg,#1e3a8a 0%,#2563eb 50%,#d4af37 100%); }
.src-hdr-wrapper { display:flex; flex-direction:column; align-items:center; padding:5px 16px 6px; gap:2px; }
.src-school-header { text-align:center; }
.src-school-name { font-size:15px; font-weight:800; color:#1e3a8a; letter-spacing:1px; margin:0; text-transform:uppercase; }
.src-school-motto { font-size:9px; color:#1e3a8a; font-style:italic; font-weight:600; margin:2px 0 1px 0; }
.src-school-location { font-size:8px; color:#475569; margin:0; display:flex; align-items:center; justify-content:center; gap:4px; }
.src-meta-item { display:flex; align-items:center; gap:3px; }
.src-divider { color:#cbd5e1; font-weight:bold; }
.src-logo-wrapper { display:flex; align-items:center; justify-content:center; margin:1px 0; }
.src-logo { max-width:52px; max-height:52px; width:auto; height:auto; object-fit:contain; background:transparent; display:block; }
.src-logo-ph { width:44px; height:44px; border:2px dashed #1e3a8a; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:8px; font-weight:600; color:#1e3a8a; text-align:center; }
.src-badge-row { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; }
.src-badge { text-align:center; flex:1; padding:5px 10px; background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%); border-radius:5px; min-width:160px; }
.src-badge-title { font-size:16px; font-weight:800; color:#fff; letter-spacing:1px; margin:0; line-height:1.1; }
.src-badge-sub { display:block; font-size:7px; color:#93c5fd; letter-spacing:1px; margin-top:1px; }
.src-term-year { display:flex; align-items:center; justify-content:center; gap:6px; }
.src-term-badge, .src-year-badge { padding:4px 10px; background:#f0f4f8; border:2px solid #1e3a8a; border-radius:5px; font-size:8px; font-weight:700; color:#1e3a8a; }
.src-term-badge span, .src-year-badge span { display:block; font-size:6.5px; color:#64748b; font-weight:500; margin-top:1px; }

/* bio */
.src-bio { display:flex; gap:8px; margin-bottom:5px; }
.src-photo { width:72px; height:90px; border:2px solid #1e3a8a; border-radius:5px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#f8fafc; flex-shrink:0; }
.src-photo img { width:100%; height:100%; object-fit:cover; }
.src-photo-ph { font-size:8px; color:#1e3a8a; font-weight:600; text-align:center; }
.src-bio-table { flex:1; border-collapse:collapse; font-size:8px; border:2px solid #1e3a8a; border-radius:6px; overflow:hidden; }
.src-bio-table th,.src-bio-table td { border:1px solid #e2e8f0; padding:4px 7px; text-align:left; }
.src-bio-table th { background:#f0f4ff; color:#1e3a8a; font-weight:700; white-space:nowrap; width:75px; font-size:7.5px; letter-spacing:0.5px; text-transform:uppercase; border-right:2px solid #1e3a8a; }
.src-bio-table td { background:#fff; color:#1e293b; font-weight:500; }
.src-bio-table tr:nth-child(even) td { background:#f8fafc; }

/* section title */
.src-section-title { text-align:center; margin:4px 0 3px; font-size:10px; font-weight:700; letter-spacing:1.5px; color:#1e3a8a; text-transform:uppercase; padding-bottom:3px; border-bottom:2px solid #d4af37; }

/* perf table */
.src-perf-table { width:100%; border-collapse:collapse; font-size:8px; border:2px solid #1e3a8a; border-radius:6px; overflow:hidden; margin-bottom:4px; }
.src-perf-table th,.src-perf-table td { border:1px solid #cbd5e1; padding:3px 3px; text-align:center; }
.src-perf-table th { background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%); color:#fff; font-weight:600; }
.src-perf-table tbody tr:nth-child(even) { background:#f8fafc; }

/* summary */
.src-summary { display:grid; grid-template-columns:repeat(4,1fr); gap:3px; margin:3px 0; font-size:9px; }
.src-summary div { border:2px solid #1e3a8a; padding:4px; text-align:center; background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%); border-radius:5px; font-weight:500; color:#1e293b; }
.src-summary strong { color:#1e3a8a; font-weight:700; }

/* grade scale */
.src-grade-scale { width:100%; border-collapse:collapse; font-size:8px; margin:3px 0; }
.src-grade-scale th { background:linear-gradient(135deg,#d4af37 0%,#f59e0b 100%); color:#1e293b; font-weight:700; border:1px solid #cbd5e1; padding:3px; }
.src-grade-scale td { border:1px solid #cbd5e1; padding:3px; text-align:center; font-weight:600; }

/* overall */
.src-overall { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; margin:6px 0; font-size:10px; }
.src-overall div { border:2px solid #d4af37; padding:6px; text-align:center; font-weight:500; background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%); border-radius:6px; color:#1e293b; }
.src-overall strong { color:#92400e; font-weight:700; }

/* key terms */
.src-key { border:1px solid #cbd5e1; border-radius:5px; padding:3px 8px; font-size:8px; margin-top:3px; background:#f8fafc; }
.src-key p { margin-bottom:1px; line-height:1.4; }
.src-key strong { color:#1e3a8a; font-weight:600; }

/* comments */
.src-comments { margin-top:3px; }
.src-comments strong { font-size:9px; color:#1e3a8a; font-weight:600; }
.src-comments p { border:1px solid #cbd5e1; border-radius:5px; min-height:22px; padding:3px 6px; font-size:8px; margin:2px 0 4px; background:#fff; line-height:1.4; }

/* footer */
.src-footer { margin-top:4px; }
.src-admin-footer { display:grid; grid-template-columns:repeat(4,1fr); gap:3px; margin-bottom:4px; font-size:8px; }
.src-admin-footer span { border:1px solid #1e3a8a; padding:3px; text-align:center; background:#f0f9ff; border-radius:3px; font-weight:500; }
.src-admin-footer strong { color:#1e3a8a; font-weight:700; }
.src-sigs { display:grid; grid-template-columns:1fr auto 1fr auto; gap:8px; padding:6px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:5px; margin-bottom:4px; }
.src-qr { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; }
.src-qr-label { font-size:6.5px; color:#64748b; text-align:center; margin-top:1px; letter-spacing:0.3px; }
.src-qr-serial { font-size:6px; color:#1e3a8a; font-weight:700; letter-spacing:0.8px; text-align:center; font-family:monospace; margin-top:1px; }
.src-sig-card { display:flex; flex-direction:column; align-items:center; gap:2px; }
.src-sig-role { font-size:8px; font-weight:700; color:#1e3a8a; letter-spacing:1px; text-transform:uppercase; }
.src-sig-name { font-size:8px; color:#475569; margin-bottom:0; }
.src-sig-line {
  position:relative;
  width:100px;
  height:32px;
  border-bottom:1.5px solid #1e3a8a;
  display:flex;
  align-items:flex-end;
  justify-content:center;
  overflow:visible;
}
.src-sig-img {
  position:absolute;
  bottom:0;
  left:50%;
  transform:translateX(-50%);
  width:100px;
  height:auto;
  max-height:36px;
  object-fit:contain;
  object-position:bottom center;
  display:block;
  image-rendering:-webkit-optimize-contrast;
  image-rendering:crisp-edges;
  image-rendering:pixelated;
}
.src-sig-label { font-size:7px; color:#64748b; padding-top:2px; width:100px; text-align:center; }
.src-stamp-card { display:flex; flex-direction:column; align-items:center; gap:2px; }
.src-stamp-ph { width:60px; height:60px; border:1.5px dashed #d4af37; border-radius:50%; display:flex; align-items:center; justify-content:center; text-align:center; font-size:8px; color:#d4af37; font-weight:600; background:#fff; }
.src-stamp-img { width:60px; height:60px; object-fit:contain; }
.src-footer-bar { background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%); color:#fff; font-size:8px; font-style:italic; padding:4px 10px; text-align:center; border-radius:3px; }
@media print {
  .src-page { margin:0; padding:0; }
  .src-card { border-radius:0; page-break-inside:avoid; break-inside:avoid; }
  @page { size:A4 portrait; margin:6mm; }
}
`;

function computeResult(subjects) {
  if (!subjects?.length) return 'Result 3';
  const grades = subjects.map(s => (s.grade || '').toUpperCase());
  if (grades.every(g => g === 'E')) return 'Result 3';
  if (grades.some(g => g === 'E')) return 'Result 2';
  return 'Result 1';
}

function mapSubjects(subjects) {
  return subjects.map((s, i) => ({
    code: String(i + 1).padStart(2, '0'),
    name: s.subject_name,
    scores: s.ca_score != null ? [s.ca_score, s.exam_score ?? 0] : [s.score ?? 0],
    grade: s.grade || '—',
    achievement: s.remark || '—',
    teacher: s.competency || '—',
  }));
}

export default function ReportCardSalah({ data }) {
  const [stamp, setStamp] = useState('');

  // Load stamp from receipt settings and composite with date
  useEffect(() => {
    const loadStamp = async () => {
      try {
        const settings = await loadReceiptSettings();
        if (settings.stamp_raw) {
          const opts = {
            offsetX: Number(settings.stamp_offset_x || 0),
            offsetY: Number(settings.stamp_offset_y || 0),
            rotate: Number(settings.stamp_rotate || 0),
            circular: settings.stamp_circular === true || settings.stamp_circular === 'true',
          };
          const stampWithDate = await buildStampWithDate(settings.stamp_raw, opts);
          setStamp(stampWithDate);
        }
      } catch {
        const cached = localStorage.getItem('schoolStamp');
        if (cached) setStamp(cached);
      }
    };
    loadStamp();
  }, []);

  const creds = (() => { try { return JSON.parse(localStorage.getItem('staffCredentials') || '[]'); } catch { return []; } })();
  const teacherCred  = creds.find(c => c.role === 'teacher');
  const headCred     = creds.find(c => c.role === 'headteacher');
  const teacherName  = teacherCred?.name  || '___________________';
  const teacherTitle = teacherCred?.title || 'Class Teacher';
  const teacherSig   = teacherCred?.signature || '';
  const headName     = headCred?.name     || '___________________';
  const headTitle    = headCred?.title    || 'Head Teacher';
  const headSig      = headCred?.signature || '';

  const subjects = mapSubjects(data.subjects || []);
  const total = data.subjects.reduce((a, s) => a + (s.score ?? 0), 0);
  const avg = data.subjects.length ? Math.round(total / data.subjects.length) : 0;
  const result = computeResult(data.subjects);
  const payLabel = data.student.payment_status === 'paid' ? 'PAID' : data.student.payment_status === 'partial' ? 'PARTIAL' : 'NOT PAID';

  const reportToken = data.report_token || data.student?.admission_number || 'preview';
  const qrUrl = `${window.location.origin}/report-view?token=${encodeURIComponent(reportToken)}`;
  const serial = reportToken && reportToken !== 'preview'
    ? reportToken.toString().replace(/-/g, '').slice(0, 8).toUpperCase().replace(/(.{4})(.{4})/, '$1-$2')
    : 'PREVIEW';

  return (
    <>
      <style>{css}</style>
      <div className="src-page">
        <div className="src-card">
          <div className="src-corner src-tl" />
          <div className="src-corner src-tr" />
          <div className="src-corner src-bl" />
          <div className="src-corner src-br" />

          {data.school?.logo && (
            <div className="src-wm"><img src={data.school.logo} alt="" /></div>
          )}

          <div className="src-inner">
            <div className="src-body">
              {/* REDESIGNED Header - Centered Layout */}
              <div className="src-hdr">
                <div className="src-hdr-bar" />
                <div className="src-hdr-wrapper">
                  {/* School Name */}
                  <div className="src-school-header">
                    <p className="src-school-name">{data.school?.name || 'KASENYI SECONDARY SCHOOL'}</p>
                    <p className="src-school-motto">&ldquo;{data.school?.motto || 'Let Our Future Shine'}&rdquo;</p>
                    <p className="src-school-location">
                      <span className="src-meta-item">{data.school?.address || 'P.O BOX 246, Village/Subcountry, District'}</span>
                    </p>
                  </div>

                  {/* Logo */}
                  <div className="src-logo-wrapper">
                    {data.school?.logo
                      ? <img src={data.school.logo} alt="logo" className="src-logo" />
                      : <div className="src-logo-ph">LOGO</div>}
                  </div>

                  {/* Title Badge and Term/Year */}
                  <div className="src-badge-row">
                    <div className="src-badge">
                      <h2 className="src-badge-title">REPORT CARD</h2>
                      <span className="src-badge-sub">Competency Based Assessment</span>
                    </div>
                    <div className="src-term-year">
                      <div className="src-term-badge">
                        {data.metadata?.term || 'Term 1'}
                        <span>{data.metadata?.academic_year || new Date().getFullYear()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Bio */}
              <div className="src-bio">
                <div className="src-photo">
                  {data.student.photo
                    ? <img src={data.student.photo} alt="student" />
                    : <span className="src-photo-ph">Photo</span>}
                </div>
                <table className="src-bio-table">
                  <tbody>
                    <tr>
                      <th>Name</th><td>{data.student.full_name}</td>
                      <th>Gender</th><td style={{textTransform:'capitalize'}}>{data.student.gender || '—'}</td>
                      <th>Stream</th><td>{data.student.stream || '—'}</td>
                    </tr>
                    <tr>
                      <th>Class</th><td>{data.student.class_or_grade}</td>
                      <th>Adm. No.</th><td>{data.student.admission_number}</td>
                      <th>Index No.</th><td>{data.student.index_number || '—'}</td>
                    </tr>
                    <tr>
                      <th>Nationality</th><td>{data.student.nationality || '—'}</td>
                      <th>Term</th><td>{data.metadata?.term}</td>
                      <th>Year</th><td>{data.metadata?.academic_year}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Performance */}
              <p className="src-section-title">Performance Records</p>
              <table className="src-perf-table">
                <thead>
                  <tr>
                    <th>#</th><th style={{textAlign:'left'}}>Subject</th>
                    <th>A1</th><th>A2</th><th>Total</th>
                    <th>Grade</th><th style={{textAlign:'left'}}>Achievement</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subjects.map((s, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td style={{textAlign:'left'}}>{s.subject_name}</td>
                      <td>{s.ca_score ?? '—'}</td>
                      <td>{s.exam_score ?? '—'}</td>
                      <td style={{fontWeight:600}}>{s.score ?? 0}</td>
                      <td style={{fontWeight:700}}>{s.grade}</td>
                      <td style={{textAlign:'left'}}>{s.remark || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary */}
              <div className="src-summary">
                <div>Total: <strong>{total}</strong></div>
                <div>Average: <strong>{avg}%</strong></div>
                <div>Result: <strong>{result}</strong></div>
                <div>Fees: <strong style={{color: data.student.payment_status === 'paid' ? '#059669' : '#dc2626'}}>{payLabel}</strong></div>
              </div>

              {/* Grade Scale */}
              <table className="src-grade-scale">
                <thead><tr><th>A (75–100)</th><th>B (60–74)</th><th>C (50–59)</th><th>D (35–49)</th><th>E (0–34)</th></tr></thead>
                <tbody><tr><td>Excellent</td><td>Good</td><td>Satisfactory</td><td>Needs Improvement</td><td>Fail</td></tr></tbody>
              </table>

              {/* Key to terms */}
              <div className="src-key">
                <p><strong>Result 1:</strong> Passed all subjects — no grade below D</p>
                <p><strong>Result 2:</strong> Has at least one grade E (failed one or more subjects)</p>
                <p><strong>Result 3:</strong> Obtained grade E in all subjects</p>
              </div>

              {/* Comments */}
              <div className="src-comments">
                <strong>Class Teacher's Comment:</strong>
                <p>{data.ai_comment || data.notes?.[0]?.description || '................................................................................................'}</p>
                <strong>Head Teacher's Comment:</strong>
                <p style={{minHeight:28}}></p>
              </div>
            </div>

            {/* Footer */}
            <div className="src-footer-push">
              <div className="src-footer">
                <div className="src-admin-footer">
                  <span>Term Ended: <strong>___________</strong></span>
                  <span>Next Term Begins: <strong>___________</strong></span>
                  <span>Fees Balance: <strong>UGX {Number(data.student.fees_balance || 0).toLocaleString()}</strong></span>
                  <span>Fees Next Term: <strong>___________</strong></span>
                </div>
                <div className="src-sigs">
                  <div className="src-sig-card">
                    <span className="src-sig-role">{teacherTitle.toUpperCase()}</span>
                    <span className="src-sig-name">{teacherName}</span>
                    <div className="src-sig-line">
                      {teacherSig && <img src={teacherSig} alt="" className="src-sig-img" />}
                    </div>
                    <span className="src-sig-label">Signature</span>
                  </div>
                  <div className="src-stamp-card">
                    {stamp
                      ? <img src={stamp} className="src-stamp-img" alt="stamp" />
                      : <div className="src-stamp-ph">Official<br/>Stamp</div>}
                    <span className="src-sig-label" style={{width:80}}>Stamp</span>
                  </div>
                  <div className="src-sig-card">
                    <span className="src-sig-role">{headTitle.toUpperCase()}</span>
                    <span className="src-sig-name">{headName}</span>
                    <div className="src-sig-line">
                      {headSig && <img src={headSig} alt="" className="src-sig-img" />}
                    </div>
                    <span className="src-sig-label">Signature</span>
                  </div>
                  <div className="src-qr">
                    <QRCodeSVG
                      value={qrUrl}
                      size={58}
                      bgColor="transparent"
                      fgColor="#1e3a8a"
                      level="M"
                    />
                    <span className="src-qr-label">Scan to verify</span>
                    <span className="src-qr-serial">S/N: {serial}</span>
                  </div>
                </div>
                <div className="src-footer-bar">
                  This report is the property of {data.school?.name || 'the school'}. If found, please return it to the school.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
