/**
 * ReportCardSalah — Navy Blue & Gold modern template
 * Adapted from salah-react. Accepts the standard buildReportData shape.
 */
import { useState } from 'react';

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
.src-inner { position:relative; z-index:2; padding:8mm 10mm; display:flex; flex-direction:column; min-height:260mm; }
.src-body { flex:1; }
.src-footer-push { margin-top:auto; }

/* header */
.src-hdr { background:#fff; border-radius:8px; margin-bottom:10px; box-shadow:0 2px 8px rgba(0,0,0,.08); }
.src-hdr-bar { height:6px; background:linear-gradient(90deg,#1e3a8a 0%,#2563eb 50%,#d4af37 100%); }
.src-hdr-content { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; padding:10px 16px; gap:14px; }
.src-hdr-left { display:flex; align-items:center; gap:12px; }
.src-logo { width:60px; height:60px; object-fit:contain; border-radius:6px; }
.src-logo-ph { width:60px; height:60px; border:2px dashed #1e3a8a; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:600; color:#1e3a8a; text-align:center; }
.src-school-name { font-size:17px; font-weight:700; color:#1e3a8a; letter-spacing:.5px; margin:0; }
.src-school-sub { font-size:10px; font-weight:600; color:#d4af37; letter-spacing:1.5px; text-transform:uppercase; margin:0; }
.src-badge { text-align:center; padding:8px 16px; background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%); border-radius:8px; }
.src-badge-lbl { display:block; font-size:8px; color:#d4af37; letter-spacing:1.5px; font-weight:600; margin-bottom:2px; }
.src-badge-title { font-size:20px; font-weight:800; color:#fff; letter-spacing:1px; margin:0 0 2px; line-height:1; }
.src-badge-sub { display:block; font-size:7px; color:#93c5fd; letter-spacing:1px; }
.src-hdr-right { display:flex; justify-content:flex-end; }
.src-term-info { display:flex; flex-direction:column; gap:5px; align-items:flex-end; }
.src-term-badge,.src-year-badge { padding:5px 12px; background:#f0f4f8; border:2px solid #1e3a8a; border-radius:6px; font-size:10px; font-weight:700; color:#1e3a8a; }
.src-contacts { display:flex; align-items:center; justify-content:center; gap:7px; padding:6px 16px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:9px; color:#475569; }
.src-contact-item { display:flex; align-items:center; gap:3px; }
.src-divider { color:#cbd5e1; font-weight:bold; }

/* bio */
.src-bio { display:flex; gap:10px; margin-bottom:10px; }
.src-photo { width:80px; height:100px; border:2px solid #1e3a8a; border-radius:6px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#f8fafc; flex-shrink:0; }
.src-photo img { width:100%; height:100%; object-fit:cover; }
.src-photo-ph { font-size:9px; color:#1e3a8a; font-weight:600; text-align:center; }
.src-bio-table { flex:1; border-collapse:collapse; font-size:10px; border:2px solid #1e3a8a; border-radius:8px; overflow:hidden; }
.src-bio-table th,.src-bio-table td { border:1px solid #cbd5e1; padding:6px 8px; text-align:left; }
.src-bio-table th { background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%); color:#fff; font-weight:600; white-space:nowrap; width:85px; }
.src-bio-table td { background:#fff; color:#1e293b; }

/* section title */
.src-section-title { text-align:center; margin:8px 0 5px; font-size:12px; font-weight:700; letter-spacing:1.5px; color:#1e3a8a; text-transform:uppercase; padding-bottom:5px; border-bottom:2px solid #d4af37; }

/* perf table */
.src-perf-table { width:100%; border-collapse:collapse; font-size:9px; border:2px solid #1e3a8a; border-radius:8px; overflow:hidden; margin-bottom:6px; }
.src-perf-table th,.src-perf-table td { border:1px solid #cbd5e1; padding:5px 3px; text-align:center; }
.src-perf-table th { background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%); color:#fff; font-weight:600; }
.src-perf-table tbody tr:nth-child(even) { background:#f8fafc; }

/* summary */
.src-summary { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; margin:6px 0; font-size:10px; }
.src-summary div { border:2px solid #1e3a8a; padding:6px; text-align:center; background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%); border-radius:6px; font-weight:500; color:#1e293b; }
.src-summary strong { color:#1e3a8a; font-weight:700; }

/* grade scale */
.src-grade-scale { width:100%; border-collapse:collapse; font-size:9px; margin:6px 0; }
.src-grade-scale th { background:linear-gradient(135deg,#d4af37 0%,#f59e0b 100%); color:#1e293b; font-weight:700; border:1px solid #cbd5e1; padding:4px; }
.src-grade-scale td { border:1px solid #cbd5e1; padding:4px; text-align:center; font-weight:600; }

/* overall */
.src-overall { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; margin:6px 0; font-size:10px; }
.src-overall div { border:2px solid #d4af37; padding:6px; text-align:center; font-weight:500; background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%); border-radius:6px; color:#1e293b; }
.src-overall strong { color:#92400e; font-weight:700; }

/* key terms */
.src-key { border:2px solid #cbd5e1; border-radius:6px; padding:6px 10px; font-size:9px; margin-top:6px; background:#f8fafc; }
.src-key p { margin-bottom:2px; line-height:1.5; }
.src-key strong { color:#1e3a8a; font-weight:600; }

/* comments */
.src-comments { margin-top:6px; }
.src-comments strong { font-size:10px; color:#1e3a8a; font-weight:600; }
.src-comments p { border:2px solid #cbd5e1; border-radius:6px; min-height:36px; padding:5px 7px; font-size:9px; margin:3px 0 6px; background:#fff; line-height:1.5; }

/* footer */
.src-footer { margin-top:8px; }
.src-admin-footer { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; margin-bottom:8px; font-size:9px; }
.src-admin-footer span { border:1px solid #1e3a8a; padding:5px; text-align:center; background:#f0f9ff; border-radius:4px; font-weight:500; }
.src-admin-footer strong { color:#1e3a8a; font-weight:700; }
.src-sigs { display:grid; grid-template-columns:1fr auto 1fr; gap:10px; padding:10px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; margin-bottom:6px; }
.src-sig-card { display:flex; flex-direction:column; align-items:center; gap:3px; }
.src-sig-role { font-size:9px; font-weight:700; color:#1e3a8a; letter-spacing:1px; text-transform:uppercase; }
.src-sig-name { font-size:9px; color:#475569; margin-bottom:3px; }
.src-sig-line { border-bottom:1px solid #1e3a8a; width:100px; height:28px; }
.src-sig-label { font-size:8px; color:#64748b; border-top:1px solid #cbd5e1; padding-top:2px; width:100px; text-align:center; }
.src-stamp-card { display:flex; flex-direction:column; align-items:center; gap:3px; }
.src-stamp-ph { width:80px; height:80px; border:1.5px dashed #d4af37; border-radius:50%; display:flex; align-items:center; justify-content:center; text-align:center; font-size:9px; color:#d4af37; font-weight:600; background:#fff; }
.src-stamp-img { width:80px; height:80px; object-fit:contain; }
.src-footer-bar { background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%); color:#fff; font-size:9px; font-style:italic; padding:6px 12px; text-align:center; border-radius:4px; }
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
  const [stamp, setStamp] = useState(data.school?.stamp || '');
  const [classSig, setClassSig] = useState(data.school?.sig || '');
  const [headSig, setHeadSig] = useState('');

  const subjects = mapSubjects(data.subjects || []);
  const total = data.subjects.reduce((a, s) => a + (s.score ?? 0), 0);
  const avg = data.subjects.length ? Math.round(total / data.subjects.length) : 0;
  const result = computeResult(data.subjects);
  const payLabel = data.student.payment_status === 'paid' ? 'PAID' : data.student.payment_status === 'partial' ? 'PARTIAL' : 'NOT PAID';

  const handleUpload = (setter) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setter(URL.createObjectURL(file));
  };

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
              {/* Header */}
              <div className="src-hdr">
                <div className="src-hdr-bar" />
                <div className="src-hdr-content">
                  <div className="src-hdr-left">
                    {data.school?.logo
                      ? <img src={data.school.logo} alt="logo" className="src-logo" />
                      : <div className="src-logo-ph">LOGO</div>}
                    <div>
                      <p className="src-school-name">{data.school?.name || 'School Name'}</p>
                      <p className="src-school-sub">Secondary School</p>
                    </div>
                  </div>
                  <div className="src-badge">
                    <span className="src-badge-lbl">NEW CURRICULUM</span>
                    <h2 className="src-badge-title">REPORT CARD</h2>
                    <span className="src-badge-sub">Competency Based Assessment</span>
                  </div>
                  <div className="src-hdr-right">
                    <div className="src-term-info">
                      <span className="src-term-badge">{data.metadata?.term || 'Term 1'}</span>
                      <span className="src-year-badge">{data.metadata?.academic_year || new Date().getFullYear()}</span>
                    </div>
                  </div>
                </div>
                <div className="src-contacts">
                  <span className="src-contact-item">📍 {data.school?.address || '—'}</span>
                  <span className="src-divider">•</span>
                  <span className="src-contact-item">📞 {data.school?.phone || '—'}</span>
                  {data.school?.motto && <><span className="src-divider">•</span><span className="src-contact-item" style={{fontStyle:'italic'}}>"{data.school.motto}"</span></>}
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
                    <th>CA</th><th>Exam</th><th>Total</th>
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
                <p>{data.notes?.[0]?.description || '................................................................................................'}</p>
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
                    <span className="src-sig-role">Class Teacher</span>
                    <span className="src-sig-name">___________________</span>
                    {classSig
                      ? <img src={classSig} style={{maxHeight:36,maxWidth:100,objectFit:'contain'}} alt="sig" />
                      : <div className="src-sig-line" />}
                    <span className="src-sig-label">Signature</span>
                  </div>
                  <div className="src-stamp-card">
                    {stamp
                      ? <img src={stamp} className="src-stamp-img" alt="stamp" />
                      : <div className="src-stamp-ph">Official<br/>Stamp</div>}
                    <span className="src-sig-label" style={{width:80}}>Stamp</span>
                  </div>
                  <div className="src-sig-card">
                    <span className="src-sig-role">Head Teacher</span>
                    <span className="src-sig-name">___________________</span>
                    {headSig
                      ? <img src={headSig} style={{maxHeight:36,maxWidth:100,objectFit:'contain'}} alt="sig" />
                      : <div className="src-sig-line" />}
                    <span className="src-sig-label">Signature</span>
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
