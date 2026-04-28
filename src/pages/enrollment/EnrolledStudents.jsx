import React, { useEffect, useState } from "react";
import axios from "axios";

export default function EnrolledStudents({ onSelectStudent }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/enrollment/students/")
      .then((res) => {
        setStudents(res.data);
        setError("");
      })
      .catch((err) => {
        setError("Failed to fetch students");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Enrolled Students</h1>
      <p>List of students who have completed enrollment.</p>
      {loading && <p>Loading students...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && students.length === 0 && (
        <p>No students found.</p>
      )}
      {/* Table of enrolled students goes here */}
    </div>
  );
}
