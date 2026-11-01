import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function RiskGauge({ probability = 0, score = 1000, tier = 'Low', baseValue = 0.5 }) {
  const probPct = Math.round(probability * 100);

  const tierConfig = {
    Low: {
      textColor: 'text-teal-400',
      icon: ShieldCheck,
      badge: 'Low Risk',
      decision: 'Safe to Approve',
      desc: 'The model predicts low default risk. The borrower has a healthy debt-to-income ratio and sufficient credit standing.'
    },
    Moderate: {
      textColor: 'text-amber-400',
      icon: AlertTriangle,
      badge: 'Moderate Risk',
      decision: 'Review Carefully',
      desc: 'The model predicts moderate default risk. The borrower has borderline credit or higher monthly debt obligations.'
    },
    High: {
      textColor: 'text-rose-400',
      icon: AlertOctagon,
      badge: 'High Risk',
      decision: 'Likely to Default (High Risk)',
      desc: 'The model predicts a high probability of loan default. High existing debt burden or poor credit score detected.'
    }
  };

  const current = tierConfig[tier] || tierConfig.Low;
  const Icon = current.icon;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Model Prediction Result
          </span>
          <h3 className="text-base font-bold text-white">Credit Risk Assessment</h3>
        </div>

        <div className={`flex items-center gap-1.5 text-sm font-bold ${current.textColor}`}>
          <Icon className="w-4 h-4" />
          <span>{current.badge}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
        {/* Probability */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[11px] text-slate-400">Default Probability:</span>
          <div className={`text-2xl font-bold font-mono mt-0.5 ${current.textColor}`}>
            {probPct}%
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Average population rate: {(baseValue * 100).toFixed(1)}%</p>
        </div>

        {/* Score */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[11px] text-slate-400">FineGuard Risk Index:</span>
          <div className="text-2xl font-bold font-mono text-white mt-0.5">
            {score} <span className="text-xs text-slate-500">/ 1000</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Higher score = safer borrower</p>
        </div>

        {/* Recommendation */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[11px] text-slate-400">Decision Suggestion:</span>
          <div className={`text-sm font-bold mt-1 ${current.textColor}`}>
            {current.decision}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Based on ML evaluation</p>
        </div>
      </div>

      {/* Explanation text */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
        💡 <strong>Summary:</strong> {current.desc}
      </div>
    </div>
  );
}
