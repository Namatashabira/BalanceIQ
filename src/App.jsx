import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ConfigProvider, useAllowedPages, useFeatures, useConfig } from "./context/ConfigContext";
import { AccountingProvider } from "./context/AccountingContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { PlanProvider, usePlan } from "./context/PlanContext";
import UpgradeWall from "./components/UpgradeWall";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import OfflineBanner from "./components/OfflineBanner";
import TrialBanner from "./components/TrialBanner";
import useSync from "./hooks/useSync";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import DownloadPage from "./pages/DownloadPage";
import UpgradePage from "./pages/UpgradePage";
import PaymentPage from "./pages/PaymentPage";
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
import ManageUsers from "./pages/ManageUsers";
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

// ── Plan guard ────────────────────────────────────────────────────────────────
function PlanGuard({ pageKey, children }) {
  const { isPageAllowed, trialExpired, planReady } = usePlan();
  if (!planReady) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (trialExpired) return <UpgradeWall reason="trial" />;
  if (pageKey && !isPageAllowed(pageKey)) return <UpgradeWall reason="page" />;
  return children;
}

// ── Role/feature access guard ─────────────────────────────────────────────────
function AccessGuard({ pageKey, children }) {
  const allowedPages = useAllowedPages();
  const { user } = useAuth();
  const { loading: configLoading, features } = useConfig();
  const role = user?.role?.toLowerCase();
  const isAdmin = ['tenant_admin', 'superadmin'].includes(role) || user?.is_staff;

  if (!user) return children;
  if (configLoading) return <div className="flex items-center justify-center py-10 text-gray-600">Loading…</div>;
  if (!features) return <div className="flex items-center justify-center py-10 text-gray-600">Loading access…</div>;
  if (!pageKey) return children;
  if (isAdmin) return children;
  if (Array.isArray(allowedPages) && allowedPages.includes(pageKey)) return children;

  const fallback = ["manager", "staff", "worker"].includes(role) ? "/orders" : "/dashboard";
  return <Navigate to={fallback} replace />;
}

// ── Default route ─────────────────────────────────────────────────────────────
function DefaultRoute() {
  const { user } = useAuth();
  const allowedPages = useAllowedPages();
  const features = useFeatures();
  const { firstAccessiblePath, loading: configLoading, features: featuresFromConfig } = useConfig();
  const isAdmin = ['tenant_admin', 'superadmin'].includes(user?.role) || user?.is_staff;

  const isEnabled = (key, def = true) => {
    const v = features?.[key];
    return v === undefined ? def : v === true;
  };

  const navOrder = [
    { path: '/dashboard', key: 'dashboard_enabled' },
    { path: '/product', key: 'product_enabled' },
    { path: '/inventory', key: 'inventory_enabled' },
    { path: '/orders', key: 'orders_enabled' },
    { path: '/sales', key: 'sales_enabled' },
    { path: '/customers', key: 'customers_enabled' },
    { path: '/appointments', key: 'scheduling_enabled' },
    { path: '/manual-entry', key: 'manual_entry_enabled' },
    { path: '/receipt-lookup', key: 'payments_enabled' },
    { path: '/analytics', key: 'analytics_enabled' },
    { path: '/accounting', key: 'accounting_enabled' },
  ];

  const getDefaultRoute = () => {
    if (configLoading || !featuresFromConfig) return null;
    if (firstAccessiblePath) return firstAccessiblePath;
    for (const item of navOrder) {
      if (!isEnabled(item.key)) continue;
      if (Array.isArray(allowedPages) && !allowedPages.includes(item.key)) continue;
      return item.path;
    }
    const role = user?.role?.toLowerCase();
    if (["manager", "staff", "worker"].includes(role)) return '/orders';
    return '/dashboard';
  };

  const route = getDefaultRoute();
  if (route === null) return <div className="flex items-center justify-center py-10 text-gray-600">Loading…</div>;
  return <Navigate to={route} replace />;
}

// ── Sidebar layout (shared by all dashboard pages) ────────────────────────────
function DashboardLayout({ sidebarOpen, setSidebarOpen, sidebarWidth, setSidebarWidth }) {
  return (
    <>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        sidebarWidth={sidebarWidth}
        setSidebarWidth={setSidebarWidth}
      />
      <div className="flex flex-col bg-gray-100" style={{ flex: 1, minWidth: 0 }}>
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        <TrialBanner />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<DefaultRoute />} />
            <Route path="/dashboard" element={<PlanGuard pageKey="dashboard_enabled"><AccessGuard pageKey="dashboard_enabled"><Dashboard /></AccessGuard></PlanGuard>} />
            <Route path="/my-organizations" element={<AccessGuard pageKey="organizations_enabled"><MyOrganizations /></AccessGuard>} />
            <Route path="/create-organization" element={<AccessGuard pageKey="organizations_enabled"><CreateOrganization /></AccessGuard>} />
            <Route path="/product" element={<PlanGuard pageKey="product_enabled"><AccessGuard pageKey="product_enabled"><Product /></AccessGuard></PlanGuard>} />
            <Route path="/inventory" element={<PlanGuard pageKey="inventory_enabled"><AccessGuard pageKey="inventory_enabled"><Inventory /></AccessGuard></PlanGuard>} />
            <Route path="/analytics" element={<PlanGuard pageKey="analytics_enabled"><AccessGuard pageKey="analytics_enabled"><Analytics /></AccessGuard></PlanGuard>} />
            <Route path="/ai-insights" element={<PlanGuard pageKey="ai_insights_enabled"><AccessGuard pageKey="analytics_enabled"><AIInsights /></AccessGuard></PlanGuard>} />
            <Route path="/forecast" element={<PlanGuard pageKey="analytics_enabled"><AccessGuard pageKey="analytics_enabled"><Forecast /></AccessGuard></PlanGuard>} />
            <Route path="/manual-entry" element={<PlanGuard pageKey="manual_entry_enabled"><AccessGuard pageKey="manual_entry_enabled"><ManualOrderEntry /></AccessGuard></PlanGuard>} />
            <Route path="/appointments" element={<PlanGuard pageKey="scheduling_enabled"><AccessGuard pageKey="scheduling_enabled"><Appointments /></AccessGuard></PlanGuard>} />
            <Route path="/receipt-lookup" element={<PlanGuard pageKey="payments_enabled"><AccessGuard pageKey="payments_enabled"><ReceiptLookup /></AccessGuard></PlanGuard>} />
            <Route path="/abandoned-carts" element={<PlanGuard pageKey="orders_enabled"><AccessGuard pageKey="orders_enabled"><AbandonedCarts /></AccessGuard></PlanGuard>} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/orders" element={<PlanGuard pageKey="orders_enabled"><AccessGuard pageKey="orders_enabled"><Orders /></AccessGuard></PlanGuard>} />
            <Route path="/sales" element={<PlanGuard pageKey="sales_enabled"><AccessGuard pageKey="sales_enabled"><Sales /></AccessGuard></PlanGuard>} />
            <Route path="/customers" element={<PlanGuard pageKey="customers_enabled"><AccessGuard pageKey="customers_enabled"><Customers /></AccessGuard></PlanGuard>} />
            <Route path="/manage-users" element={<AccessGuard pageKey="superadmin"><ManageUsers /></AccessGuard>} />
            <Route path="/accounting" element={<PlanGuard pageKey="accounting_enabled"><AccountingDashboard /></PlanGuard>} />
            <Route path="/accounting/expenses" element={<PlanGuard pageKey="accounting_enabled"><Expenses /></PlanGuard>} />
            <Route path="/accounting/payments" element={<PlanGuard pageKey="accounting_enabled"><Payments /></PlanGuard>} />
            <Route path="/accounting/taxes" element={<PlanGuard pageKey="accounting_enabled"><TaxesEnhanced /></PlanGuard>} />
            <Route path="/accounting/profit-loss" element={<PlanGuard pageKey="accounting_enabled"><ProfitAndLoss /></PlanGuard>} />
            <Route path="/accounting/balance-sheet" element={<PlanGuard pageKey="accounting_enabled"><BalanceSheet /></PlanGuard>} />
            <Route path="/accounting/assets" element={<PlanGuard pageKey="accounting_enabled"><AccessGuard pageKey="accounting_enabled"><Assets /></AccessGuard></PlanGuard>} />
            <Route path="/reports/business" element={<PlanGuard pageKey="analytics_enabled"><BusinessReport /></PlanGuard>} />
            <Route path="/website-builder" element={<PlanGuard pageKey="website_builder_enabled"><AccessGuard pageKey="website_builder_enabled"><WebsiteBuilder /></AccessGuard></PlanGuard>} />
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
  );
}

// ── App content ───────────────────────────────────────────────────────────────
function AppContent() {
  const { isAuthenticated, loading, login, user } = useAuth();
  const { isOnline, syncing, pendingCount } = useSync(isAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const toast = useToast();

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { window.__toastContext = toast; }, [toast]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="text-lg">Loading...</div></div>;
  }

  if (!loading && isAuthenticated && (!login || !('role' in (user || {})))) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-red-700 text-center">
          <h2 className="font-bold text-xl mb-2">User Profile Error</h2>
          <p>User data is missing or incomplete.<br />Please <a href="/login" className="text-blue-600 underline">log in</a> again.</p>
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

      {isAuthenticated ? (
        <Routes>
          {/* ── Fullscreen pages (no sidebar/navbar) ── */}
          <Route path="/upgrade" element={<div style={{position:'fixed',inset:0,zIndex:50,overflowY:'auto',width:'100vw'}}><UpgradePage /></div>} />
          <Route path="/payment/:planKey" element={<div style={{position:'fixed',inset:0,zIndex:50,overflowY:'auto',width:'100vw'}}><PaymentPage /></div>} />
          <Route path="/pricing" element={<div style={{position:'fixed',inset:0,zIndex:50,overflowY:'auto',width:'100vw'}}><Pricing /></div>} />

          {/* ── All dashboard pages (with sidebar/navbar) ── */}
          <Route path="*" element={
            <DashboardLayout
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              sidebarWidth={sidebarWidth}
              setSidebarWidth={setSidebarWidth}
            />
          } />
        </Routes>
      ) : (
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
            <PlanProvider>
              <AppContent />
            </PlanProvider>
          </ToastProvider>
        </AccountingProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}
