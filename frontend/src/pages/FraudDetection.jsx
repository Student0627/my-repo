import React, { useState } from 'react';
import {
  ShieldAlert,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Zap,
  Globe,
  Clock,
  ShieldCheck,
  ShieldX
} from 'lucide-react';
import { fraudService, reportService } from '../services/api';
import FeatureImpactBar from '../components/FeatureImpactBar';

export default function FraudDetection({ onNavigate }) {
  const [formData, setFormData] = useState({
    transaction_amount: 3500,
    account_avg_transaction: 1500,
    transaction_hour: 14,
    merchant_category: 0,
    transaction_velocity_1h: 1,
    is_foreign_transaction: 0,
    device_fingerprint_match: 0,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [result, setResult] = useState(null);
  const [showTheory, setShowTheory] = useState(false);

  // Save Modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('Transaction Fraud Assessment');
  const [reportNotes, setReportNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Live Surge Metric
  const surgeRatio = formData.account_avg_transaction > 0
    ? (formData.transaction_amount / formData.account_avg_transaction).toFixed(1)
    : 1.0;

  const handleInputChange = (field, val) => {
    const num = Number(val);
    setFormData((prev) => ({ ...prev, [field]: num }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.transaction_amount || formData.transaction_amount <= 0) {
      newErrors.transaction_amount = 'Please enter valid transaction amount in INR';
    }
    if (!formData.account_avg_transaction || formData.account_avg_transaction <= 0) {
      newErrors.account_avg_transaction = 'Please enter valid historical average amount in INR';
    }
    if (formData.transaction_hour < 0 || formData.transaction_hour > 23) {
      newErrors.transaction_hour = 'Hour must be between 0 and 23';
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
      const data = await fraudService.predict(formData);
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
            risk_tier: result.prediction.threat_level,
            risk_score: Math.round((1.0 - result.prediction.fraud_probability) * 1000),
            default_probability: result.prediction.fraud_probability,
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
    if (preset === 'legitimate') {
      setFormData({
        transaction_amount: 850,
        account_avg_transaction: 1200,
        transaction_hour: 15,
        merchant_category: 0,
        transaction_velocity_1h: 1,
        is_foreign_transaction: 0,
        device_fingerprint_match: 0,
      });
    } else if (preset === 'suspicious') {
      setFormData({
        transaction_amount: 28000,
        account_avg_transaction: 3000,
        transaction_hour: 22,
        merchant_category: 2,
        transaction_velocity_1h: 4,
        is_foreign_transaction: 0,
        device_fingerprint_match: 1,
      });
    } else if (preset === 'critical') {
      setFormData({
        transaction_amount: 95000,
        account_avg_transaction: 1500,
        transaction_hour: 3,
        merchant_category: 3,
        transaction_velocity_1h: 7,
        is_foreign_transaction: 1,
        device_fingerprint_match: 1,
      });
    }
    setResult(null);
    setApiError('');
  };

  const getActionBadge = (action) => {
    if (action === 'APPROVE') {
      return {
        bg: 'bg-emerald-950/60 border-emerald-800 text-emerald-400',
        icon: ShieldCheck,
      };
    }
    if (action === 'STEP-UP 2FA') {
      return {
        bg: 'bg-amber-950/60 border-amber-800 text-amber-400',
        icon: ShieldAlert,
      };
    }
    return {
      bg: 'bg-rose-950/60 border-rose-800 text-rose-400',
      icon: ShieldX,
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-teal-400" />
            Real-Time Transaction Fraud Detection
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time anomaly scoring, velocity surge analysis, and TreeSHAP attribution for digital payments.
          </p>
        </div>

        {/* Demo Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Demo Case:</span>
          <button
            type="button"
            onClick={() => loadPreset('legitimate')}
            className="px-2.5 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-lg hover:bg-emerald-900/50"
          >
            Normal UPI
          </button>
          <button
            type="button"
            onClick={() => loadPreset('suspicious')}
            className="px-2.5 py-1.5 text-xs font-medium text-amber-400 bg-amber-950/40 border border-amber-800/60 rounded-lg hover:bg-amber-900/50"
          >
            Velocity Spike
          </button>
          <button
            type="button"
            onClick={() => loadPreset('critical')}
            className="px-2.5 py-1.5 text-xs font-medium text-rose-400 bg-rose-950/40 border border-rose-800/60 rounded-lg hover:bg-rose-900/50"
          >
            Midnight Surge
          </button>
        </div>
      </div>

      {apiError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-200">
            <p className="font-semibold">Fraud Detection Error</p>
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
              <Zap className="w-4 h-4 text-teal-400" />
              Transaction Metadata & Telemetry
            </h2>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  transaction_amount: 1500,
                  account_avg_transaction: 1500,
                  transaction_hour: 12,
                  merchant_category: 0,
                  transaction_velocity_1h: 1,
                  is_foreign_transaction: 0,
                  device_fingerprint_match: 0,
                });
                setResult(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <form onSubmit={handleAnalyse} className="space-y-4">
            {/* Amount & Account Average */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Transaction Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">₹</span>
                  <input
                    type="number"
                    step="100"
                    value={formData.transaction_amount}
                    onChange={(e) => handleInputChange('transaction_amount', e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                {errors.transaction_amount && <p className="text-[11px] text-rose-400 mt-1">{errors.transaction_amount}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Historical Avg Ticket (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">₹</span>
                  <input
                    type="number"
                    step="100"
                    value={formData.account_avg_transaction}
                    onChange={(e) => handleInputChange('account_avg_transaction', e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                {errors.account_avg_transaction && <p className="text-[11px] text-rose-400 mt-1">{errors.account_avg_transaction}</p>}
              </div>
            </div>

            {/* Time & Velocity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Transaction Hour (0-23)
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.transaction_hour}
                    onChange={(e) => handleInputChange('transaction_hour', e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                {errors.transaction_hour && <p className="text-[11px] text-rose-400 mt-1">{errors.transaction_hour}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Velocity (Last 60 Mins)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.transaction_velocity_1h}
                  onChange={(e) => handleInputChange('transaction_velocity_1h', e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Merchant Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Merchant Industry Category
              </label>
              <select
                value={formData.merchant_category}
                onChange={(e) => handleInputChange('merchant_category', e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value={0}>Groceries & General Retail (Low Risk)</option>
                <option value={1}>Utilities, Telecom & Bill Payments</option>
                <option value={2}>High-End Electronics & Luxury Goods</option>
                <option value={3}>Crypto Exchanges, Forex & Gambling Gateway</option>
              </select>
            </div>

            {/* Routing & Device Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Gateway Routing
                </label>
                <select
                  value={formData.is_foreign_transaction}
                  onChange={(e) => handleInputChange('is_foreign_transaction', e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value={0}>Domestic (India IP)</option>
                  <option value={1}>Cross-Border / Foreign Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Device Fingerprint
                </label>
                <select
                  value={formData.device_fingerprint_match}
                  onChange={(e) => handleInputChange('device_fingerprint_match', e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value={0}>Recognized Trusted Device</option>
                  <option value={1}>Unknown Device / Proxy Detected</option>
                </select>
              </div>
            </div>

            {/* Live Anomaly Surge Metric */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Transaction Surge Factor:</span>
                <span className={surgeRatio > 5.0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {surgeRatio}x historical average
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Anomaly Sensitivity Threshold:</span>
                <span className="text-slate-400 font-mono">Surge {'>'} 4.0x triggers Step-Up</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Zap className="w-4 h-4 animate-spin" />
                  Running Fraud TreeSHAP...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  Inspect Transaction Risk
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
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Fraud Detection Engine Ready</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Submit transaction amount, average ticket, velocity, and device indicators to compute
                real-time fraud probability and examine TreeSHAP anomaly attribution.
              </p>
            </div>
          )}

          {result && (
            <>
              {/* Executive Assessment Card */}
              <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">Real-Time Risk Decision</h3>
                    <p className="text-[11px] text-slate-400">Random Forest Classifier with TreeSHAP</p>
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
                    <p className="text-[11px] text-slate-400">Fraud Probability</p>
                    <p className="text-lg font-bold text-white mt-1">
                      {(result.prediction.fraud_probability * 100).toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Base rate: {(result.prediction.base_value * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-[11px] text-slate-400">Automated Action</p>
                    <p className={`text-sm font-bold mt-1 ${
                      result.prediction.action === 'APPROVE' ? 'text-emerald-400' :
                      result.prediction.action === 'STEP-UP 2FA' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {result.prediction.action}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{result.prediction.threat_level}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-[11px] text-slate-400">Surge Factor</p>
                    <p className="text-lg font-bold text-white mt-1">
                      {result.surge_ratio}x
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">vs. Historical Avg</p>
                  </div>
                </div>

                {/* Plain English Synthesis */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <p className="text-xs font-semibold text-slate-300 mb-1">Fraud Detection Narrative</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {result.narrative}
                  </p>
                  <p className="text-[11px] text-teal-400 font-medium mt-2">
                    Action Policy: {result.prediction.action_desc}
                  </p>
                </div>
              </div>

              {/* SHAP Feature Contribution */}
              <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">TreeSHAP Anomaly Attribution</h3>
                    <p className="text-[11px] text-slate-400">
                      Exact marginal impact on transaction fraud probability relative to baseline
                    </p>
                  </div>
                </div>

                <FeatureImpactBar contributions={result.contributions} />

                {/* Key Escalators and Mitigators */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <p className="text-xs font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      Suspicious Anomaly Triggers
                    </p>
                    {result.risk_increasing_factors.length === 0 ? (
                      <p className="text-[11px] text-slate-400">No anomaly triggers detected.</p>
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
                      Legitimacy Anchors
                    </p>
                    {result.risk_decreasing_factors.length === 0 ? (
                      <p className="text-[11px] text-slate-400">No mitigating anchors.</p>
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

          {/* Academic & Payment Security Foundations (Viva Card) */}
          <div className="bg-[#0a1128] border border-slate-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowTheory(!showTheory)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-white">
                  RBI Cyber Security Framework & Additional Factor (AFA) Standards
                </span>
              </div>
              {showTheory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showTheory && (
              <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  <strong>1. RBI Mandatory Additional Factor of Authentication (AFA):</strong> Reserve Bank of India directions mandate multi-factor authentication for digital payments. When an automated machine learning model identifies surge ratios {'>'} 4x or unrecognized devices, transaction settlement must be challenged via step-up 2FA (OTP/Biometric) rather than silent processing.
                </p>
                <p>
                  <strong>2. Velocity Throttling:</strong> Unusually high transaction frequencies within 60 minutes indicate potential credential stuffing or card testing attacks, demanding instant algorithmic throttling.
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
              <Save className="w-4 h-4 text-teal-400" /> Save Fraud Detection Report
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
              <label className="block text-xs text-slate-300 mb-1 font-semibold">Security Analyst Notes</label>
              <textarea
                rows={3}
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="High velocity cross-border surge; triggered step-up OTP challenge..."
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
