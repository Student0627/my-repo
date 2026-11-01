import React, { useState } from 'react';
import {
  TrendingUp,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  PieChart,
  ShieldAlert,
  Wallet
} from 'lucide-react';
import { investmentService, reportService } from '../services/api';
import FeatureImpactBar from '../components/FeatureImpactBar';

export default function InvestmentRisk({ onNavigate }) {
  const [formData, setFormData] = useState({
    investment_amount: 500000,
    investor_age: 32,
    time_horizon_years: 5,
    risk_tolerance: 2,
    equity_allocation_pct: 60,
    fd_debt_allocation_pct: 40,
    emergency_fund_months: 6,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [result, setResult] = useState(null);
  const [showTheory, setShowTheory] = useState(false);

  // Save Modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('Investment & FD Risk Assessment');
  const [reportNotes, setReportNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // 100 - Age Rule benchmark
  const recommendedMaxEquity = Math.max(0, 100 - formData.investor_age);
  const equityDelta = (formData.equity_allocation_pct - recommendedMaxEquity).toFixed(0);

  const handleEquityChange = (val) => {
    const eq = Math.min(100, Math.max(0, Number(val)));
    const fd = 100 - eq;
    setFormData((prev) => ({
      ...prev,
      equity_allocation_pct: eq,
      fd_debt_allocation_pct: fd,
    }));
  };

  const handleInputChange = (field, val) => {
    const num = Number(val);
    setFormData((prev) => ({ ...prev, [field]: num }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.investment_amount || formData.investment_amount <= 0) {
      newErrors.investment_amount = 'Please enter valid investment capital in INR';
    }
    if (!formData.investor_age || formData.investor_age < 18 || formData.investor_age > 95) {
      newErrors.investor_age = 'Age must be between 18 and 95';
    }
    if (!formData.time_horizon_years || formData.time_horizon_years < 1 || formData.time_horizon_years > 30) {
      newErrors.time_horizon_years = 'Horizon must be between 1 and 30 years';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAnalyse = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      setApiError('');
      const data = await investmentService.predict(formData);
      setResult(data);
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Inference failed. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!result) return;
    try {
      setSaving(true);
      await reportService.create({
        title: reportTitle,
        notes: reportNotes,
        inputs: formData,
        result: {
          ...result,
          prediction: {
            risk_tier: result.prediction.risk_tier,
            risk_score: result.prediction.capital_safety_index,
            default_probability: result.prediction.volatility_risk_probability,
          },
          debt_to_income_ratio: 0,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowSaveModal(false);
      }, 1400);
    } catch (e) {
      alert('Error saving report: ' + (e.response?.data?.detail || e.message));
    } finally {
      setSaving(false);
    }
  };

  const loadPreset = (preset) => {
    if (preset === 'conservative') {
      setFormData({
        investment_amount: 3000000,
        investor_age: 65,
        time_horizon_years: 3,
        risk_tolerance: 1,
        equity_allocation_pct: 15,
        fd_debt_allocation_pct: 85,
        emergency_fund_months: 12,
      });
    } else if (preset === 'balanced') {
      setFormData({
        investment_amount: 600000,
        investor_age: 28,
        time_horizon_years: 7,
        risk_tolerance: 2,
        equity_allocation_pct: 60,
        fd_debt_allocation_pct: 40,
        emergency_fund_months: 6,
      });
    } else if (preset === 'speculative') {
      setFormData({
        investment_amount: 250000,
        investor_age: 24,
        time_horizon_years: 2,
        risk_tolerance: 3,
        equity_allocation_pct: 90,
        fd_debt_allocation_pct: 10,
        emergency_fund_months: 1,
      });
    }
    setResult(null);
    setApiError('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-teal-400" />
            Investment & Fixed Deposit (FD) Risk Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Portfolio drawdown volatility prediction, capital preservation scoring, and TreeSHAP asset allocation attribution.
          </p>
        </div>

        {/* Demo Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Demo Profile:</span>
          <button
            type="button"
            onClick={() => loadPreset('conservative')}
            className="px-2.5 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-lg hover:bg-emerald-900/50"
          >
            Senior Citizen (FD)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('balanced')}
            className="px-2.5 py-1.5 text-xs font-medium text-teal-400 bg-teal-950/40 border border-teal-800/60 rounded-lg hover:bg-teal-900/50"
          >
            Balanced Growth
          </button>
          <button
            type="button"
            onClick={() => loadPreset('speculative')}
            className="px-2.5 py-1.5 text-xs font-medium text-rose-400 bg-rose-950/40 border border-rose-800/60 rounded-lg hover:bg-rose-900/50"
          >
            High Drawdown
          </button>
        </div>
      </div>

      {apiError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-200">
            <p className="font-semibold">Investment Analysis Error</p>
            <p className="mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Form Left, Output Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-5 bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-teal-400" />
              Portfolio & Investor Configuration
            </h2>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  investment_amount: 500000,
                  investor_age: 30,
                  time_horizon_years: 5,
                  risk_tolerance: 2,
                  equity_allocation_pct: 50,
                  fd_debt_allocation_pct: 50,
                  emergency_fund_months: 6,
                });
                setResult(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <form onSubmit={handleAnalyse} className="space-y-4">
            {/* Capital & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Investment Capital (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">₹</span>
                  <input
                    type="number"
                    step="25000"
                    value={formData.investment_amount}
                    onChange={(e) => handleInputChange('investment_amount', e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                {errors.investment_amount && <p className="text-[11px] text-rose-400 mt-1">{errors.investment_amount}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Investor Age (Years)
                </label>
                <input
                  type="number"
                  min="18"
                  max="95"
                  value={formData.investor_age}
                  onChange={(e) => handleInputChange('investor_age', e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
                {errors.investor_age && <p className="text-[11px] text-rose-400 mt-1">{errors.investor_age}</p>}
              </div>
            </div>

            {/* Time Horizon & Risk Tolerance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Time Horizon (Years)
                </label>
                <select
                  value={formData.time_horizon_years}
                  onChange={(e) => handleInputChange('time_horizon_years', e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value={1}>1 Year (Short-term)</option>
                  <option value={2}>2 Years</option>
                  <option value={3}>3 Years</option>
                  <option value={5}>5 Years (Medium-term)</option>
                  <option value={7}>7 Years</option>
                  <option value={10}>10+ Years (Long-term)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Risk Tolerance Profile
                </label>
                <select
                  value={formData.risk_tolerance}
                  onChange={(e) => handleInputChange('risk_tolerance', e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value={1}>Conservative (Preserve Capital)</option>
                  <option value={2}>Moderate (Balanced Growth)</option>
                  <option value={3}>Aggressive (Max Growth)</option>
                </select>
              </div>
            </div>

            {/* Asset Allocation Slider: Equity vs FD/Debt */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">Asset Allocation Split</span>
                <span className="text-[11px] text-slate-400">Total: 100%</span>
              </div>

              {/* Graphical Stacked Bar */}
              <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${formData.equity_allocation_pct}%` }}
                  className="bg-indigo-500 h-full transition-all duration-300"
                  title={`Equity: ${formData.equity_allocation_pct}%`}
                />
                <div
                  style={{ width: `${formData.fd_debt_allocation_pct}%` }}
                  className="bg-teal-500 h-full transition-all duration-300"
                  title={`FD & Debt: ${formData.fd_debt_allocation_pct}%`}
                />
              </div>

              <div className="flex justify-between text-[11px]">
                <span className="text-indigo-400 font-semibold">
                  Equity: {formData.equity_allocation_pct}% (₹{((formData.investment_amount * formData.equity_allocation_pct) / 100).toLocaleString('en-IN')})
                </span>
                <span className="text-teal-400 font-semibold">
                  FD/Debt: {formData.fd_debt_allocation_pct}% (₹{((formData.investment_amount * formData.fd_debt_allocation_pct) / 100).toLocaleString('en-IN')})
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.equity_allocation_pct}
                onChange={(e) => handleEquityChange(e.target.value)}
                className="w-full accent-teal-400 cursor-pointer"
              />

              <div className="text-[11px] text-slate-400 pt-1 flex justify-between">
                <span>Rule of 100 benchmark: Max {recommendedMaxEquity}% Equity</span>
                <span className={equityDelta > 15 ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                  {equityDelta > 0 ? `+${equityDelta}% over benchmark` : `${equityDelta}% under benchmark`}
                </span>
              </div>
            </div>

            {/* Emergency Liquidity Buffer */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Emergency Fund Buffer (Months of living expenses)
              </label>
              <select
                value={formData.emergency_fund_months}
                onChange={(e) => handleInputChange('emergency_fund_months', e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value={0}>0 Months (No safety buffer - High vulnerability)</option>
                <option value={1}>1 Month (Critical shortfall)</option>
                <option value={3}>3 Months (Minimal protection)</option>
                <option value={6}>6 Months (SEBI Recommended Standard)</option>
                <option value={12}>12 Months (Conservative liquidity buffer)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <TrendingUp className="w-4 h-4 animate-spin" />
                  Evaluating Portfolio TreeSHAP...
                </>
              ) : (
                <>
                  <PieChart className="w-4 h-4" />
                  Evaluate Investment Risk
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Results & XAI */}
        <div className="lg:col-span-7 space-y-5">
          {!result && !loading && (
            <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mx-auto">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Investment Risk Engine Ready</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Configure portfolio capital, time horizon, and the equity versus Fixed Deposit split
                to predict drawdown risk and examine TreeSHAP portfolio attribution.
              </p>
            </div>
          )}

          {result && (
            <>
              {/* Executive Assessment Card */}
              <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">Portfolio Risk & Capital Safety Assessment</h3>
                    <p className="text-[11px] text-slate-400">Random Forest Volatility Model with TreeSHAP</p>
                  </div>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 hover:bg-teal-500/25 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Report
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-[11px] text-slate-400">Capital Safety Index</p>
                    <p className="text-xl font-bold text-teal-400 mt-1">
                      {result.prediction.capital_safety_index} <span className="text-xs text-slate-500">/ 1000</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Higher score = safer</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-[11px] text-slate-400">Drawdown Volatility Probability</p>
                    <p className="text-lg font-bold text-white mt-1">
                      {(result.prediction.volatility_risk_probability * 100).toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Base rate: {(result.prediction.base_value * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-[11px] text-slate-400">Portfolio Classification</p>
                    <p className="text-xs font-bold text-slate-200 mt-1 leading-tight">
                      {result.prediction.risk_tier}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Asset-liability match</p>
                  </div>
                </div>

                {/* Plain English Synthesis */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <p className="text-xs font-semibold text-slate-300 mb-1">Portfolio Analysis Narrative</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {result.narrative}
                  </p>
                  <p className="text-[11px] text-teal-400 font-medium mt-2">
                    Action: {result.prediction.recommendation}
                  </p>
                </div>
              </div>

              {/* SHAP Feature Contribution */}
              <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">TreeSHAP Portfolio Risk Attribution</h3>
                    <p className="text-[11px] text-slate-400">
                      Exact marginal impact on volatility risk probability relative to baseline
                    </p>
                  </div>
                </div>

                <FeatureImpactBar contributions={result.contributions} />

                {/* Key Escalators and Mitigators */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <p className="text-xs font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      Volatility Escalators (Increase Drawdown)
                    </p>
                    {result.risk_increasing_factors.length === 0 ? (
                      <p className="text-[11px] text-slate-400">No adverse factors detected.</p>
                    ) : (
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {result.risk_increasing_factors.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex justify-between">
                            <span>{f.label}</span>
                            <span className="font-mono text-rose-400 font-bold">+{f.shap_value.toFixed(4)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <p className="text-xs font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Capital Anchors (Preserve Principal)
                    </p>
                    {result.risk_decreasing_factors.length === 0 ? (
                      <p className="text-[11px] text-slate-400">No stabilizing factors.</p>
                    ) : (
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {result.risk_decreasing_factors.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex justify-between">
                            <span>{f.label}</span>
                            <span className="font-mono text-emerald-400 font-bold">{f.shap_value.toFixed(4)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Academic & Indian Financial Planning Foundations (Viva Card) */}
          <div className="bg-[#0a1128] border border-slate-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowTheory(!showTheory)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-white">
                  SEBI Asset Allocation & RBI DICGC Safety Rules (Student Project Reference)
                </span>
              </div>
              {showTheory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showTheory && (
              <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  <strong>1. Fixed Deposit Sovereign Insurance:</strong> Under the Deposit Insurance and Credit Guarantee Corporation (DICGC - RBI subsidiary) guidelines, cumulative deposits including Fixed Deposits and recurring deposits in scheduled commercial banks are legally insured up to ₹5,00,000 per depositor per bank.
                </p>
                <p>
                  <strong>2. Emergency Liquidity Requirement:</strong> Financial planning principles recommend maintaining 3 to 6 months of mandatory living expenses in liquid debt funds or sweep-in FDs before taking equity exposure.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1128] border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Save className="w-4 h-4 text-teal-400" /> Save Investment Report
            </h3>
            <div>
              <label className="block text-xs text-slate-300 mb-1 font-semibold">Report Title</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1 font-semibold">Advisory Notes</label>
              <textarea
                rows={3}
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Recommended rebalancing 15% from high-beta equity into 7.5% RBI floating rate bonds..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || saveSuccess}
                onClick={handleSaveReport}
                className="px-4 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 flex items-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Saved!
                  </>
                ) : saving ? (
                  'Saving...'
                ) : (
                  'Save to Reports'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
