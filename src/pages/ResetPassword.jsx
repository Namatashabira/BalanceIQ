// pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword, verifyResetToken } from '../api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const token = searchParams.get('token');

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid reset link');
        setVerifying(false);
        return;
      }

      try {
        const response = await verifyResetToken(token);
        setTokenValid(true);
        setTimeLeft(response.timeLeft || 30);
      } catch (err) {
        console.error('Token verification error:', err);
        if (err.response?.data?.expired) {
          setTokenExpired(true);
        } else {
          setError('Invalid or expired reset link');
        }
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  // Countdown timer
  useEffect(() => {
    if (!tokenValid || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTokenExpired(true);
          setTokenValid(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tokenValid, timeLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passwords.password !== passwords.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwords.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, passwords.password);
      setSuccess(true);
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      if (err.response?.data?.expired) {
        setTokenExpired(true);
        setTokenValid(false);
      } else {
        setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <div className="rainbow-wheel"></div>
        <div className="loading-dots mt-6">
          <span className="dot dot1">.</span>
          <span className="dot dot2">.</span>
          <span className="dot dot3">.</span>
        </div>
        <p className="mt-4 text-gray-600">Verifying reset link...</p>
        
        <style jsx>{`
          @keyframes rainbow-spin {
            0% { transform: rotate(0deg); border-top-color: #ff0000; }
            16.67% { border-top-color: #ff7f00; }
            33.33% { border-top-color: #ffff00; }
            50% { border-top-color: #00ff00; }
            66.67% { border-top-color: #0000ff; }
            83.33% { border-top-color: #4b0082; }
            100% { transform: rotate(360deg); border-top-color: #ff0000; }
          }
          @keyframes dot-fill {
            0%, 20% { opacity: 0.3; }
            40%, 100% { opacity: 1; }
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
      </div>
    );
  }

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Reset Your Password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Choose a strong password for your account
            </p>
          </div>

          {/* Content Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {tokenExpired ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Link Expired</h3>
                <p className="text-sm text-gray-600">
                  This password reset link has expired after 30 seconds for security reasons.
                </p>
                <div className="pt-4">
                  <Link 
                    to="/forgot-password"
                    className="inline-block w-full py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition duration-150 ease-in-out shadow-lg"
                  >
                    Request New Link
                  </Link>
                </div>
              </div>
            ) : !tokenValid ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Invalid Link</h3>
                <p className="text-sm text-gray-600">
                  This password reset link is invalid or has already been used.
                </p>
                <div className="pt-4 space-y-3">
                  <Link 
                    to="/forgot-password"
                    className="inline-block w-full py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition duration-150 ease-in-out shadow-lg"
                  >
                    Request New Link
                  </Link>
                  <Link 
                    to="/login"
                    className="inline-block w-full py-3 px-4 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 hover:bg-gray-50 transition duration-150 ease-in-out"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            ) : success ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Password Reset Successfully!</h3>
                <p className="text-sm text-gray-600">
                  Your password has been changed. All active sessions have been invalidated.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-xs text-blue-800 mb-2 font-medium">🔒 Security Actions Taken:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Password updated successfully</li>
                    <li>• All tokens invalidated</li>
                    <li>• Email notification sent</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500 pt-4">
                  Redirecting to login in 3 seconds...
                </p>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Timer Warning */}
                <div className={`border rounded-lg p-3 flex items-center justify-between ${
                  timeLeft <= 10 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                }`}>
                  <span className={`text-sm font-medium ${
                    timeLeft <= 10 ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    ⏱️ Link expires in:
                  </span>
                  <span className={`text-lg font-bold ${
                    timeLeft <= 10 ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {timeLeft}s
                  </span>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={passwords.password}
                    onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out sm:text-sm"
                    placeholder="Enter new password"
                    minLength={8}
                  />
                  <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out sm:text-sm"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || timeLeft <= 0}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Reset Password
                </button>

                <div className="text-center">
                  <Link 
                    to="/login" 
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out"
                  >
                    ← Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes rainbow-spin {
          0% { transform: rotate(0deg); border-top-color: #ff0000; }
          16.67% { border-top-color: #ff7f00; }
          33.33% { border-top-color: #ffff00; }
          50% { border-top-color: #00ff00; }
          66.67% { border-top-color: #0000ff; }
          83.33% { border-top-color: #4b0082; }
          100% { transform: rotate(360deg); border-top-color: #ff0000; }
        }
        @keyframes dot-fill {
          0%, 20% { opacity: 0.3; }
          40%, 100% { opacity: 1; }
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
