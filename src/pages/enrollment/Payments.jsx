import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUserCircle, FaMoneyBillWave, FaCheck, FaExclamationTriangle, FaDownload, FaPrint, FaEnvelope, FaMobileAlt, FaUniversity, FaCreditCard, FaCashRegister, FaFilter, FaInfoCircle, FaUser, FaIdCard, FaCalendarAlt, FaClipboardList, FaCommentDots } from "react-icons/fa";

export default function Payments() {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentInput, setPaymentInput] = useState({ amount: "", date: "", method: "", reference: "", receivedBy: "" });
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get("/api/enrollment/students/aligned/")
      .then((res) => {
        const sorted = Array.isArray(res.data) ? res.data : [];
        setStudents(sorted);
        setError("");
        if (sorted.length > 0) setSelectedId(sorted[0].id);
      })
      .catch(() => setError("Failed to fetch students"))
      .finally(() => setLoading(false));
  }, []);

  const selectedStudent = students.find(s => s.id === selectedId);
  const payments = selectedStudent?.fees || [];
  const totalFees = payments.reduce((sum, f) => sum + Number(f.total_amount || 0), 0);
  const totalPaid = payments.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0);
  const discounts = payments.reduce((sum, f) => sum + Number(f.discount || 0), 0);
  const outstanding = totalFees - totalPaid - discounts;

  // Payment input validation
  const canSubmit = paymentInput.amount && paymentInput.date && paymentInput.method && outstanding >= paymentInput.amount && paymentInput.amount > 0;

  return (
    <div className="p-6">
      {/* 1️⃣ Student / Payer Summary (Sticky Header) */}
      <div className="sticky top-0 z-10 bg-white border-b pb-2 mb-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden border flex items-center justify-center bg-gray-100">
          {selectedStudent?.student_photo ? (
            <img src={selectedStudent.student_photo} alt="Avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <FaUserCircle className="text-gray-400 text-3xl" />
          )}
        </div>
        <div>
          <div className="font-bold text-lg cursor-pointer hover:underline" onClick={() => window.open(`/students/${selectedStudent?.id}`)}>{selectedStudent?.first_name} {selectedStudent?.last_name}</div>
          <div className="text-xs text-gray-500">ID: {selectedStudent?.admission_number} | Class: {selectedStudent?.enrollments?.[0]?.grade_or_class || "-"} | Program: {selectedStudent?.enrollments?.[0]?.program || "-"}</div>
          <div className="text-xs text-gray-500">Year: {selectedStudent?.enrollments?.[0]?.academic_year || "-"} | Status: {selectedStudent?.enrollments?.[0]?.enrollment_status || "-"}</div>
        </div>
      </div>
      {/* 2️⃣ Fee Breakdown */}
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2"><FaMoneyBillWave /> Fee Breakdown</h2>
        <table className="w-full text-sm mb-2">
          <thead>
            <tr className="bg-gray-100">
              <th>Fee Item</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Discount</th>
              <th>Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((fee, idx) => (
              <tr key={idx}>
                <td>{fee.fee_structure}</td>
                <td>{fee.description || "-"}</td>
                <td>{Number(fee.total_amount).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                <td>{fee.discount ? `${fee.discount}%` : "-"}</td>
                <td>{(Number(fee.total_amount) - Number(fee.discount || 0)).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 3️⃣ Outstanding Balance Summary */}
      <div className={`mb-4 p-4 rounded shadow ${outstanding > 0 ? "bg-red-50 border border-red-400" : "bg-green-50 border border-green-400"}`}>
        <div className="flex items-center gap-2">
          <span className="font-bold">Outstanding Balance:</span>
          <span className={`text-lg font-bold ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>{outstanding.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span>
          {outstanding > 0 && <FaExclamationTriangle className="text-red-400 ml-2" title="Payment overdue" />}
          <FaInfoCircle className="ml-2 text-gray-400" title="Total Fees - Paid - Discounts" />
        </div>
        <div className="text-xs text-gray-500">Total Fees: {totalFees.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} | Paid: {totalPaid.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} | Discounts: {discounts.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</div>
      </div>
      {/* 4️⃣ Make a Payment */}
      <div className="mb-4 p-4 rounded border bg-white shadow">
        <h2 className="text-lg font-bold mb-2">Manual Cash Payment Entry</h2>
        <form className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold mb-1 flex items-center gap-1"><FaUser /> Payer Name *</label>
            <input type="text" value={paymentInput.payerName || selectedStudent?.first_name + ' ' + selectedStudent?.last_name} onChange={e => setPaymentInput({ ...paymentInput, payerName: e.target.value })} className="border rounded px-2 py-1 w-full" required />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 flex items-center gap-1"><FaIdCard /> Student ID *</label>
            <input type="text" value={paymentInput.studentId || selectedStudent?.admission_number} onChange={e => setPaymentInput({ ...paymentInput, studentId: e.target.value })} className="border rounded px-2 py-1 w-full" required />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 flex items-center gap-1"><FaCalendarAlt /> Payment Date *</label>
            <input type="date" value={paymentInput.date} onChange={e => setPaymentInput({ ...paymentInput, date: e.target.value })} className="border rounded px-2 py-1 w-full" required />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 flex items-center gap-1"><FaClipboardList /> Payment For *</label>
            <select value={paymentInput.feeItem} onChange={e => setPaymentInput({ ...paymentInput, feeItem: e.target.value })} className="border rounded px-2 py-1 w-full" required>
              <option value="">Select Fee Item</option>
              {payments.map((fee, idx) => (
                <option key={idx} value={fee.fee_structure}>{fee.fee_structure}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 flex items-center gap-1"><FaMoneyBillWave /> Amount *</label>
            <input type="number" min="1" max={outstanding} value={paymentInput.amount} onChange={e => setPaymentInput({ ...paymentInput, amount: e.target.value })} className="border rounded px-2 py-1 w-full" required />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 flex items-center gap-1"><FaCommentDots /> Notes</label>
            <input type="text" value={paymentInput.notes || ""} onChange={e => setPaymentInput({ ...paymentInput, notes: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="Optional notes or remarks" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 flex items-center gap-1"><FaUser /> Received By (staff) *</label>
            <input type="text" value={paymentInput.receivedBy} onChange={e => setPaymentInput({ ...paymentInput, receivedBy: e.target.value })} className="border rounded px-2 py-1 w-full" required />
          </div>
          <div>
            <button type="submit" disabled={!canSubmit} className={`inline-flex items-center gap-2 px-4 py-2 rounded bg-green-600 text-white font-semibold shadow hover:bg-green-700 ${!canSubmit ? "opacity-50 cursor-not-allowed" : ""}`}>Record Cash Payment <FaCheck /></button>
          </div>
        </form>
        <div className="text-xs text-gray-500 mt-2">All details required for compliance. Overpayment prevented. Staff and notes fields included.</div>
      </div>
      {/* 5️⃣ Payment Methods Integration (UI only) */}
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Supported Payment Methods</h2>
        <div className="flex gap-4 flex-wrap">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded border border-yellow-400 bg-yellow-50 text-yellow-900"><FaMobileAlt /> MTN MoMo</span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded border border-pink-400 bg-pink-50 text-pink-900"><FaMobileAlt /> Airtel Money</span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded border border-blue-400 bg-blue-50 text-blue-900"><FaUniversity /> Bank Deposit</span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded border border-green-400 bg-green-50 text-green-900"><FaCreditCard /> Stripe / Paystack / Flutterwave</span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded border border-gray-400 bg-gray-50 text-gray-900"><FaCashRegister /> Manual Cash Entry</span>
        </div>
      </div>
      {/* 6️⃣ Payment History (Ledger) */}
      {showHistory && (
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">Payment History <FaFilter className="text-gray-400" /></h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Recorded By</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((fee, idx) => (
                <tr key={idx}>
                  <td>{fee.created_at?.slice(0, 10)}</td>
                  <td>{Number(fee.paid_amount).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                  <td>{fee.payment_method}</td>
                  <td>{fee.reference || "-"}</td>
                  <td>{fee.payment_status}</td>
                  <td>{fee.received_by || "-"}</td>
                  <td>
                    {fee.receipt_file ? (
                      <a href={fee.receipt_file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded border border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700"><FaDownload /> Download</a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
