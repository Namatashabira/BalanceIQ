import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCheck, FaTimes, FaEdit, FaEnvelope, FaFileExport, FaDownload, FaUserTag, FaTrash, FaUserPlus, FaUserMinus, FaUser, FaAddressCard, FaSchool, FaHeartbeat, FaMoneyBillWave, FaFileAlt, FaCamera } from "react-icons/fa";

export default function ApplicationDetails({ applicationId }) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!applicationId) return;
    setLoading(true);
    axios.get(`/api/enrollment/applications/${applicationId}/`)
      .then(res => {
        setApplication(res.data);
        setError("");
      })
      .catch(err => {
        setError("Failed to fetch application details");
      })
      .finally(() => setLoading(false));
  }, [applicationId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!application) return <div>No application found.</div>;

  // Defensive: Ensure arrays exist to prevent .map errors
  const app = application || {};
  // Use the same profile photo field as the list (EnrolledStudents)
  const profilePhoto = app.profile_photo || app.photo || app.avatar || "";
  // Defensive: Support both userI and manual submissions
  const documents = app.documents || app.uploaded_documents || [];
  const timeline = app.timeline || app.activity_log || [];
  const notes = app.notes || app.comments || [];
  const payments = (app.linked?.payments || app.payments || []);
  const previousEnrollments = (app.linked?.previousEnrollments || app.previous_enrollments || []);
  const guardians = app.guardians || app.guardian_info || [];
  const audit = app.audit || app.compliance || {};

  // Support all possible field names for completeness
  const getField = (...fields) => fields.find(f => f !== undefined && f !== null && f !== "");

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg overflow-hidden text-xs">
      {/* Header & Actions */}
      <div className="flex justify-between items-center mb-4 flex-wrap">
        <div className="flex items-center gap-4">
          {/* Student Profile Photo - always matches list */}
          <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Student Profile" className="w-full h-full object-cover" />
            ) : (
              <FaCamera className="text-gray-400 text-3xl" />
            )}
          </div>
          <div>
            <h1 className="text-base font-bold flex items-center gap-2"><FaFileAlt /> Application {getField(app.id, app.application_id)}</h1>
            <div className="text-gray-500">Submitted: {getField(app.dateSubmitted, app.submitted_at, app.created_at)}</div>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          <button className="inline-flex items-center gap-1 px-3 py-1 rounded border border-green-600 bg-green-600 text-white shadow-sm hover:bg-green-700 focus:ring-green-400"><FaCheck /> Approve</button>
          <button className="inline-flex items-center gap-1 px-3 py-1 rounded border border-red-600 bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-400"><FaTimes /> Reject</button>
          <button className="inline-flex items-center gap-1 px-3 py-1 rounded border border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:ring-blue-400"><FaEdit /> Edit</button>
          <button className="inline-flex items-center gap-1 px-3 py-1 rounded border border-gray-400 bg-gray-100 text-gray-700 shadow-sm hover:bg-gray-200 focus:ring-gray-400"><FaFileExport /> Export</button>
          <button className="inline-flex items-center gap-1 px-3 py-1 rounded border border-yellow-400 bg-yellow-400 text-white shadow-sm hover:bg-yellow-500 focus:ring-yellow-400"><FaEnvelope /> Send Email</button>
        </div>
      </div>

      {/* Student Info */}
      <div className="mb-4 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaUser /> Student Information</div>
        <div className="grid grid-cols-2 gap-2">
          <div><span className="font-semibold">Name:</span> {getField(app.name, app.student_name)}</div>
          <div><span className="font-semibold">Gender:</span> {getField(app.gender, app.student_gender)}</div>
          <div><span className="font-semibold">Date of Birth:</span> {getField(app.dob, app.date_of_birth)}</div>
          <div><span className="font-semibold">Nationality:</span> {getField(app.nationality, app.student_nationality)}</div>
          <div><span className="font-semibold">Religion:</span> {getField(app.religion, app.student_religion)}</div>
          <div><span className="font-semibold">Languages:</span> {getField(app.languages, app.student_languages)}</div>
          <div><span className="font-semibold">National ID:</span> {getField(app.national_id, app.student_id_number)}</div>
          <div><span className="font-semibold">Email:</span> {getField(app.email, app.student_email)}</div>
          <div><span className="font-semibold">Phone:</span> {getField(app.phone, app.student_phone)}</div>
        </div>
      </div>

      {/* Enrollment Details */}
      <div className="mb-4 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaSchool /> Enrollment Details</div>
        <div className="grid grid-cols-2 gap-2">
          <div><span className="font-semibold">Academic Year:</span> {getField(app.academic_year, app.year)}</div>
          <div><span className="font-semibold">Term:</span> {getField(app.term, app.academic_term)}</div>
          <div><span className="font-semibold">Class/Grade:</span> {getField(app.class_grade, app.grade, app.class)}</div>
          <div><span className="font-semibold">Stream:</span> {getField(app.stream, app.class_stream)}</div>
          <div><span className="font-semibold">Admission Type:</span> {getField(app.admission_type, app.type)}</div>
          <div><span className="font-semibold">Intake:</span> {getField(app.intake, app.intake_period)}</div>
          <div><span className="font-semibold">Faculty:</span> {getField(app.faculty, app.department)}</div>
          <div><span className="font-semibold">Program:</span> {getField(app.program, app.course)}</div>
          <div><span className="font-semibold">Mode of Study:</span> {getField(app.mode_of_study, app.study_mode)}</div>
        </div>
      </div>

      {/* Guardians */}
      <div className="mb-4 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaUserPlus /> Guardians</div>
        {guardians.length ? (
          <div className="grid grid-cols-2 gap-2">
            {guardians.map((g, idx) => (
              <div key={idx} className="border rounded p-2 bg-white">
                <div><span className="font-semibold">Name:</span> {getField(g.full_name, g.name)}</div>
                <div><span className="font-semibold">Relationship:</span> {getField(g.relationship, g.relation)}</div>
                <div><span className="font-semibold">Phone:</span> {getField(g.phone, g.contact)}</div>
                <div><span className="font-semibold">Email:</span> {getField(g.email, g.guardian_email)}</div>
                <div><span className="font-semibold">Occupation:</span> {getField(g.occupation, g.job)}</div>
                <div><span className="font-semibold">Address:</span> {getField(g.address, g.guardian_address)}</div>
              </div>
            ))}
          </div>
        ) : <div className="text-gray-400">No guardians provided.</div>}
      </div>

      {/* Contact & Address */}
      <div className="mb-4 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaAddressCard /> Contact & Address</div>
        <div className="grid grid-cols-2 gap-2">
          <div><span className="font-semibold">Home Address:</span> {getField(app.home_address, app.address)}</div>
          <div><span className="font-semibold">District/City:</span> {getField(app.district_city, app.city)}</div>
          <div><span className="font-semibold">Country:</span> {getField(app.country, app.student_country)}</div>
          <div><span className="font-semibold">Emergency Contact Name:</span> {getField(app.emergency_contact_name, app.emergency_name)}</div>
          <div><span className="font-semibold">Emergency Contact Phone:</span> {getField(app.emergency_contact_phone, app.emergency_phone)}</div>
        </div>
      </div>

      {/* Academic Background */}
      <div className="mb-4 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaSchool /> Academic Background</div>
        <div className="grid grid-cols-2 gap-2">
          <div><span className="font-semibold">Previous School:</span> {getField(app.previous_school_name, app.last_school)}</div>
          <div><span className="font-semibold">Last Class Completed:</span> {getField(app.last_class_completed, app.last_grade)}</div>
          <div><span className="font-semibold">Reason for Transfer:</span> {getField(app.reason_for_transfer, app.transfer_reason)}</div>
          <div><span className="font-semibold">Previous Institution:</span> {getField(app.previous_institution, app.institution)}</div>
          <div><span className="font-semibold">Highest Qualification:</span> {getField(app.highest_qualification, app.qualification)}</div>
          <div><span className="font-semibold">Index/Reg No:</span> {getField(app.index_number, app.reg_no)}</div>
        </div>
      </div>

      {/* Health & Special Needs */}
      <div className="mb-4 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaHeartbeat /> Health & Special Needs</div>
        <div className="grid grid-cols-2 gap-2">
          <div><span className="font-semibold">Medical Conditions:</span> {getField(app.medical_conditions, app.health_conditions)}</div>
          <div><span className="font-semibold">Allergies:</span> {getField(app.allergies, app.student_allergies)}</div>
          <div><span className="font-semibold">Disabilities:</span> {getField(app.disabilities, app.student_disabilities)}</div>
          <div><span className="font-semibold">Accommodations:</span> {getField(app.accommodations, app.special_accommodations)}</div>
          <div><span className="font-semibold">Doctor Notes:</span> {getField(app.doctor_notes, app.health_notes)}</div>
        </div>
      </div>

      {/* Fee & Billing */}
      <div className="mb-4 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaMoneyBillWave /> Fee & Billing</div>
        <div className="grid grid-cols-2 gap-2">
          <div><span className="font-semibold">Fee Structure:</span> {getField(app.fee_structure, app.fee_plan)}</div>
          <div><span className="font-semibold">Scholarship/Discount:</span> {getField(app.scholarship_discount, app.scholarship)}</div>
          <div><span className="font-semibold">Payment Plan:</span> {getField(app.payment_plan, app.plan)}</div>
          <div><span className="font-semibold">Initial Payment:</span> {getField(app.initial_payment, app.first_payment)}</div>
          <div><span className="font-semibold">Payment Method:</span> {getField(app.payment_method, app.method)}</div>
        </div>
      </div>

      {/* Documents Upload */}
      <div className="mb-4 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaFileAlt /> Documents Upload</div>
        <div className="grid grid-cols-2 gap-2">
          {documents.map((doc) => (
            <div key={doc.name || doc.title} className="bg-white rounded p-2 flex items-center justify-between border">
              <span>{getField(doc.name, doc.title)}</span>
              <a href={getField(doc.url, doc.file_url)} className="inline-flex items-center gap-1 px-2 py-1 rounded border border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700"><FaDownload /> View</a>
            </div>
          ))}
        </div>
      </div>

      {/* Account & Access */}
      <div className="mb-4 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaUser /> Account & Access</div>
        <div className="grid grid-cols-2 gap-2">
          <div><span className="font-semibold">Student ID:</span> {getField(app.student_id, app.portal_id)}</div>
          <div><span className="font-semibold">Portal Email:</span> {getField(app.portal_email, app.account_email)}</div>
          <div><span className="font-semibold">Portal Username:</span> {getField(app.portal_username, app.account_username)}</div>
          <div><span className="font-semibold">Parent Portal Access:</span> {getField(app.parent_portal_access, app.parent_access) ? "Yes" : "No"}</div>
        </div>
      </div>

      {/* Review & Confirmation */}
      <div className="mb-4 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaCheck /> Review & Confirmation</div>
        <div><span className="font-semibold">Confirmed:</span> {getField(app.confirmation, app.is_confirmed) ? "Yes" : "No"}</div>
      </div>

      {/* Timeline / Activity Log */}
      <div className="mb-4 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaFileAlt /> Timeline / Activity Log</div>
        <ul className="list-disc pl-4 text-gray-700">
          {timeline.map((t, idx) => (
            <li key={idx}>{getField(t.entry, t.action, t.text)} — <span className="text-gray-500">{getField(t.date, t.timestamp)}</span></li>
          ))}
        </ul>
      </div>

      {/* Notes / Comments */}
      <div className="mb-4 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaUserTag /> Notes / Comments</div>
        <div className="space-y-1">
          {notes.map((note, idx) => (
            <div key={idx} className="bg-yellow-50 rounded p-2 flex items-center gap-1">
              <FaUserTag className="text-yellow-700" />
              <span className="font-semibold">{getField(note.author, note.user)}:</span>
              <span>{getField(note.text, note.comment)}</span>
              <span className="text-gray-500 ml-auto">{getField(note.date, note.timestamp)}</span>
            </div>
          ))}
        </div>
        <form className="mt-1 flex gap-1">
          <input type="text" placeholder="Add note..." className="border rounded px-2 py-1 flex-1" />
          <button className="inline-flex items-center gap-1 px-2 py-1 rounded border border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700"><FaEdit /> Add Note</button>
        </form>
      </div>

      {/* Status Management */}
      <div className="mb-4 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaEdit /> Status Management</div>
        <div className="flex gap-2 items-center flex-wrap">
          <select className="border rounded px-2 py-1">
            <option>Pending</option>
            <option>In Review</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Requires Resubmission</option>
            <option>Archived</option>
          </select>
          <input type="text" placeholder="Reason (if rejecting)" className="border rounded px-2 py-1" />
          <button className="inline-flex items-center gap-1 px-2 py-1 rounded border border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700"><FaEdit /> Change Status</button>
          <button className="inline-flex items-center gap-1 px-2 py-1 rounded border border-yellow-400 bg-yellow-400 text-white shadow-sm hover:bg-yellow-500"><FaEnvelope /> Notify</button>
        </div>
      </div>

      {/* Admin Actions Toolbar */}
      <div className="mb-4 flex gap-1 flex-wrap">
        <button className="inline-flex items-center gap-1 px-2 py-1 rounded border border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700"><FaEdit /> Edit</button>
        <button className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-400 bg-gray-100 text-gray-700 shadow-sm hover:bg-gray-200"><FaFileExport /> Export PDF</button>
        <button className="inline-flex items-center gap-1 px-2 py-1 rounded border border-purple-400 bg-purple-100 text-purple-900 shadow-sm hover:bg-purple-200"><FaUserPlus /> Assign</button>
        <button className="inline-flex items-center gap-1 px-2 py-1 rounded border border-yellow-400 bg-yellow-400 text-white shadow-sm hover:bg-yellow-500"><FaEnvelope /> Message</button>
        <button className="inline-flex items-center gap-1 px-2 py-1 rounded border border-red-600 bg-red-600 text-white shadow-sm hover:bg-red-700"><FaTrash /> Delete</button>
      </div>

      {/* Linked Records */}
      <div className="mb-4 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaFileAlt /> Linked Records</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="font-semibold">Payment History</div>
            <ul className="text-gray-700">
              {payments.map((p, idx) => (
                <li key={idx}>{getField(p.date, p.timestamp)}: {getField(p.amount, p.value)} ({getField(p.status, p.state)})</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold">Previous Enrollments</div>
            <ul className="text-gray-700">
              {previousEnrollments.map((e, idx) => (
                <li key={idx}>{getField(e.year, e.academic_year)}: {getField(e.program, e.course)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Audit & Compliance */}
      <div className="mb-2 p-3 rounded border bg-gray-50">
        <div className="font-bold mb-2 flex items-center gap-2"><FaFileAlt /> Audit & Compliance</div>
        <div className="text-gray-700">Created by: {getField(audit.createdBy, audit.created_by)} on {getField(audit.createdAt, audit.created_at)}</div>
        <div className="text-gray-700">Last modified by: {getField(audit.modifiedBy, audit.modified_by)} on {getField(audit.modifiedAt, audit.modified_at)}</div>
        <div className="text-gray-500">System logs: {(getField(audit.logs, audit.activity) || []).join(", ")}</div>
      </div>
    </div>
  );
}
