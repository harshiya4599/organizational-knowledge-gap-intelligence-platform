import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../../services/authService';

/* ─── Enterprise Features for Left Panel ─────────────────────── */
const FEATURES = [
  { icon: '📊', text: 'Workforce skill intelligence & real-time analytics' },
  { icon: '🧠', text: 'AI-powered skill gap detection & targeted development' },
  { icon: '🗺️', text: 'Personalized learning roadmaps for every employee' },
  { icon: '🔬', text: 'Competency matrix across departments & roles' },
  { icon: '🏢', text: 'Cross-functional workforce health tracking' },
];

/* ─── Recognized Public Email Providers ──────────────────────── */
const PUBLIC_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'zoho.com',
  'mail.com',
  'yandex.com',
  'live.com',
  'gmx.com',
];

function normalizeDomain(inputStr) {
  if (!inputStr) return '';
  let clean = String(inputStr).trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//i, '');
  clean = clean.replace(/^www\./i, '');
  clean = clean.split('/')[0];
  if (clean.includes('@')) {
    clean = clean.split('@')[1];
  }
  return clean;
}
const DEPARTMENTS = [
  'Engineering',
  'Data Science',
  'Product',
  'Human Resources',
  'Finance',
  'Marketing',
  'Operations',
  'Sales',
  'Information Technology',
  'Other',
];

/* ─── Role Options ───────────────────────────────────────────── */
const ROLES = [
  { id: 'Employee', label: 'Employee (Self-Registration)', requiresApproval: false },
  { id: 'Manager / Team Lead', label: 'Manager / Team Lead (Requires Approval)', requiresApproval: true },
  { id: 'HR / Department Head', label: 'HR / Department Head (Requires Approval)', requiresApproval: true },
  { id: 'Organization Administrator', label: 'Organization Administrator (Requires Authorization)', requiresApproval: true },
];

/* ─── Inline SVG Icons ───────────────────────────────────────── */
function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"/>
      <path d="M9 8h1"/>
      <path d="M9 12h1"/>
      <path d="M9 16h1"/>
      <path d="M14 8h1"/>
      <path d="M14 12h1"/>
      <path d="M14 16h1"/>
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}

function IconEyeOpen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function IconArrow() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

function IconAlert() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
      <path fill="#f35325" d="M0 0h11v11H0z"/>
      <path fill="#81bc06" d="M12 0h11v11H12z"/>
      <path fill="#05a6f0" d="M0 12h11v11H0z"/>
      <path fill="#ffba08" d="M12 12h11v11H12z"/>
    </svg>
  );
}

function Spinner() {
  return <span className="loading-spinner w-4 h-4 border-2" aria-hidden="true" />;
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="form-error mt-1" role="alert">
      {message}
    </p>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REGISTER PAGE
═══════════════════════════════════════════════════════════════ */
export default function Register() {
  const navigate = useNavigate();

  // Step 1 vs Step 2 Wizard state
  const [step, setStep] = useState(1);

  // Form Fields
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    jobTitle: '',
    department: 'Engineering',
    organizationName: '',
    companyDomain: '',
    requestedRole: 'Employee',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);
  const [socialBanner, setSocialBanner] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  // Password Strength Calculation (Weak / Medium / Strong)
  function getPasswordStrength(pw) {
    if (!pw) return { label: '', color: 'bg-slate-200', pct: 0 };
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (pw.length < 8 || score <= 1) {
      return { label: 'Weak', color: 'bg-red-500 text-red-600', pct: 33 };
    } else if (score === 2 || score === 3) {
      return { label: 'Medium', color: 'bg-amber-500 text-amber-600', pct: 66 };
    }
    return { label: 'Strong', color: 'bg-emerald-500 text-emerald-600', pct: 100 };
  }

  const pwStrength = getPasswordStrength(form.password);

  // Enterprise Domain Evaluation
  const emailDomain = normalizeDomain(form.workEmail);
  const companyDomainNorm = normalizeDomain(form.companyDomain);

  const isPublicCompanyDomain = PUBLIC_EMAIL_PROVIDERS.includes(companyDomainNorm);
  const isPublicWorkEmailDomain = PUBLIC_EMAIL_PROVIDERS.includes(emailDomain);

  let domainNotice = null;
  if (companyDomainNorm || emailDomain) {
    if (isPublicCompanyDomain || isPublicWorkEmailDomain) {
      domainNotice = {
        type: 'warning',
        text: '⚠️ Please use your organization\'s work email domain for enterprise registration (e.g. name@company.com).',
      };
    } else if (emailDomain && companyDomainNorm && emailDomain === companyDomainNorm) {
      domainNotice = {
        type: 'success',
        text: `✓ Work email domain matches organization domain (${companyDomainNorm}).`,
      };
    } else if (emailDomain && companyDomainNorm && emailDomain !== companyDomainNorm) {
      domainNotice = {
        type: 'warning',
        text: `⚠️ Work email domain (${emailDomain}) does not match organization domain (${companyDomainNorm}).`,
      };
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setForm(prev => {
      const updated = { ...prev, [name]: val };
      // Auto-extract domain from work email if companyDomain is empty
      if (name === 'workEmail' && val.includes('@') && !prev.companyDomain) {
        const domainParts = val.split('@')[1];
        if (domainParts && domainParts.includes('.')) {
          updated.companyDomain = domainParts;
        }
      }
      return updated;
    });

    if (errors[name] || errors.form) {
      setErrors(prev => ({ ...prev, [name]: '', form: '' }));
    }
  }

  // Validate Step 1
  function validateStep1() {
    const e = {};
    if (!form.firstName.trim() || form.firstName.trim().length < 2) {
      e.firstName = 'First name is required.';
    }
    if (!form.lastName.trim() || form.lastName.trim().length < 2) {
      e.lastName = 'Last name is required.';
    }
    if (!form.workEmail.trim()) {
      e.workEmail = 'Work email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.workEmail.trim())) {
      e.workEmail = 'Enter a valid work email address.';
    }
    if (!form.jobTitle.trim() || form.jobTitle.trim().length < 2) {
      e.jobTitle = 'Job title is required.';
    }
    if (!form.department) {
      e.department = 'Please select your department.';
    }
    return e;
  }

  // Validate Step 2 & Final Submission
  function validateStep2() {
    const e = {};
    if (!form.organizationName.trim() || form.organizationName.trim().length < 2) {
      e.organizationName = 'Organization name is required.';
    }
    if (!form.password) {
      e.password = 'Password is required.';
    } else if (form.password.length < 8) {
      e.password = 'Password must be at least 8 characters.';
    }
    if (!form.confirmPassword) {
      e.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match.';
    }
    if (!form.agreeTerms) {
      e.agreeTerms = 'Please accept the Terms of Service.';
    }
    return e;
  }

  function handleNextStep(e) {
    e.preventDefault();
    const errs = validateStep1();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs1 = validateStep1();
    const errs2 = validateStep2();
    const combinedErrs = { ...errs1, ...errs2 };

    if (Object.keys(combinedErrs).length > 0) {
      if (Object.keys(errs1).length > 0) setStep(1);
      setErrors(combinedErrs);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await apiRegister(form);
      setSuccessData(res);
    } catch (err) {
      setErrors({ form: err.message || 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  }

  function handleSocialClick(provider) {
    setSocialBanner(`${provider} sign-in will be available soon.`);
    setTimeout(() => setSocialBanner(null), 4000);
  }

  return (
    <div className="auth-split-page">

      {/* ── Left Brand Panel ───────────────────────── */}
      <div className="auth-left-panel">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" aria-hidden="true" />
        <div className="absolute bottom-10 -left-16 w-80 h-80 rounded-full bg-blue-500/10" aria-hidden="true" />
        <div className="absolute top-1/2 -right-8 w-44 h-44 rounded-full bg-indigo-500/10" aria-hidden="true" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">KnowledgeGap</p>
              <p className="text-blue-300 text-[10px] font-medium">Intelligence Platform</p>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-white leading-tight mb-4 text-balance">
            Empower Your Workforce with Intelligent Growth.
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed mb-8 max-w-sm">
            Enterprise-grade organizational intelligence that identifies, tracks, and resolves competency gaps across teams and departments.
          </p>

          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-item text-blue-100">
                <div className="feature-icon"><span className="text-xs">{f.icon}</span></div>
                <span className="text-xs leading-snug">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ───────────────────────── */}
      <div className="auth-right-panel">
        <div className="auth-form-container animate-fadeIn">

          {/* Social Auth Info Banner */}
          {socialBanner && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <span>ℹ️</span>
              <span>{socialBanner}</span>
            </div>
          )}

          {/* SUCCESS CONFIRMATION SCREEN */}
          {successData ? (
            <div className="space-y-6 text-center py-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold shadow-sm">
                ✓
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {successData.status === 'Active' ? 'Account Created Successfully' : 'Registration Request Submitted'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {successData.status === 'Active'
                    ? 'Your organization account is ready. You can now sign in with your work credentials.'
                    : 'Your account request has been routed for organizational approval.'}
                </p>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 py-1 px-3.5 rounded-full border text-xs font-bold bg-amber-50 text-amber-700 border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Status: {successData.status || 'Pending Approval'}</span>
              </div>

              {/* Account Summary Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="font-bold text-slate-900">{successData.record?.name || `${form.firstName} ${form.lastName}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Work Email:</span>
                  <span className="font-bold text-slate-900">{successData.record?.workEmail || form.workEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Organization:</span>
                  <span className="font-bold text-slate-900">{successData.record?.organizationName || form.organizationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department &amp; Title:</span>
                  <span className="font-bold text-slate-900">{form.jobTitle} &bull; {form.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested Role:</span>
                  <span className="font-bold text-purple-700">{form.requestedRole}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn-primary w-full text-xs py-3 flex items-center justify-center gap-2"
                >
                  Return to Sign In <IconArrow />
                </button>
              </div>
            </div>
          ) : (
            /* WIZARD REGISTRATION FORM */
            <div>
              {/* Form Heading & Progress Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-extrabold text-slate-900">Create Work Account</h2>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    Step {step} of 2
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {step === 1 ? 'Step 1: Personal & Workforce Information' : 'Step 2: Organization & Security Settings'}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className={`h-full bg-blue-600 transition-all duration-300 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
                </div>
              </div>

              {/* Form Error Alert */}
              {errors.form && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2" role="alert">
                  <IconAlert />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* STEP 1 FORM */}
              {step === 1 && (
                <form onSubmit={handleNextStep} noValidate className="space-y-4">
                  {/* First & Last Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="reg-firstname" className="form-label text-xs">First Name *</label>
                      <input
                        id="reg-firstname"
                        name="firstName"
                        type="text"
                        required
                        value={form.firstName}
                        onChange={handleChange}
                        placeholder="Jane"
                        className={errors.firstName ? 'form-input text-xs form-input-error' : 'form-input text-xs'}
                      />
                      <FieldError id="reg-firstname-err" message={errors.firstName} />
                    </div>

                    <div>
                      <label htmlFor="reg-lastname" className="form-label text-xs">Last Name *</label>
                      <input
                        id="reg-lastname"
                        name="lastName"
                        type="text"
                        required
                        value={form.lastName}
                        onChange={handleChange}
                        placeholder="Smith"
                        className={errors.lastName ? 'form-input text-xs form-input-error' : 'form-input text-xs'}
                      />
                      <FieldError id="reg-lastname-err" message={errors.lastName} />
                    </div>
                  </div>

                  {/* Work Email */}
                  <div>
                    <label htmlFor="reg-email" className="form-label text-xs">Work Email *</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon-left"><IconMail /></span>
                      <input
                        id="reg-email"
                        name="workEmail"
                        type="email"
                        required
                        value={form.workEmail}
                        onChange={handleChange}
                        placeholder="name@company.com"
                        className={errors.workEmail ? 'form-input-icon form-input-icon-error text-xs' : 'form-input-icon text-xs'}
                      />
                    </div>
                    <FieldError id="reg-email-err" message={errors.workEmail} />
                  </div>

                  {/* Job Title */}
                  <div>
                    <label htmlFor="reg-jobtitle" className="form-label text-xs">Job Title *</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon-left"><IconBriefcase /></span>
                      <input
                        id="reg-jobtitle"
                        name="jobTitle"
                        type="text"
                        required
                        value={form.jobTitle}
                        onChange={handleChange}
                        placeholder="e.g. Senior Frontend Engineer"
                        className={errors.jobTitle ? 'form-input-icon form-input-icon-error text-xs' : 'form-input-icon text-xs'}
                      />
                    </div>
                    <FieldError id="reg-jobtitle-err" message={errors.jobTitle} />
                  </div>

                  {/* Department */}
                  <div>
                    <label htmlFor="reg-dept" className="form-label text-xs">Department *</label>
                    <select
                      id="reg-dept"
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      className="form-select text-xs w-full"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full text-xs py-3 mt-4 flex items-center justify-center gap-2"
                  >
                    Continue to Step 2 <IconArrow />
                  </button>
                </form>
              )}

              {/* STEP 2 FORM */}
              {step === 2 && (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">

                  {/* Organization & Domain */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="reg-org" className="form-label text-xs">Organization Name *</label>
                      <div className="input-icon-wrap">
                        <span className="input-icon-left"><IconBuilding /></span>
                        <input
                          id="reg-org"
                          name="organizationName"
                          type="text"
                          required
                          value={form.organizationName}
                          onChange={handleChange}
                          placeholder="e.g. Acme Technologies"
                          className={errors.organizationName ? 'form-input-icon form-input-icon-error text-xs' : 'form-input-icon text-xs'}
                        />
                      </div>
                      <FieldError id="reg-org-err" message={errors.organizationName} />
                    </div>

                    <div>
                      <label htmlFor="reg-domain" className="form-label text-xs">Company Domain</label>
                      <input
                        id="reg-domain"
                        name="companyDomain"
                        type="text"
                        value={form.companyDomain}
                        onChange={handleChange}
                        placeholder="e.g. acme.com"
                        className="form-input text-xs"
                      />
                    </div>
                  </div>

                  {/* Domain Match / Mismatch / Public Provider Indicator */}
                  {domainNotice && (
                    <div className={`p-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 ${
                      domainNotice.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      <span>{domainNotice.text}</span>
                    </div>
                  )}

                  {/* Requested Role */}
                  <div>
                    <label htmlFor="reg-role" className="form-label text-xs">Requested Role *</label>
                    <select
                      id="reg-role"
                      name="requestedRole"
                      value={form.requestedRole}
                      onChange={handleChange}
                      className="form-select text-xs w-full"
                    >
                      {ROLES.map(r => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      ℹ️ Manager, HR, and Administrator roles require organizational approval before access is granted.
                    </p>
                  </div>

                  {/* Password & Strength Indicator */}
                  <div>
                    <label htmlFor="reg-password" className="form-label text-xs">Password *</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon-left"><IconLock /></span>
                      <input
                        id="reg-password"
                        name="password"
                        type={showPw ? 'text' : 'password'}
                        required
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Min. 8 characters"
                        className={errors.password ? 'form-input-icon form-input-icon-right form-input-icon-error text-xs' : 'form-input-icon form-input-icon-right text-xs'}
                      />
                      <button
                        type="button"
                        className="eye-toggle"
                        onClick={() => setShowPw(v => !v)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                      >
                        {showPw ? <IconEyeOff /> : <IconEyeOpen />}
                      </button>
                    </div>
                    {/* Password Strength Indicator */}
                    {form.password && (
                      <div className="mt-1.5 space-y-1">
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${pwStrength.color.split(' ')[0]}`} style={{ width: `${pwStrength.pct}%` }} />
                        </div>
                        <span className={`text-[10px] font-bold ${pwStrength.color.split(' ')[1]}`}>
                          Strength: {pwStrength.label}
                        </span>
                      </div>
                    )}
                    <FieldError id="reg-password-err" message={errors.password} />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="reg-confirmpassword" className="form-label text-xs">Confirm Password *</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon-left"><IconLock /></span>
                      <input
                        id="reg-confirmpassword"
                        name="confirmPassword"
                        type={showCp ? 'text' : 'password'}
                        required
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        className={errors.confirmPassword ? 'form-input-icon form-input-icon-right form-input-icon-error text-xs' : 'form-input-icon form-input-icon-right text-xs'}
                      />
                      <button
                        type="button"
                        className="eye-toggle"
                        onClick={() => setShowCp(v => !v)}
                        aria-label={showCp ? 'Hide password' : 'Show password'}
                      >
                        {showCp ? <IconEyeOff /> : <IconEyeOpen />}
                      </button>
                    </div>
                    <FieldError id="reg-confirmpassword-err" message={errors.confirmPassword} />
                  </div>

                  {/* Terms & Privacy Checkbox */}
                  <div className="pt-1">
                    <div className="flex items-start gap-2">
                      <input
                        id="reg-terms"
                        name="agreeTerms"
                        type="checkbox"
                        checked={form.agreeTerms}
                        onChange={handleChange}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 cursor-pointer"
                      />
                      <label htmlFor="reg-terms" className="text-xs text-slate-600 select-none">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setTermsModalOpen(true)}
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={() => setTermsModalOpen(true)}
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Privacy Policy
                        </button>.
                      </label>
                    </div>
                    <FieldError id="reg-terms-err" message={errors.agreeTerms} />
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="btn-outline text-xs py-3 px-4 w-1/3"
                    >
                      ← Back
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary text-xs py-3 flex-1 flex items-center justify-center gap-2"
                    >
                      {loading ? <><Spinner /> Creating Account…</> : <>Create Account <IconArrow /></>}
                    </button>
                  </div>
                </form>
              )}

              {/* Social Login Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="space-y-2">
                  <button
                    type="button"
                    className="btn-social w-full text-xs"
                    onClick={() => handleSocialClick('Google')}
                  >
                    <GoogleLogo />
                    <span>Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    className="btn-social w-full text-xs"
                    onClick={() => handleSocialClick('Microsoft')}
                  >
                    <MicrosoftLogo />
                    <span>Continue with Microsoft</span>
                  </button>
                </div>
              </div>

              <p className="mt-6 text-center text-xs text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Terms & Privacy Legal Overlay Modal */}
      {termsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm">Terms of Service &amp; Privacy Policy</h3>
              <button
                type="button"
                onClick={() => setTermsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed flex-1">
              <h4 className="font-bold text-slate-900 text-sm">KnowledgeGap Platform Enterprise Agreement</h4>
              <p>
                By creating an account on the KnowledgeGap Intelligence Platform, your organization agrees to collect and process employee skill data in accordance with applicable data protection regulations.
              </p>
              <h5 className="font-bold text-slate-800">1. Data Privacy &amp; Confidentiality</h5>
              <p>
                All assessment scores, skill gap metrics, and competency evaluations remain strictly confidential to your organization and authorized administrators.
              </p>
              <h5 className="font-bold text-slate-800">2. Role Authorization</h5>
              <p>
                Manager, HR, and Administrator roles require explicit organizational verification before elevated administrative permissions are granted.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setTermsModalOpen(false)}
                className="btn-primary text-xs py-2 px-5"
              >
                I Understand &amp; Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
