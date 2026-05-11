// Shared navigation config for Sidebar and Navbar
import {
  LayoutDashboard, Package, Warehouse, FileText, Receipt, BarChart3, Settings as SettingsIcon,
  ShoppingCart, Calendar, DollarSign, Brain, Building2, Users, TrendingUp, Globe, Lock,
  BookOpen, ClipboardList, UserCheck, GraduationCap
} from "lucide-react";
import { UsergroupAddOutlined } from '@ant-design/icons';

export const getNavigationItems = (labels, features, allowedPages, businessType, isAdmin, user) => {
  const isSchool     = businessType === 'school';
  const isSuperadmin = user?.is_superuser || user?.is_staff;

  const isEnabled = (key, def = true) => {
    const v = features?.[key];
    return v === undefined ? def : v === true;
  };

  const hasAccess = (pageKey) => {
    if (isAdmin) return true;
    if (!pageKey) return true;
    if (!Array.isArray(allowedPages)) return false;
    return allowedPages.includes(pageKey);
  };

  // ── School pages ────────────────────────────────────────────────────────────
  const schoolPages = [
    { path: '/dashboard',          label: 'Dashboard',          icon: LayoutDashboard,      enabled: hasAccess('dashboard') },
    { path: '/student-management', label: 'Student Management', icon: UsergroupAddOutlined,  enabled: hasAccess('student-management') },
    { path: '/attendance',         label: 'Attendance',         icon: UserCheck,             enabled: hasAccess('attendance') },
    { path: '/marks-entry',        label: 'Marks Entry',        icon: ClipboardList,         enabled: hasAccess('marks-entry') },
    { path: '/fees',               label: 'Fees',               icon: DollarSign,            enabled: hasAccess('fees') },
    { path: '/school-receipt-lookup', label: 'Fee Receipt Lookup', icon: Receipt,            enabled: hasAccess('school-receipt-lookup') },
    { path: '/report-templates',   label: 'Report Templates',   icon: FileText,              enabled: hasAccess('report-templates') },
    { path: '/student-reports',    label: 'Student Reports',    icon: BookOpen,              enabled: hasAccess('report-templates') },
    { path: '/school-accounting',  label: 'School Accounting',  icon: Receipt,               enabled: isEnabled('accounting_enabled') && hasAccess('accounting_enabled') },
    { path: '/school-settings',    label: 'School Settings',    icon: GraduationCap,         enabled: isAdmin },
    { path: '/manage-users',       label: 'Manage Users',       icon: Lock,                  enabled: isSuperadmin },
  ];

  // ── Non-school (business) pages ─────────────────────────────────────────────
  const contactLabel       = labels.entity   || 'Customer';
  const contactLabelPlural = labels.entities || 'Customers';

  const businessPages = [
    { path: '/',                label: 'Dashboard',              icon: LayoutDashboard, enabled: isEnabled('dashboard_enabled') && hasAccess('dashboard_enabled') },
    { path: '/product',         label: labels.resources,         icon: Package,         enabled: isEnabled('product_enabled')      && hasAccess('product_enabled') },
    { path: '/inventory',       label: labels.inventory,         icon: Warehouse,       enabled: isEnabled('inventory_enabled')    && hasAccess('inventory_enabled') },

    { path: '/sales',           label: 'Sales',                  icon: DollarSign,      enabled: isEnabled('sales_enabled')        && hasAccess('sales_enabled') },
    { path: '/customers',       label: contactLabelPlural,       icon: Users,           enabled: isEnabled('customers_enabled')    && hasAccess('customers_enabled') },
    { path: '/appointments',    label: 'Appointments',           icon: Calendar,        enabled: isEnabled('scheduling_enabled')   && hasAccess('scheduling_enabled') },
    { path: '/manual-entry',    label: `New ${labels.transaction || 'Order'}`, icon: ShoppingCart, enabled: isEnabled('manual_entry_enabled') && hasAccess('manual_entry_enabled') },
    { path: '/receipt-lookup',  label: 'Receipt Lookup',         icon: Receipt,         enabled: isEnabled('payments_enabled')     && hasAccess('payments_enabled') },
    { path: '/analytics',       label: 'Analytics',              icon: BarChart3,       enabled: isEnabled('analytics_enabled')    && hasAccess('analytics_enabled') },
    { path: '/ai-insights',     label: 'AI Insights',            icon: Brain,           enabled: isEnabled('ai_insights_enabled')  && hasAccess('ai_insights_enabled') },
    { path: '/forecast',        label: 'Forecast',               icon: TrendingUp,      enabled: isEnabled('analytics_enabled')    && hasAccess('analytics_enabled') },
    { path: '/accounting',      label: 'Accounting',             icon: Receipt,         enabled: isEnabled('accounting_enabled')   && hasAccess('accounting_enabled') },
    { path: '/reports/business',label: 'Business Report',        icon: BarChart3,       enabled: (typeof features?.business_report_enabled === 'undefined' || features.business_report_enabled === true) && hasAccess('business_report_enabled') },
    { path: '/settings',        label: 'Settings',               icon: SettingsIcon,    enabled: isAdmin },
    { path: '/manage-users',    label: 'Manage Users',           icon: Lock,            enabled: isSuperadmin },
  ];

  return isSchool ? schoolPages : businessPages;
};
