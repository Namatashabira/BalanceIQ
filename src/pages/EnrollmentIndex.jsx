import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const menu = [
  { path: "/enrollment/overview", label: "Overview" },
  { path: "/enrollment/new", label: "New Enrollment" },
  { path: "/enrollment/applications", label: "Applications" },
  { path: "/enrollment/enrolled", label: "Enrolled Students" },
  { path: "/enrollment/documents", label: "Documents" },
  { path: "/enrollment/payments", label: "Payments" },
  { path: "/enrollment/reports", label: "Reports" },
];

export default function EnrollmentIndex() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">School Enrollment</h1>
      <nav className="flex gap-4 mb-8">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `px-4 py-2 rounded font-medium transition-colors ${
                isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-blue-100"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="bg-white rounded shadow p-4">
        <Outlet />
      </div>
    </div>
  );
}
