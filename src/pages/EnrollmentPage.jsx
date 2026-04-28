import React, { useState } from "react";
import axios from "axios";

// Step definitions
const steps = ["Student Info", "Guardian Info", "Academic Enrollment", "Documents", "Fees & Payment"];

function EnrollmentPage() {
  const [step, setStep] = useState(0);
  const [student, setStudent] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    date_of_birth: "",
    gender: "",
    nationality: "",
    institution_type: "primary",
    email: "",
    study_mode: "",
    student_photo: null,
    special_needs: "",
  });
  const [guardians, setGuardians] = useState([
    { full_name: "", relationship: "", phone: "", email: "", address: "", emergency_contact: "" },
  ]);
  const [enrollment, setEnrollment] = useState({
    academic_year: "",
    term_or_semester: "",
    grade_or_class: "",
    stream: "",
    subject_combination: "",
    program: "",
    department: "",
    faculty: "",
    enrollment_status: "applied",
    notes: "",
  });
  const [documents, setDocuments] = useState([]);
  const [fees, setFees] = useState({
    fee_structure: "",
    total_amount: "",
    paid_amount: "",
    payment_status: "pending",
    payment_method: "",
    invoice_file: null,
    receipt_file: null,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Step navigation
  const nextStep = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  // Submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      Object.entries(student).forEach(([key, value]) => {
        if (value !== null && value !== "") formData.append(key, value);
      });
      formData.append("guardians", JSON.stringify(guardians));
      formData.append("enrollments", JSON.stringify([enrollment]));
      formData.append("fees", JSON.stringify([fees]));
      documents.forEach((doc, idx) => {
        formData.append(`documents[${idx}]`, doc.file);
      });
      // Replace with your backend API endpoint
      await axios.post("/api/enrollment/students/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  // Step content rendering
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <h2>Student Information</h2>
            {/* ...fields for student info... */}
            {/* Example: */}
            <input type="text" placeholder="First Name" value={student.first_name} onChange={e => setStudent({ ...student, first_name: e.target.value })} />
            {/* Add more fields as needed */}
          </div>
        );
      case 1:
        return (
          <div>
            <h2>Guardian Information</h2>
            {/* ...fields for guardians... */}
          </div>
        );
      case 2:
        return (
          <div>
            <h2>Academic Enrollment</h2>
            {/* ...fields for enrollment... */}
          </div>
        );
      case 3:
        return (
          <div>
            <h2>Documents</h2>
            {/* ...fields for document upload... */}
          </div>
        );
      case 4:
        return (
          <div>
            <h2>Fees & Payment</h2>
            {/* ...fields for fees and payment... */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">School Enrollment</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            {steps.map((s, i) => (
              <span key={i} className={i === step ? "font-bold text-blue-600" : "text-gray-400"}>{s}</span>
            ))}
          </div>
          {renderStep()}
        </div>
        <div className="flex justify-between">
          {step > 0 && <button type="button" onClick={prevStep} className="btn">Back</button>}
          {step < steps.length - 1 && <button type="button" onClick={nextStep} className="btn">Next</button>}
          {step === steps.length - 1 && <button type="submit" className="btn" disabled={loading}>{loading ? "Submitting..." : "Submit"}</button>}
        </div>
        {error && <div className="text-red-500 mt-2">{error}</div>}
        {success && <div className="text-green-500 mt-2">Enrollment submitted successfully!</div>}
      </form>
    </div>
  );
}

export default EnrollmentPage;
