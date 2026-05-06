// Shared navigation config for Sidebar and Navbar
import {
  LayoutDashboard, Package, Warehouse, FileText, Receipt, BarChart3, Settings as SettingsIcon,
  ShoppingCart, Calendar, DollarSign, Brain, Building2, Users, TrendingUp, Globe, Lock, BookOpen, ClipboardList
} from "lucide-react";
import { UsergroupAddOutlined } from '@ant-design/icons';

export const getNavigationItems = (labels, features, allowedPages, businessType, isAdmin, user) => {
  const contactLabel = labels.entity || (businessType === 'school' ? 'Student' : businessType === 'services' ? 'Client' : 'Customer');
  const contactLabelPlural = labels.entities || `${contactLabel}${contactLabel.endsWith('s') ? '' : 's'}`;
  const isEnabled = (key, defaultValue = true) => {
    const value = features?.[key];
    if (value === undefined) return defaultValue;
    return value === true;
  };
  const hasAccess = (pageKey) => {
    if (isAdmin) return true;
    if (!pageKey) return true;
    if (!Array.isArray(allowedPages)) return false;
    return allowedPages.includes(pageKey);
  };
  const isSuperadmin = user?.is_superuser || user?.is_staff;
  return [
    { path: "/", label: "Dashboard", icon: LayoutDashboard, enabled: isEnabled('dashboard_enabled') && hasAccess('dashboard_enabled') },
    { path: "/my-organizations", label: "My Organizations", icon: Building2, enabled: false },
    { path: "/product", label: labels.resources, icon: Package, enabled: isEnabled('product_enabled') && hasAccess('product_enabled') },
    { path: "/inventory", label: labels.inventory, icon: Warehouse, enabled: isEnabled('inventory_enabled') && hasAccess('inventory_enabled') },
    { path: "/orders", label: labels.transactions, icon: FileText, enabled: isEnabled('orders_enabled') && hasAccess('orders_enabled') },
    { path: "/sales", label: "Sales", icon: DollarSign, enabled: isEnabled('sales_enabled') && hasAccess('sales_enabled') },
    { path: "/customers", label: contactLabelPlural, icon: Users, enabled: isEnabled('customers_enabled') && hasAccess('customers_enabled') },
    { path: "/appointments", label: "Appointments", icon: Calendar, enabled: isEnabled('scheduling_enabled') && hasAccess('scheduling_enabled') },
    { path: "/manual-entry", label: `New ${labels.transaction}`, icon: ShoppingCart, enabled: isEnabled('manual_entry_enabled') && hasAccess('manual_entry_enabled') },
    { path: "/receipt-lookup", label: "Receipt Lookup", icon: Receipt, enabled: isEnabled('payments_enabled') && hasAccess('payments_enabled') },
    { path: "/analytics", label: "Analytics", icon: BarChart3, enabled: isEnabled('analytics_enabled') && hasAccess('analytics_enabled') },
    { path: "/ai-insights", label: "AI Insights", icon: Brain, enabled: isEnabled('ai_insights_enabled') && hasAccess('ai_insights_enabled') },
    { path: "/forecast", label: "Forecast", icon: TrendingUp, enabled: isEnabled('analytics_enabled') && hasAccess('analytics_enabled') },
    { path: "/settings", label: "Settings", icon: SettingsIcon, enabled: isAdmin },
    { path: "/manage-users", label: "Manage Users", icon: Lock, enabled: isSuperadmin },
    { path: "/accounting", label: "Accounting", icon: Receipt, enabled: isEnabled('accounting_enabled') && hasAccess('accounting_enabled') },
    { path: "/enrollment", label: "Enrollment", icon: Calendar, enabled: false },
    { path: "/student-reports", label: "Student Reports", icon: BookOpen, enabled: businessType === 'school' && isEnabled('enrollment_enabled') },
    { path: "/reports/business", label: "Business Report", icon: BarChart3, enabled: (typeof features?.business_report_enabled === 'undefined' || features.business_report_enabled === true) && hasAccess('business_report_enabled') },
    { path: "/website-builder", label: "Website Builder", icon: Globe, enabled: isEnabled('website_builder_enabled') && hasAccess('website_builder_enabled') },
    {
      path: '/student-management',
      label: 'Student Management',
      icon: UsergroupAddOutlined,
      enabled: businessType === 'school',
    },
    {
      path: '/marks-entry',
      label: 'Marks Entry',
      icon: ClipboardList,
      enabled: businessType === 'school',
    },
    {
      path: '/report-templates',
      label: 'Report Templates',
      icon: FileText,
      enabled: businessType === 'school',
    },
    {
      path: '/fees',
      label: 'Fees',
      icon: DollarSign,
      enabled: businessType === 'school',
    }
  ];
};
