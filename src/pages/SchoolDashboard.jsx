import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, FileText, Bell, X, RefreshCw, GraduationCap,
  TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign,
  CreditCard, UserCheck, BarChart2, Plus, Receipt, ClipboardList,
  ArrowUpRight, ArrowDownRight, Banknote, Award, BookMarked
} from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { fetchWithAuth } from '../api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const SCHOOL = `${API}/school`;
const FEES = `${API}/fees`;

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;
const currentTerm = () => 'Term 1';
const currentYear = () => String(new Date().getFullYear());

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, trend, to }) {
  const card = (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow ${to ? 'cursor-pointer' : ''}`}>
      <div className={`p-3 rounded-xl ${color} shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      {trend != null && (
        <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

// ── Quick action button ───────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, to, color }) {
  return (
    <Link to={to} className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${color} text-white hover:opacity-90 transition-opacity`}>
      <Icon className="w-6 h-6" />
      <span className="text-xs font-semibold text-center leading-tight">{label}</span>
    </Link>
  );
}

export default function SchoolDashboard() {
  const [students, setStudents] = useState([]);
  const [feeSummary, setFeeSummary] = useState(null);
  const [marks, setMarks] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [term] = useState(currentTerm());
  const [year] = useState(currentYear());

  const load = useCallback(async () => {
    try {
      setError(null);
      const [studRes, feeRes, marksRes, reportsRes] = await Promise.allSettled([
        fetchWithAuth(`${SCHOOL}/students/?limit=500`),
        fetchWithAuth(`${FEES}/payments/summary/?term=${term}&academic_year=${year}`),
        fetchWithAuth(`${SCHOOL}/marks/?term=${term}&academic_year=${year}`),
        fetchWithAuth(`${SCHOOL}/generated-reports/?term=${term}&academic_year=${year}`),
      ]);

      const studData = studRes.status === 'fulfilled' && studRes.value?.ok
        ? await studRes.value.json() : [];
      const feeData = feeRes.status === 'fulfilled' && feeRes.value?.ok
        ? await feeRes.value.json() : null;
      const marksData = marksRes.status === 'fulfilled' && marksRes.value?.ok
        ? await marksRes.value.json() : [];
      const reportsData = reportsRes.status === 'fulfilled' && reportsRes.value?.ok
        ? await reportsRes.value.json() : [];

      setStudents(Array.isArray(studData) ? studData : (studData.results || []));
      setFeeSummary(feeData);
      setMarks(Array.isArray(marksData) ? marksData : (marksData.results || []));
      setReports(Array.isArray(reportsData) ? reportsData : (reportsData.results || []));
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [term, year]);

  useEffect(() => { load(); }, [load]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const maleCount = students.filter(s => s.gender === 'male').length;
  const femaleCount = students.filter(s => s.gender === 'female').length;

  // Class distribution
  const classDist = students.reduce((acc, s) => {
    if (s.class_assigned) acc[s.class_assigned] = (acc[s.class_assigned] || 0) + 1;
    return acc;
  }, {});
  const classLabels = Object.keys(classDist).sort();
  const classCounts = classLabels.map(c => classDist[c]);

  // Fee stats
  const feeTotals = feeSummary?.totals || {};
  const feeStudents = feeSummary?.students || [];
  const totalRequired = feeTotals.required || 0;
  const totalCollected = feeTotals.paid || 0;
  const totalBalance = feeTotals.balance || 0;
  const collectionRate = totalRequired > 0 ? Math.round((totalCollected / totalRequired) * 100) : 0;
  const paidCount = feeTotals.count_paid || 0;
  const partialCount = feeTotals.count_partial || 0;
  const notPaidCount = feeTotals.count_not_paid || 0;

  // Marks / performance
  const marksWithScores = marks.filter(m => m.ca_score != null || m.exam_score != null);
  const avgScore = marksWithScores.length > 0
    ? Math.round(marksWithScores.reduce((s, m) => s + ((m.ca_score || 0) + (m.exam_score || 0)), 0) / marksWithScores.length)
    : null;

  // Performance by class from marks
  const perfByClass = classLabels.reduce((acc, cls) => {
    const classStudentIds = new Set(students.filter(s => s.class_assigned === cls).map(s => s.id));
    const classMarks = marksWithScores.filter(m => classStudentIds.has(m.student));
    if (classMarks.length > 0) {
      acc[cls] = Math.round(classMarks.reduce((s, m) => s + ((m.ca_score || 0) + (m.exam_score || 0)), 0) / classMarks.length);
    } else {
      acc[cls] = 0;
    }
    return acc;
  }, {});

  // Notifications
  const notifications = [];
  if (notPaidCount > 0) notifications.push({ id: 1, type: 'fee', msg: `${notPaidCount} student(s) have not paid fees`, to: '/fees' });
  if (partialCount > 0) notifications.push({ id: 2, type: 'partial', msg: `${partialCount} student(s) have partial fee payments`, to: '/fees' });
  const studentsWithoutMarks = activeStudents - new Set(marks.map(m => m.student)).size;
  if (studentsWithoutMarks > 0) notifications.push({ id: 3, type: 'marks', msg: `${studentsWithoutMarks} active student(s) have no marks entered`, to: '/marks-entry' });

  // ── Charts ────────────────────────────────────────────────────────────────
  const classChartData = {
    labels: classLabels,
    datasets: [{
      label: 'Students',
      data: classCounts,
      backgroundColor: [
        'rgba(99,102,241,0.8)', 'rgba(59,130,246,0.8)', 'rgba(16,185,129,0.8)',
        'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)', 'rgba(168,85,247,0.8)',
      ],
      borderRadius: 6,
    }]
  };

  const perfChartData = {
    labels: classLabels,
    datasets: [{
      label: 'Avg Score',
      data: classLabels.map(c => perfByClass[c] || 0),
      backgroundColor: 'rgba(99,102,241,0.7)',
      borderRadius: 6,
    }]
  };

  const feeChartData = {
    labels: ['Paid', 'Partial', 'Not Paid'],
    datasets: [{
      data: [paidCount, partialCount, notPaidCount],
      backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)'],
      borderWidth: 0,
    }]
  };

  const genderChartData = {
    labels: ['Male', 'Female'],
    datasets: [{
      data: [maleCount, femaleCount],
      backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(236,72,153,0.8)'],
      borderWidth: 0,
    }]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
    scales: { y: { beginAtZero: true, ticks: { font: { size: 11 } } }, x: { ticks: { font: { size: 11 } } } }
  };
  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
    cutout: '65%',
  };

  // ── Recent fee defaulters ─────────────────────────────────────────────────
  const defaulters = feeStudents
    .filter(s => s.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  // ── Recent reports ────────────────────────────────────────────────────────
  const recentReports = reports.slice(0, 5);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-gray-700 mb-3">{error}</p>
        <button onClick={load} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{term} · {year} · Last updated {lastUpdated}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => document.getElementById('school-notif').classList.toggle('hidden')}
              className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500"
            >
              <Bell className={`w-4 h-4 ${notifications.length > 0 ? 'text-red-500' : ''}`} />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            <div id="school-notif" className="hidden absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
              <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                <span className="font-semibold text-sm text-gray-900">Alerts ({notifications.length})</span>
                <button onClick={() => document.getElementById('school-notif').classList.add('hidden')}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-gray-400 text-center">All clear ✓</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map(n => (
                    <Link key={n.id} to={n.to} className="flex items-start gap-3 p-3 hover:bg-gray-50"
                      onClick={() => document.getElementById('school-notif').classList.add('hidden')}>
                      {n.type === 'fee' || n.type === 'partial'
                        ? <DollarSign className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        : <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                      <p className="text-sm text-gray-700">{n.msg}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={totalStudents}
          sub={`${activeStudents} active`} color="bg-indigo-500" to="/student-management" />
        <StatCard icon={Banknote} label="Fees Collected" value={fmt(totalCollected)}
          sub={`${collectionRate}% collection rate`} color="bg-emerald-500"
          trend={collectionRate - 100} to="/fees" />
        <StatCard icon={Award} label="Avg Performance" value={avgScore != null ? `${avgScore}%` : 'No data'}
          sub={`${marksWithScores.length} marks entered`} color="bg-blue-500" to="/marks-entry" />
        <StatCard icon={Bell} label="Pending Alerts" value={notifications.length}
          sub={notifications.length > 0 ? 'Requires attention' : 'All clear'}
          color={notifications.length > 0 ? 'bg-red-500' : 'bg-gray-400'} />
      </div>

      {/* Fee summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Required</p>
          <p className="text-lg font-bold text-gray-900">{fmt(totalRequired)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Outstanding Balance</p>
          <p className="text-lg font-bold text-red-600">{fmt(totalBalance)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reports Generated</p>
          <p className="text-lg font-bold text-indigo-600">{reports.length}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Students by class */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 xl:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
            <BarChart2 className="w-4 h-4 text-indigo-500" /> Students by Class
          </h3>
          {classLabels.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No students enrolled yet</p>
          ) : (
            <div style={{ height: 200 }}>
              <Bar data={classChartData} options={{ ...chartOpts, plugins: { legend: { display: false } } }} />
            </div>
          )}
        </div>

        {/* Gender split */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
            <UserCheck className="w-4 h-4 text-pink-500" /> Gender Split
          </h3>
          {totalStudents === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data</p>
          ) : (
            <div style={{ height: 200 }}>
              <Doughnut data={genderChartData} options={doughnutOpts} />
            </div>
          )}
        </div>

        {/* Fee status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-emerald-500" /> Fee Status
          </h3>
          {(paidCount + partialCount + notPaidCount) === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No fee data</p>
          ) : (
            <div style={{ height: 200 }}>
              <Doughnut data={feeChartData} options={doughnutOpts} />
            </div>
          )}
        </div>
      </div>

      {/* Performance by class */}
      {classLabels.length > 0 && marksWithScores.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-500" /> Average Performance by Class — {term} {year}
          </h3>
          <div style={{ height: 220 }}>
            <Bar data={perfChartData} options={chartOpts} />
          </div>
        </div>
      )}

      {/* Bottom row: defaulters + recent reports + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Fee defaulters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-500" /> Top Fee Defaulters
            </h3>
            <Link to="/fees" className="text-xs text-indigo-600 hover:underline">View all →</Link>
          </div>
          {defaulters.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">All fees cleared!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {defaulters.map((s, i) => (
                <div key={s.student_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.student_name}</p>
                      <p className="text-xs text-gray-400">{s.class_assigned} · {s.admission_number}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-600 shrink-0 ml-2">{fmt(s.balance)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent reports */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" /> Recent Reports
            </h3>
            <Link to="/report-templates" className="text-xs text-indigo-600 hover:underline">View all →</Link>
          </div>
          {recentReports.length === 0 ? (
            <div className="text-center py-6">
              <BookMarked className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No reports generated yet</p>
              <Link to="/report-templates" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">Generate reports →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((r, i) => (
                <div key={r.id ?? i} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.student_name}</p>
                    <p className="text-xs text-gray-400">{r.term} · {r.academic_year}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {r.generated_at ? new Date(r.generated_at).toLocaleDateString() : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-gray-500" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon={Plus} label="Add Student" to="/student-management" color="bg-indigo-500" />
            <QuickAction icon={Receipt} label="Record Payment" to="/fees" color="bg-emerald-500" />
            <QuickAction icon={BookOpen} label="Enter Marks" to="/marks-entry" color="bg-blue-500" />
            <QuickAction icon={FileText} label="Generate Report" to="/report-templates" color="bg-purple-500" />
            <QuickAction icon={GraduationCap} label="Students" to="/student-management" color="bg-amber-500" />
            <QuickAction icon={CreditCard} label="Fee Invoice" to="/fees" color="bg-rose-500" />
          </div>
        </div>
      </div>

      {/* Alerts panel */}
      {notifications.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4" /> Action Required
          </h3>
          <div className="space-y-2">
            {notifications.map(n => (
              <Link key={n.id} to={n.to}
                className="flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-amber-50 transition-colors">
                {n.type === 'marks'
                  ? <Clock className="w-4 h-4 text-red-500 shrink-0" />
                  : <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />}
                <p className="text-sm text-gray-700 flex-1">{n.msg}</p>
                <ArrowUpRight className="w-4 h-4 text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
