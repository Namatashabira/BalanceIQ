import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useConfig, useLabels, useFeatures, useAllowedPages } from "../context/ConfigContext";
import { usePlan } from "../context/PlanContext";
import AccountPopup from "./AccountPopup";
import axios from "axios";
import { getNavigationItems } from '../config/navigationConfig';

export default function Sidebar({ isOpen, onToggle, sidebarWidth = 256 }) {

  const { user, logout } = useAuth();
  const { loading: configLoading, theme, businessType } = useConfig();
  const features = useFeatures();
  const allowedPages = useAllowedPages();
  const labels = useLabels();
  const [businessLogo, setBusinessLogo] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [showAccount, setShowAccount] = useState(false);
  const isAdmin = ['tenant_admin', 'superadmin'].includes(user?.role) || user?.is_staff;


  // Fetch business settings logo from API if not already cached
  useEffect(() => {
    if (businessLogo) return;
    const fetchLogo = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/core/business-settings/`);
        const apiLogo = res.data?.businessLogoUrl;
        if (apiLogo) {
          setBusinessLogo(apiLogo);
          localStorage.setItem('businessLogoUrl', apiLogo);
        }
      } catch (err) {
        console.error('Failed to fetch business logo for sidebar:', err);
      }
    };
    fetchLogo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessLogo]);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('businessLogoUrl') : null;
    if (stored) setBusinessLogo(stored);

    const handler = () => {
      const next = localStorage.getItem('businessLogoUrl');
      if (next !== businessLogo) setBusinessLogo(next);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoUrl = businessLogo || theme?.logo_url || theme?.logo || null;

  useEffect(() => {
    const storedProfile = typeof window !== 'undefined' ? localStorage.getItem('userProfile') : null;
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    }

    const profileHandler = () => {
      const next = localStorage.getItem('userProfile');
      const parsed = next ? JSON.parse(next) : null;
      setUserProfile(parsed);
    };
    window.addEventListener('storage', profileHandler);
    return () => window.removeEventListener('storage', profileHandler);
  }, []);

  // Business name sync (localStorage + fetch fallback) - PERSISTENT
  useEffect(() => {
    const storedName = typeof window !== 'undefined' ? localStorage.getItem('businessName') : null;
    if (storedName) {
      setBusinessName(storedName);
      return; // Use stored name, don't fetch
    }

    // Only fetch if not in localStorage
    const fetchBusinessName = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/core/business-settings/`);
        const name = res.data?.businessName || res.data?.name || '';
        if (name) {
          setBusinessName(name);
          localStorage.setItem('businessName', name);
        }
      } catch (err) {
        console.error('Failed to fetch business name:', err);
      }
    };

    fetchBusinessName();

    // Listen for storage changes
    const handler = () => {
      const next = localStorage.getItem('businessName') || '';
      if (next) setBusinessName(next);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleAccountSave = ({ username, fullName, avatarUrl, avatarFile, preview }) => {
    const profilePayload = {
      username: username || user?.username,
      fullName: fullName || user?.first_name,
      avatar: preview || avatarUrl || '',
    };
    setUserProfile(profilePayload);
    localStorage.setItem('userProfile', JSON.stringify(profilePayload));
    setShowAccount(false);
  };
  // ...existing code...

  const contactLabel = labels.entity || (businessType === 'education' ? 'Student' : businessType === 'services' ? 'Client' : 'Customer');
  const contactLabelPlural = labels.entities || `${contactLabel}${contactLabel.endsWith('s') ? '' : 's'}`;

  // Treat undefined feature flags as enabled by default to avoid hiding new routes until explicitly disabled
  const isEnabled = (key, defaultValue = true) => {
    const value = features?.[key];
    if (value === undefined) return defaultValue;
    return value === true;
  };

  // Page-level access: admins bypass; workers need explicit allowedPages list
  const hasAccess = (pageKey) => {
    if (isAdmin) return true;
    if (!pageKey) return true;
    if (!Array.isArray(allowedPages)) return false;
    return allowedPages.includes(pageKey);
  };

  // Use shared navigation config
  const navigationItems = getNavigationItems(labels, features, allowedPages, businessType, isAdmin, user);
  const { isPageAllowed, trialExpired } = usePlan();
  const visibleItems = navigationItems.filter(item => item.enabled);

  return (
    <>
      <aside
        className={`hidden lg:flex lg:static bg-gray-800 text-white h-screen min-h-0 flex-col flex-shrink-0 transition-all duration-300 z-50 overflow-hidden ${
          isOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'
        }`}
        style={{ position: 'relative', width: isOpen ? sidebarWidth : 0, minWidth: isOpen ? sidebarWidth : 0 }}
      >
        <div className="w-full flex items-center gap-2 px-3 py-3 border-b border-gray-700">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="logo"
              className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
            style={{ display: logoUrl ? 'none' : 'flex' }}
          >
            {(businessName || 'B').charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-gray-300 uppercase tracking-widest truncate">
            {businessName && businessName.trim() ? businessName : 'Your Business'}
          </span>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col min-h-0">

          {/* Navigation */}
          <nav className="flex flex-col gap-0.5 flex-shrink-0">
            {configLoading || !features ? (
              <div className="text-gray-400 text-sm text-center py-4">Loading menu...</div>
            ) : (
              <>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const locked = trialExpired || !isPageAllowed(item.path.replace('/', '') + '_enabled') && !isPageAllowed(item.path.replace('/', ''));
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-white/10 text-white'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {locked && <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full">Pro</span>}
                    </NavLink>
                  );
                })}
              </>
            )}

              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAccount(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors"
                  aria-label="Open account popup"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {userProfile?.avatar ? (
                      <img src={userProfile.avatar} alt="User avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <span className="text-white text-sm font-semibold">
                        {(userProfile?.fullName || userProfile?.username || user?.username || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-white leading-tight truncate">{userProfile?.fullName || userProfile?.username || user?.first_name || user?.username || 'User'}</div>
                    <div className="text-xs text-gray-400 capitalize">
                      {user?.role === 'tenant_admin' || user?.role === 'superadmin'
                        ? 'Admin'
                        : user?.school_role
                          ? user.school_role.charAt(0).toUpperCase() + user.school_role.slice(1).replace('_', ' ')
                          : (user?.role || '').replace('_', ' ')}
                    </div>
                  </div>
                </button>
              </div>
          </nav>
        </div>

        <AccountPopup
          open={showAccount}
          onClose={() => setShowAccount(false)}
          onSave={handleAccountSave}
          onLogout={() => {
            logout();
            setShowAccount(false);
          }}
          initialProfile={userProfile || { username: user?.username, fullName: user?.first_name, avatarUrl: userProfile?.avatar || '' }}
        />
      </aside>
    </>
  );
}
