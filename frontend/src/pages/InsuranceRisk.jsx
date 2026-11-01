import React, { useState } from 'react';
import {
  HeartPulse,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  FileText,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Activity,
  ShieldAlert,
  Upload,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info
} from 'lucide-react';
import { insuranceService, reportService } from '../services/api';
import FeatureImpactBar from '../components/FeatureImpactBar';

export default function InsuranceRisk({ onNavigate }) {
  // Navigation Tabs: 'underwriting' | 'scanner'
  const [activeTab, setActiveTab] = useState('underwriting');

  // -------------------------------------------------------------
  // TAB 1: UNDERWRITING APPLICANT ML STATE
  // -------------------------------------------------------------
  const [formData, setFormData] = useState({
    age: 34,
    annual_income: 1200000,
    coverage_amount: 10000000,
    bmi: 24.5,
    smoker_status: 0,
    pre_existing_conditions: 0,
    family_medical_history: 0,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [result, setResult] = useState(null);
  const [showTheory, setShowTheory] = useState(false);

  // Underwriting Save Modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('Insurance Underwriting Risk Assessment');
  const [reportNotes, setReportNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // -------------------------------------------------------------
  // TAB 2: POLICY DOCUMENT & CLAUSE SCANNER STATE (PDF ANALYZER)
  // -------------------------------------------------------------
  const [policyFile, setPolicyFile] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('hdfc');
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState('');
  const [policyResult, setPolicyResult] = useState(null);
  const [policySaveModal, setPolicySaveModal] = useState(false);

  // Live Underwriting Ratios
  const coverageMultiplier = formData.annual_income > 0
    ? (formData.coverage_amount / formData.annual_income).toFixed(1)
    : 0;

  const getBmiCategory = (bmi) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-400' };
    if (bmi < 25) return { label: 'Normal / Healthy', color: 'text-emerald-400' };
    if (bmi < 30) return { label: 'Overweight (Borderline)', color: 'text-amber-400' };
    return { label: 'Obese (High Morbidity)', color: 'text-rose-400' };
  };

  const bmiCat = getBmiCategory(formData.bmi);

  const handleInputChange = (field, val) => {
    const num = Number(val);
    setFormData((prev) => ({ ...prev, [field]: num }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.age || formData.age < 18 || formData.age > 85) {
      newErrors.age = 'Applicant age must be between 18 and 85 years';
    }
    if (!formData.annual_income || formData.annual_income <= 0) {
      newErrors.annual_income = 'Please enter valid annual income in INR';
    }
    if (!formData.coverage_amount || formData.coverage_amount <= 0) {
      newErrors.coverage_amount = 'Please enter requested sum assured in INR';
    }
    if (!formData.bmi || formData.bmi < 12 || formData.bmi > 55) {
      newErrors.bmi = 'BMI must be between 12.0 and 55.0';
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
      const data = await insuranceService.predict(formData);
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
            risk_score: Math.round((1.0 - result.prediction.claim_risk_probability) * 1000),
            default_probability: result.prediction.claim_risk_probability,
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
    if (preset === 'preferred') {
      setFormData({
        age: 28,
        annual_income: 1500000,
        coverage_amount: 15000000,
        bmi: 22.5,
        smoker_status: 0,
        pre_existing_conditions: 0,
        family_medical_history: 0,
      });
    } else if (preset === 'borderline') {
      setFormData({
        age: 44,
        annual_income: 1200000,
        coverage_amount: 10000000,
        bmi: 28.4,
        smoker_status: 0,
        pre_existing_conditions: 1,
        family_medical_history: 0,
      });
    } else if (preset === 'high') {
      setFormData({
        age: 54,
        annual_income: 900000,
        coverage_amount: 8000000,
        bmi: 32.5,
        smoker_status: 1,
        pre_existing_conditions: 2,
        family_medical_history: 1,
      });
    }
    setResult(null);
    setApiError('');
  };

  // -------------------------------------------------------------
  // POLICY SCANNER HANDLERS
  // -------------------------------------------------------------
  const handlePolicyScan = async (e) => {
    if (e) e.preventDefault();
    try {
      setPolicyLoading(true);
      setPolicyError('');
      const fd = new FormData();

      if (policyFile) {
        fd.append('file', policyFile);
      } else {
        fd.append('preset', selectedPreset);
      }

      const res = await insuranceService.analyzePolicy(fd);
      setPolicyResult(res);
    } catch (err) {
      setPolicyError(err.response?.data?.detail || 'Failed to parse policy document PDF.');
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleSavePolicyReport = async () => {
    if (!policyResult) return;
    try {
      setSaving(true);
      await reportService.create({
        title: `${policyResult.company_name} - Policy Document Audit`,
        notes: `Policy Health Score: ${policyResult.policy_health_score}/10. ${policyResult.verdict_summary}`,
        inputs: {
          company_name: policyResult.company_name,
          plan_name: policyResult.plan_name,
          pages_scanned: policyResult.pages_scanned,
        },
        result: {
          prediction: {
            risk_tier: policyResult.is_good_to_buy ? 'Recommended' : 'Caution',
            risk_score: Math.round(policyResult.policy_health_score * 100),
            default_probability: 1.0 - (policyResult.policy_health_score / 10),
          },
          narrative: policyResult.verdict_summary,
          contributions: [],
        },
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setPolicySaveModal(false);
      }, 1400);
    } catch (e) {
      alert('Error saving policy audit: ' + (e.response?.data?.detail || e.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-teal-400" />
            Insurance Intelligence & Policy Document Scanner
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Two integrated tools: Applicant Morbidity Prediction (TreeSHAP) and PDF Policy Document Fine-Print Clause Extraction.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('underwriting')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'underwriting'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Applicant Underwriting (TreeSHAP)
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'scanner'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Policy PDF Clause Scanner
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: APPLICANT UNDERWRITING & CLAIM RISK (ML + TreeSHAP)          */}
      {/* =================================================================== */}
      {activeTab === 'underwriting' && (
        <div className="space-y-6">
          {/* Preset bar for underwriting */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Quick Demo Presets:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadPreset('preferred')}
                className="px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-lg hover:bg-emerald-900/50"
              >
                Standard Life
              </button>
              <button
                type="button"
                onClick={() => loadPreset('borderline')}
                className="px-2.5 py-1 text-xs font-medium text-amber-400 bg-amber-950/40 border border-amber-800/60 rounded-lg hover:bg-amber-900/50"
              >
                Mild Loading
              </button>
              <button
                type="button"
                onClick={() => loadPreset('high')}
                className="px-2.5 py-1 text-xs font-medium text-rose-400 bg-rose-950/40 border border-rose-800/60 rounded-lg hover:bg-rose-900/50"
              >
                High Claim Risk
              </button>
            </div>
          </div>

          {apiError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200">
                <p className="font-semibold">Underwriting Analysis Error</p>
                <p className="mt-0.5">{apiError}</p>
              </div>
            </div>
          )}

          {/* Form + Output Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form */}
            <div className="lg:col-span-5 bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  Applicant Medical & Financial Profile
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      age: 30,
                      annual_income: 1000000,
                      coverage_amount: 10000000,
                      bmi: 24.0,
                      smoker_status: 0,
                      pre_existing_conditions: 0,
                      family_medical_history: 0,
                    });
                    setResult(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>

              <form onSubmit={handleAnalyse} className="space-y-4">
                {/* Age & Income */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Applicant Age (Years)
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="85"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                    {errors.age && <p className="text-[11px] text-rose-400 mt-1">{errors.age}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Annual Income (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">₹</span>
                      <input
                        type="number"
                        step="10000"
                        value={formData.annual_income}
                        onChange={(e) => handleInputChange('annual_income', e.target.value)}
                        className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    {errors.annual_income && <p className="text-[11px] text-rose-400 mt-1">{errors.annual_income}</p>}
                  </div>
                </div>

                {/* Sum Assured */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Requested Sum Assured / Coverage (₹)
                    </label>
                    <span className="text-[11px] text-teal-400 font-medium">
                      {coverageMultiplier}x Annual Income
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">₹</span>
                    <input
                      type="number"
                      step="100000"
                      value={formData.coverage_amount}
                      onChange={(e) => handleInputChange('coverage_amount', e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  {errors.coverage_amount && <p className="text-[11px] text-rose-400 mt-1">{errors.coverage_amount}</p>}
                </div>

                {/* BMI & Smoker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-300">Body Mass Index (BMI)</label>
                      <span className={`text-[10px] font-medium ${bmiCat.color}`}>{bmiCat.label}</span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="14"
                      max="50"
                      value={formData.bmi}
                      onChange={(e) => handleInputChange('bmi', e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                    {errors.bmi && <p className="text-[11px] text-rose-400 mt-1">{errors.bmi}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tobacco / Smoking Status
                    </label>
                    <select
                      value={formData.smoker_status}
                      onChange={(e) => handleInputChange('smoker_status', e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value={0}>Non-Smoker (Clean)</option>
                      <option value={1}>Smoker / Tobacco User</option>
                    </select>
                  </div>
                </div>

                {/* Pre-existing Conditions */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pre-Existing Medical Conditions
                  </label>
                  <select
                    value={formData.pre_existing_conditions}
                    onChange={(e) => handleInputChange('pre_existing_conditions', e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value={0}>None (No diagnosed chronic ailments)</option>
                    <option value={1}>Mild / Stage 1 Hypertension</option>
                    <option value={2}>Type-2 Diabetes / Chronic Condition</option>
                    <option value={3}>Critical / Cardiovascular History</option>
                  </select>
                </div>

                {/* Family Medical History */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Critical Family Medical History
                  </label>
                  <select
                    value={formData.family_medical_history}
                    onChange={(e) => handleInputChange('family_medical_history', e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value={0}>No hereditary cardiovascular/cancer history</option>
                    <option value={1}>Direct family history (Cardiac / Diabetes / Cancer)</option>
                  </select>
                </div>

                {/* Live Benchmark Card */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Coverage Multiple:</span>
                    <span className="font-semibold text-white">{coverageMultiplier}x</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>IRDAI Recommended Guideline:</span>
                    <span className="text-slate-400 font-mono">10x - 20x Annual Income</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Underwriting Trigger:</span>
                    <span className={formData.coverage_amount > 10000000 ? 'text-amber-400 font-medium' : 'text-emerald-400'}>
                      {formData.coverage_amount > 10000000 ? 'Medical Checkup (MER) Mandatory' : 'Tele-Underwriting Eligible'}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" />
                      Running Underwriting TreeSHAP...
                    </>
                  ) : (
                    <>
                      <HeartPulse className="w-4 h-4" />
                      Analyse Insurance Risk
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Output / Explanation */}
            <div className="lg:col-span-7 space-y-5">
              {!result && !loading && (
                <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mx-auto">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Underwriting Analysis Ready</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Fill in the applicant's medical and coverage parameters on the left and click
                    "Analyse Insurance Risk" to compute claim probability, premium loading, and TreeSHAP attribution.
                  </p>
                </div>
              )}

              {result && (
                <>
                  {/* Executive Assessment Card */}
                  <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-white">Underwriting Decision Summary</h3>
                        <p className="text-[11px] text-slate-400">Random Forest Actuarial Model with TreeSHAP</p>
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
                        <p className="text-[11px] text-slate-400">Claim Risk Probability</p>
                        <p className="text-lg font-bold text-white mt-1">
                          {(result.prediction.claim_risk_probability * 100).toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Base rate: {(result.prediction.base_value * 100).toFixed(1)}%
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <p className="text-[11px] text-slate-400">Underwriting Category</p>
                        <p className="text-sm font-bold text-teal-300 mt-1">
                          {result.prediction.risk_tier}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Actuarial tier</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <p className="text-[11px] text-slate-400">Premium Loading</p>
                        <p className="text-xs font-bold text-amber-400 mt-1">
                          {result.prediction.premium_loading}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Pricing recommendation</p>
                      </div>
                    </div>

                    {/* Plain English Synthesis */}
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <p className="text-xs font-semibold text-slate-300 mb-1">Underwriter Clinical Synthesis</p>
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
                        <h3 className="text-sm font-bold text-white">TreeSHAP Feature Attribution</h3>
                        <p className="text-[11px] text-slate-400">
                          Exact marginal impact on claim risk probability relative to baseline
                        </p>
                      </div>
                    </div>

                    <FeatureImpactBar contributions={result.contributions} />

                    {/* Key Escalators and Mitigators */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                        <p className="text-xs font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          Risk Escalators (Increases Loading)
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
                          Risk Mitigators (Standard Premium)
                        </p>
                        {result.risk_decreasing_factors.length === 0 ? (
                          <p className="text-[11px] text-slate-400">No mitigating factors.</p>
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

              {/* Academic & Actuarial Foundations (Viva Card) */}
              <div className="bg-[#0a1128] border border-slate-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowTheory(!showTheory)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-white">
                      Mathematical & IRDAI Underwriting Foundations (Student Project Reference)
                    </span>
                  </div>
                  {showTheory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showTheory && (
                  <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3 text-xs text-slate-300 leading-relaxed">
                    <p>
                      <strong>1. TreeSHAP Additive Feature Attribution:</strong> In health underwriting, TreeSHAP computes Shapley values from cooperative game theory across all possible feature subsets:
                    </p>
                    <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-[11px] text-teal-300 border border-slate-800 overflow-x-auto">
                      {'\\phi_i = \\sum_{S \\subseteq F \\setminus {i}} [|S|!(|F| - |S| - 1)! / |F|!] [f(S \\cup {i}) - f(S)]'}
                    </div>
                    <p>
                      <strong>2. Indian Life Insurance Benchmarks:</strong>
                      Under IRDAI (Insurance Regulatory and Development Authority of India) guidelines, sum assured exceeding 20x annual income or applicants with BMI {'>'} 30 and tobacco use trigger mandatory Tele-Medical Examination Reports (Tele-MER) and clinical review.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: POLICY DOCUMENT & CLAUSE SCANNER (PDF UPLOAD & REDIRECTION)  */}
      {/* =================================================================== */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          {/* Top Explanatory Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
            <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-white">How This Policy Clause Scanner Works (Student Implementation):</p>
              <p className="mt-1">
                Upload any official Insurance Policy Wordings or Prospectus PDF. The Python backend extracts the text using <span className="text-teal-300 font-mono">PyPDF</span> and scans for critical hidden fine-print clauses (Room Rent sub-limits, PED waiting periods, and mandatory co-pays). It outputs a <strong>Consumer Health Score</strong> and a direct verified link to the official company portal if you decide to purchase.
              </p>
            </div>
          </div>

          {policyError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200">
                <p className="font-semibold">Scanner Error</p>
                <p className="mt-0.5">{policyError}</p>
              </div>
            </div>
          )}

          {/* Upload and Configuration Form */}
          <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal-400" />
              Upload Insurance Policy PDF Document
            </h2>

            <form onSubmit={handlePolicyScan} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* File Dropzone */}
                <div className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-xl p-5 text-center transition-colors bg-slate-900/60">
                  <Upload className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                  <label htmlFor="policy-upload" className="cursor-pointer">
                    <span className="text-xs font-semibold text-teal-300 hover:underline">
                      Click to choose any Policy PDF
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">or drag and drop document here (.pdf format)</span>
                    <input
                      id="policy-upload"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPolicyFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {policyFile ? (
                    <div className="mt-3 p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 font-medium">
                      Selected: {policyFile.name} ({(policyFile.size / 1024).toFixed(1)} KB)
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-2">No file chosen yet (you can also select a popular preset below)</p>
                  )}
                </div>

                {/* Popular Policy Presets for viva demonstration */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Or Select Pre-Loaded Popular Indian Policy:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'hdfc', name: 'HDFC ERGO Optima Secure', type: 'Health / Zero Room Cap' },
                      { id: 'star', name: 'Star Health Comprehensive', type: 'Health / 3-Yr Waiting' },
                      { id: 'care', name: 'Care Supreme Health', type: 'Health / Unlimited Recharge' },
                      { id: 'maxlife', name: 'Max Life Smart Secure Plus', type: 'Term Life / 99.5% CSR' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(item.id);
                          setPolicyFile(null);
                        }}
                        className={`p-2.5 rounded-xl text-left border transition-all ${
                          selectedPreset === item.id && !policyFile
                            ? 'bg-teal-500/15 border-teal-500 text-teal-200'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <p className="text-xs font-semibold truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.type}</p>
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400 pt-1">
                    Preset mode tests real clause patterns if you don't have a downloaded 50-page PDF ready during your presentation.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={policyLoading}
                  className="py-2.5 px-6 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {policyLoading ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" />
                      Parsing PDF & Extracting Clauses...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Scan Policy Document & Clauses
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Results: Clauses, Verdict & Official Redirection */}
          {policyResult && (
            <div className="space-y-6">
              {/* Verdict Header & Purchase Link Card */}
              <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/60">
                      {policyResult.policy_type}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-1.5">
                      {policyResult.company_name} — {policyResult.plan_name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Analyzed {policyResult.pages_scanned} pages of policy wordings via PyPDF clause tokenizer
                    </p>
                  </div>

                  {/* Policy Health Score */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-right">
                    <span className="text-[11px] text-slate-400 block">Policy Health Score</span>
                    <span className="text-2xl font-bold font-mono text-teal-400">
                      {policyResult.policy_health_score} <span className="text-xs text-slate-500">/ 10</span>
                    </span>
                  </div>
                </div>

                {/* Verdict & Purchase Action */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Purchase Recommendation:</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        policyResult.is_good_to_buy
                          ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-400'
                          : 'bg-amber-950/60 border border-amber-800 text-amber-400'
                      }`}>
                        {policyResult.is_good_to_buy ? 'Good to Buy (Recommended)' : 'Review Sub-limits Carefully'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {policyResult.verdict_summary}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Official IRDAI Claim Settlement Ratio (CSR): <strong className="text-white">{policyResult.irdai_claim_settlement_ratio}</strong> &nbsp;|&nbsp; Incurred Claims Ratio: <strong className="text-white">{policyResult.incurred_claims_ratio}</strong>
                    </p>
                  </div>

                  {/* Redirection Link Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <a
                      href={policyResult.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
                    >
                      <span>Visit Official Policy Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setPolicySaveModal(true)}
                      className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5 text-teal-400" />
                      <span>Save Audit</span>
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500">
                  * Note: Clicking "Visit Official Policy Portal" redirects you directly to {policyResult.company_name}'s official portal. Always cross-verify pricing and disclosures before finalizing payment.
                </p>
              </div>

              {/* Exact Clauses & Lines to Keep in Mind */}
              <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-400" />
                    Exact Clauses & Lines You Should Keep in Mind
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Extracted verbatim from policy wording with plain-English explanation for hospital claims
                  </p>
                </div>

                <div className="space-y-4">
                  {policyResult.clauses_to_remember.map((clause, idx) => {
                    const isFavorable = clause.severity === 'favorable';
                    const isWarning = clause.severity === 'warning';
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border space-y-2.5 ${
                          isFavorable
                            ? 'bg-slate-900/60 border-slate-800'
                            : isWarning
                            ? 'bg-amber-950/10 border-amber-900/40'
                            : 'bg-rose-950/10 border-rose-900/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white">
                            {idx + 1}. {clause.category}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded w-fit ${
                            isFavorable
                              ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-400'
                              : isWarning
                              ? 'bg-amber-950/70 border border-amber-800 text-amber-400'
                              : 'bg-rose-950/70 border border-rose-800 text-rose-400'
                          }`}>
                            {clause.exact_clause_title}
                          </span>
                        </div>

                        {/* Verbatim quote block from the PDF */}
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed">
                          <span className="text-teal-400 font-bold block mb-1">
                            Exact Policy Line / Clause:
                          </span>
                          "{clause.highlighted_quote}"
                        </div>

                        {/* Plain English Takeaway */}
                        <div className="flex items-start gap-2 pt-1 text-xs text-slate-300">
                          {isFavorable ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <strong className="text-white">What you must keep in mind: </strong>
                            <span>{clause.plain_english_takeaway}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pros vs Hidden Gotchas Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pros */}
                <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Verified Consumer Strengths
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {policyResult.pros.map((p, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gotchas */}
                <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Hidden Fine-Print Conditions & Gotchas
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {policyResult.gotchas_and_fine_print.map((g, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Modal for Underwriting */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1128] border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Save className="w-4 h-4 text-teal-400" /> Save Underwriting Report
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
              <label className="block text-xs text-slate-300 mb-1 font-semibold">Underwriting Notes</label>
              <textarea
                rows={3}
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Applicant has mild hypertension; recommended standard tele-MER..."
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

      {/* Save Modal for Policy Document Audit */}
      {policySaveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1128] border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Save className="w-4 h-4 text-teal-400" /> Save Policy Document Audit
            </h3>
            <p className="text-xs text-slate-300">
              Save the clause extraction results for <strong className="text-white">{policyResult?.company_name}</strong> to your reports archive.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPolicySaveModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || saveSuccess}
                onClick={handleSavePolicyReport}
                className="px-4 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 flex items-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Saved!
                  </>
                ) : saving ? (
                  'Saving...'
                ) : (
                  'Confirm Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
