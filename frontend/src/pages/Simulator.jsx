import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { simulationService } from '../services/api';

export default function Simulator({ initialInputs }) {
  const [original, setOriginal] = useState(
    initialInputs || {
      monthly_income: 65000,
      monthly_debt: 25000,
      loan_amount: 400000,
      loan_term_months: 36,
      credit_score: 680,
      employment_years: 4.0,
    }
  );

  const [modified, setModified] = useState(
    initialInputs || {
      monthly_income: 65000,
      monthly_debt: 12000, // Reduced debt
      loan_amount: 300000, // Reduced principal
      loan_term_months: 48, // Extended term
      credit_score: 680,
      employment_years: 4.0,
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);

  const handleRunSimulation = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await simulationService.run({ original, modified });
      setSimulationResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Simulation error.');
    } finally {
      setLoading(false);
    }
  };

  const resetModifiedToOriginal = () => {
    setModified({ ...original });
    setSimulationResult(null);
  };

  const handleModifiedChange = (field, val) => {
    setModified((prev) => ({ ...prev, [field]: Number(val) }));
  };

  const origDti = original.monthly_income > 0 ? (original.monthly_debt / original.monthly_income) * 100 : 0;
  const modDti = modified.monthly_income > 0 ? (modified.monthly_debt / modified.monthly_income) * 100 : 0;

  const comparisonData = simulationResult
    ? [
        {
          metric: 'Default Prob (%)',
          Original: Math.round(simulationResult.original_result.prediction.default_probability * 1000) / 10,
          Modified: Math.round(simulationResult.modified_result.prediction.default_probability * 1000) / 10,
        },
        {
          metric: 'DTI Ratio (%)',
          Original: Math.round(origDti * 10) / 10,
          Modified: Math.round(modDti * 10) / 10,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          What-If Counterfactual Risk Simulator
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Simulate how reducing monthly debt, altering tenure, or increasing income impacts the model's prediction in INR
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Inputs Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Scenario A: Original */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="font-bold text-xs text-slate-300">Scenario A: Original Baseline</h3>
            <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
              Reference Profile
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">Monthly Gross Income</span>
              <span className="font-mono font-bold text-white">₹{original.monthly_income.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">Monthly Debt Obligations</span>
              <span className="font-mono font-bold text-white">₹{original.monthly_debt.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">Requested Loan Principal</span>
              <span className="font-mono font-bold text-white">₹{original.loan_amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">Repayment Term</span>
              <span className="font-mono font-bold text-white">{original.loan_term_months} Months</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">Debt-to-Income (DTI)</span>
              <span className="font-mono font-bold text-teal-400">{origDti.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Scenario B: Adjusted */}
        <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="font-bold text-xs text-teal-300">Scenario B: Counterfactual Adjustments</h3>
            <button
              onClick={resetModifiedToOriginal}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to A
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Income Slider */}
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-slate-300 font-semibold">Monthly Income (₹)</span>
                <span className="font-mono text-teal-400 font-bold">₹{modified.monthly_income.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="15000"
                max="250000"
                step="2000"
                value={modified.monthly_income}
                onChange={(e) => handleModifiedChange('monthly_income', e.target.value)}
                className="w-full accent-teal-400 h-1.5 bg-slate-950 rounded cursor-pointer"
              />
            </div>

            {/* Debt Slider */}
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-slate-300 font-semibold">Monthly Debt (₹)</span>
                <span className="font-mono text-teal-400 font-bold">₹{modified.monthly_debt.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={modified.monthly_debt}
                onChange={(e) => handleModifiedChange('monthly_debt', e.target.value)}
                className="w-full accent-teal-400 h-1.5 bg-slate-950 rounded cursor-pointer"
              />
            </div>

            {/* Loan Amount Slider */}
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-slate-300 font-semibold">Loan Amount (₹)</span>
                <span className="font-mono text-teal-400 font-bold">₹{modified.loan_amount.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="25000"
                max="1500000"
                step="10000"
                value={modified.loan_amount}
                onChange={(e) => handleModifiedChange('loan_amount', e.target.value)}
                className="w-full accent-teal-400 h-1.5 bg-slate-950 rounded cursor-pointer"
              />
            </div>

            {/* Loan Tenure Dropdown */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Repayment Term</label>
              <select
                value={modified.loan_term_months}
                onChange={(e) => handleModifiedChange('loan_term_months', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-teal-500 focus:outline-none"
              >
                <option value={12}>12 Months (1 yr)</option>
                <option value={24}>24 Months (2 yrs)</option>
                <option value={36}>36 Months (3 yrs)</option>
                <option value={48}>48 Months (4 yrs)</option>
                <option value={60}>60 Months (5 yrs)</option>
                <option value={72}>72 Months (6 yrs)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="text-center">
        <button
          onClick={handleRunSimulation}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <span>Compare Scenarios with Real Model</span>
          )}
        </button>
      </div>

      {/* Results */}
      {simulationResult && (
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-[11px]">Scenario A Default Risk:</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {(simulationResult.original_result.prediction.default_probability * 100).toFixed(1)}%
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">Tier: {simulationResult.original_result.prediction.risk_tier}</p>
            </div>

            <div className="bg-slate-900 border border-teal-500/40 rounded-xl p-4">
              <span className="text-teal-400 text-[11px] font-semibold">Scenario B Default Risk:</span>
              <div className="text-xl font-bold font-mono text-teal-300 mt-1">
                {(simulationResult.modified_result.prediction.default_probability * 100).toFixed(1)}%
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5">Tier: {simulationResult.modified_result.prediction.risk_tier}</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-[11px]">Net Risk Variance (&Delta;):</span>
              <div className="flex items-center gap-1.5 mt-1 font-mono text-xl font-bold">
                {simulationResult.comparison.probability_diff < 0 ? (
                  <TrendingDown className="w-4 h-4 text-teal-400" />
                ) : simulationResult.comparison.probability_diff > 0 ? (
                  <TrendingUp className="w-4 h-4 text-rose-400" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-400" />
                )}
                <span className={simulationResult.comparison.probability_diff < 0 ? 'text-teal-400' : 'text-rose-400'}>
                  {simulationResult.comparison.probability_diff > 0 ? '+' : ''}
                  {(simulationResult.comparison.probability_diff * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Score: {simulationResult.comparison.risk_score_diff > 0 ? '+' : ''}{simulationResult.comparison.risk_score_diff} pts
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            📝 {simulationResult.comparison.summary}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h4 className="font-bold text-xs text-white mb-2">Scenario Comparison Chart</h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="metric" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Original" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Modified" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
