import { Header } from './Header';
import { StudentBio } from './StudentBio';
import { PerformanceTable } from './PerformanceTable';
import { SummaryRow } from './SummaryRow';
import { GradeScale } from './GradeScale';
import { OverallPerformance } from './OverallPerformance';
import { KeyToTerms } from './KeyToTerms';
import { Comments } from './Comments';
import { FooterSignatures } from './FooterSignatures';

export default function ReportCard({ data }) {
  return (
    <div className="report-page">

      <button className="print-btn" onClick={() => window.print()}>
        🖨 Print Report Card
      </button>

      <div className="report-card">
        <span className="corner corner-tl" />
        <span className="corner corner-tr" />
        <span className="corner corner-bl" />
        <span className="corner corner-br" />

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
