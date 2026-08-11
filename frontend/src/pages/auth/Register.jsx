import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../../services/authService';

/* ─── Static content ────────────────────────────────────────── */
const FEATURES = [
  { icon: '📊', text: 'Executive analytics dashboard with real-time KPIs' },
  { icon: '🧠', text: 'AI-powered skill gap detection and recommendations' },
  { icon: '🗺️', text: 'Personalized learning roadmaps for every employee' },
  { icon: '🔬', text: 'Competency matrix across departments and roles' },
];


/* ─── Inline SVG icons ──────────────────────────────────────── */
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

/* ─── Google Logo ───────────────────────────────────────────── */
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

/* ─── Microsoft Logo ────────────────────────────────────────── */
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
    <p id={id} className="form-error" role="alert">
      <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {message}
    </p>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REGISTER PAGE
═══════════════════════════════════════════════════════════════ */
export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors,  setErrors]  = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showCp,  setShowCp]  = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name] || errors.form) setErrors(prev => ({ ...prev, [name]: '', form: '' }));
  }

  function validate() {
    const newErrors = {};
    if (!form.fullName.trim())
      newErrors.fullName = 'Full name is required.';
    if (!form.email.trim())
      newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Enter a valid email address.';
    if (!form.password)
      newErrors.password = 'Password is required.';
    else if (form.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters.';
    if (!form.confirmPassword)
      newErrors.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match.';
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await apiRegister({
        username: form.fullName.trim() || form.email.split('@')[0],
        email: form.email.trim(),
        password: form.password,
        role: 'ROLE_EMPLOYEE',
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setErrors({ form: err.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split-page">

      {/* ── Left Brand Panel ─────────────────────────────────── */}
      <div className="auth-left-panel">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" aria-hidden="true" />
        <div className="absolute bottom-10 -left-16 w-80 h-80 rounded-full bg-blue-500/10" aria-hidden="true" />
        <div className="absolute top-1/2 -right-8 w-44 h-44 rounded-full bg-indigo-500/10" aria-hidden="true" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
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
          <p className="text-blue-200 text-sm leading-relaxed mb-10 max-w-sm">
            Join thousands of corporate HR teams using data-driven insights to transform organizational talent strategy.
          </p>

          <div className="space-y-3.5">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-item text-blue-100">
                <div className="feature-icon"><span className="text-xs">{f.icon}</span></div>
                <span className="text-sm leading-snug">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────── */}
      <div className="auth-right-panel">
        <div className="auth-form-container animate-fadeIn">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-btn-primary">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-sm">KnowledgeGap Platform</span>
          </div>

          {success ? (
            /* ── Success State ─────────────────────────────── */
            <div className="text-center py-8 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
              <p className="text-sm text-slate-500">Redirecting you to the sign-in page…</p>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Create account</h2>
                <p className="text-sm text-slate-500">Join the KnowledgeGap Platform today</p>
              </div>

              {/* ── Social Login Buttons ──────────────────────── */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  aria-label="Continue with Google"
                  className="btn-social"
                  onClick={() => {/* OAuth not yet implemented */}}
                >
                  <GoogleLogo />
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  aria-label="Continue with Microsoft"
                  className="btn-social"
                  onClick={() => {/* OAuth not yet implemented */}}
                >
                  <MicrosoftLogo />
                  <span>Continue with Microsoft</span>
                </button>
              </div>

              {/* ── OR Divider ────────────────────────────────── */}
              <div className="auth-or-divider" role="separator" aria-label="or">
                <span>or</span>
              </div>

              {/* ── Form Error ────────────────────────────────── */}
              {errors.form && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2" role="alert">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{errors.form}</span>
                </div>
              )}

              {/* ── Register Form ─────────────────────────────── */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">

                {/* Full Name */}
                <div>
                  <label htmlFor="reg-fullName" className="form-label">Full Name</label>
                  <div className="input-icon-wrap">
                    <span className="input-icon-left" aria-hidden="true"><IconUser /></span>
                    <input
                      id="reg-fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Jane Smith"
                      className={errors.fullName ? 'form-input-icon form-input-icon-error' : 'form-input-icon'}
                      aria-describedby={errors.fullName ? 'reg-name-err' : undefined}
                      aria-invalid={!!errors.fullName}
                    />
                  </div>
                  <FieldError id="reg-name-err" message={errors.fullName} />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="reg-email" className="form-label">Email address</label>
                  <div className="input-icon-wrap">
                    <span className="input-icon-left" aria-hidden="true"><IconMail /></span>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@company.com"
                      className={errors.email ? 'form-input-icon form-input-icon-error' : 'form-input-icon'}
                      aria-describedby={errors.email ? 'reg-email-err' : undefined}
                      aria-invalid={!!errors.email}
                    />
                  </div>
                  <FieldError id="reg-email-err" message={errors.email} />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="reg-password" className="form-label">Password</label>
                  <div className="input-icon-wrap">
                    <span className="input-icon-left" aria-hidden="true"><IconLock /></span>
                    <input
                      id="reg-password"
                      name="password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min. 6 characters"
                      className={errors.password ? 'form-input-icon form-input-icon-right form-input-icon-error' : 'form-input-icon form-input-icon-right'}
                      aria-describedby={errors.password ? 'reg-pw-err' : undefined}
                      aria-invalid={!!errors.password}
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
                  <FieldError id="reg-pw-err" message={errors.password} />
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="reg-confirmPassword" className="form-label">Confirm Password</label>
                  <div className="input-icon-wrap">
                    <span className="input-icon-left" aria-hidden="true"><IconLock /></span>
                    <input
                      id="reg-confirmPassword"
                      name="confirmPassword"
                      type={showCp ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className={errors.confirmPassword ? 'form-input-icon form-input-icon-right form-input-icon-error' : 'form-input-icon form-input-icon-right'}
                      aria-describedby={errors.confirmPassword ? 'reg-cp-err' : undefined}
                      aria-invalid={!!errors.confirmPassword}
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => setShowCp(v => !v)}
                      aria-label={showCp ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showCp ? <IconEyeOff /> : <IconEyeOpen />}
                    </button>
                  </div>
                  <FieldError id="reg-cp-err" message={errors.confirmPassword} />
                </div>

                {/* Submit Button */}
                <button
                  id="register-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="btn-auth-submit"
                  aria-busy={loading}
                >
                  {loading ? (
                    <><Spinner /> Creating account…</>
                  ) : (
                    <>Create Account <IconArrow /></>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
