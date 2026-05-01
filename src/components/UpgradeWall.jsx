import { useNavigate } from 'react-router-dom';
import { Lock, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { usePlan } from '../context/PlanContext';

export default function UpgradeWall({ reason = 'trial' }) {
  const { planDef } = usePlan();
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-7 h-7 text-purple-400" />
        </div>

        {reason === 'trial' ? (
          <>
            <h2 className="text-2xl font-extrabold text-white mb-3">Your free trial has ended</h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              Your 14-day free trial is over. Upgrade to keep using BusinessIQ and unlock all your data.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-white mb-3">This page requires an upgrade</h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              This feature is not included in your{' '}
              <span className="font-semibold text-purple-400">{planDef?.name}</span> plan.
              Upgrade to unlock it.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/upgrade')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg hover:scale-105 hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            <Zap className="w-4 h-4 text-yellow-300" />
            View Plans & Upgrade
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-300 bg-white/10 hover:bg-white/15 text-sm transition border border-white/10"
          >
            Go to Dashboard
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-600">
          <Sparkles className="inline w-3 h-3 mr-1 text-amber-500" />
          14-day free trial included with every plan
        </p>
      </div>
    </div>
  );
}
