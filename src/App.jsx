import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ConfigProvider, useAllowedPages, useFeatures, useConfig } from "./context/ConfigContext";
import { AccountingProvider } from "./context/AccountingContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import OfflineBanner from "./components/OfflineBanner";
import useSync from "./hooks/useSync";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import DownloadPage from "./pages/DownloadPage";
import MyOrganizations from "./pages/MyOrganizations";
import CreateOrganization from "./pages/CreateOrganization";

import Dashboard from "./pages/Dashboard";
import Product from "./pages/Product";
import Inventory from "./pages/Inventory";
import Analytics from "./pages/Analytics";
import AIInsights from "./pages/AIInsights";
import Forecast from "./pages/Forecast";
import Sales from "./pages/Sales";
import Settings from "./pages/SettingsNew";
import Orders from "./pages/Orders/Orders";
import ManualEntry from "./pages/ManualEntry";
import ManualOrderEntry from "./pages/ManualOrderEntry";
import ReceiptLookup from "./pages/ReceiptLookup";
import Appointments from "./pages/Appointments";
import AbandonedCarts from "./pages/Orders/AbandonedCarts";
import AccountingDashboard from "./pages/Accounting/AccountingDashboard";
import Expenses from "./pages/Accounting/Expenses";
import Payments from "./pages/Accounting/Payments";
import TaxesEnhanced from "./pages/Accounting/TaxesEnhanced";
import ProfitAndLoss from "./pages/Accounting/ProfitAndLoss";
import BalanceSheet from "./pages/Accounting/BalanceSheet";
import Assets from "./pages/Accounting/Assets";
import Customers from "./pages/Customers";
import EnrollmentPage from "./pages/EnrollmentPage";
import EnrollmentIndex from "./pages/EnrollmentIndex";
import Overview from "./pages/enrollment/Overview";
import NewEnrollment from "./pages/enrollment/NewEnrollment";
import Applications from "./pages/enrollment/Applications";
import EnrolledStudents from "./pages/enrollment/EnrolledStudents";
import Documents from "./pages/enrollment/Documents";
import PaymentsPage from "./pages/enrollment/Payments";
import Reports from "./pages/enrollment/Reports";
import BusinessReport from "./pages/Reports/BusinessReport";
import WebsiteBuilder from "./pages/WebsiteBuilder/WebsiteBuilder";

// Simple access guard that defers to allowedPages. If allowedPages is null/undefined,
// we assume no page-level restrictions.
function AccessGuard({ pageKey, children }) {
  const allowedPages = useAllowedPages();
  const { user } = useAuth();
  const { loading: configLoading, features } = useConfig();

  const role = user?.role?.toLowerCase();
  const isAdmin = ['tenant_admin', 'superadmin'].includes(role) || user?.is_staff;

  // For non-authenticated users, allow rendering (will redirect to login)
  if (!user) {
    return children;
  }

  // If config is still loading, wait a bit but don't block indefinitely
  if (configLoading) {
    return <div className="flex items-center justify-center py-10 text-gray-600">Loading…</div>;
  }

  // If we have a feature set (with defaults), proceed
  if (!features) {
    return <div className="flex items-center justify-center py-10 text-gray-600">Loading access…</div>;
  }

  if (!pageKey) return children;
  if (isAdmin) return children;
  if (Array.isArray(allowedPages) && allowedPages.includes(pageKey)) return children;

  const fallback = ["manager", "staff", "worker"].includes(role)
    ? "/orders"
    : "/dashboard";

  return <Navigate to={fallback} replace />;
}

// Role-based default route component
function DefaultRoute() {
  const { user } = useAuth();
  const allowedPages = useAllowedPages();
  const features = useFeatures();
  const { firstAccessiblePath, loading: configLoading, features: featuresFromConfig } = useConfig();

  const isAdmin = ['tenant_admin', 'superadmin'].includes(user?.role) || user?.is_staff;
  const isEnabled = (key, defaultValue = true) => {
    const value = features?.[key];
    if (value === undefined) return defaultValue;
    return value === true;
  };

  const navOrder = [
    { path: '/dashboard', key: 'dashboard_enabled', adminOnly: false },
    { path: '/my-organizations', key: 'organizations_enabled', adminOnly: false },
    { path: '/product', key: 'product_enabled', adminOnly: false },
    { path: '/inventory', key: 'inventory_enabled', adminOnly: false },
    { path: '/orders', key: 'orders_enabled', adminOnly: false },
    { path: '/sales', key: 'sales_enabled', adminOnly: false },
    { path: '/customers', key: 'customers_enabled', adminOnly: false },
    { path: '/appointments', key: 'scheduling_enabled', adminOnly: false },
    { path: '/manual-entry', key: 'manual_entry_enabled', adminOnly: false },
    { path: '/receipt-lookup', key: 'payments_enabled', adminOnly: false },
    { path: '/analytics', key: 'analytics_enabled', adminOnly: false },
    { path: '/ai-insights', key: 'ai_insights_enabled', adminOnly: false },
    { path: '/forecast', key: 'analytics_enabled', adminOnly: false },
    { path: '/accounting', key: 'accounting_enabled', adminOnly: false },
    { path: '/enrollment', key: 'enrollment_enabled', adminOnly: false },
    { path: '/website-builder', key: 'website_builder_enabled', adminOnly: false },
  ];

  const findFirstAccessible = () => {
    for (const item of navOrder) {
      if (item.adminOnly && !isAdmin) continue;
      if (!isEnabled(item.key)) continue;
      if (Array.isArray(allowedPages) && !allowedPages.includes(item.key)) continue;
      return item.path;
    }
    return null;
  };
  
  // Define default routes based on role
  const getDefaultRoute = () => {
    if (configLoading || !featuresFromConfig) return null;
    if (!user) return firstAccessiblePath || '/dashboard';
    const firstFromBackend = firstAccessiblePath;
    if (firstFromBackend) return firstFromBackend;
    const firstAccessible = findFirstAccessible();
    if (firstAccessible) return firstAccessible;
    
    const role = user.role?.toLowerCase();
    
    console.log('DefaultRoute - User role:', role, 'Full user:', user);
    
    // Super admin and tenants go to Dashboard
    if (role === 'admin' || role === 'superadmin' || role === 'super admin' || role === 'owner' || role === 'tenant') {
      console.log('Redirecting to dashboard for role:', role);
      return '/dashboard';
    }
    
    // For workers/staff, redirect to first accessible page based on permissions
    if (role === 'manager' || role === 'staff' || role === 'worker') {
      console.log('Redirecting worker/staff to orders for role:', role);
      return '/orders';
    }
    
    // Default to dashboard for any other role
    console.log('Redirecting to dashboard (default) for role:', role);
    return '/dashboard';
  };
  
  const route = getDefaultRoute();
  if (route === null) {
    return <div className="flex items-center justify-center py-10 text-gray-600">Loading…</div>;
  }
  console.log('DefaultRoute navigating to:', route);
  return <Navigate to={route} replace />;
}

function AppContent() {
  const { isAuthenticated, loading, login, user } = useAuth();
  const { isOnline, syncing, pendingCount } = useSync(isAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Open by default on desktop, closed on mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // Tailwind's lg breakpoint is 1024px
    }
    return true;
  });
  // Sidebar width state (sync with Sidebar)
  const [sidebarWidth, setSidebarWidth] = useState(256); // default 256px
  const toast = useToast();

  // Responsive sidebar: open on desktop, closed on mobile
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    }
    window.addEventListener('resize', handleResize);
    // Set initial state
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Make toast available globally
  useEffect(() => {
    window.__toastContext = toast;
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  // Error fallback for missing/null user
  if (!loading && isAuthenticated && (!login || !('role' in (user || {})))) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-red-700 text-center">
          <h2 className="font-bold text-xl mb-2">User Profile Error</h2>
          <p>User data is missing or incomplete.<br/>Please <a href="/login" className="text-blue-600 underline">log in</a> again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <OfflineBanner
        isOnline={isOnline}
        syncing={syncing}
        pendingCount={pendingCount}
        onManualSync={async () => {
          const { syncOnReconnect } = await import('./services/syncEngine');
          await syncOnReconnect();
        }}
      />
      {isAuthenticated && (
        <>
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            sidebarWidth={sidebarWidth}
            setSidebarWidth={setSidebarWidth}
          />
          <div
            className="flex flex-col bg-gray-100"
            style={{ flex: 1, minWidth: 0 }}
          >
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
            <main className="flex-1 p-4 sm:p-6 overflow-auto">
              <Routes>
                <Route path="/" element={<DefaultRoute />} />
                <Route path="/dashboard" element={<AccessGuard pageKey="dashboard_enabled"><Dashboard /></AccessGuard>} />
                <Route path="/my-organizations" element={<AccessGuard pageKey="organizations_enabled"><MyOrganizations /></AccessGuard>} />
                <Route path="/create-organization" element={<AccessGuard pageKey="organizations_enabled"><CreateOrganization /></AccessGuard>} />
                <Route path="/product" element={<AccessGuard pageKey="product_enabled"><Product /></AccessGuard>} />
                <Route path="/inventory" element={<AccessGuard pageKey="inventory_enabled"><Inventory /></AccessGuard>} />
                <Route path="/analytics" element={<AccessGuard pageKey="analytics_enabled"><Analytics /></AccessGuard>} />
                <Route path="/ai-insights" element={<AccessGuard pageKey="analytics_enabled"><AIInsights /></AccessGuard>} />
                <Route path="/forecast" element={<AccessGuard pageKey="analytics_enabled"><Forecast /></AccessGuard>} />
                <Route path="/manual-entry" element={<AccessGuard pageKey="manual_entry_enabled"><ManualOrderEntry /></AccessGuard>} />
                <Route path="/appointments" element={<AccessGuard pageKey="scheduling_enabled"><Appointments /></AccessGuard>} />
                {/* ManualEntry page removed from protected routes */}
                <Route path="/receipt-lookup" element={<AccessGuard pageKey="payments_enabled"><ReceiptLookup /></AccessGuard>} />
                <Route path="/abandoned-carts" element={<AccessGuard pageKey="orders_enabled"><AbandonedCarts /></AccessGuard>} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/orders" element={<AccessGuard pageKey="orders_enabled"><Orders /></AccessGuard>} />
                <Route path="/sales" element={<AccessGuard pageKey="sales_enabled"><Sales /></AccessGuard>} />
                <Route path="/customers" element={<AccessGuard pageKey="customers_enabled"><Customers /></AccessGuard>} />
                <Route path="/accounting" element={<AccountingDashboard />} />
                <Route path="/accounting/expenses" element={<Expenses />} />
                <Route path="/accounting/payments" element={<Payments />} />
                <Route path="/accounting/taxes" element={<TaxesEnhanced />} />
                <Route path="/accounting/profit-loss" element={<ProfitAndLoss />} />
                <Route path="/accounting/balance-sheet" element={<BalanceSheet />} />
                <Route path="/accounting/assets" element={<AccessGuard pageKey="accounting_enabled"><Assets /></AccessGuard>} />
                <Route path="/reports/business" element={<BusinessReport />} />
                <Route path="/website-builder" element={<AccessGuard pageKey="website_builder_enabled"><WebsiteBuilder /></AccessGuard>} />
                <Route path="/enrollment" element={<EnrollmentIndex />}> 
                  <Route path="overview" element={<Overview />} />
                  <Route path="new" element={<NewEnrollment />} />
                  <Route path="applications" element={<Applications />} />
                  <Route path="enrolled" element={<EnrolledStudents />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="reports" element={<Reports />} />
                  <Route index element={<Overview />} />
                </Route>
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </>
      )}

      {/* Public routes rendered only when not authenticated */}
      {!isAuthenticated && (
        <Routes>
          <Route path="/manual-entry-old" element={<ManualEntry />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/login" element={<Login onLogin={login} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <AccountingProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AccountingProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}
