import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ReportTemplateProvider } from "./context/ReportTemplateContext";
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
import { syncPendingReceiptSettings } from "./services/receiptSettingsService";
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
import StudentReportPage from "./pages/StudentReportPage";
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
import StudentManagementPage from "./pages/StudentManagementPage";
import FeesPage from "./pages/FeesPage";
import FeeReceipt from "./pages/fees/FeeReceipt";
import FeeInvoice from "./pages/fees/FeeInvoice";
import SchoolReceiptLookup from "./pages/SchoolReceiptLookup";
import ReportTemplatesPage from "./pages/ReportTemplatesPage";
import MarksEntryPage from "./pages/MarksEntryPage";
import AttendancePage from "./pages/AttendancePage";
import SchoolSettingsPage from "./pages/SchoolSettingsPage";
import SchoolAccounting from "./pages/Accounting/SchoolAccounting";

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

  // Worker: redirect to their first allowed page
  const SCHOOL_PAGE_ORDER = ['marks-entry','attendance','fees','school-receipt-lookup','student-management','report-templates','analytics','dashboard'];
  const first = SCHOOL_PAGE_ORDER.find(p => Array.isArray(allowedPages) && allowedPages.includes(p));
  const fallback = first ? `/${first}` : '/marks-entry';
  return <Navigate to={fallback} replace />;
}

// ── School-only route guard ───────────────────────────────────────────────────
function SchoolGuard({ children }) {
  const { businessType, loading } = useConfig();
  if (loading) return null;
  if (businessType !== 'school') return <Navigate to="/" replace />;
  return children;
}

// ── Business-only route guard ─────────────────────────────────────────────────
function BusinessGuard({ children }) {
  const { businessType, loading } = useConfig();
  if (loading) return null;
  if (businessType === 'school') return <Navigate to="/dashboard" replace />;
  return children;
}
// ── Default route ─────────────────────────────────────────────────────────────
function DefaultRoute() {
  const { user } = useAuth();
  const allowedPages = useAllowedPages();
  const features = useFeatures();
  const { businessType, firstAccessiblePath, loading: configLoading, features: featuresFromConfig } = useConfig();
  const isAdmin = ['tenant_admin', 'superadmin'].includes(user?.role) || user?.is_staff;
  const isSchool = businessType === 'school';

  const isEnabled = (key, def = true) => {
    const v = features?.[key];
    return v === undefined ? def : v === true;
  };

  const getDefaultRoute = () => {
    if (configLoading || !featuresFromConfig) return null;

    if (isSchool) {
      // Workers: land on first allowed school page
      if (!isAdmin && Array.isArray(allowedPages) && allowedPages.length > 0) {
        const order = ['marks-entry','attendance','fees','school-receipt-lookup','student-management','report-templates','analytics','dashboard'];
        const first = order.find(p => allowedPages.includes(p));
        return first ? `/${first}` : `/${allowedPages[0]}`;
      }
      // Admin: land on school dashboard
      return '/dashboard';
    }

    // Non-school business
    if (firstAccessiblePath) return firstAccessiblePath;
    const navOrder = [
      { path: '/dashboard', key: 'dashboard_enabled' },
      { path: '/product',   key: 'product_enabled' },
      { path: '/inventory', key: 'inventory_enabled' },
      { path: '/orders',    key: 'orders_enabled' },
      { path: '/analytics', key: 'analytics_enabled' },
      { path: '/accounting',key: 'accounting_enabled' },
    ];
    for (const item of navOrder) {
      if (!isEnabled(item.key)) continue;
      return item.path;
    }
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
            <Route path="/my-organizations" element={<BusinessGuard><AccessGuard pageKey="organizations_enabled"><MyOrganizations /></AccessGuard></BusinessGuard>} />
            <Route path="/create-organization" element={<BusinessGuard><AccessGuard pageKey="organizations_enabled"><CreateOrganization /></AccessGuard></BusinessGuard>} />
            <Route path="/product" element={<BusinessGuard><PlanGuard pageKey="product_enabled"><AccessGuard pageKey="product_enabled"><Product /></AccessGuard></PlanGuard></BusinessGuard>} />
            <Route path="/inventory" element={<BusinessGuard><PlanGuard pageKey="inventory_enabled"><AccessGuard pageKey="inventory_enabled"><Inventory /></AccessGuard></PlanGuard></BusinessGuard>} />
            <Route path="/analytics" element={<PlanGuard pageKey="analytics_enabled"><AccessGuard pageKey="analytics_enabled"><Analytics /></AccessGuard></PlanGuard>} />
            <Route path="/ai-insights" element={<BusinessGuard><PlanGuard pageKey="ai_insights_enabled"><AccessGuard pageKey="analytics_enabled"><AIInsights /></AccessGuard></PlanGuard></BusinessGuard>} />
            <Route path="/forecast" element={<BusinessGuard><PlanGuard pageKey="analytics_enabled"><AccessGuard pageKey="analytics_enabled"><Forecast /></AccessGuard></PlanGuard></BusinessGuard>} />
            <Route path="/manual-entry" element={<BusinessGuard><PlanGuard pageKey="manual_entry_enabled"><AccessGuard pageKey="manual_entry_enabled"><ManualOrderEntry /></AccessGuard></PlanGuard></BusinessGuard>} />
            <Route path="/appointments" element={<BusinessGuard><PlanGuard pageKey="scheduling_enabled"><AccessGuard pageKey="scheduling_enabled"><Appointments /></AccessGuard></PlanGuard></BusinessGuard>} />
            <Route path="/receipt-lookup" element={<BusinessGuard><PlanGuard pageKey="payments_enabled"><AccessGuard pageKey="payments_enabled"><ReceiptLookup /></AccessGuard></PlanGuard></BusinessGuard>} />
            <Route path="/abandoned-carts" element={<BusinessGuard><PlanGuard pageKey="orders_enabled"><AccessGuard pageKey="orders_enabled"><AbandonedCarts /></AccessGuard></PlanGuard></BusinessGuard>} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/orders" element={<BusinessGuard><PlanGuard pageKey="orders_enabled"><AccessGuard pageKey="orders_enabled"><Orders /></AccessGuard></PlanGuard></BusinessGuard>} />
            <Route path="/sales" element={<BusinessGuard><PlanGuard pageKey="sales_enabled"><AccessGuard pageKey="sales_enabled"><Sales /></AccessGuard></PlanGuard></BusinessGuard>} />
            <Route path="/customers" element={<BusinessGuard><PlanGuard pageKey="customers_enabled"><AccessGuard pageKey="customers_enabled"><Customers /></AccessGuard></PlanGuard></BusinessGuard>} />
            <Route path="/manage-users" element={<AccessGuard pageKey="superadmin"><ManageUsers /></AccessGuard>} />
            <Route path="/accounting" element={<BusinessGuard><PlanGuard pageKey="accounting_enabled"><AccountingDashboard /></PlanGuard></BusinessGuard>} />
            <Route path="/accounting/expenses" element={<BusinessGuard><PlanGuard pageKey="accounting_enabled"><Expenses /></PlanGuard></BusinessGuard>} />
            <Route path="/accounting/payments" element={<BusinessGuard><PlanGuard pageKey="accounting_enabled"><Payments /></PlanGuard></BusinessGuard>} />
            <Route path="/accounting/taxes" element={<BusinessGuard><PlanGuard pageKey="accounting_enabled"><TaxesEnhanced /></PlanGuard></BusinessGuard>} />
            <Route path="/accounting/profit-loss" element={<BusinessGuard><PlanGuard pageKey="accounting_enabled"><ProfitAndLoss /></PlanGuard></BusinessGuard>} />
            <Route path="/accounting/balance-sheet" element={<BusinessGuard><PlanGuard pageKey="accounting_enabled"><BalanceSheet /></PlanGuard></BusinessGuard>} />
            <Route path="/accounting/assets" element={<BusinessGuard><PlanGuard pageKey="accounting_enabled"><AccessGuard pageKey="accounting_enabled"><Assets /></AccessGuard></PlanGuard></BusinessGuard>} />
            <Route path="/reports/business" element={<BusinessGuard><PlanGuard pageKey="analytics_enabled"><BusinessReport /></PlanGuard></BusinessGuard>} />
            <Route path="/website-builder" element={<BusinessGuard><PlanGuard pageKey="website_builder_enabled"><AccessGuard pageKey="website_builder_enabled"><WebsiteBuilder /></AccessGuard></PlanGuard></BusinessGuard>} />
            <Route path="/enrollment" element={<BusinessGuard><EnrollmentIndex /></BusinessGuard>}>
              <Route path="overview" element={<Overview />} />
              <Route path="new" element={<NewEnrollment />} />
              <Route path="applications" element={<Applications />} />
              <Route path="enrolled" element={<EnrolledStudents />} />
              <Route path="documents" element={<Documents />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="reports" element={<Reports />} />
              <Route index element={<Overview />} />
            </Route>
            <Route path="/student-reports" element={<SchoolGuard><AccessGuard pageKey="report-templates"><StudentReportPage /></AccessGuard></SchoolGuard>} />
            <Route path="/student-management" element={<SchoolGuard><AccessGuard pageKey="student-management"><StudentManagementPage /></AccessGuard></SchoolGuard>} />
            <Route path="/marks-entry" element={<SchoolGuard><AccessGuard pageKey="marks-entry"><MarksEntryPage /></AccessGuard></SchoolGuard>} />
            <Route path="/attendance" element={<SchoolGuard><AccessGuard pageKey="attendance"><AttendancePage /></AccessGuard></SchoolGuard>} />
            <Route path="/school-settings" element={<SchoolGuard><SchoolSettingsPage /></SchoolGuard>} />
            <Route path="/fees" element={<SchoolGuard><AccessGuard pageKey="fees"><FeesPage /></AccessGuard></SchoolGuard>} />
            <Route path="/fees/receipt" element={<SchoolGuard><AccessGuard pageKey="fees"><FeeReceipt /></AccessGuard></SchoolGuard>} />
            <Route path="/fees/invoice" element={<SchoolGuard><AccessGuard pageKey="fees"><FeeInvoice /></AccessGuard></SchoolGuard>} />
            <Route path="/school-receipt-lookup" element={<SchoolGuard><AccessGuard pageKey="school-receipt-lookup"><SchoolReceiptLookup /></AccessGuard></SchoolGuard>} />
            <Route path="/school-accounting" element={<SchoolGuard><PlanGuard pageKey="accounting_enabled"><SchoolAccounting /></PlanGuard></SchoolGuard>} />
            <Route path="/report-templates" element={<SchoolGuard><AccessGuard pageKey="report-templates"><ReportTemplatesPage /></AccessGuard></SchoolGuard>} />
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

  useEffect(() => {
    if (isAuthenticated) syncPendingReceiptSettings();
  }, [isAuthenticated]);

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
              <ReportTemplateProvider>
                <AppContent />
              </ReportTemplateProvider>
            </PlanProvider>
          </ToastProvider>
        </AccountingProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}
