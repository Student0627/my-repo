import React, { useState, useEffect } from 'react';
import {
  FileText,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { reportService } from '../services/api';
import RiskGauge from '../components/RiskGauge';
import FeatureImpactBar from '../components/FeatureImpactBar';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await reportService.list();
      setReports(data);
    } catch (err) {
      setError('Could not load reports from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete report "${title}"?`)) return;
    try {
      await reportService.delete(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
    } catch (e) {
      alert('Failed to delete report.');
    }
  };

  const handleDownloadPdf = async (id, title) => {
    try {
      await reportService.downloadPdf(id, `${title.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      alert('Error downloading report PDF.');
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const doc = await reportService.get(id);
      setSelectedReport(doc);
    } catch (e) {
      alert('Failed to load report detail.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Saved Reports & History
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Previous predictions saved to your MongoDB database
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
          <span>Loading saved reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center max-w-md mx-auto text-xs text-slate-400">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-300 text-sm">No Saved Reports Yet</p>
          <p className="mt-1">Run an analysis in the <strong>Loan Risk Predictor</strong> and click "Save Report" to store it here.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b132b] text-[11px] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Report Title</th>
                  <th className="py-3 px-4 font-semibold">Loan Amount</th>
                  <th className="py-3 px-4 font-semibold">DTI</th>
                  <th className="py-3 px-4 font-semibold">Risk Level</th>
                  <th className="py-3 px-4 font-semibold">P(Default)</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-medium text-slate-200">{r.title}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      ${Number(r.loan_amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {(r.debt_to_income_ratio * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        r.risk_tier === 'Low'
                          ? 'text-emerald-400'
                          : r.risk_tier === 'Moderate'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}>
                        {r.risk_tier} ({r.risk_score})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {(r.default_probability * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {r.created_at?.slice(0, 10)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDetail(r.id)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(r.id, r.title)}
                          className="p-1 rounded text-slate-400 hover:text-teal-300 hover:bg-slate-800"
                          title="PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.title)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedReport.title}</h3>
                <p className="text-[11px] text-slate-400">{selectedReport.created_at?.slice(0, 16).replace('T', ' ')}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(selectedReport.id, selectedReport.title)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold"
                >
                  <Download className="w-3 h-3" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {selectedReport.notes && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <strong>Notes:</strong> {selectedReport.notes}
              </div>
            )}

            <RiskGauge
              probability={selectedReport.result?.prediction?.default_probability || selectedReport.default_probability}
              score={selectedReport.result?.prediction?.risk_score || selectedReport.risk_score}
              tier={selectedReport.result?.prediction?.risk_tier || selectedReport.risk_tier}
              baseValue={selectedReport.result?.prediction?.base_value || 0.5}
            />

            {/* Inputs */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <span className="font-bold text-slate-300">Submitted Inputs:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
                <div>Income: <strong className="text-white">${selectedReport.inputs?.monthly_income?.toLocaleString()}</strong></div>
                <div>Debt: <strong className="text-white">${selectedReport.inputs?.monthly_debt?.toLocaleString()}</strong></div>
                <div>Loan: <strong className="text-white">${selectedReport.inputs?.loan_amount?.toLocaleString()}</strong></div>
                <div>Term: <strong className="text-white">{selectedReport.inputs?.loan_term_months} mo</strong></div>
              </div>
            </div>

            {selectedReport.result?.contributions && (
              <FeatureImpactBar contributions={selectedReport.result.contributions} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
