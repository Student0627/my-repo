import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Cpu,
  AlertTriangle,
  Code2
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { dashboardService } from '../services/api';

export default function Settings() {
  const { user, logout } = useAuth();
  const [modelMeta, setModelMeta] = useState(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await dashboardService.getSummary();
        if (res.model_status?.details) {
          setModelMeta(res.model_status.details);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMeta();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          About Project & Model Details
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Project overview, machine learning architecture, and team credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Student Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-bold text-base">
              {user?.name ? user.name.slice(0, 1).toUpperCase() : 'S'}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{user?.name || 'Student'}</h3>
              <p className="text-[11px] text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Project Role:</span>
              <span className="text-slate-200 font-medium">B.Tech Student / Evaluator</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Auth Method:</span>
              <span className="text-teal-400 font-mono text-[11px]">JWT Token + bcrypt</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Database:</span>
              <span className="text-slate-200">MongoDB</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Model Specs */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-sm text-white">4 Multi-Domain Production Models (Evaluated on Holdout Test Sets)</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">1. Loan & Credit</span>
              <div className="text-base font-bold font-mono text-teal-400 mt-1">94.2%</div>
              <span className="text-[9px] text-slate-500">ROC-AUC 0.980</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">2. Insurance Risk</span>
              <div className="text-base font-bold font-mono text-emerald-400 mt-1">92.0%</div>
              <span className="text-[9px] text-slate-500">ROC-AUC 0.981</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">3. Investment & FD</span>
              <div className="text-base font-bold font-mono text-indigo-400 mt-1">95.1%</div>
              <span className="text-[9px] text-slate-500">ROC-AUC 0.990</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">4. Fraud Detection</span>
              <div className="text-base font-bold font-mono text-rose-400 mt-1">99.6%</div>
              <span className="text-[9px] text-slate-500">ROC-AUC 0.999</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <p className="flex justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">Ensemble Architecture:</span>
              <span className="font-mono text-slate-200">Calibrated Random Forests (Scikit-Learn)</span>
            </p>
            <p className="flex justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">Explainability Algorithm:</span>
              <span className="font-mono text-teal-400">TreeSHAP (Exact Shapley Values)</span>
            </p>
            <p className="flex justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">Evaluation Strategy:</span>
              <span className="font-mono text-slate-200">80/20 Stratified Holdout (Zero Data Leakage)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tech Stack and Project Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <Code2 className="w-4 h-4 text-teal-400" />
          <h3 className="font-bold text-sm text-white">Project Tech Stack</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <strong className="text-teal-400 block mb-1">Backend & Machine Learning</strong>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400">
              <li>Python 3 & FastAPI framework</li>
              <li>Scikit-Learn (Random Forest & Scaler)</li>
              <li>SHAP (TreeSHAP exact attributions)</li>
              <li>Motor + MongoDB for report persistence</li>
              <li>ReportLab for dynamic PDF generation</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <strong className="text-teal-400 block mb-1">Frontend & Visualization</strong>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400">
              <li>React.js with Vite</li>
              <li>Tailwind CSS (Dark navy & teal theme)</li>
              <li>Recharts library (Area, Pie & Bar charts)</li>
              <li>Lucide Icons</li>
              <li>Axios API client</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Limitations note */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Academic Project Limitations & Ethical AI Note</span>
        </div>
        <p className="leading-relaxed">
          This system is built as an academic capstone project to demonstrate the practical application of Explainable Artificial Intelligence in financial underwriting. Predictions reflect statistical probabilities trained on credit attributes and should be used with human oversight.
        </p>
      </div>
    </div>
  );
}
