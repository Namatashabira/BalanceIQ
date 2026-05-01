import { createContext, useContext, useState, useEffect } from 'react';
import { logoutUser } from '../api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken');
      const stored = localStorage.getItem('user');
      if (token && stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    // Seed trial start if not already set (used by plan enforcement offline)
    if (!localStorage.getItem('trialStart')) {
      localStorage.setItem('trialStart', String(Date.now()));
    }
    window.dispatchEvent(new Event('auth-changed'));
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    ['cachedSubscription','selectedPlan','trialStart'].forEach(k => localStorage.removeItem(k));
    window.dispatchEvent(new Event('auth-changed'));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
