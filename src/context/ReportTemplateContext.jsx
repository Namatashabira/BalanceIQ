import { createContext, useContext, useState } from 'react';

const ReportTemplateContext = createContext(null);

export function ReportTemplateProvider({ children }) {
  const [template, setTemplate] = useState('modern');
  return (
    <ReportTemplateContext.Provider value={{ template, setTemplate }}>
      {children}
    </ReportTemplateContext.Provider>
  );
}

export function useReportTemplate() {
  const ctx = useContext(ReportTemplateContext);
  if (!ctx) throw new Error('useReportTemplate must be used within ReportTemplateProvider');
  return ctx;
}
