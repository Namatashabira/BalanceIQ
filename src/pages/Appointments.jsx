import { useEffect, useMemo, useState, useRef } from 'react';
import { Calendar, Clock, MapPin, User as UserIcon, RefreshCw, Plus, Bell } from 'lucide-react';
import { fetchWithAuth } from '../api';
import { useToast } from '../context/ToastContext';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [filterAssignee, setFilterAssignee] = useState('mine');
  const [viewMode, setViewMode] = useState('agenda');
  const [currentDate, setCurrentDate] = useState(new Date());
  const remindedIdsRef = useRef(new Set());
  const toast = useToast();

  const fetchWorkers = async () => {
    try {
      const res = await fetchWithAuth('http://127.0.0.1:8000/api/core/workers/');
      if (res && res.ok) {
        const data = await res.json();
        setWorkers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch workers', err);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filterAssignee === 'mine') {
        params.set('mine', 'true');
      } else if (filterAssignee && filterAssignee !== 'all') {
        params.set('assignedTo', filterAssignee);
      }

      const res = await fetchWithAuth(`http://127.0.0.1:8000/api/core/appointments/?${params.toString()}`);
      if (res && res.ok) {
        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : []);
      } else {
        // Fallback to sample when endpoint unavailable
        setAppointments(sampleAppointments());
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setError('Unable to load appointments right now. Showing sample data.');
      setAppointments(sampleAppointments());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchAppointments();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [filterAssignee]);

  // In-app reminder alarm: show toast when within reminder window
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      appointments.forEach((appt) => {
        const start = new Date(appt.startTime || appt.start_time).getTime();
        const mins = appt.reminderMinutes ?? appt.reminder_minutes_before ?? 30;
        const delta = start - now;
        if (delta <= mins * 60_000 && delta > 0) {
          const key = appt.id || appt.title || start;
          if (!remindedIdsRef.current.has(key)) {
            remindedIdsRef.current.add(key);
            toast.info(`Reminder: ${appt.title || 'Appointment'} starts soon`);
          }
        }
      });
    }, 30_000); // check every 30s
    return () => clearInterval(interval);
  }, [appointments, toast]);

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = appointments.filter((a) => new Date(a.startTime) >= now);
    const today = upcoming.filter((a) => isSameDay(new Date(a.startTime), now));
    return {
      total: appointments.length,
      upcoming: upcoming.length,
      today: today.length,
    };
  }, [appointments]);

  const handleRefresh = async () => {
    await fetchAppointments();
    toast.success('Appointments refreshed');
  };

  const handleMove = async (appt, targetDate) => {
    if (!appt?.id || String(appt.id).startsWith('sample') || !targetDate) return;
    const orig = new Date(appt.startTime || appt.start_time);
    const newStart = new Date(targetDate);
    newStart.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
    try {
      const payload = { id: appt.id, startTime: newStart.toISOString() };
      const res = await fetchWithAuth('http://127.0.0.1:8000/api/core/appointments/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res && res.ok) {
        const updated = await res.json();
        setAppointments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        toast.success('Appointment rescheduled');
      }
    } catch (err) {
      console.error('Failed to move appointment', err);
      toast.error('Move failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">Appointments & Scheduling</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Stay on top of upcoming meetings and bookings.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
            {['agenda', 'day', 'week', 'month'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm ${viewMode === mode ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate((d) => addDays(d, viewMode === 'month' ? -30 : viewMode === 'week' ? -7 : -1))}
              className="px-2.5 py-2 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
            >
              ◀
            </button>
            <button
              onClick={() => setCurrentDate((d) => addDays(d, viewMode === 'month' ? 30 : viewMode === 'week' ? 7 : 1))}
              className="px-2.5 py-2 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
            >
              ▶
            </button>
          </div>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-2.5 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
            disabled={loading}
          >
            <option value="mine">My schedule</option>
            <option value="all">All</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name || w.email}
              </option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-blue-600 text-white text-sm sm:text-base hover:bg-blue-700"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-emerald-600 text-white text-sm sm:text-base hover:bg-emerald-700"
            onClick={() => setCreating(true)}
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-sm">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard label="Total" value={stats.total} color="blue" />
        <StatCard label="Upcoming" value={stats.upcoming} color="emerald" />
        <StatCard label="Today" value={stats.today} color="purple" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Schedule</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">Auto-syncs on refresh + local reminders</span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">No appointments yet.</div>
        ) : viewMode === 'agenda' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {appointments.map((appt) => (
              <AppointmentCard key={appt.id || appt.title} appt={appt} />
            ))}
          </div>
        ) : viewMode === 'day' ? (
          <div className="overflow-x-auto"><DayView date={currentDate} appointments={appointments} onMove={handleMove} /></div>
        ) : viewMode === 'week' ? (
          <div className="overflow-x-auto"><WeekView date={currentDate} appointments={appointments} onMove={handleMove} /></div>
        ) : (
          <div className="overflow-x-auto"><MonthView date={currentDate} appointments={appointments} onMove={handleMove} /></div>
        )}
      </div>

      {creating && (
        <AppointmentForm
          workers={workers}
          onClose={() => setCreating(false)}
          onCreated={(appt) => {
            setAppointments((prev) => [appt, ...prev]);
            setCreating(false);
            toast.success('Appointment created');
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700',
  };
  return (
    <div className={`rounded-lg border ${colors[color]} p-3 sm:p-4`}>
      <p className="text-xs sm:text-sm font-medium">{label}</p>
      <p className="text-xl sm:text-2xl font-bold">{value}</p>
    </div>
  );
}

function AppointmentCard({ appt }) {
  const start = new Date(appt.startTime || appt.start_time || appt.date || Date.now());
  const end = appt.endTime || appt.end_time ? new Date(appt.endTime || appt.end_time) : null;
  const assignee = appt.assignedTo?.name || appt.assignedTo?.email;
  const attendees = appt.attendees || [];
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/40">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{formatDate(start)}</p>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-tight">{appt.title || 'Scheduled meeting'}</h3>
        </div>
        <span className="text-[10px] sm:text-[11px] px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
          {appt.status || 'upcoming'}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
        <Clock className="w-4 h-4 text-gray-500" />
        <span>{formatTimeRange(start, end)}</span>
      </div>
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1">
        <UserIcon className="w-4 h-4 text-gray-500" />
        <span>{assignee || appt.participant || 'Personal'}</span>
      </div>
      {appt.location && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span>{appt.location}</span>
        </div>
      )}
      {appt.notes && (
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">{appt.notes}</p>
      )}
      <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2">
        <Bell className="w-3 h-3" />
        <span>Reminder {appt.reminderMinutes ?? appt.reminder_minutes_before ?? 30}m before</span>
      </div>
      {appt.recurrence && appt.recurrence !== 'none' && (
        <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">Repeats {appt.recurrence}</div>
      )}
      {attendees.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {attendees.map((a) => (
            <span key={a.email} className="text-[10px] sm:text-[11px] px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
              {a.name || a.email} • {a.status || 'invited'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentForm({ onClose, onCreated, workers }) {
  const [title, setTitle] = useState('');
  const [participant, setParticipant] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [assignedTo, setAssignedTo] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [recurrenceUntil, setRecurrenceUntil] = useState('');
  const [attendeesText, setAttendeesText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!startTime) {
      toast.error('Start time is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: title || 'Appointment',
        participant,
        location,
        notes,
        startTime,
        endTime: endTime || null,
        reminderMinutes: Number(reminderMinutes) || 30,
        assignedTo: assignedTo || null,
        recurrence,
        recurrenceUntil: recurrenceUntil || null,
        attendees: attendeesText
          .split(/[,\n]/)
          .map((e) => e.trim())
          .filter(Boolean)
          .map((email) => ({ email })),
      };
      const res = await fetchWithAuth('http://127.0.0.1:8000/api/core/appointments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res && res.ok) {
        const data = await res.json();
        onCreated(data);
      } else {
        toast.error('Failed to create appointment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-4 sm:p-6 space-y-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">New Appointment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-1">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="px-3 py-2 rounded border bg-white dark:bg-gray-900" />
          </label>
          <label className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-1">
            Participant
            <input value={participant} onChange={(e) => setParticipant(e.target.value)} className="px-3 py-2 rounded border bg-white dark:bg-gray-900" />
          </label>
          <label className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-1">
            Assign to
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="px-3 py-2 rounded border bg-white dark:bg-gray-900">
              <option value="">Me / Personal</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name || w.email}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-1">
            Location
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="px-3 py-2 rounded border bg-white dark:bg-gray-900" />
          </label>
          <label className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-1">
            Reminder (minutes before)
            <input type="number" value={reminderMinutes} onChange={(e) => setReminderMinutes(e.target.value)} className="px-3 py-2 rounded border bg-white dark:bg-gray-900" />
          </label>
          <label className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-1">
            Start time
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="px-3 py-2 rounded border bg-white dark:bg-gray-900" />
          </label>
          <label className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-1">
            End time
            <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="px-3 py-2 rounded border bg-white dark:bg-gray-900" />
          </label>
        </div>
        <label className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-1">
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="px-3 py-2 rounded border bg-white dark:bg-gray-900" rows={3} />
          <label className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-1">
            Recurrence
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="px-3 py-2 rounded border bg-white dark:bg-gray-900">
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-1">
            Recurrence ends (optional)
            <input type="date" value={recurrenceUntil} onChange={(e) => setRecurrenceUntil(e.target.value)} className="px-3 py-2 rounded border bg-white dark:bg-gray-900" />
          </label>
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Cancel</button>
          <button onClick={submit} disabled={submitting} className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">
            {submitting ? 'Saving...' : 'Save'}
        <label className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-1">
          Attendees (emails, comma or newline separated)
          <textarea value={attendeesText} onChange={(e) => setAttendeesText(e.target.value)} className="px-3 py-2 rounded border bg-white dark:bg-gray-900" rows={2} />
        </label>
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTimeRange(start, end) {
  const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endStr = end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  return endStr ? `${startStr} - ${endStr}` : startStr;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  return new Date(d.setDate(diff));
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function WeekView({ date, appointments, onMove }) {
  const start = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const handleDrop = (evt, day) => {
    evt.preventDefault();
    try {
      const payload = JSON.parse(evt.dataTransfer.getData('text/plain'));
      const appt = appointments.find((a) => a.id === payload.id);
      if (appt) onMove(appt, day);
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2 sm:gap-3 min-w-[720px]">
      {days.map((day) => (
        <div
          key={day.toISOString()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, day)}
          className="min-h-[180px] border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/30"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="space-y-2">
            {appointments
              .filter((a) => isSameDay(new Date(a.startTime || a.start_time), day))
              .map((a) => (
                <div
                  key={a.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ id: a.id }))}
                  className="p-2 rounded bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 cursor-move"
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400">{formatTimeRange(new Date(a.startTime || a.start_time), a.endTime ? new Date(a.endTime) : null)}</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{a.title}</div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthView({ date, appointments, onMove }) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = startOfWeek(firstDay);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const handleDrop = (evt, day) => {
    evt.preventDefault();
    try {
      const payload = JSON.parse(evt.dataTransfer.getData('text/plain'));
      const appt = appointments.find((a) => a.id === payload.id);
      if (appt) onMove(appt, day);
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2 sm:gap-3 min-w-[720px]">
      {days.map((day, idx) => (
        <div
          key={day.toISOString()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, day)}
          className={`min-h-[120px] border rounded-lg p-2 ${day.getMonth() === date.getMonth() ? 'bg-white dark:bg-gray-900/40 border-gray-200 dark:border-gray-700' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
        >
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{day.getDate()}</div>
          <div className="space-y-1">
            {appointments
              .filter((a) => isSameDay(new Date(a.startTime || a.start_time), day))
              .map((a) => (
                <div
                  key={a.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ id: a.id }))}
                  className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 cursor-move"
                >
                  {a.title}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DayView({ date, appointments, onMove }) {
  const dayAppts = appointments.filter((a) => isSameDay(new Date(a.startTime || a.start_time), date));
  const handleDrop = (evt) => {
    evt.preventDefault();
    try {
      const payload = JSON.parse(evt.dataTransfer.getData('text/plain'));
      const appt = appointments.find((a) => a.id === payload.id);
      if (appt) onMove(appt, date);
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div
      className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      <div className="space-y-3">
        {dayAppts.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400">No events</div>}
        {dayAppts.map((appt) => (
          <AppointmentCard key={appt.id} appt={appt} />
        ))}
      </div>
    </div>
  );
}

function sampleAppointments() {
  const now = new Date();
  return [
    {
      id: 'sample-1',
      title: 'Consultation',
      participant: 'Jane Doe',
      startTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
      location: 'Office',
      status: 'upcoming',
      notes: 'Discuss requirements and next steps.',
    },
    {
      id: 'sample-2',
      title: 'Follow-up',
      participant: 'John Smith',
      startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      location: 'Video call',
      status: 'upcoming',
      notes: 'Review progress and blockers.',
    },
  ];
}
