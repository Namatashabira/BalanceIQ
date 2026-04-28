// components/settings/UserRoleManagement.jsx
import React, { useState, useEffect } from "react";
import { useToast } from '../../context/ToastContext';
import {
  fetchWorkers,
  fetchWorkerPermissions,
  updateWorkerPermissions,
  createWorker,
  deleteWorker,
  createTenant,
  deleteTenant,
  fetchTenants,
  getCurrentUser,
  logoutUser,
} from "../../api";

export default function UserRoleManagement() {
  const toast = useToast();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [showCreateWorker, setShowCreateWorker] = useState(false);
  const [showTenantsList, setShowTenantsList] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [newTenant, setNewTenant] = useState({ name: "", adminEmail: "" });
  const [newWorker, setNewWorker] = useState({ email: "", password: "", role: "worker", tenant: null });

  const pagesWithFields = {
    dashboard: ["overview", "stats", "recentActivity"],
    orders: ["pendingOrders", "confirmedOrders", "cancelledOrders"],
    customers: ["customerList", "customerDetails", "emailNotification"],
    analytics: ["charts", "reports"],
    settings: ["profileSettings", "notifications", "deleteAccount"],
    userManagement: ["createWorker", "editPermissions", "deleteWorker"],
    tenantManagement: ["createTenant", "viewTenants", "manageTenants"],
  };

  // Get current user info
  const loadCurrentUser = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
  };

  // Fetch all workers
  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await fetchWorkers();
      if (!data) {
        setSessionExpired(true);
        return;
      }
      setWorkers(data);
    } catch (err) {
      console.error("loadWorkers error:", err);
      setSessionExpired(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all tenants (superadmin only)
  const loadTenants = async () => {
    if (currentUser?.role !== 'superadmin') return;
    try {
      const data = await fetchTenants();
      if (data) setTenants(data);
    } catch (err) {
      console.error("loadTenants error:", err);
    }
  };

  useEffect(() => {
    loadCurrentUser();
    loadWorkers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadTenants();
    }
  }, [currentUser]);

  // Fetch permissions of a selected worker
  const selectWorker = async (worker) => {
    try {
      const permissions = await fetchWorkerPermissions(worker.id);
      if (!permissions) {
        setSessionExpired(true);
        return;
      }
      setSelectedWorker({ ...worker, permissions });
    } catch (err) {
      console.error("selectWorker error:", err);
      setSessionExpired(true);
    }
  };

  const togglePageAccess = (page) => {
    if (!selectedWorker) return;
    const updatedPermissions = {
      ...selectedWorker.permissions,
      pages: {
        ...selectedWorker.permissions.pages,
        [page]: !selectedWorker.permissions.pages[page],
      },
      fields: {
        ...selectedWorker.permissions.fields,
        [page]: selectedWorker.permissions.fields[page] || {},
      },
    };
    setSelectedWorker({ ...selectedWorker, permissions: updatedPermissions });
  };

  const toggleFieldAccess = (page, field) => {
    if (!selectedWorker) return;
    const updatedFields = {
      ...selectedWorker.permissions.fields,
      [page]: {
        ...selectedWorker.permissions.fields[page],
        [field]: !selectedWorker.permissions.fields[page]?.[field],
      },
    };
    setSelectedWorker({
      ...selectedWorker,
      permissions: { ...selectedWorker.permissions, fields: updatedFields },
    });
  };

  const savePermissions = async () => {
    if (!selectedWorker) return;
    setUpdating(true);
    try {
      const updated = await updateWorkerPermissions(
        selectedWorker.id,
        selectedWorker.permissions
      );
      if (!updated) {
        setSessionExpired(true);
        return;
      }
      setWorkers(
        workers.map((w) => (w.id === selectedWorker.id ? selectedWorker : w))
      );
      toast.success("Permissions updated successfully!");
    } catch (err) {
      console.error("savePermissions error:", err);
      toast.error("Failed to update permissions.");
    } finally {
      setUpdating(false);
    }
  };

  // Create new tenant (superadmin only) - auto-generates a 5-digit PIN on backend
  const handleCreateTenant = async () => {
    if (!newTenant.name || !newTenant.adminEmail) {
      toast.warning("Please provide tenant name and admin email");
      return;
    }
    try {
      const created = await createTenant({ name: newTenant.name, adminEmail: newTenant.adminEmail });
      if (created) {
        setTenants([...tenants, created]);
        setNewTenant({ name: "", adminEmail: "" });
        setShowCreateTenant(false);
        const pin = created.initialPassword || created.initial_pin || created.pin;
        if (pin) {
          toast.success(`Tenant created! Initial PIN: ${pin}`);
        } else {
          toast.success("Tenant created successfully!");
        }
      }
    } catch (err) {
      console.error("createTenant error:", err);
      toast.error("Failed to create tenant.");
    }
  };


  // Create new worker
  const handleCreateWorker = async () => {
    if (!newWorker.email || !newWorker.password) {
      toast.warning("Please fill all fields");
      return;
    }
    
    // Superadmin must select a tenant
    if (currentUser?.role === 'superadmin' && !newWorker.tenant) {
      toast.warning("Please select a tenant");
      return;
    }

    try {
      const created = await createWorker(newWorker);
      if (created) {
        setWorkers([...workers, created]);
        setNewWorker({ email: "", password: "", role: "worker", tenant: null });
        setShowCreateWorker(false);
        toast.success("Worker created successfully!");
      }
    } catch (err) {
      console.error("createWorker error:", err);
      toast.error("Failed to create worker.");
    }
  };

  // Delete worker
  const handleDeleteWorker = async (workerId) => {
    if (!window.confirm("Are you sure you want to delete this worker?")) return;
    try {
      const deleted = await deleteWorker(workerId);
      if (deleted) {
        setWorkers(workers.filter(w => w.id !== workerId));
        toast.success("Worker deleted successfully!");
      }
    } catch (err) {
      console.error("deleteWorker error:", err);
      toast.error("Failed to delete worker.");
    }
  };

  // Delete tenant (Superadmin only)
  const handleDeleteTenant = async (tenantId) => {
    if (!confirm("Are you sure you want to delete this tenant and all its workers?")) return;
    try {
      // Find the tenant by id or uuid
      const tenant = tenants.find(t => t.uuid === tenantId || t.id === tenantId);
      const deleted = await deleteTenant(tenant?.uuid || tenantId);
      if (deleted) {
        setTenants(tenants.filter(t => (t.uuid || t.id) !== (tenant?.uuid || tenantId)));
        toast.success("Tenant deleted successfully!");
      }
    } catch (err) {
      console.error("deleteTenant error:", err);
      toast.error("Failed to delete tenant.");
    }
  };

  const assignedPages = selectedWorker
    ? Object.keys(selectedWorker.permissions.pages).filter(
        (page) => selectedWorker.permissions.pages[page]
      )
    : [];

  // If session expired, show login redirect message
  if (sessionExpired) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Session Expired</h2>
        <p>Your session has expired. Please log in again.</p>
        <button
          onClick={logoutUser}
          style={{
            padding: "10px 15px",
            borderRadius: "5px",
            border: "none",
            backgroundColor: "#007bff",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>User & Role Management</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          {currentUser?.role === 'superadmin' && (
            <>
              <button
                onClick={() => setShowTenantsList(true)}
                style={{
                  padding: "10px 15px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#6c757d",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Manage Tenants
              </button>
              <button
                onClick={() => setShowCreateTenant(true)}
                style={{
                  padding: "10px 15px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#28a745",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Create Tenant
              </button>
            </>
          )}
          {(currentUser?.role === 'superadmin' || currentUser?.role === 'tenant_admin') && (
            <button
              onClick={() => setShowCreateWorker(true)}
              style={{
                padding: "10px 15px",
                borderRadius: "5px",
                border: "none",
                backgroundColor: "#007bff",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Add Worker
            </button>
          )}
        </div>
      </div>

      {/* Current User Info */}
      {currentUser && (
        <div style={{ 
          backgroundColor: "#f8f9fa", 
          padding: "15px", 
          borderRadius: "8px", 
          marginBottom: "20px",
          border: "1px solid #dee2e6"
        }}>
          <h4 style={{ margin: "0 0 10px 0" }}>Current User</h4>
          <p style={{ margin: "5px 0" }}><strong>Email:</strong> {currentUser.email}</p>
          <p style={{ margin: "5px 0" }}><strong>Role:</strong> {currentUser.role}</p>
          {currentUser.tenant && (
            <p style={{ margin: "5px 0" }}><strong>Tenant:</strong> {currentUser.tenant}</p>
          )}
        </div>
      )}

      {/* Manage Tenants Modal */}
      {showTenantsList && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          overflowY: "auto"
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            width: "600px",
            maxWidth: "90vw",
            maxHeight: "80vh",
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3>Manage Tenants</h3>
              <button
                onClick={() => setShowTenantsList(false)}
                style={{
                  padding: "5px 10px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: "#f8f9fa",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            {tenants.length === 0 ? (
              <p>No tenants found.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "10px", borderBottom: "1px solid #ddd" }}>Tenant Name</th>
                      <th style={{ textAlign: "left", padding: "10px", borderBottom: "1px solid #ddd" }}>Admin Email</th>
                      <th style={{ textAlign: "left", padding: "10px", borderBottom: "1px solid #ddd" }}>Workers</th>
                      <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px" }}>{tenant.name}</td>
                        <td style={{ padding: "10px" }}>{tenant.admin_email}</td>
                        <td style={{ padding: "10px" }}>{tenant.worker_count || 0}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <button
                            onClick={() => handleDeleteTenant(tenant.id)}
                            style={{
                              padding: "5px 10px",
                              border: "none",
                              borderRadius: "5px",
                              backgroundColor: "#dc3545",
                              color: "#fff",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {showCreateTenant && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            width: "400px",
            maxWidth: "90vw"
          }}>
            <h3>Create New Tenant</h3>
            <div style={{ marginBottom: "15px" }}>
              <label>Tenant Name:</label>
              <input
                type="text"
                value={newTenant.name}
                onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "5px",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label>Admin Email:</label>
              <input
                type="email"
                value={newTenant.adminEmail}
                onChange={(e) => setNewTenant({...newTenant, adminEmail: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "5px",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
            {/* Password is auto-generated as a 5-digit PIN on creation */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowCreateTenant(false)}
                style={{
                  padding: "8px 15px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "#f8f9fa",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTenant}
                style={{
                  padding: "8px 15px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: "#28a745",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Create Tenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Worker Modal */}
      {showCreateWorker && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            width: "400px",
            maxWidth: "90vw"
          }}>
            <h3>Add New Worker</h3>
            {currentUser?.role === 'superadmin' && (
              <div style={{ marginBottom: "15px" }}>
                <label>Tenant:</label>
                <select
                  value={newWorker.tenant || ""}
                  onChange={(e) => setNewWorker({...newWorker, tenant: parseInt(e.target.value) || null})}
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    border: "1px solid #ddd",
                    borderRadius: "4px"
                  }}
                >
                  <option value="">Select a tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ marginBottom: "15px" }}>
              <label>Email:</label>
              <input
                type="email"
                value={newWorker.email}
                onChange={(e) => setNewWorker({...newWorker, email: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "5px",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label>Password:</label>
              <input
                type="password"
                value={newWorker.password}
                onChange={(e) => setNewWorker({...newWorker, password: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "5px",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label>Role:</label>
              <select
                value={newWorker.role}
                onChange={(e) => setNewWorker({...newWorker, role: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "5px",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              >
                <option value="worker">Worker</option>
                {currentUser?.role === 'superadmin' && (
                  <option value="tenant_admin">Tenant Admin</option>
                )}
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowCreateWorker(false)}
                style={{
                  padding: "8px 15px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "#f8f9fa",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorker}
                style={{
                  padding: "8px 15px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: "#007bff",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Add Worker
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading workers...</p>
      ) : !selectedWorker ? (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px", borderBottom: "1px solid #ddd" }}>Name</th>
                <th style={{ textAlign: "left", padding: "10px", borderBottom: "1px solid #ddd" }}>Email</th>
                <th style={{ textAlign: "left", padding: "10px", borderBottom: "1px solid #ddd" }}>Role</th>
                {currentUser?.role === 'superadmin' && (
                  <th style={{ textAlign: "left", padding: "10px", borderBottom: "1px solid #ddd" }}>Tenant</th>
                )}
                <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "10px" }}>{w.name || w.email}</td>
                  <td style={{ padding: "10px" }}>{w.email}</td>
                  <td style={{ padding: "10px" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      backgroundColor: w.role === 'superadmin' ? '#dc3545' : w.role === 'tenant_admin' ? '#ffc107' : '#28a745',
                      color: w.role === 'tenant_admin' ? '#000' : '#fff'
                    }}>
                      {w.role}
                    </span>
                  </td>
                  {currentUser?.role === 'superadmin' && (
                    <td style={{ padding: "10px" }}>{w.tenant || 'N/A'}</td>
                  )}
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                      <button
                        onClick={() => selectWorker(w)}
                        style={{
                          padding: "5px 10px",
                          border: "none",
                          borderRadius: "5px",
                          backgroundColor: "#007bff",
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        Manage Access
                      </button>
                      {(currentUser?.role === 'superadmin' || 
                        (currentUser?.role === 'tenant_admin' && w.role === 'worker')) && (
                        <button
                          onClick={() => handleDeleteWorker(w.id)}
                          style={{
                            padding: "5px 10px",
                            border: "none",
                            borderRadius: "5px",
                            backgroundColor: "#dc3545",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={() => setSelectedWorker(null)}
            style={{
              marginBottom: "20px",
              padding: "10px 15px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "#007bff",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            ← Back to Workers
          </button>

          <h3>Manage Access for {selectedWorker.name || selectedWorker.email}</h3>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginTop: "10px" }}>
            {Object.keys(pagesWithFields).map((page) => (
              <div
                key={page}
                onClick={() => togglePageAccess(page)}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "15px",
                  cursor: "pointer",
                  backgroundColor: selectedWorker.permissions.pages[page] ? "#007bff" : "#f0f0f0",
                  color: selectedWorker.permissions.pages[page] ? "#fff" : "#000",
                  minWidth: "120px",
                  textAlign: "center",
                  transition: "0.2s all",
                }}
              >
                {page.charAt(0).toUpperCase() + page.slice(1)}
              </div>
            ))}
          </div>

          {assignedPages.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h4>Field Access:</h4>
              {assignedPages.map((page) => (
                <div key={page} style={{ marginBottom: "15px" }}>
                  <h5>{page.charAt(0).toUpperCase() + page.slice(1)}</h5>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {pagesWithFields[page].map((field) => (
                      <div
                        key={field}
                        onClick={() => toggleFieldAccess(page, field)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "5px",
                          cursor: "pointer",
                          border: "1px solid #ccc",
                          backgroundColor: selectedWorker.permissions.fields[page]?.[field]
                            ? "#28a745"
                            : "#f8f8f8",
                          color: selectedWorker.permissions.fields[page]?.[field] ? "#fff" : "#000",
                        }}
                      >
                        {field}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              onClick={savePermissions}
              disabled={updating}
              style={{
                padding: "10px 20px",
                borderRadius: "5px",
                border: "none",
                backgroundColor: "#28a745",
                color: "#fff",
                cursor: updating ? "not-allowed" : "pointer",
              }}
            >
              {updating ? "Saving..." : "Save Permissions"}
            </button>
            
            {/* Role Management for Superadmin */}
            {currentUser?.role === 'superadmin' && selectedWorker.role !== 'superadmin' && (
              <select
                value={selectedWorker.role}
                onChange={(e) => {
                  setSelectedWorker({...selectedWorker, role: e.target.value});
                }}
                style={{
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ddd",
                  backgroundColor: "#fff",
                }}
              >
                <option value="worker">Worker</option>
                <option value="tenant_admin">Tenant Admin</option>
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
