import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { getCertifications } from '../../services/learningProgressService';
import {
  subscribeToStore,
  addCollectionItem,
  updateCollectionItem,
  deleteCollectionItem,
  calculateDaysRemaining,
} from '../../utils/hybridStore';
import SummaryCard from '../../components/dashboard/SummaryCard';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState from '../../components/feedback/ErrorState';

// ── Dynamic status calculation ───────────────────────────────────
function computeCertStatus(expiryDate) {
  const days = calculateDaysRemaining(expiryDate);
  if (days < 0)   return { status: 'Expired',       statusBadge: 'badge-danger bg-red-50 text-red-700 border-red-200',             renewalRequired: true,  daysRemaining: days };
  if (days <= 60) return { status: 'Expiring Soon', statusBadge: 'badge-warning bg-amber-50 text-amber-700 border-amber-200',       renewalRequired: true,  daysRemaining: days };
  return            { status: 'Valid',            statusBadge: 'badge-success bg-emerald-50 text-emerald-700 border-emerald-200', renewalRequired: false, daysRemaining: days };
}

// ── Empty add-cert form ──────────────────────────────────────────
const EMPTY_FORM = {
  certificationName: '',
  issuingOrganization: '',
  credentialId: '',
  issueDate: '',
  expiryDate: '',
  skill: '',
  credentialUrl: '',
  icon: '📜',
};

// ── Add/Edit form validation ─────────────────────────────────────
function validateCertForm(form) {
  const errs = {};
  if (!form.certificationName?.trim())  errs.certificationName  = 'Certification name is required.';
  if (!form.issuingOrganization?.trim()) errs.issuingOrganization = 'Issuing body is required.';
  if (!form.credentialId?.trim())        errs.credentialId        = 'Certification ID is required.';
  if (!form.issueDate)                   errs.issueDate           = 'Issue date is required.';
  if (!form.expiryDate)                  errs.expiryDate          = 'Expiry date is required.';
  if (form.issueDate && form.expiryDate && form.expiryDate < form.issueDate)
    errs.expiryDate = 'Expiry date cannot be before issue date.';
  return errs;
}

// ── Renewal form validation ──────────────────────────────────────
function validateRenewalForm(form) {
  const errs = {};
  if (!form.newIssueDate)   errs.newIssueDate  = 'New issue date is required.';
  if (!form.newExpiryDate)  errs.newExpiryDate = 'New expiry date is required.';
  if (form.newIssueDate && form.newExpiryDate && form.newExpiryDate <= form.newIssueDate)
    errs.newExpiryDate = 'New expiry date must be later than the issue date.';
  if (!form.renewalMethod)  errs.renewalMethod = 'Renewal method is required.';
  return errs;
}

// ── Shared modal backdrop ────────────────────────────────────────
function ModalBackdrop({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

// ── InfoRow helper ───────────────────────────────────────────────
function InfoRow({ label, value, mono = false, accent = '' }) {
  return (
    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-xs font-bold text-slate-800 mt-0.5 leading-snug ${mono ? 'font-mono' : ''} ${accent}`}>{value}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// DETAILS MODAL
// ════════════════════════════════════════════════════════════════
function DetailsModal({ cert, onClose, onEdit, onRenew, onRemove }) {
  const computed   = computeCertStatus(cert.expiryDate);
  const needsRenew = computed.status === 'Expiring Soon' || computed.status === 'Expired';
  const history    = cert.renewalHistory || [];

  const statusBg =
    computed.status === 'Valid'         ? 'bg-emerald-50 border-emerald-200' :
    computed.status === 'Expiring Soon' ? 'bg-amber-50 border-amber-200'    : 'bg-red-50 border-red-200';
  const statusText =
    computed.status === 'Valid'         ? 'text-emerald-700' :
    computed.status === 'Expiring Soon' ? 'text-amber-700'   : 'text-red-700';
  const statusLabel =
    computed.status === 'Valid'         ? '✓ Verified & Active' :
    computed.status === 'Expiring Soon' ? '⚠️ Expiring Soon — Renewal Required' :
                                          '🔴 Expired — Renewal Required';

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0">{cert.icon || '📜'}</span>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 leading-snug truncate">{cert.certificationName}</h2>
              <p className="text-[11px] text-slate-500 font-mono">ID: {cert.credentialId}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none ml-3 shrink-0">✕</button>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Status banner */}
          <div className={`flex items-center justify-between p-3 rounded-xl border ${statusBg}`}>
            <span className={`text-xs font-bold ${statusText}`}>{statusLabel}</span>
            <span className={`${computed.statusBadge} text-xs font-bold py-0.5 px-2.5 rounded-full border`}>{computed.status}</span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2">
            <InfoRow label="Issuing Body"      value={cert.issuingOrganization} />
            <InfoRow label="Category / Domain" value={cert.skill || '—'} />
            <InfoRow label="Issue Date"        value={cert.issueDate} />
            <InfoRow label="Expiry Date"       value={cert.expiryDate} />
            <InfoRow label="Days Remaining"    value={computed.daysRemaining < 0 ? `Expired ${Math.abs(computed.daysRemaining)} days ago` : `${computed.daysRemaining} days`} />
            <InfoRow label="Credential ID"     value={cert.credentialId} mono />
          </div>

          {/* Credential URL */}
          {cert.credentialUrl && cert.credentialUrl !== '#' && (
            <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2">
              🔗 View Credential Online
            </a>
          )}

          {/* Renewal History */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              🔄 Renewal History
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No renewal history available.</p>
            ) : (
              <div className="space-y-2">
                {history.slice().reverse().map((r, i) => (
                  <div key={i} className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Renewal #{history.length - i}</span>
                      <span className="text-[10px] text-slate-500">{r.renewedAt}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <div><span className="font-semibold text-slate-600">Previous Expiry:</span> <span className="text-slate-700">{r.previousExpiryDate}</span></div>
                      <div><span className="font-semibold text-slate-600">New Expiry:</span> <span className="text-emerald-700 font-bold">{r.newExpiryDate}</span></div>
                      <div><span className="font-semibold text-slate-600">Method:</span> <span className="text-slate-700">{r.renewalMethod}</span></div>
                      {r.updatedCredentialId && (
                        <div><span className="font-semibold text-slate-600">New ID:</span> <span className="font-mono text-slate-700">{r.updatedCredentialId}</span></div>
                      )}
                    </div>
                    {r.renewalNotes && (
                      <p className="text-[11px] text-slate-600 italic">"{r.renewalNotes}"</p>
                    )}
                    {r.attachmentName && (
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        📎 {r.attachmentName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <button type="button" onClick={() => onRemove(cert)} className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">
            🗑 Remove
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-outline text-xs py-2 px-4">Close</button>
            <button type="button" onClick={() => onEdit(cert)} className="btn-outline text-xs py-2 px-4">✏️ Edit</button>
            {needsRenew && (
              <button type="button" onClick={() => onRenew(cert)} className="btn-primary text-xs py-2 px-4 bg-amber-600 hover:bg-amber-700 border-amber-600">
                🔄 Renew
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ════════════════════════════════════════════════════════════════
// RENEW CERTIFICATION MODAL — proper form, then success state
// ════════════════════════════════════════════════════════════════
const RENEWAL_METHODS = [
  'Renewal Exam',
  'Continuing Education Credits',
  'Training Completion',
  'Recertification',
  'Other',
];

function RenewCertModal({ cert, onClose, onSubmit }) {
  const [phase, setPhase] = useState('form'); // 'form' | 'success'
  const [submittedData, setSubmittedData] = useState(null);
  const fileInputRef = useRef(null);
  const todayStr = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    newIssueDate:        todayStr,
    newExpiryDate:       '',
    renewalMethod:       '',
    renewalNotes:        '',
    updatedCredentialId: '',
    attachmentName:      '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const computed = computeCertStatus(cert.expiryDate);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({ ...prev, attachmentName: file.name }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validateRenewalForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      onSubmit(cert, form);
      setSubmittedData(form);
      setPhase('success');
    } finally {
      setSubmitting(false);
    }
  }

  const newStatus = form.newExpiryDate ? computeCertStatus(form.newExpiryDate) : null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-sm font-extrabold text-slate-900">
            {phase === 'form' ? '🔄 Renew Certification' : '✅ Renewal Submitted Successfully'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none">✕</button>
        </div>

        {phase === 'form' ? (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

              {/* Current certification summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{cert.icon || '📜'}</span>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">{cert.certificationName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">ID: {cert.credentialId}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-400 block">Issuing Body</span>
                    <span className="font-semibold text-slate-700">{cert.issuingOrganization}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-400 block">Current Status</span>
                    <span className={`font-bold ${computed.status === 'Expired' ? 'text-red-600' : 'text-amber-600'}`}>{computed.status}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-400 block">Current Issue Date</span>
                    <span className="font-semibold text-slate-700">{cert.issueDate}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-400 block">Current Expiry Date</span>
                    <span className="font-bold text-red-600">{cert.expiryDate}</span>
                  </div>
                </div>
              </div>

              {/* ── Renewal Details ── */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-black">✓</span>
                  Renewal Details
                </h3>
                <div className="space-y-4">

                  {/* New Issue Date + New Expiry Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">New Issue Date *</label>
                      <input
                        type="date"
                        name="newIssueDate"
                        value={form.newIssueDate}
                        onChange={handleChange}
                        className={`form-input text-xs ${errors.newIssueDate ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                      />
                      {errors.newIssueDate && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.newIssueDate}</p>}
                    </div>
                    <div>
                      <label className="form-label">New Expiry Date *</label>
                      <input
                        type="date"
                        name="newExpiryDate"
                        value={form.newExpiryDate}
                        onChange={handleChange}
                        min={form.newIssueDate || todayStr}
                        className={`form-input text-xs ${errors.newExpiryDate ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                      />
                      {errors.newExpiryDate && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.newExpiryDate}</p>}
                    </div>
                  </div>

                  {/* New status preview */}
                  {newStatus && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-semibold ${
                      newStatus.status === 'Valid' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      newStatus.status === 'Expiring Soon' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                      'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <span>{newStatus.status === 'Valid' ? '✅' : newStatus.status === 'Expiring Soon' ? '⚠️' : '🔴'}</span>
                      New Status: <span className="font-extrabold">{newStatus.status}</span>
                      {newStatus.daysRemaining > 0 && <span className="ml-auto text-slate-500">{newStatus.daysRemaining} days remaining</span>}
                    </div>
                  )}

                  {/* Renewal Method */}
                  <div>
                    <label className="form-label">Renewal Method / Requirement *</label>
                    <select
                      name="renewalMethod"
                      value={form.renewalMethod}
                      onChange={handleChange}
                      className={`form-select text-xs w-full ${errors.renewalMethod ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                    >
                      <option value="">— Select renewal method —</option>
                      {RENEWAL_METHODS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {errors.renewalMethod && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors.renewalMethod}</p>}
                  </div>

                  {/* Renewal Notes */}
                  <div>
                    <label className="form-label">Renewal Notes / Requirements</label>
                    <textarea
                      name="renewalNotes"
                      value={form.renewalNotes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="e.g. Completed required continuing education credits."
                      className="form-input text-xs resize-none w-full"
                    />
                  </div>

                  {/* Updated Credential ID */}
                  <div>
                    <label className="form-label">Updated Certification ID <span className="text-slate-400 font-normal">(optional)</span></label>
                    <input
                      type="text"
                      name="updatedCredentialId"
                      value={form.updatedCredentialId}
                      onChange={handleChange}
                      placeholder="Leave blank to keep existing ID"
                      className="form-input text-xs font-mono"
                    />
                  </div>

                  {/* Certificate Upload */}
                  <div>
                    <label className="form-label">Upload Renewed Certificate <span className="text-slate-400 font-normal">(optional)</span></label>
                    <div
                      className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors cursor-pointer bg-slate-50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="text-center">
                        {form.attachmentName ? (
                          <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 font-semibold">
                            <span className="text-lg">📎</span>
                            <span>{form.attachmentName}</span>
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); setForm(prev => ({ ...prev, attachmentName: '' })); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                              className="text-slate-400 hover:text-red-500 font-bold ml-1"
                            >✕</button>
                          </div>
                        ) : (
                          <>
                            <span className="text-2xl block mb-1">📤</span>
                            <p className="text-xs font-semibold text-slate-600">Click to upload certificate</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">PDF, JPG, JPEG, PNG accepted</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button type="button" onClick={onClose} className="btn-outline text-xs py-2 px-4">Cancel</button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs py-2 px-5 bg-blue-600 hover:bg-blue-700 border-blue-600"
              >
                {submitting ? 'Submitting…' : 'Submit Renewal'}
              </button>
            </div>
          </form>
        ) : (
          /* ── Success State ── */
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                <span className="text-4xl block">✅</span>
                <p className="text-sm font-extrabold text-emerald-900">Renewal Submitted Successfully</p>
                <p className="text-xs text-emerald-700">{cert.certificationName}</p>
                <p className="text-[11px] text-emerald-600 leading-relaxed mt-1">
                  Your renewed certification details have been successfully recorded.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <InfoRow label="New Issue Date"   value={submittedData?.newIssueDate || '—'} />
                <InfoRow label="New Expiry Date"  value={submittedData?.newExpiryDate || '—'} />
                <InfoRow label="Renewal Method"   value={submittedData?.renewalMethod || '—'} />
                {submittedData?.updatedCredentialId && (
                  <InfoRow label="Updated ID" value={submittedData.updatedCredentialId} mono />
                )}
              </div>

              {submittedData?.renewalNotes && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Renewal Notes</p>
                  <p className="text-xs text-slate-700 leading-relaxed">"{submittedData.renewalNotes}"</p>
                </div>
              )}

              {submittedData?.attachmentName && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-base">📎</span>
                  <div>
                    <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wide">Certificate Attached</p>
                    <p className="text-xs font-bold text-blue-800">{submittedData.attachmentName}</p>
                  </div>
                </div>
              )}

              {newStatus && submittedData?.newExpiryDate && (
                <div className={`flex items-center gap-2 p-3 rounded-xl border ${
                  computeCertStatus(submittedData.newExpiryDate).status === 'Valid'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <span>📋</span>
                  <div>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Renewal Status</p>
                    <p className="text-xs font-extrabold text-slate-800">
                      Renewal Recorded — {computeCertStatus(submittedData.newExpiryDate).status}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Note: This renewal has been recorded in your local profile. Official verification is subject to the issuing body's confirmation process.
              </p>
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button type="button" onClick={onClose} className="btn-primary text-xs py-2 px-5">Close</button>
            </div>
          </div>
        )}
      </div>
    </ModalBackdrop>
  );
}

// ════════════════════════════════════════════════════════════════
// ADD / EDIT CERTIFICATION MODAL
// ════════════════════════════════════════════════════════════════
function CertFormModal({ title, initial, onClose, onSave }) {
  const [form, setForm]     = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateCertForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  }

  const FIELDS = [
    { name: 'certificationName',  label: 'Certification Name *', type: 'text', placeholder: 'e.g. AWS Certified Solutions Architect' },
    { name: 'issuingOrganization',label: 'Issuing Body *',        type: 'text', placeholder: 'e.g. Amazon Web Services' },
    { name: 'credentialId',       label: 'Certification ID *',    type: 'text', placeholder: 'e.g. AWS-SAA-849204', mono: true },
    { name: 'issueDate',          label: 'Issue Date *',          type: 'date' },
    { name: 'expiryDate',         label: 'Expiry Date *',         type: 'date' },
    { name: 'skill',              label: 'Category / Domain',     type: 'text', placeholder: 'e.g. Cloud Computing' },
    { name: 'credentialUrl',      label: 'Credential URL',        type: 'url',  placeholder: 'https://...' },
  ];

  const ICONS = ['📜','☁️','⚓','🛡️','⚛️','🏆','☕','🔐','🧠','📊','🌐','🎯'];

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Icon picker */}
            <div>
              <label className="form-label">Icon</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ICONS.map(ic => (
                  <button key={ic} type="button"
                    onClick={() => setForm(prev => ({ ...prev, icon: ic }))}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center border-2 transition-all ${form.icon === ic ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}`}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            {/* Fields */}
            {FIELDS.map(({ name, label, type, placeholder, mono }) => (
              <div key={name}>
                <label className="form-label">{label}</label>
                <input type={type} name={name} value={form[name] || ''} onChange={handleChange}
                  placeholder={placeholder}
                  className={`form-input text-xs ${mono ? 'font-mono' : ''} ${errors[name] ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                />
                {errors[name] && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errors[name]}</p>}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
            <button type="button" onClick={onClose} className="btn-outline text-xs py-2 px-4">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-xs py-2 px-5">
              {saving ? 'Saving…' : title.startsWith('Add') ? '+ Add Certification' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

// ════════════════════════════════════════════════════════════════
// DELETE CONFIRM MODAL
// ════════════════════════════════════════════════════════════════
function DeleteModal({ cert, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try { await onConfirm(cert); }
    finally { setBusy(false); }
  }
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900">Remove Certification?</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{cert.icon || '📜'}</span>
              <p className="text-xs font-bold text-red-900">{cert.certificationName}</p>
            </div>
            <p className="text-[11px] text-red-700 font-mono">ID: {cert.credentialId}</p>
            <p className="text-[11px] text-red-600">Issued by {cert.issuingOrganization}</p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to remove this certification from your records? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-outline text-xs py-2 px-4">Cancel</button>
            <button type="button" onClick={go} disabled={busy}
              className="btn-primary text-xs py-2 px-4 bg-red-600 hover:bg-red-700 border-red-600">
              {busy ? 'Removing…' : 'Remove Certification'}
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function CertificationsPage() {
  const { user }    = useAuth();
  const { currentRole, roleBadge, isManager, isAdmin } = useRole();
  const employeeId  = user?.employeeId || user?.id || 3;

  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [certifications, setCertifications] = useState([]);

  const [certStatusFilter, setCertStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery]           = useState('');

  const [detailsCert, setDetailsCert]   = useState(null);
  const [renewCert, setRenewCert]       = useState(null);
  const [editCert, setEditCert]         = useState(null);
  const [deleteCert, setDeleteCert]     = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [toast, setToast] = useState(null);
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  }

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const list = await getCertifications(isManager || isAdmin ? null : employeeId);
      const normalized = (Array.isArray(list) ? list : []).map(c => ({ ...c, ...computeCertStatus(c.expiryDate) }));
      setCertifications(normalized);
      setLoading(false);
    } catch (err) {
      console.warn('[CertificationsPage] fetch error:', err);
      setError('Unable to load certifications. Please retry.');
      setLoading(false);
    }
  }, [employeeId, currentRole, isManager, isAdmin]);

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return unsub;
  }, [loadData]);

  // ── Handlers ─────────────────────────────────────────────────

  function handleRenewalSubmit(cert, form) {
    const renewalRecord = {
      renewedAt:           new Date().toISOString().split('T')[0],
      previousIssueDate:   cert.issueDate,
      previousExpiryDate:  cert.expiryDate,
      newIssueDate:        form.newIssueDate,
      newExpiryDate:       form.newExpiryDate,
      renewalMethod:       form.renewalMethod,
      renewalNotes:        form.renewalNotes || '',
      updatedCredentialId: form.updatedCredentialId || '',
      attachmentName:      form.attachmentName || '',
    };
    const newComputed    = computeCertStatus(form.newExpiryDate);
    const existingHistory = cert.renewalHistory || [];
    updateCollectionItem('certifications', cert.id, {
      issueDate:       form.newIssueDate,
      expiryDate:      form.newExpiryDate,
      credentialId:    form.updatedCredentialId || cert.credentialId,
      renewalHistory:  [...existingHistory, renewalRecord],
      lastRenewalMethod: form.renewalMethod,
      lastRenewalNotes: form.renewalNotes || '',
      attachmentName:  form.attachmentName || '',
      ...newComputed,
    });
    showToast(`✓ "${cert.certificationName}" renewal recorded — now ${newComputed.status}.`);
  }

  function handleAddSave(form) {
    const computed = computeCertStatus(form.expiryDate);
    addCollectionItem('certifications', {
      ...form,
      employeeId:   Number(employeeId),
      employeeName: user?.name || user?.username || 'Employee',
      renewalHistory: [],
      ...computed,
    });
    setShowAddModal(false);
    showToast(`✓ "${form.certificationName}" added to your certifications!`);
  }

  function handleEditSave(form) {
    const computed = computeCertStatus(form.expiryDate);
    updateCollectionItem('certifications', editCert.id, { ...form, ...computed });
    setEditCert(null);
    setDetailsCert(null);
    showToast(`✓ "${form.certificationName}" updated successfully!`);
  }

  function handleDeleteConfirm(cert) {
    deleteCollectionItem('certifications', cert.id);
    setDeleteCert(null);
    setDetailsCert(null);
    showToast(`✓ "${cert.certificationName}" removed from your records.`, 'info');
  }

  // ── Computed metrics (always dynamic) ────────────────────────
  const live          = certifications.map(c => ({ ...c, ...computeCertStatus(c.expiryDate) }));
  const validCerts    = live.filter(c => c.status === 'Valid').length;
  const expiringCount = live.filter(c => c.status === 'Expiring Soon').length;
  const expiredCount  = live.filter(c => c.status === 'Expired').length;
  const totalCerts    = live.length;

  // ── Filter + Search ───────────────────────────────────────────
  const q = searchQuery.toLowerCase().trim();
  const displayedCerts = live.filter(c => {
    const matchesStatus = certStatusFilter === 'All' || c.status === certStatusFilter;
    const matchesSearch = !q || [c.certificationName, c.issuingOrganization, c.credentialId, c.skill]
      .some(v => v && v.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  if (loading) return <LoadingScreen message="Loading My Certifications…" />;
  if (error)   return <ErrorState   message={error} onRetry={loadData} />;

  return (
    <div className="page-container space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border animate-fadeIn ${
          toast.type === 'info' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-900 border-slate-700 text-white'
        }`}>
          <span className={toast.type === 'info' ? 'text-blue-400 text-base' : 'text-emerald-400 text-base'}>
            {toast.type === 'info' ? 'ℹ' : '✓'}
          </span>
          <span className="text-xs font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-header-title text-2xl font-extrabold">My Certifications</h1>
            <span className={roleBadge.badgeClass}>{roleBadge.label} View</span>
          </div>
          <p className="page-header-subtitle">
            Track, manage, and renew your professional credentials and certification compliance.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {expiringCount > 0 && <span className="badge-warning text-xs font-bold">⚠️ {expiringCount} Expiring</span>}
          <button type="button" onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
            <span className="text-base leading-none">+</span>
            Add Certification
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Verified Certifications" value={`${validCerts} Active`}        subtext="Fully compliant credentials"           icon="📜" accent="purple" />
        <SummaryCard title="Expiring Soon"           value={`${expiringCount} Certs`}      subtext="Within 60 days — action required"     icon="⚠️" accent={expiringCount > 0 ? 'amber' : 'emerald'} />
        <SummaryCard title="Expired"                 value={`${expiredCount} Certs`}       subtext={expiredCount > 0 ? 'Immediate renewal required' : 'No expired credentials'} icon="🔴" accent={expiredCount > 0 ? 'amber' : 'blue'} />
        <SummaryCard title="Total Credentials"       value={`${totalCerts} Certs`}         subtext="Across all issuing bodies"            icon="🏅" accent="indigo" />
      </div>

      {/* Main Panel */}
      <div className="panel overflow-hidden">

        {/* Alert Banner */}
        {(expiringCount > 0 || expiredCount > 0) && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="text-sm font-bold text-amber-900">{expiringCount + expiredCount} Certification(s) Require Renewal Action</h4>
                <p className="text-xs text-amber-800">Keep credentials active to maintain organization compliance and project eligibility.</p>
              </div>
            </div>
            <span className="badge-warning text-xs font-bold shrink-0">Action Required</span>
          </div>
        )}

        {/* Filter + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 border-b border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search certifications…" className="form-input text-xs pl-8 w-full" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filter:</label>
              <select value={certStatusFilter} onChange={e => setCertStatusFilter(e.target.value)}
                className="form-select text-xs w-auto">
                <option value="All">All Statuses</option>
                <option value="Valid">Valid</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
            Showing {displayedCerts.length} of {totalCerts} Credentials
          </span>
        </div>

        {/* Table */}
        <div className="p-4">
          {displayedCerts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              <span className="text-4xl block mb-3">📜</span>
              <p className="font-semibold">No certifications found.</p>
              <p className="text-xs mt-1">
                {searchQuery || certStatusFilter !== 'All'
                  ? 'Try adjusting your search or filter.'
                  : 'Click "+ Add Certification" to add your first credential.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base w-full" style={{ minWidth: '760px' }}>
                <thead>
                  <tr>
                    <th className="table-th">CERTIFICATION</th>
                    <th className="table-th hidden md:table-cell">ISSUING BODY</th>
                    <th className="table-th hidden sm:table-cell">EXPIRY DATE</th>
                    <th className="table-th text-center hidden sm:table-cell">DAYS LEFT</th>
                    <th className="table-th text-center">STATUS</th>
                    <th className="table-th" style={{ minWidth: '220px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCerts.map((cert) => {
                    const computed    = computeCertStatus(cert.expiryDate);
                    const needsRenew  = computed.status === 'Expiring Soon' || computed.status === 'Expired';
                    return (
                      <tr key={cert.id} className="table-row">
                        {/* Cert name */}
                        <td className="table-td">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl shrink-0">{cert.icon || '📜'}</span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs leading-snug">{cert.certificationName}</p>
                              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">ID: {cert.credentialId}</p>
                              <p className="text-[10px] text-slate-500 md:hidden">{cert.issuingOrganization}</p>
                            </div>
                          </div>
                        </td>
                        {/* Issuing body */}
                        <td className="table-td text-xs font-semibold text-slate-700 hidden md:table-cell max-w-[140px]">
                          <span className="block truncate">{cert.issuingOrganization}</span>
                        </td>
                        {/* Expiry date */}
                        <td className="table-td text-xs text-slate-500 font-semibold hidden sm:table-cell whitespace-nowrap">{cert.expiryDate}</td>
                        {/* Days left */}
                        <td className="table-td text-center hidden sm:table-cell whitespace-nowrap">
                          {computed.daysRemaining < 0 ? (
                            <span className="text-xs font-bold text-red-600">{Math.abs(computed.daysRemaining)}d ago</span>
                          ) : (
                            <span className={`text-xs font-bold ${computed.daysRemaining <= 60 ? 'text-amber-600' : 'text-slate-700'}`}>
                              {computed.daysRemaining}d
                            </span>
                          )}
                        </td>
                        {/* Status */}
                        <td className="table-td text-center">
                          <span className={`${computed.statusBadge} text-xs font-bold py-0.5 px-2 rounded-full border whitespace-nowrap`}>
                            {computed.status}
                          </span>
                        </td>
                        {/* ── Actions — always one line, no wrap ── */}
                        <td className="table-td" style={{ minWidth: '220px' }}>
                          <div className="flex items-center gap-1" style={{ flexWrap: 'nowrap' }}>
                            {/* Details */}
                            <button type="button" onClick={() => setDetailsCert(cert)}
                              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
                              👁 Details
                            </button>
                            {/* Edit */}
                            <button type="button" onClick={() => setEditCert(cert)}
                              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
                              ✏️ Edit
                            </button>
                            {/* Renew — only for Expiring/Expired */}
                            {needsRenew && (
                              <button type="button" onClick={() => setRenewCert(cert)}
                                style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold py-1.5 px-2.5 rounded-lg border border-amber-500 bg-amber-500 text-white hover:bg-amber-600 hover:border-amber-600 transition-all">
                                🔄 Renew
                              </button>
                            )}
                            {/* Remove */}
                            <button type="button" onClick={() => setDeleteCert(cert)}
                              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold py-1.5 px-2.5 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-400 transition-all">
                              🗑 Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ── */}

      {detailsCert && (
        <DetailsModal
          cert={detailsCert}
          onClose={() => setDetailsCert(null)}
          onEdit={(c)   => { setDetailsCert(null); setEditCert(c); }}
          onRenew={(c)  => { setDetailsCert(null); setRenewCert(c); }}
          onRemove={(c) => { setDetailsCert(null); setDeleteCert(c); }}
        />
      )}

      {renewCert && (
        <RenewCertModal
          cert={renewCert}
          onClose={() => setRenewCert(null)}
          onSubmit={handleRenewalSubmit}
        />
      )}

      {showAddModal && (
        <CertFormModal
          title="Add Certification"
          initial={EMPTY_FORM}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddSave}
        />
      )}

      {editCert && (
        <CertFormModal
          title="Edit Certification"
          initial={editCert}
          onClose={() => setEditCert(null)}
          onSave={handleEditSave}
        />
      )}

      {deleteCert && (
        <DeleteModal
          cert={deleteCert}
          onClose={() => setDeleteCert(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
