import { useNavigate } from 'react-router-dom';
import { Lock, Zap, ArrowRight } from 'lucide-react';
import { usePlan } from '../context/PlanContext';

export default function UpgradeWall({ reason = 'trial' }) {
  const { planDef } = usePlan();
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">

        <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-8 h-8 text-purple-600" />
        </div>

        {reason === 'trial' ? (
          <>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Your free trial has ended</h2>
            <p className="text-gray-500 mb-6 text-sm">
              Your 14-day free trial is over. Upgrade to keep using BusinessIQ and unlock all your data.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">This page requires an upgrade</h2>
            <p className="text-gray-500 mb-6 text-sm">
              This feature is not included in your{' '}
              <span className="font-semibold text-purple-700">{planDef?.name}</span> plan.
              Upgrade to unlock it.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/upgrade')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            <Zap className="w-4 h-4 text-yellow-300" />
            View Plans & Upgrade
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 text-sm transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
