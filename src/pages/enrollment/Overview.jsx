import React, { useMemo, useState } from "react";
import {
  FaUserGraduate,
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyBillWave,
} from "react-icons/fa";
import { MdCheckCircle, MdErrorOutline, MdWarningAmber } from "react-icons/md";

export default function Overview() {
  /* ---------------- GLOBAL STATE ---------------- */
  const [institutionType, setInstitutionType] = useState("primary");

  /* ---------------- KPI DATA ---------------- */
  const kpis = [
    { label: "Total Students Enrolled", value: 1240, icon: FaUserGraduate },
    { label: "Applications Pending", value: 87, icon: FaClipboardList },
    { label: "Approved This Term", value: 320, icon: FaCheckCircle },
    { label: "Rejected / Withdrawn", value: 15, icon: FaTimesCircle },
    { label: "Outstanding Fees", value: "$12,500", icon: FaMoneyBillWave },
  ];

  /* ---------------- ADAPTIVE KPIs ---------------- */
  const adaptiveKpis = useMemo(() => {
    if (institutionType === "university") {
      return [
        { label: "Students per Program", value: "50 avg" },
        { label: "Active Semesters", value: "2" },
        { label: "Part-time vs Full-time", value: "80 / 240" },
      ];
    }
    return [
      { label: "Students per Class", value: "30 avg" },
      { label: "Guardians Registered", value: "900" },
    ];
  }, [institutionType]);

  /* ---------------- STATUS DATA ---------------- */
  const statusData = [
    { label: "Applied", value: 87, color: "bg-blue-500" },
    { label: "Reviewed", value: 50, color: "bg-yellow-500" },
    { label: "Approved", value: 320, color: "bg-green-500" },
    { label: "Enrolled", value: 1240, color: "bg-indigo-500" },
    { label: "Waitlisted", value: 12, color: "bg-red-500" },
  ];

  /* ---------------- CAPACITY DATA ---------------- */
  const capacityData =
    institutionType === "university"
      ? [
          { name: "BSc Computer Science", capacity: 120, enrolled: 118 },
          { name: "Business Administration", capacity: 100, enrolled: 100 },
          { name: "Information Technology", capacity: 90, enrolled: 62 },
        ]
      : [
          { name: "Grade 1", capacity: 40, enrolled: 38 },
          { name: "Grade 2", capacity: 40, enrolled: 40 },
          { name: "Grade 3", capacity: 40, enrolled: 28 },
        ];

  /* ---------------- STATUS LOGIC ---------------- */
  const getStatus = (capacity, enrolled) => {
    const available = capacity - enrolled;
    if (available === 0)
      return { label: "Full", icon: MdErrorOutline, color: "red" };
    if (available <= 2)
      return { label: "Almost Full", icon: MdWarningAmber, color: "yellow" };
    return { label: "Available", icon: MdCheckCircle, color: "green" };
  };

  /* ---------------- RECENT ACTIVITY ---------------- */
  const recentActivity = [
    { time: "2h ago", desc: "Student approved by Registrar" },
    { time: "4h ago", desc: "Payment received" },
    { time: "1d ago", desc: "Document verified" },
    { time: "2d ago", desc: "Application rejected – missing documents" },
  ];

  /* ---------------- ALERTS ---------------- */
  const alerts = [
    { label: "Applications awaiting review", count: 12 },
    { label: "Documents pending verification", count: 7 },
    { label: "Payments overdue", count: 3 },
    { label: "Classes / Programs over capacity", count: 1 },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">

      {/* ---------------- FILTER ---------------- */}
      <div className="flex justify-end">
        <select
          value={institutionType}
          onChange={e => setInstitutionType(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-white shadow-sm capitalize"
        >
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="university">University</option>
        </select>
      </div>

      {/* ---------------- KPI CARDS ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-white rounded-lg shadow-sm p-4 flex items-start gap-3 min-w-0"
          >
            <Icon className="text-gray-500 text-base mt-1 shrink-0" />
            <div className="min-w-0">
              <div className="text-lg font-semibold truncate">{value}</div>
              <div className="text-xs text-gray-500 truncate">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ---------------- ADAPTIVE KPIs ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {adaptiveKpis.map(kpi => (
          <div
            key={kpi.label}
            className="bg-white rounded-lg shadow-sm p-4 min-w-0"
          >
            <div className="text-lg font-semibold truncate">{kpi.value}</div>
            <div className="text-xs text-gray-500 truncate">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ---------------- STATUS BREAKDOWN ---------------- */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-sm font-semibold mb-3">Enrollment Status</h2>
        <div className="flex gap-4 flex-wrap">
          {statusData.map(s => (
            <div key={s.label} className="text-center min-w-[80px]">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${s.color}`} />
              <div className="text-xs font-medium truncate">{s.label}</div>
              <div className="text-xs text-gray-500">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- CAPACITY TABLE ---------------- */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-sm font-semibold mb-3">
          {institutionType === "university" ? "Program Capacity" : "Class Capacity"}
        </h2>

        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr className="text-left text-gray-600">
                <th className="p-2">Name</th>
                <th className="p-2">Capacity</th>
                <th className="p-2">Enrolled</th>
                <th className="p-2">Progress</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {capacityData.map(item => {
                const percent = Math.round((item.enrolled / item.capacity) * 100);
                const status = getStatus(item.capacity, item.enrolled);
                const StatusIcon = status.icon;

                return (
                  <tr key={item.name} className="border-b last:border-none">
                    <td className="p-2 truncate max-w-[160px]">{item.name}</td>
                    <td className="p-2">{item.capacity}</td>
                    <td className="p-2">{item.enrolled}</td>
                    <td className="p-2 w-40">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full bg-${status.color}-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">{percent}%</div>
                    </td>
                    <td className="p-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-${status.color}-100 text-${status.color}-700`}
                      >
                        <StatusIcon className="text-xs" />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- ACTIVITY & ALERTS ---------------- */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-sm font-semibold mb-3">Recent Activity</h2>
          {recentActivity.map((a, i) => (
            <div key={i} className="text-xs text-gray-600 mb-1 truncate">
              <span className="text-gray-400 mr-2">{a.time}</span>
              {a.desc}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-sm font-semibold mb-3">Pending Alerts</h2>
          {alerts.map(a => (
            <div key={a.label} className="flex justify-between text-xs border-b py-1 last:border-none">
              <span className="truncate">{a.label}</span>
              <span className="font-semibold">{a.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
