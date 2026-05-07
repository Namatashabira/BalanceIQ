import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, DollarSign, UserCheck, TrendingUp, AlertTriangle, RefreshCw,
  Banknote, Award, BookOpen, Clock, CreditCard, Receipt, ArrowUpRight,
  ArrowDownRight, Bell, X, GraduationCap, BarChart3, PieChart, Activity
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { fetchWithAuth } from '../api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const SCHOOL = `${API}/school`;
const FEES = `${API}/fees`;

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;
const currentTerm = () => 'Term 1';
const currentYear = () => String(new Date().getFullYear());

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, trend, to }) {
  const card = (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start gap-3 hover:shadow-md transition-all ${to ? 'cursor-pointer' : ''}`}>
      <div className={`p-2.5 rounded-lg ${color} shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
      </div>
      {trend != null && (
        <div className={`flex items-center gap-0.5 text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

export default function SchoolDashboardNew() {
  const [students, setStudents] = useState([]);
  const [feeSummary, setFeeSummary] = useState(null);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [term] = useState(currentTerm());
  const [year] = useState(currentYear());

  // Mock data for teacher salaries and expenses (replace with real API calls)
  const [teacherSalaries] = useState({ paid: 15000000, pending: 3000000, total: 18000000 });
  const [expenses] = useState({ utilities: 2500000, supplies: 1800000, maintenance: 1200000, other: 800000 });
  const [debts] = useState({ suppliers: 4500000, loans: 8000000, other: 1500000 });

  const load = useCallback(async () => {
    try {
      setError(null);
      const [studRes, feeRes, marksRes, attRes] = await Promise.allSettled([
        fetchWithAuth(`${SCHOOL}/students/?limit=500`),
        fetchWithAuth(`${FEES}/payments/summary/?term=${term}&academic_year=${year}`),
        fetchWithAuth(`${SCHOOL}/marks/?term=${term}&academic_year=${year}`),
        fetchWithAuth(`${SCHOOL}/attendance/?term=${term}&academic_year=${year}`),
      ]);

      const studData = studRes.status === 'fulfilled' && studRes.value?.ok ? await studRes.value.json() : [];
      const feeData = feeRes.status === 'fulfilled' && feeRes.value?.ok ? await feeRes.value.json() : null;
      const marksData = marksRes.status === 'fulfilled' && marksRes.value?.ok ? await marksRes.value.json() : [];
      const attData = attRes.status === 'fulfilled' && attRes.value?.ok ? await attRes.value.json() : [];

      setStudents(Array.isArray(studData) ? studData : (studData.results || []));
      setFeeSummary(feeData);
      setMarks(Array.isArray(marksData) ? marksData : (marksData.results || []));
      setAttendance(Array.isArray(attData) ? attData : (attData.results || []));
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [term, year]);

  useEffect(() => { load(); }, [load]);

  // ── Derived Stats ─────────────────────────────────────────────────────────
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;

  // Class distribution
  const classDist = students.reduce((acc, s) => {
    if (s.class_assigned) acc[s.class_assigned] = (acc[s.class_assigned] || 0) + 1;
    return acc;
  }, {});
  const classLabels = Object.keys(classDist).sort();
  const classCounts = classLabels.map(c => classDist[c]);

  // Fee stats
  const feeTotals = feeSummary?.totals || {};
  const totalRequired = feeTotals.required || 0;
  const totalCollected = feeTotals.paid || 0;
  const totalBalance = feeTotals.balance || 0;
  const collectionRate = totalRequired > 0 ? Math.round((totalCollected / totalRequired) * 100) : 0;

  // Attendance stats
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  // Performance by class
  const marksWithScores = marks.filter(m => m.ca_score != null || m.exam_score != null);
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

  // Teacher salary stats
  const teacherPaidRate = teacherSalaries.total > 0 ? Math.round((teacherSalaries.paid / teacherSalaries.total) * 100) : 0;

  // Total expenses
  const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);

  // Total debts
  const totalDebts = Object.values(debts).reduce((a, b) => a + b, 0);

  // Notifications
  const notifications = [];
  if (totalBalance > 0) notifications.push({ id: 1, msg: `Outstanding fees: ${fmt(totalBalance)}`, to: '/fees' });
  if (teacherSalaries.pending > 0) notifications.push({ id: 2, msg: `Pending teacher salaries: ${fmt(teacherSalaries.pending)}`, to: '/fees' });
  if (absentCount > 5) notifications.push({ id: 3, msg: `${absentCount} students absent today`, to: '/attendance' });

  // ── Charts ────────────────────────────────────────────────────────────────
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { size: 10 } } } },
    scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } }
  };
  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } },
    cutout: '60%',
  };

  // Fee collection chart (Line)
  const feeCollectionData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Fees Collected',
      data: [totalCollected * 0.2, totalCollected * 0.4, totalCollected * 0.7, totalCollected],
      borderColor: 'rgb(16,185,129)',
      backgroundColor: 'rgba(16,185,129,0.1)',
      tension: 0.4,
    }]
  };

  // Teacher salary chart (Bar)
  const teacherSalaryData = {
    labels: ['Paid', 'Pending'],
    datasets: [{
      label: 'Amount (UGX)',
      data: [teacherSalaries.paid, teacherSalaries.pending],
      backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(245,158,11,0.8)'],
      borderRadius: 6,
    }]
  };

  // Attendance chart (Doughnut)
  const attendanceChartData = {
    labels: ['Present', 'Absent'],
    datasets: [{
      data: [presentCount, absentCount],
      backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(239,68,68,0.8)'],
      borderWidth: 0,
    }]
  };

  // Performance by class (Bar)
  const perfChartData = {
    labels: classLabels,
    datasets: [{
      label: 'Avg Score (%)',
      data: classLabels.map(c => perfByClass[c] || 0),
      backgroundColor: 'rgba(99,102,241,0.7)',
      borderRadius: 6,
    }]
  };

  // Expenses breakdown (Doughnut)
  const expensesChartData = {
    labels: ['Utilities', 'Supplies', 'Maintenance', 'Other'],
    datasets: [{
      data: [expenses.utilities, expenses.supplies, expenses.maintenance, expenses.other],
      backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(168,85,247,0.8)', 'rgba(245,158,11,0.8)', 'rgba(156,163,175,0.8)'],
      borderWidth: 0,
    }]
  };

  // Debts breakdown (Doughnut)
  const debtsChartData = {
    labels: ['Suppliers', 'Loans', 'Other'],
    datasets: [{
      data: [debts.suppliers, debts.loans, debts.other],
      backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(245,158,11,0.8)', 'rgba(156,163,175,0.8)'],
      borderWidth: 0,
    }]
  };

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
    <div className="space-y-4 pb-6">

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">{term} · {year} · Last updated {lastUpdated}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => document.getElementById('notif').classList.toggle('hidden')}
              className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <Bell className={`w-4 h-4 ${notifications.length > 0 ? 'text-red-500' : ''}`} />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            <div id="notif" className="hidden absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
              <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                <span className="font-semibold text-xs text-gray-900">Alerts ({notifications.length})</span>
                <button onClick={() => document.getElementById('notif').classList.add('hidden')}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="p-4 text-xs text-gray-400 text-center">All clear ✓</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map(n => (
                    <Link key={n.id} to={n.to} className="flex items-start gap-2 p-3 hover:bg-gray-50 text-xs"
                      onClick={() => document.getElementById('notif').classList.add('hidden')}>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-gray-700">{n.msg}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Users} label="Students" value={totalStudents} sub={`${activeStudents} active`} color="bg-indigo-500" to="/student-management" />
        <StatCard icon={Banknote} label="Fees Collected" value={fmt(totalCollected)} sub={`${collectionRate}% rate`} color="bg-emerald-500" trend={collectionRate - 100} to="/fees" />
        <StatCard icon={CreditCard} label="Teacher Salaries" value={fmt(teacherSalaries.paid)} sub={`${teacherPaidRate}% paid`} color="bg-blue-500" trend={teacherPaidRate - 100} />
        <StatCard icon={UserCheck} label="Attendance" value={`${attendanceRate}%`} sub={`${presentCount}/${attendance.length}`} color="bg-green-500" to="/attendance" />
        <StatCard icon={Award} label="Avg Performance" value={marksWithScores.length > 0 ? `${Math.round(marksWithScores.reduce((s, m) => s + ((m.ca_score || 0) + (m.exam_score || 0)), 0) / marksWithScores.length)}%` : 'N/A'} sub={`${marksWithScores.length} marks`} color="bg-purple-500" to="/marks-entry" />
        <StatCard icon={AlertTriangle} label="Alerts" value={notifications.length} sub={notifications.length > 0 ? 'Action needed' : 'All clear'} color={notifications.length > 0 ? 'bg-red-500' : 'bg-gray-400'} />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Total Expenses</p>
          <p className="text-lg font-bold text-red-600">{fmt(totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Total Debts</p>
          <p className="text-lg font-bold text-orange-600">{fmt(totalDebts)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Outstanding Fees</p>
          <p className="text-lg font-bold text-amber-600">{fmt(totalBalance)}</p>
        </div>
      </div>

      {/* Charts Row 1: Fees & Teacher Salaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> School Fees Collection Trend
          </h3>
          <div style={{ height: 200 }}>
            <Line data={feeCollectionData} options={chartOpts} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-blue-500" /> Teacher Salaries Paid
          </h3>
          <div style={{ height: 200 }}>
            <Bar data={teacherSalaryData} options={chartOpts} />
          </div>
        </div>
      </div>

      {/* Charts Row 2: Attendance & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <UserCheck className="w-4 h-4 text-green-500" /> Student Attendance
          </h3>
          <div style={{ height: 200 }} className="flex items-center justify-center">
            <Doughnut data={attendanceChartData} options={doughnutOpts} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-purple-500" /> Performance by Class
          </h3>
          <div style={{ height: 200 }}>
            <Bar data={perfChartData} options={chartOpts} />
          </div>
        </div>
      </div>

      {/* Charts Row 3: Expenses & Debts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <PieChart className="w-4 h-4 text-blue-500" /> Expenses Breakdown
          </h3>
          <div style={{ height: 200 }} className="flex items-center justify-center">
            <Doughnut data={expensesChartData} options={doughnutOpts} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-red-500" /> Debts Breakdown
          </h3>
          <div style={{ height: 200 }} className="flex items-center justify-center">
            <Doughnut data={debtsChartData} options={doughnutOpts} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-gray-500" /> Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { icon: Users, label: 'Students', to: '/student-management', color: 'bg-indigo-500' },
            { icon: Receipt, label: 'Fees', to: '/fees', color: 'bg-emerald-500' },
            { icon: BookOpen, label: 'Marks', to: '/marks-entry', color: 'bg-blue-500' },
            { icon: UserCheck, label: 'Attendance', to: '/attendance', color: 'bg-green-500' },
            { icon: DollarSign, label: 'Expenses', to: '/fees', color: 'bg-red-500' },
            { icon: Award, label: 'Reports', to: '/report-templates', color: 'bg-purple-500' },
          ].map(({ icon: Icon, label, to, color }) => (
            <Link key={label} to={to} className={`flex flex-col items-center gap-2 p-3 rounded-lg ${color} text-white hover:opacity-90 transition-opacity`}>
              <Icon className="w-5 h-5" />
              <span className="text-xs font-semibold text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
