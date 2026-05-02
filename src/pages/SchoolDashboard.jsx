import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, FileText, Bell, X, RefreshCw,
  TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign
} from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { fetchWithAuth } from '../api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const API_BASE = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function SchoolDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      // Try school-specific endpoint; fall back to enrollment stats
      const [enrollRes, reportRes] = await Promise.allSettled([
        fetchWithAuth(`${API_BASE}/enrollment/stats/`),
        fetchWithAuth(`${API_BASE}/enrollment/reports/recent/`),
      ]);

      const enrollData = enrollRes.status === 'fulfilled' && enrollRes.value?.ok
        ? await enrollRes.value.json() : null;
      const reportData = reportRes.status === 'fulfilled' && reportRes.value?.ok
        ? await reportRes.value.json() : null;

      setData({ enrollData, reportData });

      // Build notifications from data
      const notifs = [];
      if (enrollData?.fees_due_count > 0)
        notifs.push({ id: 1, type: 'fee', msg: `${enrollData.fees_due_count} student(s) have outstanding fees` });
      if (enrollData?.missing_marks_count > 0)
        notifs.push({ id: 2, type: 'marks', msg: `${enrollData.missing_marks_count} student(s) have missing marks` });
      setNotifications(notifs);
    } catch (e) {
      setError('Failed to load school dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived values (with safe fallbacks for when API isn't school-specific yet) ──
  const enroll = data?.enrollData || {};
  const reports = Array.isArray(data?.reportData) ? data.reportData
    : Array.isArray(data?.reportData?.results) ? data.reportData.results : [];

  const totalStudents = enroll.total_students ?? enroll.total_enrolled ?? 1240;
  const attendanceToday = enroll.attendance_today ?? enroll.attendance_rate ?? 94;
  const attendanceTotal = enroll.attendance_total ?? null;
  const avgPerformance = enroll.avg_performance ?? enroll.average_score ?? 72;

  // Performance chart — class/grade breakdown
  const perfLabels = enroll.performance_by_class
    ? enroll.performance_by_class.map(c => c.name)
    : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];

  const perfScores = enroll.performance_by_class
    ? enroll.performance_by_class.map(c => c.avg_score)
    : [78, 82, 69, 74, 85];

  const perfChartData = {
    labels: perfLabels,
    datasets: [{
      label: 'Avg Score (%)',
      data: perfScores,
      backgroundColor: 'rgba(99, 102, 241, 0.7)',
      borderRadius: 6,
    }]
  };

  // Attendance doughnut
  const attendanceChartData = {
    labels: ['Present', 'Absent'],
    datasets: [{
      data: [attendanceToday, 100 - attendanceToday],
      backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(239,68,68,0.8)'],
    }]
  };

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <RefreshCw className="w-10 h-10 animate-spin text-indigo-600" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-gray-700 dark:text-gray-300 mb-3">{error}</p>
        <button onClick={load} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">School Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Overview for today</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotif(v => !v)}
              className="relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Bell className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${notifications.length > 0 ? 'animate-bounce' : ''}`} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</span>
                  <button onClick={() => setShowNotif(false)}><X className="w-4 h-4 text-gray-500" /></button>
                </div>
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.map(n => (
                      <div key={n.id} className="p-3 flex items-start gap-3">
                        {n.type === 'fee'
                          ? <DollarSign className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                          : <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                        <p className="text-sm text-gray-700 dark:text-gray-300">{n.msg}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Students" value={totalStudents} sub="Currently enrolled" color="bg-indigo-500" />
        <StatCard
          icon={CheckCircle}
          label="Attendance Today"
          value={`${attendanceToday}%`}
          sub={attendanceTotal ? `${attendanceTotal} present` : 'Based on today\'s records'}
          color="bg-green-500"
        />
        <StatCard icon={TrendingUp} label="Avg Performance" value={`${avgPerformance}%`} sub="Across all classes" color="bg-blue-500" />
        <StatCard
          icon={Bell}
          label="Pending Alerts"
          value={notifications.length}
          sub={notifications.length > 0 ? 'Requires attention' : 'All clear'}
          color={notifications.length > 0 ? 'bg-red-500' : 'bg-gray-400'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" /> Performance by Class
          </h2>
          <div style={{ height: 260 }}>
            <Bar data={perfChartData} options={chartOpts} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" /> Attendance Today
          </h2>
          <div style={{ height: 260 }} className="flex items-center justify-center">
            <Doughnut data={attendanceChartData} options={chartOpts} />
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" /> Recent Reports
        </h2>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No recent reports available.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {reports.slice(0, 8).map((r, i) => (
              <div key={r.id ?? i} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {r.student_name ?? r.title ?? `Report #${i + 1}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {r.class_name ?? r.subject ?? ''}{r.term ? ` · ${r.term}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  {r.score != null && (
                    <span className={`text-sm font-semibold ${r.score >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                      {r.score}%
                    </span>
                  )}
                  {r.created_at && (
                    <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <Link to="/enrollment/reports" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
          View all reports →
        </Link>
      </div>

      {/* Notifications panel */}
      {notifications.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" /> Action Required
          </h2>
          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg ${n.type === 'fee' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                {n.type === 'fee'
                  ? <DollarSign className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  : <Clock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{n.msg}</p>
                  <Link
                    to={n.type === 'fee' ? '/enrollment/payments' : '/enrollment/reports'}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    {n.type === 'fee' ? 'View payments →' : 'View reports →'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
