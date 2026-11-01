import React from 'react';
import { Menu, Plus } from 'lucide-react';

export default function TopNav({ currentPage, onToggleMobile, onNavigate }) {
  const titles = {
    dashboard: { title: 'Project Overview & Metrics', subtitle: 'Summary of analyses, model metrics, and recent test records' },
    loans: { title: 'Loan Risk Predictor', subtitle: 'Enter applicant details to predict risk and see SHAP explanation' },
    simulator: { title: 'What-If Risk Simulator', subtitle: 'Change input values to see how the model prediction changes' },
    reports: { title: 'Saved Reports & Archive', subtitle: 'View previously analyzed cases and download PDF reports' },
    settings: { title: 'About Project & Model Details', subtitle: 'Project information, student team, dataset info, and limitations' },
  };

  const currentMeta = titles[currentPage] || { title: 'FineGuard', subtitle: '' };

  return (
    <header className="h-16 border-b border-slate-800 bg-[#090f24]/90 backdrop-blur-md sticky top-0 z-30 px-5 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base lg:text-lg font-bold text-white tracking-tight">
            {currentMeta.title}
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-400">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {currentPage !== 'loans' && (
          <button
            onClick={() => onNavigate('loans')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Prediction</span>
          </button>
        )}
      </div>
    </header>
  );
}
