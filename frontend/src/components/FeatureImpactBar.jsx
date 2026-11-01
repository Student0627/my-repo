import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function FeatureImpactBar({ contributions = [] }) {
  const [filter, setFilter] = useState('all');

  const displayed = contributions.filter((c) => {
    if (filter === 'increase') return c.shap_value > 0;
    if (filter === 'decrease') return c.shap_value < 0;
    return true;
  });

  const maxAbs = Math.max(...contributions.map((c) => Math.abs(c.shap_value)), 0.05);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-sm text-white">
            Feature Importance Explanation (TreeSHAP)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Marginal contribution of each borrower attribute towards default risk probability
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            All Factors ({contributions.length})
          </button>
          <button
            onClick={() => setFilter('increase')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
              filter === 'increase'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Risk Escalators
          </button>
          <button
            onClick={() => setFilter('decrease')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
              filter === 'decrease'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            Risk Mitigators
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {displayed.map((item, idx) => {
          const isEscalator = item.shap_value > 0;
          const pctWidth = Math.min(100, Math.round((Math.abs(item.shap_value) / maxAbs) * 100));

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{item.label}</span>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {item.feature.includes('ratio')
                      ? `${(item.feature_value * 100).toFixed(1)}%`
                      : item.feature.includes('amount') || item.feature.includes('income') || item.feature.includes('debt')
                      ? `₹${Number(item.feature_value).toLocaleString('en-IN')}`
                      : item.feature_value}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span
                    className={`font-bold ${
                      isEscalator ? 'text-rose-400' : 'text-teal-400'
                    }`}
                  >
                    {item.shap_value > 0 ? `+${item.shap_value.toFixed(3)}` : item.shap_value.toFixed(3)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isEscalator ? '(Adds Risk)' : '(Mitigates Risk)'}
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                {isEscalator ? (
                  <>
                    <div className="w-1/2 bg-transparent" />
                    <div
                      className="h-full bg-rose-500 rounded-r-full"
                      style={{ width: `${pctWidth / 2}%` }}
                    />
                  </>
                ) : (
                  <>
                    <div className="w-1/2 flex justify-end">
                      <div
                        className="h-full bg-teal-400 rounded-l-full"
                        style={{ width: `${pctWidth / 2}%` }}
                      />
                    </div>
                    <div className="w-1/2 bg-transparent" />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="text-teal-400 font-medium">← Negative SHAP = Lowers Default Probability</span>
        <span className="text-rose-400 font-medium">Positive SHAP = Increases Default Probability →</span>
      </div>
    </div>
  );
}
