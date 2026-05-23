import { useState, useRef, useEffect } from 'react';
import './report5.css';
import { loadReceiptSettings } from '../../services/receiptSettingsService';

const defaultData = {
  school: {
    logo: '', name: 'ST. MARK SCHOOLS', address: 'Kayunga, Uganda',
    phone: '+256 700 123456', email: 'info@stmark.sc.ug', term: 'TERM 1', year: '2026',
    motto: 'Excellence in Education', poBox: 'P.O. BOX 123', regNumber: 'REG001',
    street: 'Kampala Road', district: 'Kampala', website: 'www.stmark.ug',
  },
  student: {
    name: 'John Doe', gender: 'Male', class: 'S.5', stream: 'Science',
    idNo: '12345', term: 'Term 1', year: '2026',
  },
  subjects: [
    { name: 'English', teacher: 'Ms. Smith', a1: 90, a2: 85, a3: 88, total: 87, grade: 'A' },
    { name: 'Biology', teacher: 'Mr. Okello', a1: 78, a2: 80, a3: 75, total: 76, grade: 'B' },
    { name: 'Mathematics', teacher: 'Mr. Kato', a1: 92, a2: 88, a3: 90, total: 90, grade: 'A' },
    { name: 'Chemistry', teacher: 'Ms. Namutebi', a1: 74, a2: 70, a3: 72, total: 71, grade: 'B' },
    { name: 'Physics', teacher: 'Mr. Ssali', a1: 85, a2: 82, a3: 84, total: 83, grade: 'A' },
  ],
  summary: { average: 81, position: 3, outOf: 30 },
  comments: {
    classTeacher: 'John has performed very well this term. Keep up the good work!',
    headTeacher: 'Excellent performance. We encourage continued dedication to studies.',
  },
  admin: {
    termEnded: '2026-04-17', nextTerm: '2026-05-04', balance: '0',
    classTeacherName: 'Mr. Ssempala David', headTeacherName: 'Mrs. Nankya Patience',
  },
};

function transformReportData(data) {
  if (!data) return defaultData;

  const subjects = (data.subjects || []).map(s => {
    const a1 = s.a1_score ?? 0;
    const a2 = s.a2_score ?? 0;
    const a3 = s.a3_score ?? 0;
    const assessmentAvg = (a1 + a2) / 2;
    const total = (assessmentAvg * 0.2) + (a3 * 0.8);
    
    return {
      name: s.subject_name || 'Unknown',
      teacher: s.teacher || s.teacher_name || 'N/A',
      a1: Math.round(a1),
      a2: Math.round(a2),
      a3: Math.round(a3),
      total: Math.round(total),
      grade: s.grade || 'N/A',
    };
  });

  const total = subjects.reduce((sum, s) => sum + s.total, 0);
  const average = subjects.length > 0 ? Math.round(total / subjects.length) : 0;

  return {
    school: {
      logo: data.school?.logo || '',
      name: data.school?.name || data.school?.business_name || data.school?.businessName || 'School Name',
      address: data.school?.address || '',
      phone: data.school?.phone || '',
      email: data.school?.email || '',
      term: data.school?.term || data.metadata?.term || 'Term 1',
      year: data.school?.year || data.metadata?.academic_year || '2026',
      stamp: data.school?.stamp || data.school_stamp || '',
      motto: data.school?.motto || '',
      poBox: data.school?.po_box || data.school?.poBox || '',
      regNumber: data.school?.registration_number || data.school?.regNumber || '',
      street: data.school?.street_address || data.school?.location || '',
      district: data.school?.district || '',
      website: data.school?.website || '',
    },
    student: {
      name: data.student?.full_name || 'Student Name',
      gender: data.student?.gender || 'N/A',
      class: data.student?.class_or_grade || 'N/A',
      stream: data.student?.stream || 'N/A',
      idNo: data.student?.admission_number || 'N/A',
      term: data.student?.term || data.metadata?.term || 'Term 1',
      year: data.student?.year || data.metadata?.academic_year || '2026',
    },
    subjects,
    summary: {
      average: average || 0,
      position: data.summary?.position || 0,
      outOf: data.summary?.outOf || 0,
    },
    comments: {
      classTeacher: data.comments?.classTeacher || data.ai_comment || data.notes?.[0]?.description || 'No comment available.',
      headTeacher: data.comments?.headTeacher || 'Excellent performance. We encourage continued dedication to studies.',
    },
    admin: {
      termEnded: data.fees?.term_ended_date || data.admin?.termEnded || new Date().toISOString().split('T')[0],
      nextTerm: data.fees?.next_term_date || data.admin?.nextTerm || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      balance: data.student?.fees_balance ? `${data.student.fees_balance}` : data.admin?.balance || '0',
      classTeacherName: data.admin?.classTeacherName || data.staff?.class_teacher_name || 'Class Teacher',
      headTeacherName: data.admin?.headTeacherName || data.staff?.headteacher_name || 'Head Teacher',
    },
    staff: {
      class_teacher_signature: data.staff?.class_teacher_signature || null,
      headteacher_signature: data.staff?.headteacher_signature || null,
    },
    school_stamp: data.school_stamp || data.school?.stamp || null,
  };
}

export default function Report5({ data: propData }) {
  const initialData = propData ? transformReportData(propData) : defaultData;
  const [data, setData] = useState(initialData);
  const [receiptSettings, setReceiptSettings] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    loadReceiptSettings()
      .then(settings => {
        setReceiptSettings(settings);
        if (settings) {
          setData(prevData => ({
            ...prevData,
            school: {
              ...prevData.school,
              logo: settings.logo || prevData.school.logo,
              stamp: settings.stamp_raw || prevData.school.stamp,
            },
          }));
        }
      })
      .catch(err => console.error('Failed to load receipt settings:', err));
  }, []);

  function handlePrint() {
    window.print();
  }

  // Debug: Log all data
  useEffect(() => {
    console.log('[Report5] Full data structure:', {
      admin: data.admin,
      staff: data.staff,
      school_stamp: data.school_stamp,
      schoolStamp: data.school?.stamp,
    });
  }, [data]);
  return (
    <div className="r5-page">
      <div className="r5-controls">
        <button onClick={handlePrint} className="r5-print-btn">Print Report</button>
      </div>

      <div className="r5-card-wrapper">
        <div className="r5-card" ref={cardRef}>
          {/* Modern Academic Header */}
          <div className="r5-header">
            <div className="r5-header-container">
              {/* Left: Logo */}
              <div className="r5-logo-section">
                {data.school.logo ? (
                  <img src={data.school.logo} alt="School Logo" className="r5-logo-img" />
                ) : (
                  <div className="r5-logo-placeholder"></div>
                )}
              </div>

              {/* Center: School Info */}
              <div className="r5-center-section">
                <h1 className="r5-school-name">{data.school.name}</h1>
                {data.school.motto && <p className="r5-school-motto">{data.school.motto}</p>}
                
                <div className="r5-school-info-row">
                  {data.school.poBox && (
                    <div className="r5-info-item">
                      <span className="r5-info-label">P.O. Box</span>
                      <span className="r5-info-value">{data.school.poBox}</span>
                    </div>
                  )}
                  {data.school.regNumber && (
                    <div className="r5-info-item">
                      <span className="r5-info-label">Reg No</span>
                      <span className="r5-info-value">{data.school.regNumber}</span>
                    </div>
                  )}
                  {data.school.phone && (
                    <div className="r5-info-item">
                      <span className="r5-info-label">Tel</span>
                      <span className="r5-info-value">{data.school.phone}</span>
                    </div>
                  )}
                  {data.school.email && (
                    <div className="r5-info-item">
                      <span className="r5-info-label">Email</span>
                      <span className="r5-info-value">{data.school.email}</span>
                    </div>
                  )}
                  {data.school.website && (
                    <div className="r5-info-item">
                      <span className="r5-info-label">Website</span>
                      <span className="r5-info-value">{data.school.website}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Term/Year Card */}
              <div className="r5-term-card">
                <div className="r5-term-text">{data.school.term}</div>
                <div className="r5-year-text">{data.school.year}</div>
              </div>
            </div>

            {/* Divider */}
            <div className="r5-header-divider"></div>

            {/* Report Title */}
            <h2 className="r5-report-title">ACADEMIC REPORT CARD</h2>
          </div>

          {/* Student Info */}
          <div className="r5-student-info">
            <table className="r5-info-table">
              <tbody>
                <tr>
                  <td className="r5-label">Student Name:</td>
                  <td className="r5-value">{data.student.name}</td>
                  <td className="r5-label">Class:</td>
                  <td className="r5-value">{data.student.class}</td>
                </tr>
                <tr>
                  <td className="r5-label">Admission No:</td>
                  <td className="r5-value">{data.student.idNo}</td>
                  <td className="r5-label">Stream:</td>
                  <td className="r5-value">{data.student.stream}</td>
                </tr>
                <tr>
                  <td className="r5-label">Gender:</td>
                  <td className="r5-value">{data.student.gender}</td>
                  <td className="r5-label">Term:</td>
                  <td className="r5-value">{data.student.term} {data.student.year}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Subjects Table */}
          <div className="r5-subjects-section">
            <h3 className="r5-section-title">ACADEMIC PERFORMANCE</h3>
            <table className="r5-subjects-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>A1</th>
                  <th>A2</th>
                  <th>A3</th>
                  <th>Total</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((s, i) => (
                  <tr key={i}>
                    <td className="r5-center">{i + 1}</td>
                    <td>{s.name}</td>
                    <td>{s.teacher}</td>
                    <td className="r5-center">{s.a1}</td>
                    <td className="r5-center">{s.a2}</td>
                    <td className="r5-center">{s.a3}</td>
                    <td className="r5-center r5-bold">{s.total}</td>
                    <td className="r5-center r5-grade">{s.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="r5-summary">
            <div className="r5-summary-item">
              <span className="r5-summary-label">Class Average:</span>
              <span className="r5-summary-value">{data.summary.average}%</span>
            </div>
            <div className="r5-summary-item">
              <span className="r5-summary-label">Position:</span>
              <span className="r5-summary-value">{data.summary.position}/{data.summary.outOf}</span>
            </div>
          </div>

          {/* Comments */}
          <div className="r5-comments">
            <div className="r5-comment-box">
              <h4 className="r5-comment-title">Class Teacher's Comment</h4>
              <p className="r5-comment-text">{data.comments.classTeacher}</p>
            </div>
            <div className="r5-comment-box">
              <h4 className="r5-comment-title">Head Teacher's Comment</h4>
              <p className="r5-comment-text">{data.comments.headTeacher}</p>
            </div>
          </div>

          {/* Signatures & Stamp */}
          <div className="r5-footer">
            <div className="r5-sig-section">
              <div className="r5-sig-col">
                {data.staff?.class_teacher_signature ? (
                  <img src={data.staff.class_teacher_signature} alt="Class Teacher Signature" className="r5-sig-image" />
                ) : (
                  <div className="r5-sig-line"></div>
                )}
                <p className="r5-sig-name">{data.admin?.classTeacherName || 'Class Teacher'}</p>
                <p className="r5-sig-title">Class Teacher</p>
              </div>
              <div className="r5-sig-col">
                {data.staff?.headteacher_signature ? (
                  <img src={data.staff.headteacher_signature} alt="Head Teacher Signature" className="r5-sig-image" />
                ) : (
                  <div className="r5-sig-line"></div>
                )}
                <p className="r5-sig-name">{data.admin?.headTeacherName || 'Head Teacher'}</p>
                <p className="r5-sig-title">Head Teacher</p>
              </div>
              <div className="r5-sig-col">
                {data.school_stamp ? (
                  <img src={data.school_stamp} alt="School Stamp" className="r5-stamp-image" />
                ) : (
                  <div className="r5-sig-line"></div>
                )}
                <p className="r5-sig-title">Official Stamp</p>
              </div>
              <div className="r5-sig-col">
                <p className="r5-sig-date">{new Date().toLocaleDateString()}</p>
                <p className="r5-sig-title">Date</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
