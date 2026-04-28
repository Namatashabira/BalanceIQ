// pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { requestPasswordReset } from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await requestPasswordReset(email);
      setSuccess(true);
      // Auto redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Forgot Password?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              No worries! Enter your email and we'll send you a reset link
            </p>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {success ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Check Your Email!</h3>
                <p className="text-sm text-gray-600">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-xs text-blue-800 mb-2 font-medium">⏱️ Important:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Link expires in <strong>30 seconds</strong></li>
                    <li>• Check your spam folder if not received</li>
                    <li>• Only the latest link will work</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500 pt-4">
                  Redirecting to login in 5 seconds...
                </p>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out sm:text-sm"
                    placeholder="Enter your email address"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Send Reset Link
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
