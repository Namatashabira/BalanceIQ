import { Link } from 'react-router-dom';
import { Clock, Zap } from 'lucide-react';
import { usePlan } from '../context/PlanContext';

export default function TrialBanner() {
  const { planKey, daysLeft, trialExpired, sub } = usePlan();

  // Only show for free trial that hasn't expired yet
  if (planKey !== 'free') return null;
  if (sub?.status !== 'trial') return null;
  if (trialExpired) return null;
  if (daysLeft === null) return null;

  const urgent = daysLeft <= 3;

  return (
    <div className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-sm ${
      urgent ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
    }`}>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">
          {daysLeft === 0
            ? 'Your free trial expires today!'
            : `Free trial: ${daysLeft} day${daysLeft === 1 ? '' : 's'} left — 7 product limit active`}
        </span>
      </div>
      <Link
        to="/upgrade"
        className="flex-shrink-0 flex items-center gap-1 bg-white/20 hover:bg-white/30 border border-white/30 px-3 py-1 rounded-lg font-semibold text-xs transition"
      >
        <Zap className="w-3 h-3" /> Upgrade
      </Link>
    </div>
  );
}
