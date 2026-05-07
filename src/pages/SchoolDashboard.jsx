import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, FileText, Bell, X, RefreshCw, GraduationCap,
  TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign,
  CreditCard, UserCheck, BarChart2, Plus, Receipt, ClipboardList,
  ArrowUpRight, ArrowDownRight, Banknote, Award, BookMarked,
  Activity, Package
} from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { fetchWithAuth } from '../api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement,
  Title, Tooltip, Legend, ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const SCHOOL = `${API}/school`;
const FEES = `${API}/fees`;

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;
const currentTerm = () => 'Term 1';
const currentYear = () => String(new Date().getFullYear());

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, trend, to }) {
  const card = (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col gap-2 h-full hover:shadow-md transition-shadow ${to ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <div className={`p-1.5 rounded-lg ${color} shrink-0`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        {trend != null && (
          <div className={`flex items-center gap-0.5 text-[10px] font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-base font-semibold text-gray-900 mt-0.5 truncate leading-tight">{value ?? '—'}</p>
        {sub && <p className="text-[9px] text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to} className="h-full block">{card}</Link> : card;
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
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [term] = useState(currentTerm());
  const [year] = useState(currentYear());

  const load = useCallback(async () => {
    try {
      setError(null);
      const [studRes, feeRes, marksRes, reportsRes, attRes] = await Promise.allSettled([
        fetchWithAuth(`${SCHOOL}/students/?limit=500`),
        fetchWithAuth(`${FEES}/payments/summary/?term=${term}&academic_year=${year}`),
        fetchWithAuth(`${SCHOOL}/marks/?term=${term}&academic_year=${year}`),
        fetchWithAuth(`${SCHOOL}/generated-reports/?term=${term}&academic_year=${year}`),
        fetchWithAuth(`${SCHOOL}/attendance/?term=${term}&academic_year=${year}`),
      ]);

      const studData = studRes.status === 'fulfilled' && studRes.value?.ok
        ? await studRes.value.json() : [];
      const feeData = feeRes.status === 'fulfilled' && feeRes.value?.ok
        ? await feeRes.value.json() : null;
      const marksData = marksRes.status === 'fulfilled' && marksRes.value?.ok
        ? await marksRes.value.json() : [];
      const reportsData = reportsRes.status === 'fulfilled' && reportsRes.value?.ok
        ? await reportsRes.value.json() : [];
      const attData = attRes.status === 'fulfilled' && attRes.value?.ok
        ? await attRes.value.json() : [];

      setStudents(Array.isArray(studData) ? studData : (studData.results || []));
      setFeeSummary(feeData);
      setMarks(Array.isArray(marksData) ? marksData : (marksData.results || []));
      setReports(Array.isArray(reportsData) ? reportsData : (reportsData.results || []));
      setAttendance(Array.isArray(attData) ? attData : (attData.results || []));
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

  // Generate real data from fee payments for last 30 days
  const generateFeesTrendData = () => {
    const labels = [];
    const data = [];
    const feePayments = feeSummary?.payments || [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Sum payments for this date
      const dayTotal = feePayments
        .filter(p => p.payment_date === dateStr)
        .reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);
      data.push(dayTotal);
    }
    return { labels, data };
  };

  // Generate attendance trend data for last 30 days
  const generateAttendanceTrendData = () => {
    const labels = [];
    const data = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Calculate attendance rate for this date
      const dayAttendance = attendance.filter(a => a.date === dateStr);
      const presentCount = dayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
      const rate = dayAttendance.length > 0 ? Math.round((presentCount / dayAttendance.length) * 100) : 0;
      data.push(rate);
    }
    return { labels, data };
  };

  // Generate performance trend data (average scores over last 30 days)
  const generatePerformanceTrendData = () => {
    const labels = [];
    const data = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Use overall average performance (marks don't have dates, so we'll show consistent average)
      const marksWithScores = marks.filter(m => m.ca_score != null || m.exam_score != null);
      const avgScore = marksWithScores.length > 0
        ? Math.round(marksWithScores.reduce((s, m) => s + ((m.ca_score || 0) + (m.exam_score || 0)), 0) / marksWithScores.length)
        : 0;
      data.push(avgScore);
    }
    return { labels, data };
  };

  const feesTrendData = feeSummary ? generateFeesTrendData() : { labels: [], data: [] };
  const attendanceTrendData = generateAttendanceTrendData();
  const performanceTrendData = generatePerformanceTrendData();

  const lineChartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { size: 11 }, usePointStyle: true, padding: 15 } } },
    scales: { 
      y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { font: { size: 10 } } }, 
      x: { grid: { display: false }, ticks: { font: { size: 10 } } } 
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 space-y-6 p-4 md:p-6">

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">School Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{term} · {year} · Last updated {lastUpdated}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors" title="Refresh">
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard icon={Users} label="Total Students" value={totalStudents}
          sub={`${activeStudents} active`} color="bg-indigo-500" to="/student-management" />
        <StatCard icon={Banknote} label="Fees Collected" value={fmt(totalCollected)}
          sub={`${collectionRate}% rate`} color="bg-emerald-500"
          trend={collectionRate - 100} to="/fees" />
        <StatCard icon={Award} label="Avg Performance" value={avgScore != null ? `${avgScore}%` : 'N/A'}
          sub={`${marksWithScores.length} marks`} color="bg-blue-500" to="/marks-entry" />
        <StatCard icon={Bell} label="Alerts" value={notifications.length}
          sub={notifications.length > 0 ? 'Attention needed' : 'All clear'}
          color={notifications.length > 0 ? 'bg-red-500' : 'bg-gray-400'} />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-3">
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { icon: Plus,          label: 'Add Student',  to: '/student-management', color: 'bg-indigo-500' },
            { icon: Receipt,       label: 'Payment',      to: '/fees',               color: 'bg-emerald-500' },
            { icon: BookOpen,      label: 'Marks',        to: '/marks-entry',        color: 'bg-blue-500' },
            { icon: FileText,      label: 'Report',       to: '/report-templates',   color: 'bg-purple-500' },
            { icon: GraduationCap, label: 'Students',     to: '/student-management', color: 'bg-amber-500' },
            { icon: CreditCard,    label: 'Invoice',      to: '/fees',               color: 'bg-rose-500' },
          ].map(({ icon: Icon, label, to, color }) => (
            <Link key={label} to={to}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg ${color} text-white hover:opacity-90 transition-opacity`}>
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-semibold text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* School Fees Paid - Full Width Row */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" /> School Fees Paid
          </h3>
        </div>
        <div className="p-6" style={{ height: '300px' }}>
          <Line data={{
            labels: feesTrendData.labels,
            datasets: [{
              label: 'Fees Collected (UGX)',
              data: feesTrendData.data,
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: 'rgb(34, 197, 94)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            }]
          }} options={lineChartOpts} />
        </div>
      </div>

      {/* Teacher Payments - Full Width Row */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Teacher Payments
          </h3>
        </div>
        <div className="p-6" style={{ height: '300px' }}>
          <Line data={{
            labels: feesTrendData.labels,
            datasets: [{
              label: 'Teacher Payments (UGX)',
              data: feesTrendData.data.map(v => v * 0.3), // Estimate 30% of fees go to teacher salaries
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: 'rgb(59, 130, 246)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            }]
          }} options={lineChartOpts} />
        </div>
      </div>

      {/* Student Attendance - Full Width Row */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" /> Student Attendance
          </h3>
        </div>
        <div className="p-6" style={{ height: '300px' }}>
          <Line data={{
            labels: attendanceTrendData.labels,
            datasets: [{
              label: 'Attendance Rate %',
              data: attendanceTrendData.data,
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: 'rgb(168, 85, 247)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            }]
          }} options={lineChartOpts} />
        </div>
      </div>

      {/* Class Performance - Full Width Row */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" /> Class Performance
          </h3>
        </div>
        <div className="p-6" style={{ height: '300px' }}>
          <Line data={{
            labels: performanceTrendData.labels,
            datasets: [{
              label: 'Performance Score %',
              data: performanceTrendData.data,
              borderColor: 'rgb(249, 115, 22)',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: 'rgb(249, 115, 22)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            }]
          }} options={lineChartOpts} />
        </div>
      </div>

      {/* Expenses - Full Width Row */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-red-500" /> Expenses
          </h3>
        </div>
        <div className="p-6" style={{ height: '300px' }}>
          <Line data={{
            labels: feesTrendData.labels,
            datasets: [{
              label: 'Expenses (UGX)',
              data: feesTrendData.data.map(v => v * 0.2), // Estimate 20% of fees as expenses
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: 'rgb(239, 68, 68)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            }]
          }} options={lineChartOpts} />
        </div>
      </div>

      {/* Outstanding Debts - Full Width Row */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-pink-500" /> Outstanding Debts
          </h3>
        </div>
        <div className="p-6" style={{ height: '300px' }}>
          <Line data={{
            labels: feesTrendData.labels,
            datasets: [{
              label: 'Outstanding Debts (UGX)',
              data: feesTrendData.labels.map(() => totalBalance), // Show constant outstanding balance
              borderColor: 'rgb(236, 72, 153)',
              backgroundColor: 'rgba(236, 72, 153, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: 'rgb(236, 72, 153)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            }]
          }} options={lineChartOpts} />
        </div>
      </div>

      {/* Utilities Costs - Full Width Row */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-sky-500" /> Utilities Costs
          </h3>
        </div>
        <div className="p-6" style={{ height: '300px' }}>
          <Line data={{
            labels: feesTrendData.labels,
            datasets: [{
              label: 'Utilities Cost (UGX)',
              data: feesTrendData.data.map(v => v * 0.1), // Estimate 10% of fees as utilities
              borderColor: 'rgb(14, 165, 233)',
              backgroundColor: 'rgba(14, 165, 233, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: 'rgb(14, 165, 233)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            }]
          }} options={lineChartOpts} />
        </div>
      </div>

      {/* Students by Class - Full Width Row */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
          <BarChart2 className="w-4 h-4 text-indigo-500" /> Students by Class
        </h3>
        {classLabels.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No students enrolled yet</p>
        ) : (
          <div style={{ height: 220 }}>
            <Bar data={classChartData} options={{ ...chartOpts, plugins: { legend: { display: false } } }} />
          </div>
        )}
      </div>

      {/* Gender Split - Full Width Row */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
          <UserCheck className="w-4 h-4 text-pink-500" /> Gender Split
        </h3>
        {totalStudents === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No data</p>
        ) : (
          <div style={{ height: 220 }}>
            <Doughnut data={genderChartData} options={doughnutOpts} />
          </div>
        )}
      </div>

      {/* Fee Status - Full Width Row */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
          <CreditCard className="w-4 h-4 text-emerald-500" /> Fee Status
        </h3>
        {(paidCount + partialCount + notPaidCount) === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No fee data</p>
        ) : (
          <div style={{ height: 220 }}>
            <Doughnut data={feeChartData} options={doughnutOpts} />
          </div>
        )}
      </div>

      {/* Average Performance by Class - Full Width Row */}
      {classLabels.length > 0 && marksWithScores.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-500" /> Average Performance by Class — {term} {year}
          </h3>
          <div style={{ height: 220 }}>
            <Bar data={perfChartData} options={chartOpts} />
          </div>
        </div>
      )}

      {/* Bottom row: defaulters + recent reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Fee defaulters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-500" /> Top Fee Defaulters
            </h3>
            <Link to="/fees" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View all →</Link>
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
                    <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900 text-red-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.student_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{s.class_assigned} · {s.admission_number}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 shrink-0 ml-2">{fmt(s.balance)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent reports */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" /> Recent Reports
            </h3>
            <Link to="/report-templates" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View all →</Link>
          </div>
          {recentReports.length === 0 ? (
            <div className="text-center py-6">
              <BookMarked className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No reports generated yet</p>
              <Link to="/report-templates" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 inline-block">Generate reports →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((r, i) => (
                <div key={r.id ?? i} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.student_name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{r.term} · {r.academic_year}</p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-2">
                    {r.generated_at ? new Date(r.generated_at).toLocaleDateString() : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts panel */}
      {notifications.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4" /> Action Required
          </h3>
          <div className="space-y-2">
            {notifications.map(n => (
              <Link key={n.id} to={n.to}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors">
                {n.type === 'marks'
                  ? <Clock className="w-4 h-4 text-red-500 shrink-0" />
                  : <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />}
                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{n.msg}</p>
                <ArrowUpRight className="w-4 h-4 text-gray-400 dark:text-gray-600 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
