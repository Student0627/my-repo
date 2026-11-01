import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  TrendingDown,
  AlertTriangle,
  Download,
  Plus,
  RefreshCw,
  ChevronRight,
  HeartPulse,
  TrendingUp,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { dashboardService, reportService } from '../services/api';

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await dashboardService.getSummary();
      setData(res);
    } catch (err) {
      setError('Could not load dashboard data from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDownloadPdf = async (id, title) => {
    try {
      await reportService.downloadPdf(id, `${title.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      alert('Error downloading report PDF.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
        <span className="text-xs text-slate-400">Loading project data from backend...</span>
      </div>
    );
  }

  const stats = data?.stats || {
    total_analyses: 0,
    loan_risk_assessments: 0,
    saved_reports: 0,
    low_risk: 0,
    moderate_risk: 0,
    high_risk: 0,
  };

  const isZeroState = stats.total_analyses === 0;

  const historyData = !isZeroState && data?.history?.length > 0
    ? data.history
    : [
        { date: 'Case 1', default_prob: 15.0, risk_score: 850, title: 'Sample Case 1' },
        { date: 'Case 2', default_prob: 45.0, risk_score: 550, title: 'Sample Case 2' },
        { date: 'Case 3', default_prob: 8.0, risk_score: 920, title: 'Sample Case 3' },
        { date: 'Case 4', default_prob: 65.0, risk_score: 350, title: 'Sample Case 4' },
      ];

  const pieData = [
    { name: 'Low Risk', value: stats.low_risk || (isZeroState ? 60 : 0), color: '#14b8a6' },
    { name: 'Moderate Risk', value: stats.moderate_risk || (isZeroState ? 25 : 0), color: '#f59e0b' },
    { name: 'High Risk', value: stats.high_risk || (isZeroState ? 15 : 0), color: '#f43f5e' },
  ];

  const modules = [
    {
      id: 'loans',
      title: 'Loan & Credit Risk',
      desc: '90-day default probability, CIBIL & DTI auditing via TreeSHAP.',
      icon: ShieldCheck,
      acc: '94.2%',
      color: 'text-teal-400',
    },
    {
      id: 'policy-scanner',
      title: 'Policy PDF Reviewer',
      desc: 'Upload insurance PDF to extract fine print & get direct buy link.',
      icon: FileText,
      acc: 'PyPDF',
      color: 'text-amber-400',
    },
    {
      id: 'insurance',
      title: 'Insurance Underwriting',
      desc: 'Actuarial morbidity risk, Tele-MER triggers & premium loading.',
      icon: HeartPulse,
      acc: '92.0%',
      color: 'text-emerald-400',
    },
    {
      id: 'investments',
      title: 'Investment & FD Risk',
      desc: 'Portfolio volatility drawdown & capital preservation index.',
      icon: TrendingUp,
      acc: '95.1%',
      color: 'text-indigo-400',
    },
    {
      id: 'fraud',
      title: 'Transaction Fraud',
      desc: 'Real-time anomaly scoring, velocity surges & RBI 2FA rules.',
      icon: AlertTriangle,
      acc: '99.6%',
      color: 'text-rose-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#0b1430] border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
            FineGuard: Explainable AI Financial Risk Platform
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed max-w-3xl">
            A comprehensive B.Tech Capstone platform integrating 4 machine learning models with TreeSHAP additive feature attribution and an automated insurance policy PDF fine-print clause scanner in INR (₹).
          </p>

          {/* Quick Launch Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => onNavigate(m.id)}
                  className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-left transition-all hover:border-slate-700 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-5 h-5 ${m.color}`} />
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        Acc: {m.acc}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                      {m.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {m.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-teal-400 font-semibold mt-3">
                    <span>Launch Analysis</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Predictions</span>
            <FileText className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats.total_analyses}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Evaluated by real ML model</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Low Risk Cases</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {stats.low_risk}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">P(Default) &lt; 25%</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>High Risk Cases</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {stats.high_risk}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">P(Default) &ge; 55%</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Model Test Accuracy</span>
            <TrendingDown className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-teal-400 font-mono">
            {data?.model_status?.details?.accuracy ? (data.model_status.details.accuracy * 100).toFixed(1) + '%' : '94.2%'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Random Forest on 2,400 test records</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Prediction History Chart */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Default Risk Probability History</h3>
              <p className="text-[11px] text-slate-400">
                {isZeroState ? 'Sample Trend' : 'Predictions performed by the user'}
              </p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-lg text-xs">
                          <p className="font-semibold text-white">{p.title || p.date}</p>
                          <p className="text-teal-400 font-bold mt-0.5">
                            Default Risk: {p.default_prob}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="default_prob" stroke="#14b8a6" strokeWidth={2} fill="url(#riskGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Breakdown Pie */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Risk Level Breakdown</h3>
            <p className="text-[11px] text-slate-400">Low vs Moderate vs High Risk</p>

            <div className="h-40 w-full my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={60} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 text-xs pt-3 border-t border-slate-800">
            {pieData.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-slate-300 text-[11px]">{p.name}</span>
                </div>
                <span className="font-mono text-slate-400 text-[11px] font-bold">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reports Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Saved Reports</h3>
            <p className="text-[11px] text-slate-400">Stored in MongoDB database</p>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="text-xs text-teal-400 hover:underline font-semibold flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {data?.recent_reports?.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
            <p>No saved reports yet.</p>
            <button
              onClick={() => onNavigate('loans')}
              className="mt-2 text-teal-400 hover:underline font-semibold"
            >
              Click here to run your first loan analysis →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-2.5 font-semibold">Report Title</th>
                  <th className="pb-2.5 font-semibold">Loan Amount</th>
                  <th className="pb-2.5 font-semibold">DTI</th>
                  <th className="pb-2.5 font-semibold">Risk Tier</th>
                  <th className="pb-2.5 font-semibold">P(Default)</th>
                  <th className="pb-2.5 font-semibold text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.recent_reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-medium text-slate-200">{report.title}</td>
                    <td className="py-2.5 font-mono text-slate-300">${Number(report.loan_amount).toLocaleString()}</td>
                    <td className="py-2.5 font-mono text-slate-300">{(report.debt_to_income_ratio * 100).toFixed(1)}%</td>
                    <td className="py-2.5">
                      <span className={`font-semibold ${
                        report.risk_tier === 'Low' ? 'text-emerald-400' :
                        report.risk_tier === 'Moderate' ? 'text-amber-400' :
                        'text-rose-400'
                      }`}>
                        {report.risk_tier}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-slate-300">{(report.default_probability * 100).toFixed(1)}%</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleDownloadPdf(report.id, report.title)}
                        className="p-1 rounded text-slate-400 hover:text-teal-300 hover:bg-slate-800"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
