import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';

export default function WaterfallChart({ baseValue = 0.5, finalValue = 0.1, contributions = [] }) {
  const sorted = [...contributions]
    .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
    .slice(0, 5);

  let running = baseValue;
  const data = [
    {
      name: 'Base Avg',
      val: Math.round(baseValue * 1000) / 10,
      type: 'base',
      displayVal: `${(baseValue * 100).toFixed(1)}%`
    }
  ];

  sorted.forEach((c) => {
    const change = Math.round(c.shap_value * 1000) / 10;
    running += c.shap_value;
    data.push({
      name: c.label.length > 14 ? c.label.slice(0, 14) + '..' : c.label,
      val: Math.abs(change),
      change: change,
      type: change >= 0 ? 'increase' : 'decrease',
      displayVal: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
    });
  });

  data.push({
    name: 'Final Risk',
    val: Math.round(finalValue * 1000) / 10,
    type: 'final',
    displayVal: `${(finalValue * 100).toFixed(1)}%`
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
      <div>
        <h4 className="font-bold text-sm text-white">How Features Changed the Prediction</h4>
        <p className="text-xs text-slate-400">
          Starts from average population risk (50%) and applies borrower's specific feature adjustments
        </p>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} tickLine={false} />
            <Tooltip
              formatter={(value, name, props) => [props.payload.displayVal, 'Impact']}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }}
            />
            <ReferenceLine y={0} stroke="#334155" />
            <Bar dataKey="val" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => {
                let fill = '#14b8a6';
                if (entry.type === 'base') fill = '#3b82f6';
                else if (entry.type === 'increase') fill = '#f43f5e';
                else if (entry.type === 'final') fill = '#a855f7';
                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-blue-500" /> Base Average (50%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-rose-500" /> Adds Risk (+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-teal-500" /> Lowers Risk (-)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-purple-500" /> Final Calculated Risk
        </span>
      </div>
    </div>
  );
}
