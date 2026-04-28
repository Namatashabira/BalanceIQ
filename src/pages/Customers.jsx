import { useEffect, useMemo, useState } from 'react';
import { UserRound, MapPin, Phone, Mail, RefreshCw, Loader2, Plus, Star } from 'lucide-react';
import { useConfig, useLabels } from '../context/ConfigContext';
import { useToast } from '../context/ToastContext';
import { fetchWithAuth } from '../api';

const CUSTOMERS_API = 'http://127.0.0.1:8000/api/core/customers/';

const deriveContactLabels = (businessType, labels) => {
  const baseSingular = labels.entity || (businessType === 'education' ? 'Student' : businessType === 'services' ? 'Client' : 'Customer');
  const basePlural = labels.entities || `${baseSingular}${baseSingular.endsWith('s') ? '' : 's'}`;
  return { singular: baseSingular, plural: basePlural };
};

export default function Customers() {
  const { businessType } = useConfig();
  const labels = useLabels();
  const toast = useToast();

  const { singular: contactLabel, plural: contactLabelPlural } = useMemo(
    () => deriveContactLabels(businessType, labels),
    [businessType, labels]
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '' });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(CUSTOMERS_API);
      if (!res || !res.ok) throw new Error(`Load failed (${res?.status || 'no response'})`);
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error('Failed to load customers', err);
      toast.error('Could not load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name && !form.email && !form.phone) {
      toast.warning(`Add at least a name, email, or phone to save a ${contactLabel.toLowerCase()}.`);
      return;
    }
    try {
      setSaving(true);
      const res = await fetchWithAuth(CUSTOMERS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res || !res.ok) {
        const txt = await res?.text();
        throw new Error(txt || 'Save failed');
      }
      toast.success(`${contactLabel} saved`);
      setForm({ name: '', email: '', phone: '', location: '' });
      loadCustomers();
    } catch (err) {
      console.error('Failed to save customer', err);
      toast.error('Could not save entry.');
    } finally {
      setSaving(false);
    }
  };

  const permanentFlag = (c) => {
    const count = c.visit_count || c.total_orders || c.order_count || c.times_seen || 0;
    return count >= 3;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Unified {contactLabel.toLowerCase()} records from public site + manual entry</p>
          <h1 className="text-2xl font-bold text-gray-900">{contactLabelPlural}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadCustomers}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Reload
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow border border-gray-100 space-y-3 lg:col-span-1">
          <h2 className="text-lg font-semibold">Add {contactLabel}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`e.g. Walk-in ${contactLabel}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0700 000 000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="City / area"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Save {contactLabel}
          </button>
          <p className="text-xs text-gray-500">Blank fields stay optional; the system auto-dedupe by phone/email on the backend.</p>
        </form>

        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent {contactLabelPlural}</h2>
            <div className="text-sm text-gray-500">{customers.length} total</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">{contactLabel}</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Contact</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Location</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-gray-500">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                      </div>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-gray-500">No {contactLabelPlural.toLowerCase()} yet.</td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id || `${c.email || c.phone || c.name}`}> 
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserRound className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-semibold text-gray-900">{c.name || contactLabel}</div>
                            {permanentFlag(c) && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 mt-1">
                                <Star className="w-3 h-3" /> Frequent
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 space-y-1">
                        {c.phone && (
                          <div className="flex items-center gap-2 text-gray-700"><Phone className="w-4 h-4" /> {c.phone}</div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-2 text-gray-700"><Mail className="w-4 h-4" /> {c.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4" /> {c.location || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {c.visit_count || c.total_orders || c.order_count || c.times_seen || 1}x
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
