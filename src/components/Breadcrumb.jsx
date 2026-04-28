import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAllowedPages } from '../context/ConfigContext';

const Breadcrumb = () => {
  const location = useLocation();
  const { user } = useAuth();
  const allowedPages = useAllowedPages();
  // Route everything through the app's DefaultRoute by pointing home to "/"
  // This keeps role/access-based landing logic in a single place and avoids
  // accidentally sending restricted users to the dashboard.
  const homePath = '/';
  
  // Define custom labels for routes
  const routeLabels = {
    dashboard: 'Dashboard',
    product: 'Products/Services',
    inventory: 'Inventory',
    orders: 'Orders',
    'manual-entry': 'New Order',
    'manual-entry-old': 'Manual Entry (Old)',
    'receipt-lookup': 'Receipt Lookup',
    'abandoned-carts': 'Abandoned Carts',
    analytics: 'Analytics',
    settings: 'Settings',
    accounting: 'Accounting',
    expenses: 'Expenses',
    payments: 'Payments',
    taxes: 'Taxes',
    'profit-loss': 'Profit & Loss',
    'balance-sheet': 'Balance Sheet',
  };

  // Generate breadcrumb items from current path
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    
    // On root or explicit dashboard, rely on the home icon target
    if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
      return [];
    }

    const breadcrumbs = [];
    let currentPath = '';

    pathnames.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathnames.length - 1;
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      breadcrumbs.push({
        path: currentPath,
        label: label,
        isLast: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="flex items-center space-x-2 text-sm mb-4 bg-white px-4 py-3 rounded-lg shadow-sm">
      {/* Home Icon */}
      <Link
        to={homePath}
        className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
        title="Home"
      >
        <Home className="w-4 h-4" />
      </Link>

      {/* Breadcrumb items */}
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center">
          <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
          {crumb.isLast ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="text-gray-500 hover:text-blue-600 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;
