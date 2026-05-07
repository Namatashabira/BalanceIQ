/**
 * ReportCardClassic — Traditional A4 report card template
 * Adapted from react.js folder. Accepts the standard buildReportData shape.
 */

const css = `
.rcc-card { width:100%; background:#fff; padding:10mm 12mm; border:1px solid #999; font-family:Arial,Helvetica,sans-serif; font-size:11px; color:#000; box-sizing:border-box; }

/* header */
.rcc-header { display:grid; grid-template-columns:100px 1fr 100px; align-items:center; border-bottom:2px solid #003366; padding-bottom:8px; margin-bottom:10px; }
.rcc-header-center { text-align:center; }
.rcc-header-center h1 { font-size:18px; letter-spacing:1px; margin:0 0 3px; color:#003366; }
.rcc-header-center h2 { font-size:13px; margin:0 0 2px; }
.rcc-header-center span { display:block; font-size:10px; font-weight:bold; color:#006633; margin-top:2px; }
.rcc-logo { max-width:90px; max-height:90px; object-fit:contain; }
.rcc-logo-ph { width:80px; height:80px; border:1px dashed #003366; display:flex; align-items:center; justify-content:center; font-size:9px; color:#003366; text-align:center; }
.rcc-contacts { font-size:10px; text-align:right; color:#003366; line-height:1.6; }

/* bio */
.rcc-bio { display:grid; grid-template-columns:90px 1fr; gap:10px; margin-bottom:12px; }
.rcc-photo { width:90px; height:110px; border:1px solid #000; display:flex; align-items:center; justify-content:center; font-size:9px; overflow:hidden; }
.rcc-photo img { width:100%; height:100%; object-fit:cover; }
.rcc-bio-table { width:100%; border-collapse:collapse; font-size:11px; }
.rcc-bio-table th,.rcc-bio-table td { border:1px solid #000; padding:5px 7px; text-align:left; }
.rcc-bio-table th { background:#e9eef3; font-weight:bold; width:90px; white-space:nowrap; }

/* section */
.rcc-section-title { text-align:center; margin:10px 0 5px; font-size:13px; font-weight:bold; letter-spacing:1px; color:#003366; text-transform:uppercase; }

/* perf table */
.rcc-perf-table { width:100%; border-collapse:collapse; font-size:10px; margin-bottom:6px; }
.rcc-perf-table th,.rcc-perf-table td { border:1px solid #000; padding:4px 3px; text-align:center; }
.rcc-perf-table th { background:#e9eef3; font-weight:bold; }
.rcc-perf-table tbody tr:nth-child(even) { background:#f5f5f5; }

/* summary */
.rcc-summary { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; margin:7px 0; font-size:11px; }
.rcc-summary div { border:1px solid #000; padding:6px; text-align:center; }

/* grade scale */
.rcc-grade-scale { width:100%; border-collapse:collapse; font-size:10px; margin:8px 0; }
.rcc-grade-scale th { background:#003366; color:#fff; border:1px solid #000; padding:4px; }
.rcc-grade-scale td { border:1px solid #000; padding:4px; text-align:center; font-weight:600; }

/* overall */
.rcc-overall { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; margin:7px 0; font-size:11px; }
.rcc-overall div { border:1px solid #000; padding:6px; text-align:center; font-weight:bold; }

/* key terms */
.rcc-key { border:1px solid #000; padding:6px; font-size:10px; margin-top:8px; }
.rcc-key p { margin-bottom:3px; }

/* comments */
.rcc-comments { margin-top:10px; }
.rcc-comments strong { font-size:11px; }
.rcc-comments p { border:1px solid #000; min-height:42px; padding:5px; font-size:10px; margin:3px 0 7px; }

/* footer */
.rcc-admin-footer { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; margin-top:8px; font-size:10px; }
.rcc-admin-footer span { border:1px solid #000; padding:4px; text-align:center; }
.rcc-sigs { display:grid; grid-template-columns:1fr 1.5fr 1fr; gap:18px; margin-top:16px; align-items:end; }
.rcc-sig-block { display:flex; flex-direction:column; align-items:center; gap:3px; font-size:10px; }
.rcc-sig-role { font-weight:bold; color:#003366; letter-spacing:.5px; text-transform:uppercase; }
.rcc-sig-name { color:#555; margin-bottom:4px; }
.rcc-sig-line { border-bottom:1px solid #000; width:120px; height:28px; }
.rcc-sig-label { font-size:9px; color:#555; border-top:1px solid #ccc; padding-top:2px; width:120px; text-align:center; }
.rcc-stamp-area { display:flex; flex-direction:column; align-items:center; gap:4px; font-size:10px; }
.rcc-stamp-ph { width:90px; height:90px; border:2px solid #000; display:flex; align-items:center; justify-content:center; text-align:center; font-weight:bold; font-size:10px; color:#003366; }
.rcc-stamp-img { width:90px; height:90px; object-fit:contain; }
.rcc-disclaimer { margin-top:10px; border-top:2px solid #003366; padding-top:6px; font-size:9px; text-align:center; color:#555; font-style:italic; }
`;

export default function ReportCardClassic({ data }) {
  const total = data.subjects.reduce((a, s) => a + (s.score ?? 0), 0);
  const avg = data.subjects.length ? Math.round(total / data.subjects.length) : 0;
  const payLabel = data.student.payment_status === 'paid' ? 'PAID' : data.student.payment_status === 'partial' ? 'PARTIAL' : 'NOT PAID';

  const grades = data.subjects.map(s => (s.grade || '').toUpperCase());
  const result = grades.every(g => g === 'E') ? 'Result 3' : grades.some(g => g === 'E') ? 'Result 2' : 'Result 1';

  return (
    <>
      <style>{css}</style>
      <div className="rcc-card">
        {/* Header */}
        <div className="rcc-header">
          <div>
            {data.school?.logo
              ? <img src={data.school.logo} alt="logo" className="rcc-logo" />
              : <div className="rcc-logo-ph">LOGO</div>}
          </div>
          <div className="rcc-header-center">
            <h1>{data.school?.name || 'School Name'}</h1>
            <h2>STUDENT REPORT CARD</h2>
            <span>{data.metadata?.term} — Academic Year {data.metadata?.academic_year}</span>
            {data.school?.motto && <span style={{color:'#888',fontStyle:'italic',fontWeight:'normal'}}>"{data.school.motto}"</span>}
          </div>
          <div className="rcc-contacts">
            {data.school?.address && <div>{data.school.address}</div>}
            {data.school?.phone && <div>Tel: {data.school.phone}</div>}
          </div>
        </div>

        {/* Student Bio */}
        <div className="rcc-bio">
          <div className="rcc-photo">
            {data.student.photo
              ? <img src={data.student.photo} alt="student" />
              : <span style={{fontSize:9,color:'#999',textAlign:'center'}}>Photo</span>}
          </div>
          <table className="rcc-bio-table">
            <tbody>
              <tr>
                <th>Full Name</th><td colSpan={3}>{data.student.full_name}</td>
              </tr>
              <tr>
                <th>Adm. No.</th><td>{data.student.admission_number}</td>
                <th>Gender</th><td style={{textTransform:'capitalize'}}>{data.student.gender || '—'}</td>
              </tr>
              <tr>
                <th>Class</th><td>{data.student.class_or_grade}</td>
                <th>Stream</th><td>{data.student.stream || '—'}</td>
              </tr>
              <tr>
                <th>Nationality</th><td>{data.student.nationality || '—'}</td>
                <th>District</th><td>{data.student.district || '—'}</td>
              </tr>
              {data.student.guardians?.[0] && (
                <tr>
                  <th>Guardian</th><td>{data.student.guardians[0].full_name} ({data.student.guardians[0].relationship})</td>
                  <th>Phone</th><td>{data.student.guardians[0].phone}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Performance */}
        <p className="rcc-section-title">Performance Records</p>
        <table className="rcc-perf-table">
          <thead>
            <tr>
              <th>#</th><th style={{textAlign:'left'}}>Subject</th>
              <th>CA</th><th>Exam</th><th>Total</th><th>Grade</th><th style={{textAlign:'left'}}>Remark</th>
            </tr>
          </thead>
          <tbody>
            {data.subjects.map((s, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td style={{textAlign:'left'}}>{s.subject_name}</td>
                <td>{s.ca_score ?? '—'}</td>
                <td>{s.exam_score ?? '—'}</td>
                <td style={{fontWeight:600}}>{s.score ?? 0} / 100</td>
                <td style={{fontWeight:700}}>{s.grade}</td>
                <td style={{textAlign:'left'}}>{s.remark || '—'}</td>
              </tr>
            ))}
            <tr style={{background:'#e9eef3',fontWeight:'bold'}}>
              <td colSpan={4} style={{textAlign:'right'}}>Total / Average</td>
              <td>{total} / {data.subjects.length * 100}</td>
              <td>{avg}%</td>
              <td style={{textAlign:'left'}}>{avg >= 75 ? 'Excellent' : avg >= 60 ? 'Good' : avg >= 50 ? 'Satisfactory' : avg >= 35 ? 'Needs Improvement' : 'Fail'}</td>
            </tr>
          </tbody>
        </table>

        {/* Summary */}
        <div className="rcc-summary">
          <div>Average: <strong>{avg}%</strong></div>
          <div>Result: <strong>{result}</strong></div>
          <div>Fees Balance: <strong>UGX {Number(data.student.fees_balance || 0).toLocaleString()}</strong></div>
          <div>Payment: <strong style={{color: data.student.payment_status === 'paid' ? '#006633' : '#cc0000'}}>{payLabel}</strong></div>
        </div>

        {/* Grade Scale */}
        <table className="rcc-grade-scale">
          <thead><tr><th>A (75–100)</th><th>B (60–74)</th><th>C (50–59)</th><th>D (35–49)</th><th>E (0–34)</th></tr></thead>
          <tbody><tr><td>Excellent</td><td>Good</td><td>Satisfactory</td><td>Needs Improvement</td><td>Fail</td></tr></tbody>
        </table>

        {/* Key to terms */}
        <div className="rcc-key">
          <p><strong>Result 1:</strong> Student passed all subjects — no grade below D</p>
          <p><strong>Result 2:</strong> Student has at least one grade E (failed one or more subjects)</p>
          <p><strong>Result 3:</strong> Student obtained grade E in all subjects</p>
        </div>

        {/* Comments */}
        <div className="rcc-comments">
          <strong>Class Teacher's Comment:</strong>
          <p>{data.notes?.[0]?.description || '................................................................................................'}</p>
          <strong>Head Teacher's Comment:</strong>
          <p style={{minHeight:30}}></p>
        </div>

        {/* Admin footer */}
        <div className="rcc-admin-footer">
          <span>Term Ended: ___________</span>
          <span>Next Term Begins: ___________</span>
          <span>Fees Balance: UGX {Number(data.student.fees_balance || 0).toLocaleString()}</span>
          <span>Head Teacher: ___________</span>
        </div>

        {/* Signatures */}
        <div className="rcc-sigs">
          <div className="rcc-sig-block">
            <span className="rcc-sig-role">Class Teacher</span>
            <span className="rcc-sig-name">___________________</span>
            <div className="rcc-sig-line" />
            <span className="rcc-sig-label">Signature</span>
          </div>
          <div className="rcc-stamp-area">
            {data.school?.stamp
              ? <img src={data.school.stamp} className="rcc-stamp-img" alt="stamp" />
              : <div className="rcc-stamp-ph">OFFICIAL<br/>STAMP</div>}
            <span style={{fontSize:9,color:'#555'}}>Official Stamp</span>
          </div>
          <div className="rcc-sig-block">
            <span className="rcc-sig-role">Head Teacher</span>
            <span className="rcc-sig-name">___________________</span>
            <div className="rcc-sig-line" />
            <span className="rcc-sig-label">Signature</span>
          </div>
        </div>

        <div className="rcc-disclaimer">
          This report is the property of {data.school?.name || 'the school'}. If found, please return it to the school address above.
        </div>
      </div>
    </>
  );
}
