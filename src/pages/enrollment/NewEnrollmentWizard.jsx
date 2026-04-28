import React, { useState } from "react";
import { sections } from "./NewEnrollmentFormSections";
import { FaCheckCircle, FaSave, FaArrowLeft, FaArrowRight, FaCamera } from "react-icons/fa";

export default function NewEnrollmentWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [draftSaved, setDraftSaved] = useState(false);

  // Extract photo from form state
  const photoFile = form.student_photo;
  const [photoUrl, setPhotoUrl] = useState("");

  // Update photo preview when file changes
  React.useEffect(() => {
    if (photoFile && typeof photoFile === "object") {
      const url = URL.createObjectURL(photoFile);
      setPhotoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPhotoUrl("");
    }
  }, [photoFile]);

  const currentSection = sections[step];

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateSection = () => {
    const errs = {};
    currentSection.fields.forEach((f) => {
      if (f.required && !form[f.name]) {
        errs[f.name] = "Required";
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (validateSection()) setStep((s) => Math.min(s + 1, sections.length - 1));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const saveDraft = () => {
    setDraftSaved(true);
    // TODO: Save to backend/localStorage
  };

  const submit = () => {
    if (validateSection()) {
      // TODO: Submit to backend
      alert("Enrollment submitted!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow-lg">
      {/* Applicant Photo Preview */}
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
          {photoUrl ? (
            <img src={photoUrl} alt="Applicant" className="w-full h-full object-cover" />
          ) : (
            <FaCamera className="text-gray-400 text-4xl" />
          )}
        </div>
      </div>
      {/* Progress Bar */}
      <div className="flex items-center mb-8">
        {sections.map((sec, idx) => (
          <div key={sec.key} className="flex-1 flex items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full border-2 text-lg font-bold ${
                idx === step
                  ? "border-blue-600 bg-blue-100 text-blue-700"
                  : idx < step
                  ? "border-green-500 bg-green-100 text-green-700"
                  : "border-gray-300 bg-gray-50 text-gray-400"
              }`}
            >
              {idx < step ? <FaCheckCircle /> : idx + 1}
            </div>
            {idx < sections.length - 1 && (
              <div className="flex-1 h-1 bg-gray-200 mx-2">
                <div
                  className={`h-1 ${
                    idx < step ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {currentSection.title}
        </h2>
        <span className="text-sm text-gray-500">
          Step {step + 1} of {sections.length}
        </span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          step === sections.length - 1 ? submit() : next();
        }}
      >
        <div className="space-y-6">
          {currentSection.fields.map((f) => (
            <div key={f.name} className="mb-2">
              <label className="block text-sm font-semibold mb-1 text-gray-700">
                {f.label}
                {f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === "select" ? (
                <select
                  className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-400"
                  value={form[f.name] || ""}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                >
                  <option value="">Select</option>
                  {f.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : f.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={!!form[f.name]}
                  onChange={(e) => handleChange(f.name, e.target.checked)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              ) : f.type === "file" ? (
                <input
                  type="file"
                  accept={f.accept}
                  onChange={(e) => handleChange(f.name, e.target.files[0])}
                  className="block w-full text-sm text-gray-700 border border-gray-300 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              ) : (
                <input
                  type={f.type}
                  className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-400"
                  value={form[f.name] || ""}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                />
              )}
              {errors[f.name] && (
                <div className="text-xs text-red-500 mt-1">
                  {errors[f.name]}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-8 gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={prev}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold shadow-sm hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <FaArrowLeft className="text-lg" />
              <span>Back</span>
            </button>
          )}
          <button
            type="button"
            onClick={saveDraft}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-yellow-400 bg-yellow-50 text-yellow-900 font-semibold shadow-sm hover:bg-yellow-100 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <FaSave className="text-lg" />
            <span>Save as Draft</span>
          </button>
          {step < sections.length - 1 ? (
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <span>Next</span>
              <FaArrowRight className="text-lg" />
            </button>
          ) : (
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-green-600 bg-green-600 text-white font-semibold shadow-sm hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <FaCheckCircle className="text-lg" />
              <span>Submit</span>
            </button>
          )}
        </div>
        {draftSaved && (
          <div className="text-green-600 mt-4 text-sm flex items-center gap-2">
            <FaCheckCircle /> Draft saved!
          </div>
        )}
      </form>
    </div>
  );
}
