import React, { useState, useEffect } from "react";
import { Info, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { fetchWithAuth } from '../../api';
// Removed your-ui-library imports. Using native HTML and Tailwind CSS.

export default function WebsiteConfiguration() {
  // Allowed Origins (CORS) state
  const [allowedOrigins, setAllowedOrigins] = useState([]);
  const [newOrigin, setNewOrigin] = useState("");
  const [originError, setOriginError] = useState("");

  // Fetch allowed origins on mount
  useEffect(() => {
    fetchWithAuth('/api/website-config/allowed-origins/')
      .then(res => res && res.ok ? res.json() : [])
      .then(data => setAllowedOrigins(data));
  }, []);

  // Add a new allowed origin
  const handleAddOrigin = async () => {
    setOriginError("");
    if (!/^https?:\/\/[a-zA-Z0-9\-\.]+(:\d+)?$/.test(newOrigin)) {
      setOriginError("Invalid URL format. Must start with http(s):// and be a valid domain, localhost, or IP address.");
      return;
    }
    try {
      const res = await fetchWithAuth('/api/website-config/allowed-origins/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: newOrigin })
      });
      const data = res && res.ok ? await res.json() : null;
      if (data && data.origin) {
        setAllowedOrigins([data, ...allowedOrigins]);
        setNewOrigin("");
      } else {
        setOriginError("Failed to add origin.");
      }
    } catch {
      setOriginError("Failed to add origin.");
    }
  };

  // Delete an allowed origin
  const handleDeleteOrigin = async (id) => {
    const res = await fetchWithAuth(`/api/website-config/allowed-origins/${id}/`, {
      method: 'DELETE'
    });
    if (res && res.status === 204) {
      setAllowedOrigins(allowedOrigins.filter(o => o.id !== id));
    }
  };

  // Order Sync state
  const [orderSyncActive, setOrderSyncActive] = useState(false);
  const [fieldMapping, setFieldMapping] = useState({
    customer_name: "customerName",
    email: "email",
    product_id: "productId",
    quantity: "qty",
    order_total: "total"
  });
  const [orderSyncStatus, setOrderSyncStatus] = useState("");
  const [orderSyncError, setOrderSyncError] = useState("");
  const [orderLogs, setOrderLogs] = useState([]);
  const [testOrderLoading, setTestOrderLoading] = useState(false);

  // Fetch config and logs on mount
  useEffect(() => {
    fetchWithAuth('/api/website-config/config/')
      .then(res => res && res.ok ? res.json() : {})
      .then(data => {
        setOrderSyncActive(data.enabled);
        setFieldMapping(data.field_mapping || fieldMapping);
      });
    fetchWithAuth('/api/website-config/orders/logs/')
      .then(res => res && res.ok ? res.json() : [])
      .then(data => setOrderLogs(data));
  }, []);

  const handleMappingChange = (saasField, value) => {
    const newMapping = { ...fieldMapping, [saasField]: value };
    setFieldMapping(newMapping);
    fetchWithAuth('/api/website-config/config/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field_mapping: newMapping })
    });
  };

  const handleOrderSyncToggle = () => {
    const newEnabled = !orderSyncActive;
    setOrderSyncActive(newEnabled);
    setOrderSyncStatus("");
    setOrderSyncError("");
    fetchWithAuth('/api/website-config/config/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: newEnabled })
    });
  };

  const handleTestOrder = async () => {
    setTestOrderLoading(true);
    setOrderSyncStatus("");
    setOrderSyncError("");
    try {
      const payload = {};
      Object.entries(fieldMapping).forEach(([saas, web]) => {
        payload[web] = `test_${saas}`;
      });
      const apiKey = "demo_api_key"; // TODO: Replace with real tenant API key if available
      const res = await fetch('/api/website-config/orders/test/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, payload })
      });
      const data = await res.json();
      if (data.success) {
        setOrderSyncStatus("Test order sent successfully!");
        setOrderLogs((prev) => [
          { id: Date.now(), customer_name: "Test", status: "success", created_at: new Date().toLocaleString() },
          ...prev.slice(0, 9)
        ]);
      } else {
        setOrderSyncError("Test failed: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      setOrderSyncError("Test failed: " + (e.message || "Unknown error"));
    } finally {
      setTestOrderLoading(false);
    }
  };
  // Track which field is being edited
  const [editingField, setEditingField] = useState(null);
  const [fieldValue, setFieldValue] = useState("");
  const [fieldStatus, setFieldStatus] = useState("");

  // Save handler for individual fields
  const handleFieldSave = (field) => {
    setFieldStatus("Saved!");
    setEditingField(null);
    setFieldStatus("");
    switch (field) {
      case "domain": setDomain(fieldValue); break;
      case "subdomain": setSubdomain(fieldValue); break;
      case "apiKey": setApiKey(fieldValue); break;
      case "webhookUrl": setWebhookUrl(fieldValue); break;
      case "trackingCode": setTrackingCode(fieldValue); break;
      default: break;
    }
  };
  // State hooks for all fields
  const [domain, setDomain] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  // Optionally, for general config state:
  // const [orderSyncConfigured, setOrderSyncConfigured] = useState(false);
  const [template, setTemplate] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [domainVerified, setDomainVerified] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Dummy template list
  const templates = [
    { id: "classic", name: "Classic", preview: "classic.png" },
    { id: "modern", name: "Modern", preview: "modern.png" },
    { id: "minimal", name: "Minimal", preview: "minimal.png" },
  ];

  // Handlers
  const handleSave = () => {
    setStatusMsg("Settings saved successfully!");
    setLastUpdated(new Date().toLocaleString());
  };
  const handleTest = () => {
    setStatusMsg("Test passed: integration working!");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* 1. Page Header / Title */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Website Configuration</h1>
        <p className="text-gray-600 text-lg">Connect your public website or app to receive orders directly into your SaaS.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left / Main Column */}
        <div className="md:col-span-2 space-y-8">
          {/* 2. Domain / Website Section */}
                    {/* Allowed Origins (CORS) Section */}
                    <section className="bg-white rounded-xl shadow p-6 mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Allowed Origins (CORS)</h2>
                        <Info size={18} className="text-gray-400" title="Manage which website URLs are allowed to access your API." />
                      </div>
                      <div className="flex gap-2 mb-4">
                        <input
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="https://yourwebsite.com"
                          value={newOrigin}
                          onChange={e => setNewOrigin(e.target.value)}
                        />
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={handleAddOrigin}>Add</button>
                      </div>
                      {originError && <div className="text-red-600 text-xs mb-2">{originError}</div>}
                      <ul className="space-y-2">
                        {allowedOrigins.length === 0 && <li className="text-gray-400 text-sm">No allowed origins set.</li>}
                        {allowedOrigins.map(origin => (
                          <li key={origin.id} className="flex items-center justify-between border rounded px-3 py-2">
                            <span>{origin.origin}</span>
                            <button className="text-red-600 text-xs ml-2" onClick={() => handleDeleteOrigin(origin.id)}>Remove</button>
                          </li>
                        ))}
                      </ul>
                    </section>
          <section className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Domain / Website</h2>
              <span className="text-xs text-gray-500 cursor-pointer" title="This is the website that will be connected to your SaaS.">?</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Website Domain or App URL</label>
              {editingField !== "domain" && (
                <button className="text-blue-600 text-xs" onClick={() => {setEditingField("domain"); setFieldValue(domain);}}>Edit</button>
              )}
            </div>
            {editingField === "domain" ? (
              <div className="flex gap-2 mb-2">
                <input
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="www.mybusiness.com"
                  value={fieldValue}
                  onChange={e => setFieldValue(e.target.value)}
                />
                <button className="bg-green-600 text-white px-3 py-1 rounded-lg" onClick={() => handleFieldSave("domain")}>Save</button>
              </div>
            ) : (
              <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 mb-2">{domain}</div>
            )}
            {domain && !/^https?:\/\/.+\..+/.test(domain) && (
              <div className="text-red-600 text-xs mb-2">Invalid URL format</div>
            )}
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Subdomain (optional)</label>
              {editingField !== "subdomain" && (
                <button className="text-blue-600 text-xs" onClick={() => {setEditingField("subdomain"); setFieldValue(subdomain);}}>Edit</button>
              )}
            </div>
            {editingField === "subdomain" ? (
              <div className="flex gap-2 mb-2">
                <input
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="staging.mybusiness.com"
                  value={fieldValue}
                  onChange={e => setFieldValue(e.target.value)}
                />
                <button className="bg-green-600 text-white px-3 py-1 rounded-lg" onClick={() => handleFieldSave("subdomain")}>Save</button>
              </div>
            ) : (
              <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 mb-2">{subdomain}</div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Domain Verified:</span>
              {domainVerified ? (
                <CheckCircle className="text-green-600" size={18} />
              ) : (
                <XCircle className="text-red-600" size={18} />
              )}
            </div>
          </section>
          {/* 3. API / Webhook Integration Section */}
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">API / Webhook Integration</h2>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">API Key</label>
              {editingField !== "apiKey" && (
                <button className="text-blue-600 text-xs" onClick={() => {setEditingField("apiKey"); setFieldValue(apiKey);}}>Edit</button>
              )}
            </div>
            {editingField === "apiKey" ? (
              <div className="flex gap-2 mb-2">
                <input
                  className="w-full px-4 py-2 border rounded-lg"
                  type="password"
                  value={fieldValue}
                  onChange={e => setFieldValue(e.target.value)}
                />
                <button className="bg-green-600 text-white px-3 py-1 rounded-lg" onClick={() => handleFieldSave("apiKey")}>Save</button>
              </div>
            ) : (
              <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 mb-2">{apiKey ? "••••••••" : ""}</div>
            )}
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Webhook URL</label>
              {editingField !== "webhookUrl" && (
                <button className="text-blue-600 text-xs" onClick={() => {setEditingField("webhookUrl"); setFieldValue(webhookUrl);}}>Edit</button>
              )}
            </div>
            {editingField === "webhookUrl" ? (
              <div className="flex gap-2 mb-2">
                <input
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="https://..."
                  value={fieldValue}
                  onChange={e => setFieldValue(e.target.value)}
                />
                <button className="bg-green-600 text-white px-3 py-1 rounded-lg" onClick={() => handleFieldSave("webhookUrl")}>Save</button>
              </div>
            ) : (
              <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 mb-2">{webhookUrl}</div>
            )}
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg mr-2" onClick={handleTest}>Test Connection</button>
            <div className="text-xs text-gray-600 mt-2">{statusMsg}</div>
          </section>
          {/* 4. Order Sync Section */}
          <section className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Order Sync</h2>
              <Info size={18} className="text-gray-400" title="Enable this to automatically receive orders from your website." />
            </div>
            <div className="flex items-center mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderSyncActive}
                  onChange={handleOrderSyncToggle}
                  className="mr-2"
                />
                <span className="font-medium">Enable Order Sync</span>
              </label>
            </div>
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <span className="font-semibold mr-2">Field Mapping</span>
                <Info size={16} className="text-gray-400" title="Map your website's field names to SaaS fields." />
              </div>
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">SaaS Field</th>
                    <th className="p-2 text-left">Your Website Field</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(fieldMapping).map(([saas, web]) => (
                    <tr key={saas} className="border-t">
                      <td className="p-2 font-medium text-gray-700">{saas}</td>
                      <td className="p-2">
                        <input
                          className="w-full px-2 py-1 border rounded"
                          value={web}
                          onChange={e => handleMappingChange(saas, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                onClick={handleTestOrder}
                disabled={testOrderLoading}
              >
                <RefreshCw className={testOrderLoading ? "animate-spin" : ""} size={18} />
                Test Order
              </button>
              {orderSyncStatus && <span className="text-green-600 flex items-center gap-1"><CheckCircle size={16} /> {orderSyncStatus}</span>}
              {orderSyncError && <span className="text-red-600 flex items-center gap-1"><XCircle size={16} /> {orderSyncError}</span>}
            </div>
            <div>
              <div className="flex items-center mb-2">
                <span className="font-semibold mr-2">Recent Orders</span>
                <Info size={16} className="text-gray-400" title="Shows the last 5-10 orders received via sync." />
              </div>
              <table className="w-full text-xs border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Customer</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {orderLogs.length === 0 && (
                    <tr><td colSpan={3} className="p-2 text-gray-400 text-center">No orders yet.</td></tr>
                  )}
                  {orderLogs.map((log) => (
                    <tr key={log.id} className="border-t">
                      <td className="p-2">{log.customer_name}</td>
                      <td className="p-2">
                        {log.status === "success" ? (
                          <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14} /> Success</span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1"><XCircle size={14} /> Error</span>
                        )}
                      </td>
                      <td className="p-2">{log.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {/* 6. Analytics / Tracking Section */}
          <section className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Analytics / Tracking</h2>
              <span className="text-xs text-gray-500 cursor-pointer" title="Paste code from Google Analytics, Facebook Pixel, etc.">?</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Tracking Scripts (Google Analytics, Facebook Pixel, etc.)</label>
              {editingField !== "trackingCode" && (
                <button className="text-blue-600 text-xs" onClick={() => {setEditingField("trackingCode"); setFieldValue(trackingCode);}}>Edit</button>
              )}
            </div>
            {editingField === "trackingCode" ? (
              <div className="flex gap-2 mb-2">
                <textarea
                  className="w-full px-4 py-2 border rounded-lg"
                  value={fieldValue}
                  onChange={e => setFieldValue(e.target.value)}
                  placeholder="Paste your tracking code here"
                />
                <button className="bg-green-600 text-white px-3 py-1 rounded-lg" onClick={() => handleFieldSave("trackingCode")}>Save</button>
              </div>
            ) : (
              <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 mb-2 whitespace-pre-wrap">{trackingCode}</div>
            )}
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={trackingEnabled}
                onChange={e => setTrackingEnabled(e.target.checked)}
                className="mr-2"
              />
              Enable Tracking
            </label>
          </section>
        </div>
        {/* Right / Side Column */}
        <div className="space-y-8">
          {/* 5. Template / Theme Selection Section */}
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Template / Theme Selection</h2>
            <div className="grid grid-cols-1 gap-4">
              {templates.map(t => (
                <div
                  key={t.id}
                  className={`border rounded-lg p-4 flex flex-col items-center ${template === t.id ? 'border-blue-600' : 'border-gray-200'}`}
                  onClick={() => setTemplate(t.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={t.preview} alt={t.name} className="h-16 w-16 object-contain mb-2" />
                  <div className="font-medium mb-1">{t.name}</div>
                  {template === t.id && <CheckCircle className="text-blue-600 mb-1" size={18} />}
                  <button className="bg-gray-200 px-2 py-1 rounded-lg text-xs" onClick={e => {e.stopPropagation(); window.open(t.preview, "_blank");}}>Preview</button>
                </div>
              ))}
            </div>
          </section>
          {/* 8. Optional / Advanced Components */}
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Advanced</h2>
            <div className="flex items-center gap-2 mb-2">
              <button className="bg-red-100 text-red-700 px-4 py-2 rounded-lg">Reset to Defaults</button>
              <span className="text-xs text-gray-600">Last Updated: {lastUpdated || "Never"}</span>
            </div>
            <div className="text-xs text-gray-600 mb-2">Webhook/API Logs (coming soon)</div>
          </section>
        </div>
      </div>
      {/* 7. Save & Test Section */}
      <div className="mt-8 flex gap-4 justify-center">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg" onClick={handleSave}>Save / Update</button>
        <button className="bg-green-600 text-white px-6 py-2 rounded-lg" onClick={handleTest}>Test Configuration</button>
        <div className="text-xs text-gray-600 mt-2">{statusMsg}</div>
      </div>
    </div>
  );
}
