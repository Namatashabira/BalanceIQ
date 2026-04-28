import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Documents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/enrollment/students/")
      .then((res) => {
        // Always sort by id for consistent order
        const sorted = Array.isArray(res.data) ? res.data.sort((a, b) => a.id - b.id) : [];
        setStudents(sorted);
        setError("");
      })
      .catch((err) => {
        setError("Failed to fetch students");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Documents</h1>
      <p>Manage student documents and verification status.</p>
      {loading && <p>Loading students...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && students.length === 0 && <p>No students found.</p>}
      <table className="w-full mt-4 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th>Index</th>
            <th>Photo</th>
            <th>Name</th>
            <th>Documents</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, idx) => (
            <tr key={student.id}>
              <td>{idx + 1}</td>
              <td><img src={student.photo} alt="Profile" className="w-8 h-8 rounded-full object-cover" /></td>
              <td>{student.name}</td>
              <td>{student.documents?.length || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
