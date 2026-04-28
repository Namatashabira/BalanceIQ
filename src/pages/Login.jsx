// pages/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { loginUser } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpValid, setOtpValid] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Add delay to show loading animation
      await new Promise(resolve => setTimeout(resolve, 4000));

      // If already in OTP activation mode, finish activation
      if (otpMode && otpValid) {
        if (!credentials.newPassword || credentials.newPassword.length < 6) {
          setError('Please enter a new password (min 6 characters).');
          setLoading(false);
          return;
        }
        if (credentials.newPassword !== credentials.confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        await axios.post('http://127.0.0.1:8000/api/core/auth/activate/', {
          email: credentials.username,
          otp: credentials.password,
          password: credentials.newPassword,
        });

        const result = await loginUser(credentials.username, credentials.newPassword);
        if (result && result.user) {
          login(result.user);
          navigate('/');
          return;
        }
        setError('Activation succeeded, but login failed. Try signing in with your new password.');
        setLoading(false);
        return;
      }

      // First ask backend; it now detects OTP first and returns 202 with otp_valid
      const result = await loginUser(credentials.username, credentials.password);

      if (result?.otp_valid) {
        setOtpMode(true);
        setOtpValid(true);
        setError('We found your one-time code. Please create and confirm your new password to finish.');
        return;
      }

      if (result && result.user) {
        login(result.user);
        navigate('/');
        return;
      }

      setError('Invalid username or password');
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err?.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
          <div className="rainbow-wheel"></div>
          <div className="loading-dots mt-6">
            <span className="dot dot1">.</span>
            <span className="dot dot2">.</span>
            <span className="dot dot3">.</span>
          </div>
        </div>
      )}
      
      <div className={`min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 ${loading ? 'hidden' : ''}`}>
        <div className="max-w-md w-full space-y-8">
          {/* Logo/Brand Section */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={credentials.username}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out sm:text-sm"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {otpMode ? 'One-time code' : 'Password'}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={credentials.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out sm:text-sm"
                  placeholder={otpMode ? 'Enter the 11-character code you received' : 'Enter your password'}
                />
                {otpMode && (
                  <p className="text-xs text-blue-600 mt-1">Code validated. Create your password below to finish setup.</p>
                )}
              </div>

              {otpMode && (
                <>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Create password
                    </label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      required
                      value={credentials.newPassword}
                      onChange={handleChange}
                      className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out sm:text-sm"
                      placeholder="New password"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={credentials.confirmPassword}
                      onChange={handleChange}
                      className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out sm:text-sm"
                      placeholder="Confirm password"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link 
                    to="/forgot-password"
                    className="font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Sign in
              </button>
            </form>

            {/* Signup Link */}
            <div className="mt-4 text-center">
              <span>Don't have an account? </span>
              <button
                style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate('/')}
              >
                Sign up
              </button>
            </div>

          {/* Footer */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Admin Dashboard
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <p className="text-center text-sm text-gray-600">
          Need help? Contact{' '}
          <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
            support
          </a>
        </p>
      </div>
    </div>

      <style jsx>{`
        @keyframes rainbow-spin {
          0% {
            transform: rotate(0deg);
            border-top-color: #ff0000;
          }
          16.67% {
            border-top-color: #ff7f00;
          }
          33.33% {
            border-top-color: #ffff00;
          }
          50% {
            border-top-color: #00ff00;
          }
          66.67% {
            border-top-color: #0000ff;
          }
          83.33% {
            border-top-color: #4b0082;
          }
          100% {
            transform: rotate(360deg);
            border-top-color: #ff0000;
          }
        }

        @keyframes dot-fill {
          0%, 20% {
            opacity: 0.3;
          }
          40%, 100% {
            opacity: 1;
          }
        }

        .rainbow-wheel {
          width: 60px;
          height: 60px;
          border: 6px solid rgba(0, 0, 0, 0.1);
          border-top-color: #ff0000;
          background-color: white;
          animation: rainbow-spin 1s linear infinite;
        }

        .loading-dots {
          display: flex;
          gap: 12px;
          font-size: 32px;
          font-weight: bold;
        }

        .dot {
          opacity: 0.3;
          color: #333;
        }

        .dot1 {
          animation: dot-fill 1.5s ease-in-out infinite;
          animation-delay: 0s;
        }

        .dot2 {
          animation: dot-fill 1.5s ease-in-out infinite;
          animation-delay: 0.3s;
        }

        .dot3 {
          animation: dot-fill 1.5s ease-in-out infinite;
          animation-delay: 0.6s;
        }
      `}</style>
    </>
  );
}
