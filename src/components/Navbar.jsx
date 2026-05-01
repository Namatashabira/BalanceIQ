import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig, useLabels, useFeatures, useAllowedPages } from '../context/ConfigContext';
import { getNavigationItems } from '../config/navigationConfig';
import AccountPopup from './AccountPopup';
import BIQLogo from './BIQLogo';
import axios from 'axios';
import {
  Menu, X, Bell, Search, ChevronDown, Settings, LogOut,
  User, Home, ChevronRight
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

// ── Breadcrumb labels ────────────────────────────────────────────────────────
const ROUTE_LABELS = {
  dashboard: 'Dashboard', product: 'Products', inventory: 'Inventory',
  orders: 'Orders', sales: 'Sales', customers: 'Customers',
  appointments: 'Appointments', 'manual-entry': 'New Order',
  'receipt-lookup': 'Receipt Lookup', 'abandoned-carts': 'Abandoned Carts',
  analytics: 'Analytics', 'ai-insights': 'AI Insights', forecast: 'Forecast',
  settings: 'Settings', accounting: 'Accounting', expenses: 'Expenses',
  payments: 'Payments', taxes: 'Taxes', 'profit-loss': 'Profit & Loss',
  'balance-sheet': 'Balance Sheet', assets: 'Assets', enrollment: 'Enrollment',
  reports: 'Reports', business: 'Business Report', 'website-builder': 'Website Builder',
  'my-organizations': 'My Organizations',
};

function useBreadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length || (segments.length === 1 && segments[0] === 'dashboard')) return [];
  let path = '';
  return segments.map((seg, i) => {
    path += `/${seg}`;
    return { path, label: ROUTE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1), isLast: i === segments.length - 1 };
  });
}

// ── Search ───────────────────────────────────────────────────────────────────
function SearchBar({ items }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  const results = query.trim().length > 0
    ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative hidden md:flex w-full max-w-xs lg:max-w-sm">
      <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl px-3 py-2 w-full">
        <Search size={15} className="text-gray-400 flex-shrink-0" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search pages…"
          className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {results.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setQuery(''); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition-colors"
              >
                {Icon && <Icon size={16} className="text-gray-400 flex-shrink-0" />}
                <span className="text-sm text-gray-700">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Notifications ────────────────────────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    // Load recent orders as notifications
    const load = async () => {
      try {
        const res = await axios.get(`${API}/core/orders/?status=pending&limit=5`, { headers: getAuthHeaders() });
        const orders = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setNotifications(orders.slice(0, 5).map(o => ({
          id: o.id,
          text: `New order from ${o.customer_name || o.customer_email || 'customer'}`,
          sub: `#${o.id} · ${o.total ? `UGX ${Number(o.total).toLocaleString()}` : ''}`,
          read: false,
          time: o.date || o.created_at,
        })));
      } catch { /* silent */ }
    };
    load();
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => setNotifications(n => n.map(x => ({ ...x, read: true })))}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">No new notifications</div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex gap-3 items-start hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/40' : ''}`}
                  onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate">{n.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-4 py-2.5 border-t border-gray-100">
            <Link to="/orders" onClick={() => setOpen(false)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all orders →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── User Menu ────────────────────────────────────────────────────────────────
function UserMenu({ user, userProfile, onOpenAccount, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = userProfile?.fullName || userProfile?.username || user?.first_name || user?.username || 'User';
  const avatar = userProfile?.avatar;
  const role = user?.role?.replace('_', ' ') || '';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          {avatar ? (
            <img src={avatar} alt="avatar" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
          ) : (
            <span className="text-white text-sm font-semibold">{displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold text-gray-800 max-w-[100px] truncate">{displayName}</span>
          <span className="text-[11px] text-gray-400 capitalize">{role}</span>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform hidden sm:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 capitalize">{role}</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => { onOpenAccount(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User size={15} className="text-gray-400" /> My Account
            </button>
            <button
              onClick={() => { navigate('/settings'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings size={15} className="text-gray-400" /> Settings
            </button>
          </div>
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => { onLogout(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mobile Search (inside drawer) ──────────────────────────────────────────
function MobileSearch({ items, onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const results = query.trim().length > 0
    ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];
  return (
    <div className="flex-1">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search pages…"
        className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
      />
      {results.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {results.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setQuery(''); onClose(); }}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-blue-50 text-left text-sm text-gray-700"
              >
                {Icon && <Icon size={15} className="text-gray-400" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Mobile Drawer (slides from RIGHT) ───────────────────────────────────────
function MobileDrawer({ open, onClose, items, user, userProfile, onOpenAccount, onLogout, logoUrl, businessName }) {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  // Close only when path actually changes (not on mount)
  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      onClose();
    }
  }, [location.pathname]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer — hidden off-screen right when closed */}
      <div
        className="fixed top-0 right-0 h-full w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl transition-transform duration-300 ease-in-out"
        style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer header with X close button */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="w-9 h-9 rounded-xl object-cover" onError={e => e.target.style.display = 'none'} />
            ) : (
              <BIQLogo size={36} />
            )}
            <span className="font-semibold text-gray-900 truncate max-w-[140px]">{businessName || 'Menu'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <MobileSearch items={items} onClose={onClose} />
          </div>
        </div>

        {/* Mobile notifications */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notifications</span>
          <NotificationBell />
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {items.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {Icon && <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-100 p-4">
          <button
            onClick={() => { onOpenAccount(); onClose(); }}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm font-semibold">
                  {(userProfile?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {userProfile?.fullName || userProfile?.username || user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </button>
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Header ──────────────────────────────────────────────────────────────
export default function Navbar({ onToggleSidebar, sidebarOpen }) {
  const { user, logout } = useAuth();
  const { theme, businessType, loading: configLoading, features: featuresFromConfig } = useConfig();
  const features = useFeatures();
  const allowedPages = useAllowedPages();
  const labels = useLabels();

  const [businessLogo, setBusinessLogo] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [showAccount, setShowAccount] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = ['tenant_admin', 'superadmin'].includes(user?.role) || user?.is_staff;
  const breadcrumbs = useBreadcrumbs();

  // ── Business name: user.tenant.name is the source of truth ──────────────
  useEffect(() => {
    const nameFromAuth = user?.tenant?.name;
    if (nameFromAuth) {
      setBusinessName(nameFromAuth);
      localStorage.setItem('businessName', nameFromAuth);
      return;
    }
    // Fallback to localStorage cache (e.g. after page reload before auth resolves)
    const cached = localStorage.getItem('businessName');
    if (cached) setBusinessName(cached);
  }, [user?.tenant?.name]);

  const logoUrl = businessLogo || theme?.logo_url || null;

  const handleAccountSave = ({ username, fullName, avatarUrl, avatarFile, preview }) => {
    const p = { username: username || user?.username, fullName: fullName || user?.first_name, avatar: preview || avatarUrl || '' };
    setUserProfile(p);
    localStorage.setItem('userProfile', JSON.stringify(p));
    setShowAccount(false);
  };

  const navigationItems = getNavigationItems(labels, featuresFromConfig, allowedPages, businessType, isAdmin, user);
  const visibleItems = navigationItems.filter(i => i.enabled);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between h-14 px-3 sm:px-4">

          {/* ── Left: Logo + business name ─────────────────────────────── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onToggleSidebar}
              className="hidden lg:flex p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
            <Link to="/" className="flex items-center gap-2.5 min-w-0">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" className="w-8 h-8 rounded-xl object-cover flex-shrink-0" onError={e => e.target.style.display = 'none'} />
              ) : (
                <BIQLogo size={34} className="flex-shrink-0" />
              )}
              <span className="hidden sm:block font-semibold text-gray-900 text-sm truncate max-w-[140px]">
                {businessName || 'Dashboard'}
              </span>
            </Link>
          </div>

          {/* ── Center: Breadcrumb (desktop) / Search (md) ───────────── */}
          <div className="flex-1 min-w-0 flex items-center px-3">
            <div className="hidden lg:flex items-center gap-1 w-full text-sm text-gray-500 overflow-hidden">
              <Link to="/" className="hover:text-blue-600 transition-colors flex-shrink-0"><Home size={14} /></Link>
              {breadcrumbs.map(crumb => (
                <span key={crumb.path} className="flex items-center gap-1 min-w-0">
                  <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
                  {crumb.isLast
                    ? <span className="text-gray-900 font-medium truncate">{crumb.label}</span>
                    : <Link to={crumb.path} className="hover:text-blue-600 transition-colors truncate">{crumb.label}</Link>}
                </span>
              ))}
            </div>
            <SearchBar items={visibleItems} />
          </div>

          {/* ── Right: desktop controls + mobile hamburger ────────────── */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="hidden lg:flex items-center gap-1">
              <NotificationBell />
              <UserMenu
                user={user}
                userProfile={userProfile}
                onOpenAccount={() => setShowAccount(true)}
                onLogout={logout}
              />
            </div>
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors" style={{ marginLeft: '370px' }}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        items={visibleItems}
        user={user}
        userProfile={userProfile}
        onOpenAccount={() => setShowAccount(true)}
        onLogout={logout}
        logoUrl={logoUrl}
        businessName={businessName}
      />

      {/* Account Popup */}
      <AccountPopup
        open={showAccount}
        onClose={() => setShowAccount(false)}
        onSave={handleAccountSave}
        onLogout={logout}
        initialProfile={userProfile || { username: user?.username, fullName: user?.first_name, avatarUrl: '' }}
      />
    </>
  );
}
