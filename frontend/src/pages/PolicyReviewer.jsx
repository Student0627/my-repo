import React, { useState } from 'react';
import {
  FileText,
  Upload,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Info,
  BookOpen,
  Save,
  ArrowRight
} from 'lucide-react';
import { insuranceService, reportService } from '../services/api';

export default function PolicyReviewer({ onNavigate }) {
  // Input mode: 'upload' | 'preset' | 'paste'
  const [inputMode, setInputMode] = useState('upload');
  const [policyFile, setPolicyFile] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('hdfc');
  const [pastedText, setPastedText] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Save Modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const samplePresets = [
    {
      id: 'hdfc',
      name: 'HDFC ERGO Optima Secure',
      type: 'Health Mediclaim',
      highlight: 'Zero Room Rent Capping • 24 Mo PED • Nil Co-pay',
      officialSite: 'https://www.hdfcergo.com/health-insurance'
    },
    {
      id: 'star',
      name: 'Star Health Comprehensive',
      type: 'Health Mediclaim',
      highlight: '1% Room Rent Cap • 36 Mo PED • 10% Senior Co-pay',
      officialSite: 'https://www.starhealth.in/'
    },
    {
      id: 'care',
      name: 'Care Supreme Health',
      type: 'Health Mediclaim',
      highlight: 'Single Private Room • 36 Mo PED • Unlimited Recharge',
      officialSite: 'https://www.careinsurance.com/'
    },
    {
      id: 'maxlife',
      name: 'Max Life Smart Secure Plus',
      type: 'Term Life Cover',
      highlight: '99.5% IRDAI Claim Settlement Ratio • Terminal Illness Payout',
      officialSite: 'https://www.maxlifeinsurance.com/'
    }
  ];

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setResult(null);

      const fd = new FormData();
      if (inputMode === 'upload') {
        if (!policyFile) {
          setError('Please select an insurance policy PDF file to upload.');
          setLoading(false);
          return;
        }
        fd.append('file', policyFile);
      } else if (inputMode === 'paste') {
        if (!pastedText || pastedText.trim().length < 30) {
          setError('Please paste at least one or two sentences of policy wording to analyze.');
          setLoading(false);
          return;
        }
        fd.append('raw_text', pastedText.trim());
      } else {
        fd.append('preset', selectedPreset);
      }

      const res = await insuranceService.analyzePolicy(fd);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze policy document. Check file format.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPolicyFile(null);
    setPastedText('');
    setResult(null);
    setError('');
  };

  const handleSaveAudit = async () => {
    if (!result) return;
    try {
      setSaving(true);
      await reportService.create({
        title: `${result.company_name} - Policy Document Audit`,
        notes: `Policy Health Score: ${result.policy_health_score}/10. ${result.verdict_summary}`,
        inputs: {
          company_name: result.company_name,
          plan_name: result.plan_name,
          pages_scanned: result.pages_scanned,
          website: result.company_website
        },
        result: {
          prediction: {
            risk_tier: result.is_good_to_buy ? 'Recommended' : 'Caution',
            risk_score: Math.round(result.policy_health_score * 100),
            default_probability: Math.max(0, 1.0 - (result.policy_health_score / 10)),
          },
          narrative: result.verdict_summary,
          contributions: [],
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-400" />
            Insurance Policy PDF Reviewer & Clause Extractor
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Upload any policy PDF document to detect hidden clauses, evaluate if it is good to buy, and get official company purchase links.
          </p>
        </div>

        {/* Quick link to Underwriting model */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('insurance')}
            className="text-xs font-semibold text-slate-300 hover:text-teal-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>Switch to Applicant ML Underwriting</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-200 space-y-1.5 flex-1">
            <p className="font-semibold">Document Notice</p>
            <p>{error}</p>
            {error.includes('scanned image') && (
              <button
                type="button"
                onClick={() => { setInputMode('paste'); setError(''); }}
                className="mt-1 px-3 py-1 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-semibold border border-teal-500/40 text-[11px] flex items-center gap-1"
              >
                Switch to "2. Paste Text" Mode Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Input Configuration Card */}
      <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal-400" />
              Provide Policy Document for Review
            </h2>
            <p className="text-[11px] text-slate-400">
              Choose to upload an actual PDF, paste policy clauses, or test pre-loaded policy wordings
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => { setInputMode('upload'); setError(''); setResult(null); }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                inputMode === 'upload'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Upload PDF
            </button>
            <button
              type="button"
              onClick={() => { setInputMode('paste'); setError(''); setResult(null); }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                inputMode === 'paste'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Paste Text
            </button>
            <button
              type="button"
              onClick={() => { setInputMode('preset'); setError(''); setResult(null); }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                inputMode === 'preset'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3. Sample Policies
            </button>
          </div>
        </div>

        <form onSubmit={handleScan} className="space-y-4">
          {/* MODE 1: FILE UPLOAD */}
          {inputMode === 'upload' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-2xl p-6 text-center transition-colors bg-slate-900/40">
                <Upload className="w-10 h-10 text-teal-400 mx-auto mb-2 opacity-80" />
                <label htmlFor="policy-file-input" className="cursor-pointer">
                  <span className="text-xs font-bold text-teal-300 hover:underline">
                    Click here to select an Insurance Policy PDF from your computer
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supports any standard PDF policy wording or prospectus document
                  </p>
                  <input
                    id="policy-file-input"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPolicyFile(e.target.files[0]);
                        setError('');
                      }
                    }}
                    className="hidden"
                  />
                </label>

                {policyFile ? (
                  <div className="mt-4 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 max-w-md mx-auto text-left flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white truncate max-w-xs">{policyFile.name}</p>
                      <p className="text-[10px] text-teal-400">{(policyFile.size / 1024).toFixed(1)} KB • PDF Document Ready</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPolicyFile(null)}
                      className="text-xs text-slate-400 hover:text-rose-400"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-3">No file chosen yet.</p>
                )}
              </div>
            </div>
          )}

          {/* MODE 2: PASTE TEXT */}
          {inputMode === 'paste' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Paste Policy Clauses / Excerpt Below:
              </label>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Example: Section 2.1 Room Rent: Daily room rent is capped at 1% of the Sum Insured. Pre-existing disease waiting period is 36 months. Nil co-payment applies..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono leading-relaxed"
              />
              <p className="text-[11px] text-slate-400">
                Tip: Copy and paste key clauses from any policy quotation, brochure, or email to check for hidden traps.
              </p>
            </div>
          )}

          {/* MODE 3: PRE-LOADED SAMPLES */}
          {inputMode === 'preset' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Choose a Pre-Loaded Indian Policy for Live Demonstration:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {samplePresets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPreset(p.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      selectedPreset === p.id
                        ? 'bg-teal-500/15 border-teal-500 text-teal-200'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white">{p.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{p.type}</span>
                    </div>
                    <p className="text-[11px] text-teal-400 mt-1">{p.highlight}</p>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                Pre-loaded wordings allow immediate demonstration during class/viva without having to find and download a real 40-page PDF file.
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-between pt-2">
            {result && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Form
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="ml-auto py-2.5 px-6 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Reading PDF Pages & Extracting Clauses...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Analyze Policy & Generate Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ============================================================= */}
      {/* RESULTS SECTION: REVIEW, VERDICT & OFFICIAL REDIRECTION LINK */}
      {/* ============================================================= */}
      {result && (
        <div className="space-y-6">
          {/* Card 1: Review Verdict & Buy Button */}
          <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/60">
                  {result.engine_details}
                </span>
                <h2 className="text-lg font-bold text-white mt-1.5">
                  {result.company_name} — {result.plan_name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {result.source_file && (
                    <span className="text-teal-300 font-medium">Doc: {result.source_file} • </span>
                  )}
                  Extracted {result.pages_scanned} page(s) ({result.word_count.toLocaleString('en-IN')} words tokenized)
                </p>
              </div>

              {/* Health Score Pill */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-right shrink-0">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Consumer Health Score</span>
                <span className="text-2xl font-bold font-mono text-teal-400">
                  {result.policy_health_score} <span className="text-xs text-slate-500">/ 10</span>
                </span>
              </div>
            </div>

            {/* Verdict Box */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Purchase Decision:</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                    result.is_good_to_buy
                      ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-400'
                      : 'bg-rose-950/80 border border-rose-800 text-rose-400'
                  }`}>
                    {result.verdict_badge}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  IRDAI Claim Settlement Ratio: <strong className="text-white">{result.irdai_claim_settlement_ratio}</strong>
                </div>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">
                {result.verdict_summary}
              </p>

              {/* Official Purchase Redirection Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800/80">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Verified Official Company Portal:
                  </p>
                  <p className="text-xs text-teal-400 font-mono truncate max-w-md">
                    {result.company_website}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5 text-teal-400" />
                    <span>Save Audit</span>
                  </button>

                  <a
                    href={result.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
                  >
                    <span>Visit Official Website to Buy</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Exact Clauses & Lines to Keep in Mind */}
          <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                Exact Clauses & Lines You Should Keep in Mind
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Verbatim sentences matched from the scanned document with practical advice for hospital claims
              </p>
            </div>

            <div className="space-y-4">
              {result.clauses_to_remember.map((clause, idx) => {
                const isFavorable = clause.severity === 'favorable';
                const isWarning = clause.severity === 'warning';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border space-y-2.5 ${
                      isFavorable
                        ? 'bg-slate-900/60 border-slate-800'
                        : isWarning
                        ? 'bg-amber-950/15 border-amber-900/40'
                        : 'bg-rose-950/15 border-rose-900/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {idx + 1}. {clause.category}
                        </span>
                        <span className="text-[10px] text-teal-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          Page {clause.page_number}
                        </span>
                      </div>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded w-fit ${
                        isFavorable
                          ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-400'
                          : isWarning
                          ? 'bg-amber-950/80 border border-amber-800 text-amber-400'
                          : 'bg-rose-950/80 border border-rose-800 text-rose-400'
                      }`}>
                        {clause.exact_clause_title}
                      </span>
                    </div>

                    {/* Exact Quote from PDF */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-300 leading-relaxed">
                      <span className="text-teal-400 font-bold block mb-1">
                        Exact Line in Document (Page {clause.page_number}):
                      </span>
                      "{clause.highlighted_quote}"
                    </div>

                    {/* Practical Advice */}
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

          {/* Card 3: Pros vs Gotchas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Verified Policy Strengths
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {result.pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Fine-Print Gotchas & Important Disclaimers
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {result.gotchas_and_fine_print.map((g, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Viva & Engineering Student Architecture Card */}
          <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-5 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-white font-bold pb-1 border-b border-slate-800">
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span>Project Implementation Details (For Viva / Academic Defense)</span>
            </div>
            <p className="pt-1">
              <strong>1. Extraction Engine:</strong> Uses Python's <code className="text-teal-300 font-mono">pypdf.PdfReader</code> stream parser to read the uploaded binary stream in memory without writing unneeded files to disk.
            </p>
            <p>
              <strong>2. Clause Tokenizer:</strong> Text is split into sentence tokens using regex boundary lookaheads <code className="text-teal-300 font-mono">re.split(r'[\r\n]+|(?&lt;=[.!?])\s+', text)</code> and cross-referenced with IRDAI Health Insurance Regulations 2016 categories.
            </p>
            <p>
              <strong>3. Proportionate Deduction Penalty:</strong> As per Indian insurance norms, policies with a 1% room rent cap penalize the claimant proportionally across the total hospital bill. The engine automatically penalizes such plans by 2.0 points.
            </p>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1128] border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Save className="w-4 h-4 text-teal-400" /> Save Policy Document Audit
            </h3>
            <p className="text-xs text-slate-300">
              Save the audit and extracted fine-print clauses for <strong className="text-white">{result?.company_name}</strong> into your project reports history.
            </p>
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
                onClick={handleSaveAudit}
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
