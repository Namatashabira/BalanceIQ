import { X, Printer, Download } from 'lucide-react';
import { useState } from 'react';
import { TEMPLATE_MAP } from '../pages/ReportTemplatesPage';

export function ReportPreviewModal({ isOpen, onClose, templateId, templateName, data }) {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const PreviewComponent = TEMPLATE_MAP[templateId];
  if (!PreviewComponent) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleDownloadPDF = () => {
    // This would require html2pdf or similar library
    console.log('Download PDF functionality - implement with html2pdf');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity print:hidden"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{templateName}</h2>
              <p className="text-sm text-gray-500 mt-1">Preview with sample data</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-auto bg-gray-50 p-6">
            <div className="flex justify-center">
              <div className="bg-white rounded-lg shadow-sm p-8 w-full lg:max-w-2xl">
                {data && <PreviewComponent data={data} />}
              </div>
            </div>
          </div>

          {/* Footer - Action Buttons */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 shrink-0">
            <p className="text-sm text-gray-600">
              Use <strong>Print</strong> to save as PDF or print directly
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Printer className="w-4 h-4" />
                {isPrinting ? 'Printing...' : 'Print / Save'}
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .fixed,
          .print\\:hidden,
          [class*="print:hidden"] {
            display: none !important;
          }
          .bg-gray-50,
          .bg-gray-100 {
            background-color: white !important;
          }
        }
      `}</style>
    </>
  );
}
