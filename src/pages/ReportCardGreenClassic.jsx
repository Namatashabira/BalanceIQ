/**
 * ReportCardGreenClassic — Green & Gold traditional design
 * Uses react.js folder components. Accepts the standard buildReportData shape.
 */
import { Header } from './react.js/Header';
import { StudentBio } from './react.js/StudentBio';
import { PerformanceTable } from './react.js/PerformanceTable';
import { SummaryRow } from './react.js/SummaryRow';
import { GradeScale } from './react.js/GradeScale';
import { OverallPerformance } from './react.js/OverallPerformance';
import { KeyToTerms } from './react.js/KeyToTerms';
import { Comments } from './react.js/Comments';
import { FooterSignatures } from './react.js/FooterSignatures';
import greenCss from './react.js/index.css?raw';

function mapData(data) {
  const total = data.subjects.reduce((a, s) => a + (s.score ?? 0), 0);
  const avg = data.subjects.length ? Math.round(total / data.subjects.length) : 0;

  return {
    school: {
      name: data.school?.name || 'School Name',
      subtitle: 'Secondary School',
      address: data.school?.address || '',
      phone: data.school?.phone || '',
      email: data.school?.email || '',
      website: data.school?.website || '',
      logo: data.school?.logo || '',
      term: data.metadata?.term || 'Term 1',
      year: data.metadata?.academic_year || String(new Date().getFullYear()),
    },
    student: {
      name: data.student.full_name,
      gender: data.student.gender || '',
      section: data.student.stream || '',
      class: data.student.class_or_grade || '',
      stream: data.student.stream || '',
      idNo: data.student.admission_number || '',
      payCode: data.student.index_number || '',
      term: data.metadata?.term || '',
      year: data.metadata?.academic_year || '',
      photo: data.student.photo || '',
    },
    subjects: data.subjects.map((s, i) => ({
      code: String(i + 1).padStart(2, '0'),
      name: s.subject_name,
      scores: s.ca_score != null
        ? [s.ca_score, s.exam_score ?? 0, s.score ?? 0]
        : [s.score ?? 0],
      grade: s.grade || '—',
      achievement: s.remark || '—',
      teacher: s.competency || '—',
    })),
    assessmentModel: 'A1',
    summary: {
      average: `${avg}%`,
      total: `${total}`,
      position: '—',
      outOf: '—',
    },
    overall: {
      identifier: avg >= 75 ? 'Excellent' : avg >= 60 ? 'Good' : avg >= 50 ? 'Satisfactory' : avg >= 35 ? 'Needs Improvement' : 'Fail',
      achievement: avg >= 75 ? 'Outstanding' : avg >= 60 ? 'Good' : 'Average',
      grade: avg >= 75 ? 'A' : avg >= 60 ? 'B' : avg >= 50 ? 'C' : avg >= 35 ? 'D' : 'E',
    },
    comments: {
      classTeacher: data.notes?.[0]?.description || '',
      headTeacher: '',
    },
    admin: {
      termEnded: '___________',
      nextTerm: '___________',
      balance: Number(data.student.fees_balance || 0).toLocaleString(),
      nextFees: '___________',
      classTeacherName: '',
      headTeacherName: '',
    },
  };
}

export default function ReportCardGreenClassic({ data }) {
  const mapped = mapData(data);

  return (
    <>
      <style>{greenCss}</style>
      <div className="report-page" style={{ padding: 0 }}>
        <button className="print-btn" onClick={() => window.print()}>🖨 Print Report Card</button>

        <div className="report-card">
          <span className="corner corner-tl" />
          <span className="corner corner-tr" />
          <span className="corner corner-bl" />
          <span className="corner corner-br" />

          <div className="report-inner">
            <div className="report-body">
              <Header school={mapped.school} />
              <StudentBio student={mapped.student} />
              <PerformanceTable subjects={mapped.subjects} assessmentModel={mapped.assessmentModel} />
              <SummaryRow summary={mapped.summary} subjects={mapped.subjects} />
              <GradeScale />
              <OverallPerformance overall={mapped.overall} />
              <KeyToTerms />
              <Comments comments={mapped.comments} />
            </div>
            <div className="report-footer-push">
              <FooterSignatures admin={mapped.admin} school={mapped.school} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
