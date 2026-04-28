import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, isAuthenticated, logoutUser } from '../api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  // Only validate session on protected routes
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(window.location.pathname);

  const validateSession = async () => {
    if (isPublicRoute) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('http://127.0.0.1:8000/api/core/auth/profile/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || data);
      } else {
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (!isPublicRoute) alert('Session expired or invalid. Please log in again.');
        if (!isPublicRoute) window.location.href = '/login';
      }
    } catch (err) {
      setUser(null);
      if (!isPublicRoute) alert('Session check failed. Please log in again.');
      if (!isPublicRoute) window.location.href = '/login';
    }
    setLoading(false);
  };

  useEffect(() => {
    validateSession();
  }, []);

  const login = async (userData) => {
    setUser(userData);
    await validateSession();
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  };

  // Error fallback for missing/null user
  if (!loading && !user && !isPublicRoute) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',color:'#b91c1c',background:'#fef2f2'}}>
        <div>
          <h2 style={{fontWeight:'bold',fontSize:'1.5rem'}}>Authentication Error</h2>
          <p>Session invalid or user data missing.<br/>Please <a href="/login" style={{color:'#2563eb'}}>log in</a> again.</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}