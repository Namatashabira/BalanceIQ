import { fetchWithAuth } from '../api';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/core`;

export async function loadReportSettings() {
  try {
    const res = await fetchWithAuth(`${API}/report-settings/`);
    if (!res?.ok) {
      console.warn(`Report settings endpoint returned ${res?.status || 'error'}: ${res?.statusText || 'unknown'}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('Failed to load report settings:', err.message);
  }
  return null;
}

export function mergeReportSettings(defaultData, settings) {
  if (!settings || !defaultData) return defaultData;

  return {
    ...defaultData,
    overall: {
      identifier: settings.overall_grade || defaultData.overall?.identifier || 'OP1',
      achievement: settings.overall_performance || defaultData.overall?.achievement || 'Good',
      grade: settings.overall_grade || defaultData.overall?.grade || 'B',
    },
    summary: {
      ...defaultData.summary,
      result: settings.result || defaultData.summary?.result || 'Pass',
      position: settings.position || defaultData.summary?.position || 0,
      outOf: settings.position_out_of || defaultData.summary?.outOf || 0,
    },
    comments: {
      classTeacher: settings.class_teacher_comment || defaultData.comments?.classTeacher || '',
      headTeacher: settings.head_teacher_comment || defaultData.comments?.headTeacher || '',
    },
    admin: {
      ...defaultData.admin,
      termEnded: settings.term_ended_date || defaultData.admin?.termEnded || new Date().toISOString().split('T')[0],
      nextTerm: settings.next_term_date || defaultData.admin?.nextTerm || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      balance: settings.fees_balance?.replace('UGX ', '') || defaultData.admin?.balance || '0',
      nextFees: settings.next_term_fees?.replace('UGX ', '') || defaultData.admin?.nextFees || '0',
    },
  };
}
