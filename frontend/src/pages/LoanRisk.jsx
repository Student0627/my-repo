import React, { useState } from 'react';
import {
  Calculator,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  FileText,
  Sliders,
  HelpCircle,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { loanService, reportService } from '../services/api';
import RiskGauge from '../components/RiskGauge';
import FeatureImpactBar from '../components/FeatureImpactBar';
import WaterfallChart from '../components/WaterfallChart';

export default function LoanRisk({ onNavigate, onSendToSimulator }) {
  // Input form state (Realistic Indian Rupees values)
  const [formData, setFormData] = useState({
    monthly_income: 65000,
    monthly_debt: 15000,
    loan_amount: 400000,
    loan_term_months: 36,
    credit_score: 745,
    employment_years: 4.5,
    credit_history: 2,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [result, setResult] = useState(null);

  // Collapsible XAI theory section
  const [showTheory, setShowTheory] = useState(false);

  // Save Modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('Loan Risk Assessment Report');
  const [reportNotes, setReportNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Live Financial Ratios (Indian Banking Standards)
  const liveDti = formData.monthly_income > 0
    ? (formData.monthly_debt / formData.monthly_income) * 100
    : 0;

  const liveLti = formData.monthly_income > 0
    ? (formData.loan_amount / (formData.monthly_income * 12)) * 100
    : 0;

  const handleInputChange = (field, val) => {
    const num = Number(val);
    setFormData((prev) => ({ ...prev, [field]: num }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.monthly_income || formData.monthly_income <= 0) {
      newErrors.monthly_income = 'Please enter valid monthly income in INR';
    }
    if (formData.monthly_debt < 0) {
      newErrors.monthly_debt = 'Monthly debt cannot be negative';
    }
    if (!formData.loan_amount || formData.loan_amount <= 0) {
      newErrors.loan_amount = 'Please enter requested loan amount in INR';
    }
    if (!formData.loan_term_months || formData.loan_term_months < 6 || formData.loan_term_months > 120) {
      newErrors.loan_term_months = 'Loan tenure must be between 6 and 120 months';
    }
    if (!formData.credit_score || formData.credit_score < 300 || formData.credit_score > 900) {
      newErrors.credit_score = 'CIBIL score must be between 300 and 900';
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
      const data = await loanService.predict(formData);
      setResult(data);
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Prediction failed. Check backend connection.');
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
        result: result,
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
    if (preset === 'prime') {
      setFormData({
        monthly_income: 85000,
        monthly_debt: 12000,
        loan_amount: 350000,
        loan_term_months: 36,
        credit_score: 785,
        employment_years: 6.0,
        credit_history: 3,
      });
    } else if (preset === 'stressed') {
      setFormData({
        monthly_income: 32000,
        monthly_debt: 20000,
        loan_amount: 450000,
        loan_term_months: 48,
        credit_score: 590,
        employment_years: 1.5,
        credit_history: 0,
      });
    } else {
      setFormData({
        monthly_income: 55000,
        monthly_debt: 18000,
        loan_amount: 250000,
        loan_term_months: 48,
        credit_score: 675,
        employment_years: 3.0,
        credit_history: 1,
      });
    }
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Title & Indian Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Loan & Credit Risk Predictor (Indian Banking Standards)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Random Forest Ensemble Classifier paired with exact TreeSHAP attribution
          </p>
        </div>

        {/* Demo Test Presets */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Demo Test Profiles:</span>
          <button
            onClick={() => loadPreset('prime')}
            className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30 font-medium hover:bg-teal-500/25"
          >
            Prime (Safe)
          </button>
          <button
            onClick={() => loadPreset('moderate')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium hover:bg-amber-500/25"
          >
            Moderate
          </button>
          <button
            onClick={() => loadPreset('stressed')}
            className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 font-medium hover:bg-rose-500/25"
          >
            High Risk (Stressed DTI)
          </button>
        </div>
      </div>

      {apiError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Main Grid: Form Left, Output Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-sm text-white">Step 1: Applicant Financial Data</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Currency: INR (₹)</span>
          </div>

          <form onSubmit={handleAnalyse} className="space-y-3.5 text-xs">
            {/* Monthly Income in INR */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-slate-300">Monthly Gross Income (₹)</label>
                <span className="text-teal-400 font-mono font-bold">₹{formData.monthly_income.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="number"
                min="5000"
                step="1000"
                value={formData.monthly_income}
                onChange={(e) => handleInputChange('monthly_income', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-teal-500 focus:outline-none"
              />
              {errors.monthly_income && <p className="text-[11px] text-rose-400 mt-0.5">{errors.monthly_income}</p>}
            </div>

            {/* Existing Monthly Debt in INR */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-slate-300">Existing Monthly Debt Obligations (₹)</label>
                <span className="text-slate-300 font-mono">₹{formData.monthly_debt.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="number"
                min="0"
                step="500"
                value={formData.monthly_debt}
                onChange={(e) => handleInputChange('monthly_debt', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-teal-500 focus:outline-none"
              />
              {errors.monthly_debt && <p className="text-[11px] text-rose-400 mt-0.5">{errors.monthly_debt}</p>}
            </div>

            {/* Loan Amount in INR */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-slate-300">Requested Loan Principal (₹)</label>
                <span className="text-teal-400 font-mono font-bold">₹{formData.loan_amount.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="number"
                min="10000"
                step="10000"
                value={formData.loan_amount}
                onChange={(e) => handleInputChange('loan_amount', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-teal-500 focus:outline-none"
              />
              {errors.loan_amount && <p className="text-[11px] text-rose-400 mt-0.5">{errors.loan_amount}</p>}
            </div>

            {/* Loan Term & Employment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Loan Tenure</label>
                <select
                  value={formData.loan_term_months}
                  onChange={(e) => handleInputChange('loan_term_months', e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-teal-500 focus:outline-none"
                >
                  <option value={12}>12 Months (1 yr)</option>
                  <option value={24}>24 Months (2 yrs)</option>
                  <option value={36}>36 Months (3 yrs)</option>
                  <option value={48}>48 Months (4 yrs)</option>
                  <option value={60}>60 Months (5 yrs)</option>
                  <option value={72}>72 Months (6 yrs)</option>
                  <option value={84}>84 Months (7 yrs)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Employment (Years)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.employment_years}
                  onChange={(e) => handleInputChange('employment_years', e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* CIBIL Score & Grade */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="font-semibold text-slate-300">CIBIL Score (300-900)</label>
                  <span className="text-teal-400 font-mono font-bold">{formData.credit_score}</span>
                </div>
                <input
                  type="number"
                  min="300"
                  max="900"
                  value={formData.credit_score}
                  onChange={(e) => handleInputChange('credit_score', e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-teal-500 focus:outline-none"
                />
                {errors.credit_score && <p className="text-[11px] text-rose-400 mt-0.5">{errors.credit_score}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Credit History Grade</label>
                <select
                  value={formData.credit_history}
                  onChange={(e) => handleInputChange('credit_history', e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-teal-500 focus:outline-none"
                >
                  <option value={0}>Poor (&lt; 600)</option>
                  <option value={1}>Fair (600 - 699)</option>
                  <option value={2}>Good (700 - 749)</option>
                  <option value={3}>Excellent (750+ Prime)</option>
                </select>
              </div>
            </div>

            {/* Real-time Ratios with Banking Benchmarks */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Debt-to-Income (DTI / FOIR):</span>
                  <span className="text-[10px] text-slate-400">RBI Guideline Benchmark: &le; 40%</span>
                </div>
                <span className={`font-mono font-bold text-sm ${liveDti > 43 ? 'text-rose-400' : liveDti > 35 ? 'text-amber-400' : 'text-teal-400'}`}>
                  {liveDti.toFixed(1)}% {liveDti > 43 ? '(Elevated)' : liveDti > 35 ? '(Moderate)' : '(Healthy)'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Annual Loan-to-Income (LTI):</span>
                  <span className="text-[10px] text-slate-400">Benchmark: &le; 50% Annual Earnings</span>
                </div>
                <span className="font-mono text-slate-200 font-bold text-sm">{liveLti.toFixed(1)}%</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Running Random Forest & TreeSHAP...</span>
                </>
              ) : (
                <span>Analyse Risk & Compute SHAP Explanations</span>
              )}
            </button>
          </form>
        </div>

        {/* Results & Explainability Column */}
        <div className="lg:col-span-7 space-y-5">
          {!result ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-3">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Model Ready for Inference</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                Enter borrower income and debt in INR on the left or select a demo profile above, then click <strong>Analyse Risk</strong>.
              </p>
              <button
                onClick={handleAnalyse}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-semibold"
              >
                Run Prediction With Current Values
              </button>
            </div>
          ) : (
            <>
              {/* Step 2: Risk Gauge */}
              <RiskGauge
                probability={result.prediction.default_probability}
                score={result.prediction.risk_score}
                tier={result.prediction.risk_tier}
                baseValue={result.prediction.base_value}
              />

              {/* Step 3: Decision Narrative */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <h4 className="font-bold text-sm text-white">Synthesized Decision Narrative</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  {result.narrative}
                </p>
              </div>

              {/* Step 4: Mathematical Additive Formulation (Professor Delight) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="font-bold text-xs text-white">
                    Mathematical Formulation: Additive Feature Attribution
                  </h4>
                  <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    Lloyd Shapley (1953)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-center text-teal-300">
                  f(x) = &phi;<sub>0</sub> + &sum;<sub>i=1</sub><sup>M</sup> &phi;<sub>i</sub>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px]">&phi;<sub>0</sub> (Base Population):</span>
                    <strong className="text-white font-mono text-sm">{(result.prediction.base_value * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px]">&sum; &phi;<sub>i</sub> (Net Feature Push):</span>
                    <strong className={`font-mono text-sm ${(result.prediction.default_probability - result.prediction.base_value) > 0 ? 'text-rose-400' : 'text-teal-400'}`}>
                      {((result.prediction.default_probability - result.prediction.base_value) * 100).toFixed(1)}%
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px]">f(x) (Predicted Probability):</span>
                    <strong className="text-white font-mono text-sm">{(result.prediction.default_probability * 100).toFixed(1)}%</strong>
                  </div>
                </div>
              </div>

              {/* Step 5: Indian Banking Benchmark Audit Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="font-bold text-xs text-white">
                  Banking Benchmark & Feature Audit Table
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b132b] text-[11px] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Parameter</th>
                        <th className="py-2.5 px-3 font-semibold">Borrower Value</th>
                        <th className="py-2.5 px-3 font-semibold">Standard Benchmark</th>
                        <th className="py-2.5 px-3 font-semibold">SHAP Impact (&phi;)</th>
                        <th className="py-2.5 px-3 font-semibold">Risk Effect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {result.contributions.map((c, idx) => {
                        const isRisk = c.shap_value > 0;
                        let benchmark = 'Standard';
                        if (c.feature === 'credit_score') benchmark = '750+ Prime (CIBIL)';
                        else if (c.feature === 'debt_to_income_ratio') benchmark = '≤ 40% (RBI FOIR)';
                        else if (c.feature === 'monthly_income') benchmark = '> ₹25,000 (Min salary)';
                        else if (c.feature === 'loan_to_income_ratio') benchmark = '≤ 50% Annual Income';
                        else if (c.feature === 'employment_years') benchmark = '≥ 2.0 Years stable';

                        return (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="py-2 px-3 font-medium text-slate-200">{c.label}</td>
                            <td className="py-2 px-3 font-mono text-slate-300">
                              {c.feature.includes('ratio')
                                ? `${(c.feature_value * 100).toFixed(1)}%`
                                : c.feature.includes('amount') || c.feature.includes('income') || c.feature.includes('debt')
                                ? `₹${Number(c.feature_value).toLocaleString('en-IN')}`
                                : c.feature_value}
                            </td>
                            <td className="py-2 px-3 text-slate-400 text-[11px]">{benchmark}</td>
                            <td className={`py-2 px-3 font-mono font-bold ${isRisk ? 'text-rose-400' : 'text-teal-400'}`}>
                              {c.shap_value > 0 ? `+${c.shap_value.toFixed(3)}` : c.shap_value.toFixed(3)}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`text-[11px] font-semibold ${isRisk ? 'text-rose-400' : 'text-teal-400'}`}>
                                {isRisk ? 'Escalates Risk (+)' : 'Mitigates Risk (-)'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 6: Visual Charts */}
              <FeatureImpactBar contributions={result.contributions} />
              <WaterfallChart
                baseValue={result.prediction.base_value}
                finalValue={result.prediction.default_probability}
                contributions={result.contributions}
              />

              {/* Theoretical Collapsible Note for Academic Viva */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTheory((prev) => !prev)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                    <span className="font-bold text-xs text-white">
                      Theoretical Explainability: Why TreeSHAP instead of LIME or Gini Importance?
                    </span>
                  </div>
                  {showTheory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showTheory && (
                  <div className="p-4 pt-0 border-t border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed bg-slate-950/40">
                    <p>
                      <strong>1. Exact vs Approximated:</strong> LIME fits a local surrogate model which can vary with random perturbations. TreeSHAP provides <em>exact polynomial-time calculations</em> across all decision paths in the Random Forest.
                    </p>
                    <p>
                      <strong>2. Mathematical Axioms:</strong> TreeSHAP satisfies the 4 foundational axioms of game theory: <em>Efficiency</em> (sum of SHAP equals difference from base), <em>Symmetry</em> (equal contributors get equal credit), <em>Dummy</em> (non-impact features get zero), and <em>Additivity</em>.
                    </p>
                    <p>
                      <strong>3. Local vs Global:</strong> Gini impurity gives only a single global score for the whole dataset. SHAP provides <em>local attribution</em> tailored to this specific applicant.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Report to Database</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onSendToSimulator) onSendToSimulator(formData);
                      onNavigate('simulator');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-teal-400" />
                    <span>Test in What-If Simulator</span>
                  </button>
                </div>

                <button
                  onClick={() => setResult(null)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Result</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">Save Analysis Report</h3>
            <p className="text-xs text-slate-400 mb-4">
              Persist this risk evaluation into MongoDB for audit history and PDF export.
            </p>

            {saveSuccess ? (
              <div className="py-6 text-center text-teal-400 space-y-2">
                <CheckCircle className="w-8 h-8 mx-auto" />
                <p className="font-bold text-sm">Report Saved Successfully!</p>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Report Title</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    placeholder="e.g. Borrower verified, satisfactory CIBIL rating..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveReport}
                    disabled={saving}
                    className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
                  >
                    {saving ? 'Saving...' : 'Save Report'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
