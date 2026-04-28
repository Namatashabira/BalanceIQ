import { useState } from 'react';
import { loginUser } from '../api';

export default function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowSpinner(true);

    const startTime = Date.now();

    try {
      const result = await loginUser(credentials.username, credentials.password);

      const elapsed = Date.now() - startTime;
      const remaining = 3000 - elapsed; // minimum 3s spinner
      if (remaining > 0) {
        await new Promise((res) => setTimeout(res, remaining));
      }

      if (result) onLogin(result.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
      setShowSpinner(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {showSpinner ? (
          <div className="flex flex-col items-center justify-center py-16">
            {/* Rainbow rotating wheel with pulsating effect */}
            <div className="relative w-24 h-24 animate-spin-slow pulse-wheel">
              <div
                className="absolute inset-0 rounded-full border-8 border-t-transparent border-b-transparent"
                style={{
                  borderImage:
                    'conic-gradient(#ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff, #ff0000) 1',
                  borderImageSlice: 1,
                }}
              ></div>
            </div>
            <span className="text-lg font-medium text-gray-700 mt-4">Signing in...</span>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Professional inputs card */}
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
              <input
                type="text"
                required
                className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Username"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials((prev) => ({ ...prev, username: e.target.value }))
                }
              />
              <input
                type="password"
                required
                className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Custom animations for pulsating rainbow wheel */}
      <style>{`
        @keyframes pulse-wheel {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(180deg); }
        }
        .pulse-wheel {
          animation: pulse-wheel 1.5s infinite linear;
        }
        .animate-spin-slow {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
