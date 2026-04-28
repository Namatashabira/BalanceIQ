import React, { useEffect, useState } from "react";
import axios from "axios";
import ApplicationDetails from "./ApplicationDetails";

export default function Applications({ onSelectApplication }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/enrollment/applications/")
      .then((res) => {
        setApplications(res.data);
        setError("");
        if (res.data.length > 0) {
          setSelectedId(res.data[0].id);
        }
      })
      .catch((err) => {
        setError("Failed to fetch applications");
      })
      .finally(() => setLoading(false));
  }, []);

  // Defensive: ensure applications is always an array
  const appList = Array.isArray(applications) ? applications : [];
  const selectedApp = appList.find((app) => app.id === selectedId);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg text-center text-gray-500">
        <h2 className="text-2xl font-bold mb-4">Applications</h2>
        <p>Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg text-center text-gray-500">
        <h2 className="text-2xl font-bold mb-4">Applications</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!appList.length) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg text-center text-gray-500">
        <h2 className="text-2xl font-bold mb-4">Applications</h2>
        <p>No applications found.</p>
      </div>
    );
  }

  // Defensive: If no selectedApp, show a message
  if (!selectedApp) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg text-center text-gray-500">
        <h2 className="text-2xl font-bold mb-4">Applications</h2>
        <p>Select an application to view details.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      {/* Applications List */}
      <div className="w-96 bg-white rounded-xl shadow p-4">
        <h2 className="text-xl font-bold mb-4">Applications</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th>Photo</th>
              <th>Name</th>
              <th>Status</th>
              <th>Program</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {appList.map((app) => (
              <tr
                key={app.id}
                className={`cursor-pointer hover:bg-blue-50 ${
                  selectedId === app.id ? "bg-blue-100" : ""
                }`}
                onClick={() => setSelectedId(app.id)}
              >
                <td>
                  <img
                    src={app.photo}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </td>
                <td className="font-semibold">{app.name}</td>
                <td>{app.status}</td>
                <td>{app.program}</td>
                <td>{app.dateSubmitted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Application Details */}
      <div className="flex-1">
        <ApplicationDetails application={selectedApp} />
      </div>
    </div>
  );
}
