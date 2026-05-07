import { Header } from './Header';
import { StudentBio } from './StudentBio';
import { PerformanceTable } from './PerformanceTable';
import { SummaryRow } from './SummaryRow';
import { GradeScale } from './GradeScale';
import { OverallPerformance } from './OverallPerformance';
import { KeyToTerms } from './KeyToTerms';
import { Comments } from './Comments';
import { FooterSignatures } from './FooterSignatures';

import { useState } from 'react';

export default function ReportCard({ data }) {
  const [watermark, setWatermark] = useState('');

  function handleWatermark(e) {
    const file = e.target.files[0];
    if (!file) return;
    setWatermark(URL.createObjectURL(file));
  }

  return (
    <div className="report-page">
      <div className="top-controls">
        <button className="print-btn" onClick={() => window.print()}>🖨 Print Report Card</button>
        <label className="watermark-btn" title="Click to upload school watermark">
          💧 {watermark ? 'Change Watermark' : 'Add Watermark'}
          <input type="file" accept="image/*" onChange={handleWatermark} style={{ display: 'none' }} />
        </label>
        {watermark && (
          <button className="watermark-btn remove" onClick={() => setWatermark('')}>✕ Remove Watermark</button>
        )}
      </div>

      <div className="report-card">
        <div className="corner-accent corner-tl" />
        <div className="corner-accent corner-tr" />
        <div className="corner-accent corner-bl" />
        <div className="corner-accent corner-br" />

        {watermark && (
          <div className="watermark-layer">
            <img src={watermark} alt="Watermark" className="watermark-img" />
          </div>
        )}

        <div className="report-inner">
          <div className="report-body">
            <Header school={data.school} />
            <StudentBio student={data.student} />
            <PerformanceTable subjects={data.subjects} assessmentModel={data.assessmentModel} />
            <SummaryRow summary={data.summary} subjects={data.subjects} />
            <GradeScale />
            <OverallPerformance overall={data.overall} />
            <KeyToTerms />
            <Comments comments={data.comments} />
          </div>

          <div className="report-footer-push">
            <FooterSignatures admin={data.admin} school={data.school} />
          </div>
        </div>
      </div>
    </div>
  );
}
