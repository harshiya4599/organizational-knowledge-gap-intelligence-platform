import { useState } from 'react';
import {
  exportToCSV,
  printReport,
  exportToPDF,
  exportToExcel,
} from '../../utils/exportUtils';

/**
 * Reusable Export & Reporting Toolbar component.
 * Provides instant CSV export and Print functionality while offering
 * backend-ready PDF and Excel export triggers with user feedback.
 */
export default function ExportToolbar({
  data = [],
  columns = [],
  filename = 'report',
  title = 'Export Options',
}) {
  const [loadingType, setLoadingType] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType]       = useState('info');

  const showNotification = (msg, type = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // CSV Export Handler
  const handleCSVExport = () => {
    try {
      if (!data || data.length === 0) {
        showNotification('No visible data to export.', 'warning');
        return;
      }
      exportToCSV(data, columns, filename);
      showNotification(`Successfully exported ${data.length} rows to CSV.`, 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to export CSV.', 'error');
    }
  };

  // Print Handler
  const handlePrint = () => {
    printReport();
  };

  // PDF Export Handler
  const handlePDFExport = () => {
    try {
      if (!data || data.length === 0) {
        showNotification('No visible data to export to PDF.', 'warning');
        return;
      }
      exportToPDF(data, columns, filename);
      showNotification(`Generated PDF report for ${data.length} items.`, 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to generate PDF report.', 'error');
    }
  };

  // Excel Export Handler
  const handleExcelExport = () => {
    try {
      if (!data || data.length === 0) {
        showNotification('No visible data to export to Excel.', 'warning');
        return;
      }
      exportToExcel(data, columns, filename);
      showNotification(`Successfully exported ${data.length} items to Excel (.xls).`, 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to generate Excel report.', 'error');
    }
  };

  const TOAST_STYLES = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    error:   'bg-red-50 text-red-800 border-red-200',
    info:    'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <div className="no-print space-y-2">
      {/* ── Action Buttons Toolbar ────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 shadow-card p-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-700">{title}</span>
            <span className="text-xs text-slate-400 font-medium ml-2">({data.length} items)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Export */}
          <button
            type="button"
            onClick={handleCSVExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-all duration-150 shadow-btn"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all duration-150 shadow-btn"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print Report
          </button>

          {/* PDF Export */}
          <button
            type="button"
            onClick={handlePDFExport}
            disabled={loadingType === 'pdf'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-all duration-150 shadow-btn disabled:opacity-50"
          >
            {loadingType === 'pdf' ? (
              <span className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spinSlow" />
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            )}
            Export PDF
          </button>

          {/* Excel Export */}
          <button
            type="button"
            onClick={handleExcelExport}
            disabled={loadingType === 'excel'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition-all duration-150 shadow-btn disabled:opacity-50"
          >
            {loadingType === 'excel' ? (
              <span className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spinSlow" />
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2.5"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="15" y1="3" x2="15" y2="21"/>
              </svg>
            )}
            Export Excel
          </button>
        </div>
      </div>

      {/* ── Notification Toast ────────────────────────────── */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-medium border shadow-toast transition-all duration-200 animate-fadeIn ${
            TOAST_STYLES[toastType] ?? TOAST_STYLES.info
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-3 p-0.5 rounded hover:opacity-70 transition-opacity"
            aria-label="Dismiss notification"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
