import { useState, useEffect } from 'react';
import { Save, CheckCircle, BarChart3, Calendar, DollarSign, MessageSquare } from 'lucide-react';
import { fetchWithAuth } from '../api';

const API = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/core`;

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

function SavedBadge({ show }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
      <CheckCircle className="w-3.5 h-3.5" /> Saved
    </span>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
        <Icon className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function ReportSettingsSection() {
  const [settings, setSettings] = useState({
    overall_performance: 'Average',
    overall_grade: 'F',
    result: 'Fail',
    position: 0,
    position_out_of: 0,
    class_teacher_comment: 'No comment available.',
    head_teacher_comment: 'Excellent performance. We encourage continued dedication to studies.',
    term_ended_date: '',
    next_term_date: '',
    fees_balance: 'UGX 0.00',
    next_term_fees: 'UGX 0.00',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithAuth(`${API}/report-settings/`)
      .then(r => r?.json())
      .then(d => {
        if (d) {
          setSettings(prev => ({
            ...prev,
            overall_performance: d.overall_performance || prev.overall_performance,
            overall_grade: d.overall_grade || prev.overall_grade,
            result: d.result || prev.result,
            position: d.position || 0,
            position_out_of: d.position_out_of || 0,
            class_teacher_comment: d.class_teacher_comment || prev.class_teacher_comment,
            head_teacher_comment: d.head_teacher_comment || prev.head_teacher_comment,
            term_ended_date: d.term_ended_date || '',
            next_term_date: d.next_term_date || '',
            fees_balance: d.fees_balance || prev.fees_balance,
            next_term_fees: d.next_term_fees || prev.next_term_fees,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetchWithAuth(`${API}/report-settings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res?.ok) {
        setError('Failed to save. Please try again.');
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-3xl">
      {/* Overall Performance */}
      <Section title="Overall Performance" icon={BarChart3}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Performance Level</label>
            <input
              className={inputCls}
              value={settings.overall_performance}
              onChange={e => setSettings(s => ({ ...s, overall_performance: e.target.value }))}
              placeholder="e.g., Average, Excellent, Good"
            />
          </div>
          <div>
            <label className={labelCls}>Overall Grade</label>
            <input
              className={inputCls}
              value={settings.overall_grade}
              onChange={e => setSettings(s => ({ ...s, overall_grade: e.target.value }))}
              placeholder="e.g., A, B, C, D, E, F"
              maxLength="2"
            />
          </div>
          <div>
            <label className={labelCls}>Result</label>
            <input
              className={inputCls}
              value={settings.result}
              onChange={e => setSettings(s => ({ ...s, result: e.target.value }))}
              placeholder="e.g., Pass, Fail"
            />
          </div>
        </div>
      </Section>

      {/* Position */}
      <Section title="Class Position" icon={BarChart3}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Position</label>
            <input
              type="number"
              className={inputCls}
              value={settings.position}
              onChange={e => setSettings(s => ({ ...s, position: parseInt(e.target.value) || 0 }))}
              placeholder="e.g., 1"
              min="0"
            />
          </div>
          <div>
            <label className={labelCls}>Out of (Total Students)</label>
            <input
              type="number"
              className={inputCls}
              value={settings.position_out_of}
              onChange={e => setSettings(s => ({ ...s, position_out_of: parseInt(e.target.value) || 0 }))}
              placeholder="e.g., 50"
              min="0"
            />
          </div>
        </div>
      </Section>

      {/* Comments */}
      <Section title="Teacher Comments" icon={MessageSquare}>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Class Teacher Comment</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows="3"
              value={settings.class_teacher_comment}
              onChange={e => setSettings(s => ({ ...s, class_teacher_comment: e.target.value }))}
              placeholder="Enter class teacher's comment"
            />
          </div>
          <div>
            <label className={labelCls}>Head Teacher Comment</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows="3"
              value={settings.head_teacher_comment}
              onChange={e => setSettings(s => ({ ...s, head_teacher_comment: e.target.value }))}
              placeholder="Enter head teacher's comment"
            />
          </div>
        </div>
      </Section>

      {/* Administrative Information */}
      <Section title="Administrative Information" icon={Calendar}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Term Ended Date</label>
            <input
              type="date"
              className={inputCls}
              value={settings.term_ended_date}
              onChange={e => setSettings(s => ({ ...s, term_ended_date: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Next Term Date</label>
            <input
              type="date"
              className={inputCls}
              value={settings.next_term_date}
              onChange={e => setSettings(s => ({ ...s, next_term_date: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Fees Balance</label>
            <input
              className={inputCls}
              value={settings.fees_balance}
              onChange={e => setSettings(s => ({ ...s, fees_balance: e.target.value }))}
              placeholder="e.g., UGX 0.00"
            />
          </div>
          <div>
            <label className={labelCls}>Next Term Fees</label>
            <input
              className={inputCls}
              value={settings.next_term_fees}
              onChange={e => setSettings(s => ({ ...s, next_term_fees: e.target.value }))}
              placeholder="e.g., UGX 0.00"
            />
          </div>
        </div>
      </Section>

      {/* Save button */}
      <div className="flex items-center gap-3 justify-end">
        {error && <p className="text-xs text-red-500 mr-auto">{error}</p>}
        <SavedBadge show={saved} />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Report Settings'}
        </button>
      </div>
    </form>
  );
}
