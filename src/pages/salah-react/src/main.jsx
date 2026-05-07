import React from 'react';
import ReactDOM from 'react-dom/client';
import ReportCard from './components/ReportCard';
import './index.css';

const data = {
  school: {
    logo: '',
    name: 'ST. MARK SCHOOLS',
    subtitle: 'PRIMARY & SECONDARY',
    address: 'Kayunga, Uganda',
    phone: '+256 700 123456',
    phone2: '+256 776 987654',
    email: 'info@stmark.sc.ug',
    website: 'www.stmark.sc.ug',
    term: 'TERM 1',
    year: '2026',
  },
  student: {
    photo: '',
    name: 'John Doe',
    gender: 'Male',
    section: 'A',
    class: 'S.5',
    stream: 'Science',
    idNo: '12345',
    payCode: 'PC001',
    term: 'Term 1',
    year: '2026'
  },
  subjects: [
    { code: 'ENG', name: 'English',         scores: [90, 85, 88, 87, 18, 69, 87], grade: 'A', achievement: 'Excellent',  teacher: 'Ms. Smith'    },
    { code: 'BIO', name: 'Biology',          scores: [78, 80, 75, 78, 16, 62, 78], grade: 'B', achievement: 'Very Good',  teacher: 'Mr. Okello'   },
    { code: 'MAT', name: 'Mathematics',      scores: [92, 88, 90, 90, 18, 72, 90], grade: 'A', achievement: 'Excellent',  teacher: 'Mr. Kato'     },
    { code: 'CHE', name: 'Chemistry',        scores: [74, 70, 72, 72, 14, 58, 72], grade: 'B', achievement: 'Very Good',  teacher: 'Ms. Namutebi' },
    { code: 'PHY', name: 'Physics',          scores: [85, 82, 84, 84, 17, 67, 84], grade: 'A', achievement: 'Excellent',  teacher: 'Mr. Ssali'    },
    { code: 'HIS', name: 'History',          scores: [65, 60, 63, 63, 13, 50, 63], grade: 'C', achievement: 'Good',       teacher: 'Ms. Nakato'   },
    { code: 'GEO', name: 'Geography',        scores: [70, 68, 69, 69, 14, 55, 69], grade: 'B', achievement: 'Very Good',  teacher: 'Mr. Mugisha'  },
    { code: 'ICT', name: 'ICT',              scores: [88, 85, 87, 87, 17, 70, 87], grade: 'A', achievement: 'Excellent',  teacher: 'Mr. Tumwine'  },
    { code: 'ENT', name: 'Entrepreneurship', scores: [76, 72, 74, 74, 15, 59, 74], grade: 'B', achievement: 'Very Good',  teacher: 'Ms. Apio'     },
  ],
  assessmentModel: 'A1',
  summary: {
    average: 78,
    total: 100,
    result: 'Pass',
    position: 3,
    outOf: 30
  },
  overall: {
    identifier: 'OP1',
    achievement: 'Very Good',
    grade: 'B'
  },
  comments: {
    classTeacher: 'John has performed very well this term. Keep up the good work!',
    headTeacher: 'Excellent performance. We encourage continued dedication to studies.'
  },
  admin: {
    termEnded: '2026-04-17',
    nextTerm: '2026-05-04',
    balance: '0',
    nextFees: '450,000',
    other: 'School uniform',
    classTeacherName: 'Mr. Ssempala David',
    headTeacherName: 'Mrs. Nankya Patience',
    classTeacherSig: '',
    headTeacherSig: ''
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ReportCard data={data} />
  </React.StrictMode>
);
