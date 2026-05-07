import { useState } from 'react';
import axios from 'axios';
import { loginUser } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Key, ArrowLeft, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
const API  = `${BASE}/api`;

// ── OTP Activation flow ───────────────────────────────────────────────────────
function OtpActivationForm({ onBack }) {
  const [step, setStep]       = useState(1); // 1=enter username+otp, 2=set password
  const [username, setUsername] = useState('');
  const [otp, setOtp]         = useState('');
  const [inviteInfo, setInviteInfo] = useState(null); // { name, email, school_role }
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleCheckOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/core/access/check-otp/`, { username, otp });
      if (res.data.valid) {
        setInviteInfo(res.data);
        setStep(2);
      } else {
        setError(res.data.reason === 'expired' ? 'OTP code has expired. Ask the admin to regenerate.' : 'Invalid username or OTP code.');
      }
    } catch {
      setError('Could not verify code. Please try again.');
    } finally { setLoading(false); }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/core/access/activate/`, { username, otp, password });
      // Auto-login after activation
      const result = await loginUser(username, password);
      if (result?.user) { login(result.user); navigate('/'); return; }
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error || 'Activation failed. Please try again.');
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className="text-center space-y-4">
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-7 h-7 text-green-600" />
      </div>
      <p className="font-semibold text-gray-800">Account activated!</p>
      <p className="text-sm text-gray-500">You can now sign in with your username and new password.</p>
      <button onClick={onBack} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
        Go to Login
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="font-bold text-gray-800">Activate Staff Account</h3>
          <p className="text-xs text-gray-500">
            {step === 1 ? 'Enter the username and OTP code you received' : `Welcome, ${inviteInfo?.name || username}! Set your password.`}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {[1, 2].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {step === 1 && (
        <form onSubmit={handleCheckOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input required value={username} onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Your assigned username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
            <input required value={otp} onChange={e => setOtp(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Paste the code you received" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <>Verify Code <ArrowLeft className="w-4 h-4 rotate-180" /></>}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleActivate} className="space-y-4">
          {inviteInfo?.school_role && (
            <div className="bg-indigo-50 rounded-lg px-4 py-2 text-sm text-indigo-700 font-medium">
              Role: <span className="capitalize">{inviteInfo.school_role}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input required type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Repeat password" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Activating…</> : <><CheckCircle className="w-4 h-4" /> Activate &amp; Sign In</>}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Main Login page ───────────────────────────────────────────────────────────
export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showOtp, setShowOtp]   = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => setCredentials(c => ({ ...c, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await new Promise(r => setTimeout(r, 1200));
      const result = await loginUser(credentials.username, credentials.password);
      if (result?.user) { login(result.user); navigate('/'); return; }
      setError('Invalid username or password');
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 border-r-purple-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
          </div>
          <p className="text-gray-500 text-sm font-semibold tracking-widest uppercase">Signing in…</p>
        </div>
      )}

      <div className={`min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 ${loading ? 'hidden' : ''}`}>
        <div className="max-w-md w-full space-y-8">

          {/* Brand */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              {showOtp ? 'Staff Activation' : 'Welcome back'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {showOtp ? 'Use your OTP code to activate your account' : 'Sign in to continue to your dashboard'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {showOtp ? (
              <OtpActivationForm onBack={() => setShowOtp(false)} />
            ) : (
              <>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
                  )}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input id="username" name="username" type="text" required
                      value={credentials.username} onChange={handleChange}
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                      placeholder="Enter your username" />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input id="password" name="password" type="password" required
                      value={credentials.password} onChange={handleChange}
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                      placeholder="Enter your password" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      Forgot password?
                    </Link>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition">
                    Sign in
                  </button>
                </form>

                {/* OTP entry point */}
                <div className="mt-5">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                    <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-gray-400">or</span></div>
                  </div>
                  <button onClick={() => setShowOtp(true)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-dashed border-indigo-300 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition">
                    <Key className="w-4 h-4" /> Have an OTP code? Activate staff account
                  </button>
                </div>

                <div className="mt-4 text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button onClick={() => navigate('/')} className="font-medium text-blue-600 hover:text-blue-500 underline bg-transparent border-none cursor-pointer">
                    Sign up
                  </button>
                </div>

                <div className="mt-6 relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Admin Dashboard</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-sm text-gray-600">
            Need help? Contact{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">support</a>
          </p>
        </div>
      </div>
    </>
  );
}
