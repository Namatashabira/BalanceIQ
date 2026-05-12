import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Printer, Download, Home, MoreVertical } from 'lucide-react';
import { TEMPLATE_MAP } from './ReportTemplatesPage';
import BIQLogo from '../components/BIQLogo';

// Sample report data - same as in ReportTemplatesPage
const SAMPLE = {
  school: { 
    name: "St. Joseph's College Layibi", 
    logo: null, 
    address: 'P.O. Box 123, Gulu, Uganda', 
    motto: 'Knowledge is Power' 
  },
  student: { 
    full_name: 'Nakato Sarah', 
    admission_number: 'ADM/2025/001', 
    class_or_grade: 'S.3', 
    stream: 'East', 
    gender: 'Female', 
    nationality: 'Ugandan', 
    district: 'Kampala', 
    enrollment_date: '2023-02-01', 
    status: 'active', 
    index_number: '', 
    previous_school: "St. Mary's Primary", 
    fees_balance: 120000, 
    payment_status: 'partial', 
    photo: null, 
    guardians: [{ full_name: 'Nakato Grace', relationship: 'Mother', phone: '0701234567' }] 
  },
  subjects: [
    { subject_name: 'Mathematics', score: 78, ca_score: 28, exam_score: 50, grade: 'B', remark: 'Good performance' },
    { subject_name: 'English',     score: 85, ca_score: 35, exam_score: 50, grade: 'A', remark: 'Excellent' },
    { subject_name: 'Biology',     score: 62, ca_score: 22, exam_score: 40, grade: 'C', remark: 'Satisfactory' },
    { subject_name: 'Chemistry',   score: 55, ca_score: 20, exam_score: 35, grade: 'D', remark: 'Needs improvement' },
    { subject_name: 'History',     score: 90, ca_score: 38, exam_score: 52, grade: 'A', remark: 'Outstanding' },
  ],
  attendance: [{ title: 'Term 1 Attendance', description: 'Present 58/60 days', date: '2025-04-30' }],
  notes: [{ title: 'Class Teacher Note', description: 'Sarah is a hardworking student who participates actively in class.', date: '2025-04-30' }],
  metadata: { term: 'Term 1', academic_year: '2025' },
};

const TEMPLATES = [
  { id: 'salah',         name: 'Navy & Gold (New Curriculum)' },
  { id: 'salahv2',       name: 'Navy & Gold + Watermark' },
  { id: 'greenclassic',  name: 'Green & Gold Classic' },
  { id: 'classic2',      name: 'Classic A4' },
  { id: 'classic',       name: 'Classic (Original)' },
  { id: 'modern',        name: 'Modern Card' },
  { id: 'minimal',       name: 'Minimal' },
];

export default function PreviewReportPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isPrinting, setIsPrinting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const templateId = searchParams.get('template') || 'salah';
  const template = TEMPLATES.find(t => t.id === templateId);
  const PreviewComponent = TEMPLATE_MAP[templateId];

  if (!PreviewComponent) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Template Not Found</h1>
          <p className="text-gray-600 mb-4">The template you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/reports')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Home className="w-4 h-4" />
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleDownloadPDF = () => {
    console.log('Download PDF - implement with html2pdf library');
    // Implementation would go here
  };

  const handleSwitchTemplate = (newTemplateId) => {
    navigate(`/preview-report?template=${newTemplateId}`);
    setShowMenu(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header - Fixed */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/reports')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to templates"
              >
                <Home className="w-5 h-5 text-gray-600" />
              </button>
              <div className="border-l border-gray-200 pl-4">
                <h1 className="text-2xl font-bold text-gray-900">{template?.name}</h1>
                <p className="text-sm text-gray-500">Sample preview with demo data</p>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2 relative">
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors sm:px-3 sm:py-1.5"
                title="Print or save as PDF"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">{isPrinting ? 'Printing...' : 'Print'}</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                title="Download as PDF"
              >
                <Download className="w-4 h-4" />
                Download
              </button>

              {/* Template Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors sm:px-3 sm:py-1.5"
                  title="Switch template"
                >
                  <MoreVertical className="w-4 h-4" />
                  <span className="hidden sm:inline">Template</span>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-2 max-h-64 overflow-y-auto">
                      {TEMPLATES.map(tmpl => (
                        <button
                          key={tmpl.id}
                          onClick={() => handleSwitchTemplate(tmpl.id)}
                          className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                            templateId === tmpl.id
                              ? 'bg-indigo-100 text-indigo-900 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {tmpl.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Preview Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
              <div className="flex justify-center">
                {PreviewComponent && <PreviewComponent data={SAMPLE} />}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Info Panel (hidden on small screens) */}
          <aside className="hidden lg:block w-80 space-y-6">
            {/* Template Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Template Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Current Template</p>
                  <p className="font-medium text-gray-900">{template?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Format</p>
                  <p className="font-medium text-gray-900">A4 Portrait</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Sample Data</p>
                  <p className="text-gray-600">Student: {SAMPLE.student.full_name}</p>
                  <p className="text-gray-600">Term: {SAMPLE.metadata.term}</p>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Click "Print" to save as PDF</li>
                <li>• Use "Template" menu to switch designs</li>
                <li>• Responsive on all screen sizes</li>
                <li>• Use Ctrl+P for browser print dialog</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => navigate('/reports')}
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Back to Templates
              </button>
              <button
                onClick={() => navigate('/students')}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                View Real Reports
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Footer */}
      <footer className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2">
          <button
            onClick={() => navigate('/reports')}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 bg-white rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Templates
          </button>
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            Print
          </button>
        </div>
      </footer>

      {/* Add padding for mobile footer */}
      <div className="lg:hidden h-16" />

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          header,
          aside,
          footer,
          .print\\:hidden,
          [class*="print:hidden"] {
            display: none !important;
          }
          main {
            max-width: 100%;
            margin: 0;
            padding: 0;
          }
          .bg-gray-50,
          .bg-gray-100,
          .shadow-md,
          .rounded-lg {
            background-color: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .bg-white {
            background-color: white !important;
          }
        }
      `}</style>
    </div>
  );
}
