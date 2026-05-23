import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import Report1 from './new report templates/report1';
import Report2 from './new report templates/report2';
import Report3 from './new report templates/report3';
import Report4 from './new report templates/report4';
import Report5 from './new report templates/report5';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api');
const STUDENTS_API = `${API}/school`;

const TEMPLATE_MAP = {
  report1: Report1,
  report2: Report2,
  report3: Report3,
  report4: Report4,
  report5: Report5,
};

export default function VerifyReportPage() {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('id');
  const studentClass = searchParams.get('class');
  const studentName = searchParams.get('name');
  const template = searchParams.get('template') || 'report1';
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [studentId, studentClass, studentName, template]);

  async function fetchReport() {
    setLoading(true);
    setError('');
    
    try {
      if (!studentId || !studentClass || !studentName) {
        setError('Invalid QR code: Missing required information');
        setLoading(false);
        return;
      }

      const res = await fetch(`${STUDENTS_API}/public-students/?admission_number=${studentId}`);
      if (!res?.ok) {
        setError('Student record not found');
        setLoading(false);
        return;
      }

      const data = await res.json();
      const students = Array.isArray(data) ? data : (data?.results || []);
      
      if (students.length === 0) {
        setError('Student record not found in database');
        setLoading(false);
        return;
      }

      const student = students[0];
      
      if (
        student.admission_number === studentId &&
        student.class_assigned === studentClass
      ) {
        const fullRes = await fetch(`${STUDENTS_API}/public-students/${student.id}/`);
        if (fullRes?.ok) {
          const fullStudent = await fullRes.json();
          const builtData = buildReportData(fullStudent);
          setReportData(builtData);
        } else {
          setError('Failed to load complete student data');
        }
      } else {
        setError('Report verification failed: Details do not match');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(`Verification error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function buildReportData(student) {
    const subjects = (student.subjects || []).map(s => {
      const a1 = s.a1_score || 0;
      const a2 = s.a2_score || 0;
      const a3 = s.a3_score || 0;
      const assessmentAvg = (a1 + a2) / 2;
      const total = (assessmentAvg * 0.2) + (a3 * 0.8);
      return {
        code: s.subject_code || 'N/A',
        name: s.subject_name || 'Subject',
        scores: [a1, a2, a3, assessmentAvg, assessmentAvg * 0.2, a3 * 0.8, total],
        grade: s.grade || 'B',
        achievement: s.achievement || s.remark || 'Good',
        teacher: s.teacher || 'Teacher',
      };
    });

    return {
      school: {
        logo: '',
        name: 'School Name',
        subtitle: 'PRIMARY & SECONDARY',
        address: 'Address',
        phone: '+256 700 000000',
        phone2: '+256 776 000000',
        email: 'info@school.ug',
        website: 'www.school.ug',
        term: 'Term 1',
        year: new Date().getFullYear().toString(),
      },
      student: {
        photo: '',
        name: `${student.first_name} ${student.last_name}`,
        gender: student.gender || 'N/A',
        section: student.stream || 'N/A',
        class: student.class_assigned || 'N/A',
        stream: student.stream_name || 'N/A',
        idNo: student.admission_number || 'N/A',
        payCode: student.index_number || 'N/A',
        term: 'Term 1',
        year: new Date().getFullYear().toString(),
      },
      subjects: subjects.length > 0 ? subjects : [],
      assessmentModel: 'A1',
      summary: {
        average: subjects.length > 0 ? Math.round(subjects.reduce((sum, s) => sum + s.scores[6], 0) / subjects.length) : 0,
        total: 100,
        result: 'Pass',
        position: student.position || 0,
        outOf: student.class_size || 0,
      },
      overall: {
        identifier: 'OP1',
        achievement: 'Very Good',
        grade: 'B',
      },
      comments: {
        classTeacher: student.class_teacher_comment || 'No comment available',
        headTeacher: student.head_teacher_comment || 'No comment available',
      },
      admin: {
        termEnded: new Date().toISOString().split('T')[0],
        nextTerm: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        balance: '0',
        nextFees: '0',
        classTeacherName: 'Class Teacher',
        headTeacherName: 'Head Teacher',
      },
      staff: {
        headteacher_name: 'Head Teacher',
        headteacher_title: 'HEAD TEACHER',
        headteacher_signature: '',
      },
      metadata: {
        term: 'Term 1',
        academic_year: new Date().getFullYear().toString(),
      },
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="max-w-md mx-auto mt-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
              <AlertCircle className="w-12 h-12 mx-auto mb-3" />
              <h1 className="text-2xl font-bold text-center">Report Not Found</h1>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-medium mb-2">Unable to Load Report</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-gray-600 text-sm">
                  If you believe this is an error, please contact the school administration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const PreviewComponent = TEMPLATE_MAP[template] || TEMPLATE_MAP.report1;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Report</h1>
              <p className="text-sm text-gray-600 mt-1">
                {reportData?.student?.name} • {reportData?.student?.class}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
            >
              🖨 Print / Save PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <PreviewComponent data={reportData} />
        </div>
      </div>
    </div>
  );
}
