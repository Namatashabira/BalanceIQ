import { fetchWithAuth } from '../api';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api');
const STUDENTS_API = `${API}/school`;
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '');

function resolvePhoto(photo) {
  if (!photo) return null;
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  return `${BASE_URL}${photo.startsWith('/') ? '' : '/'}${photo}`;
}

/**
 * Fetch all school data from BusinessSettings
 */
export async function fetchSchoolData() {
  try {
    const res = await fetchWithAuth(`${API}/core/business-settings/`);
    if (!res?.ok) throw new Error('Failed to fetch business settings');
    
    const data = await res.json();
    return {
      name: data.business_name || data.businessName || 'School Name',
      motto: data.motto || '',
      poBox: data.po_box || data.poBox || '',
      regNumber: data.registration_number || data.registrationNumber || '',
      phone: data.phone || '',
      email: data.email || '',
      website: data.website || '',
      location: data.location || '',
      town: data.town || '',
      district: data.district || '',
      headteacher_name: data.headteacher_name || 'Head Teacher',
      class_teacher_name: data.class_teacher_name || 'Class Teacher',
      headteacher_signature: data.headteacher_signature || null,
      class_teacher_signature: data.class_teacher_signature || null,
      school_stamp: data.school_stamp || null,
      term_ended_date: data.term_ended_date || new Date().toISOString().split('T')[0],
      next_term_date: data.next_term_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      next_term_fees: data.next_term_fees || '0',
    };
  } catch (err) {
    console.warn('[fetchSchoolData] Error:', err.message);
    return {
      name: 'School Name',
      motto: '',
      poBox: '',
      regNumber: '',
      phone: '',
      email: '',
      website: '',
      location: '',
      town: '',
      district: '',
      headteacher_name: 'Head Teacher',
      class_teacher_name: 'Class Teacher',
      headteacher_signature: null,
      class_teacher_signature: null,
      school_stamp: null,
      term_ended_date: new Date().toISOString().split('T')[0],
      next_term_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      next_term_fees: '0',
    };
  }
}

/**
 * Build complete report data with all school information
 */
export async function buildCompleteReportData(student, term, academicYear, logo, schoolInfo, reportSettings) {
  console.log('[buildCompleteReportData] Starting for student:', { id: student.id, name: `${student.first_name} ${student.last_name}` });

  // Fetch fresh school data
  const schoolData = await fetchSchoolData();
  console.log('[buildCompleteReportData] School data fetched:', schoolData);

  // Fetch marks
  const markParams = new URLSearchParams({ student: student.id, term, academic_year: academicYear });
  let marks = [];
  try {
    const marksRes = await fetchWithAuth(`${STUDENTS_API}/marks/?${markParams}`);
    if (marksRes?.ok) {
      const md = await marksRes.json();
      marks = Array.isArray(md) ? md : (md?.results || []);
    }
  } catch (err) {
    console.warn('[buildCompleteReportData] Error fetching marks:', err.message);
  }

  // Fetch staff data
  let staffData = { headteacher: null };
  let teacherMap = {};
  try {
    const staffRes = await fetchWithAuth(`${API}/staff/staff/?page_size=500`);
    if (staffRes?.ok) {
      const staffList = await staffRes.json();
      const staff = Array.isArray(staffList) ? staffList : (staffList?.results || []);
      
      const headteacher = staff.find(s => s.main_role === 'headteacher');
      if (headteacher) {
        staffData.headteacher = {
          name: headteacher.display_name_on_reports || headteacher.full_name || 'Head Teacher',
          title: headteacher.report_title || 'HEAD TEACHER',
          signature: headteacher.profile_signature || null,
        };
      }

      const studentClass = student.class_assigned;
      const classTeachers = staff.filter(s => {
        if (!s.subjects_taught || !Array.isArray(s.subjects_taught) || s.subjects_taught.length === 0) return false;
        if (!s.classes_assigned || !Array.isArray(s.classes_assigned) || s.classes_assigned.length === 0) return true;
        return s.classes_assigned.some(cls => {
          const normalizedClass = cls?.replace(/\./g, '').toLowerCase();
          const normalizedStudentClass = studentClass?.replace(/\./g, '').toLowerCase();
          return normalizedClass === normalizedStudentClass;
        });
      });

      classTeachers.forEach(s => {
        if (s.subjects_taught && Array.isArray(s.subjects_taught)) {
          s.subjects_taught.forEach(subject => {
            teacherMap[subject] = s.full_name || 'Teacher';
          });
        }
      });
    }
  } catch (err) {
    console.warn('[buildCompleteReportData] Error fetching staff:', err.message);
  }

  // Process subjects
  const GRADE_SCALE = [
    { min: 80, grade: 'A' }, { min: 70, grade: 'B' }, { min: 60, grade: 'C' },
    { min: 50, grade: 'D' }, { min: 40, grade: 'E' }, { min: 0, grade: 'F' },
  ];
  const getGrade = (score) => (GRADE_SCALE.find(g => score >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1]).grade;
  const REMARK_MAP = { A: 'Excellent', B: 'Good', C: 'Satisfactory', D: 'Needs Improvement', E: 'Poor', F: 'Fail' };

  const marksWithScores = marks.filter(m => {
    const a1 = m.a1_score ?? 0;
    const a2 = m.a2_score ?? 0;
    const a3 = m.a3_score ?? 0;
    return a1 > 0 || a2 > 0 || a3 > 0;
  });

  const subjects = marksWithScores.map(m => {
    const a1 = m.a1_score ?? 0;
    const a2 = m.a2_score ?? 0;
    const a3 = m.a3_score ?? 0;
    const assessmentAvg = (a1 + a2) / 2;
    const total = (assessmentAvg * 0.2) + (a3 * 0.8);
    const grade = m.grade || getGrade(total);
    const teacherName = teacherMap[m.subject] || m.teacher_name || 'N/A';
    
    return {
      subject_name: m.subject,
      code: m.subject?.substring(0, 3).toUpperCase() || 'N/A',
      name: m.subject,
      a1_score: a1,
      a2_score: a2,
      a3_score: a3,
      scores: [a1, a2, a3, assessmentAvg, assessmentAvg * 0.2, a3 * 0.8, total],
      score: total,
      grade,
      remark: REMARK_MAP[grade] || '',
      achievement: REMARK_MAP[grade] || '',
      competency: m.competency || '',
      teacher: teacherName,
    };
  });

  // Fetch AI comment
  let aiComment = '';
  try {
    const aiRes = await fetchWithAuth(`${API}/ai-comments/generate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.id, term, academic_year: academicYear }),
    });
    if (aiRes?.ok) {
      const aiData = await aiRes.json();
      aiComment = aiData.comment || '';
    }
  } catch (err) {
    console.warn('[buildCompleteReportData] Error fetching AI comment:', err.message);
  }

  const guardians = (student.guardians || []).map(g => ({ full_name: g.full_name, relationship: g.relationship, phone: g.phone, email: g.email || '' }));
  const history = student.history || [];

  // Build complete report data
  const reportData = {
    school: {
      name: schoolData.name,
      logo: logo || null,
      address: [schoolData.poBox, schoolData.location, schoolData.town].filter(Boolean).join(' · ') || '',
      motto: schoolData.motto,
      phone: schoolData.phone,
      email: schoolData.email,
      website: schoolData.website,
      stamp: schoolData.school_stamp,
      term: term || 'Term 1',
      year: academicYear || '2024',
      subtitle: 'PRIMARY & SECONDARY',
      phone2: schoolData.phone,
      po_box: schoolData.poBox,
      poBox: schoolData.poBox,
      registration_number: schoolData.regNumber,
      regNumber: schoolData.regNumber,
      location: schoolData.location,
      town: schoolData.town,
      district: schoolData.district,
    },
    student: {
      full_name: `${student.first_name} ${student.last_name}`,
      name: `${student.first_name} ${student.last_name}`,
      admission_number: student.admission_number || '—',
      idNo: student.admission_number || '—',
      class_or_grade: student.class_assigned || '—',
      class: student.class_assigned || '—',
      stream: student.stream_name || student.stream || '—',
      section: student.stream_name || student.stream || 'A',
      gender: student.gender || '—',
      nationality: student.nationality || '—',
      district: student.district || '—',
      home_address: student.home_address || '',
      enrollment_date: student.enrollment_date || '',
      status: student.status || 'active',
      index_number: student.index_number || '',
      payCode: student.index_number || '',
      previous_school: student.previous_school || '',
      fees_balance: student.fees_balance ?? 0,
      payment_status: student.payment_status || 'not_paid',
      photo: resolvePhoto(student.photo) || null,
      guardians,
      term: term || 'Term 1',
      year: academicYear || '2024',
    },
    subjects,
    attendance: history.filter(h => h.history_type === 'attendance').map(h => ({ title: h.title, description: h.description, date: h.date })),
    notes: history.filter(h => h.history_type === 'note').map(h => ({ title: h.title, description: h.description, date: h.date })),
    ai_comment: aiComment,
    metadata: { term, academic_year: academicYear },
    staff: {
      headteacher_name: staffData.headteacher?.name || schoolData.headteacher_name,
      headteacher_signature: staffData.headteacher?.signature || schoolData.headteacher_signature,
      headteacher_title: staffData.headteacher?.title || 'Head Teacher',
      class_teacher_name: schoolData.class_teacher_name,
      class_teacher_signature: schoolData.class_teacher_signature,
    },
    school_stamp: schoolData.school_stamp,
    fees: {
      next_term_fees: schoolData.next_term_fees,
      term_ended_date: schoolData.term_ended_date,
      next_term_date: schoolData.next_term_date,
    },
    admin: {
      termEnded: schoolData.term_ended_date,
      nextTerm: schoolData.next_term_date,
      balance: String(student.fees_balance ?? 0),
      nextFees: schoolData.next_term_fees,
      classTeacherName: schoolData.class_teacher_name,
      headTeacherName: schoolData.headteacher_name,
    },
    summary: {
      position: 0,
      outOf: 0,
      average: subjects.length > 0 ? Math.round(subjects.reduce((sum, s) => sum + s.score, 0) / subjects.length) : 0,
      total: 100,
      result: 'Pass',
    },
    overall: {
      identifier: 'OP1',
      achievement: 'Very Good',
      grade: 'B',
    },
    comments: {
      classTeacher: aiComment || 'No comment available',
      headTeacher: 'Excellent performance. We encourage continued dedication to studies.',
    },
    assessmentModel: 'A1',
  };

  console.log('[buildCompleteReportData] Report data built successfully:', {
    studentName: reportData.student.full_name,
    subjectsCount: reportData.subjects.length,
    schoolName: reportData.school.name,
    headteacherName: reportData.staff.headteacher_name,
    classTeacherName: reportData.staff.class_teacher_name,
    hasStamp: !!reportData.school_stamp,
    hasHeadteacherSig: !!reportData.staff.headteacher_signature,
    hasClassTeacherSig: !!reportData.staff.class_teacher_signature,
    adminData: reportData.admin,
    staffData: reportData.staff,
  });
  return reportData;
}
