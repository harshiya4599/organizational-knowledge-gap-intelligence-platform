import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login as apiLogin } from '../../services/authService';

/* ─── Static Brand Features ─────────────────────────────────── */
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

function IconAlert() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

/* ─── Google Logo SVG ───────────────────────────────────────── */
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

/* ─── Microsoft Logo SVG ────────────────────────────────────── */
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

/* ─── Spinner ───────────────────────────────────────────────── */
function Spinner() {
  return <span className="loading-spinner w-4 h-4 border-2" aria-hidden="true" />;
}

/* ─── Reusable error message ────────────────────────────────── */
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

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form,       setForm]       = useState({ email: '', password: '' });
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);
  const [showPw,     setShowPw]     = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  // UI-only role selection — does NOT grant permissions.
  // The backend/JWT is the actual authority for authentication and role assignment.
  const [selectedRole, setSelectedRole] = useState('Employee');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name] || errors.form) setErrors(prev => ({ ...prev, [name]: '', form: '' }));
  }

  function validate() {
    const e = {};
    if (!form.email.trim()) e.email    = 'Username or Email is required.';
    if (!form.password)     e.password = 'Password is required.';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      const res = await apiLogin(form.email, form.password, selectedRole);
      login(res.user, res.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Network error (backend not running) — do not expose server internals
      if (err.isNetworkError) {
        setErrors({ form: 'Cannot reach the server. Please try again in a moment.' });
        return;
      }
      const status = err.status || err.response?.status;
      if (status === 401 || status === 403) {
        setErrors({ form: 'Incorrect username or password. Please try again.' });
      } else if (status === 400) {
        setErrors({ form: 'Incorrect username or password. Please try again.' });
      } else {
        setErrors({ form: 'Incorrect username or password. Please try again.' });
      }
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
            Close Every Skill Gap. Unlock Every Team's Potential.
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed mb-10 max-w-sm">
            Enterprise-grade organizational intelligence that identifies, tracks, and resolves competency gaps across teams and departments.
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

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-sm text-slate-500">Sign in to your workspace to continue</p>
          </div>

          {/* ── Form Error ───────────────────────────────────── */}
          {errors.form && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2" role="alert">
              <IconAlert />
              <span>{errors.form}</span>
            </div>
          )}

          {/* ── Login Form ───────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Role Selection (UI hint only — backend validates actual role) */}
            <div>
              <label htmlFor="login-role" className="form-label">Role</label>
              <div className="input-icon-wrap">
                <span className="input-icon-left" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </span>
                <select
                  id="login-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="form-input-icon w-full appearance-none pr-8 cursor-pointer bg-white"
                  aria-label="Select your role"
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Administrator">Organization Administrator</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </div>
            </div>

            {/* Username / Email */}
            <div>
              <label htmlFor="login-email" className="form-label">Username or Email</label>
              <div className="input-icon-wrap">
                <span className="input-icon-left" aria-hidden="true"><IconUser /></span>
                <input
                  id="login-email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@company.com or username"
                  className={errors.email ? 'form-input-icon form-input-icon-error' : 'form-input-icon'}
                  aria-describedby={errors.email ? 'login-email-err' : undefined}
                  aria-invalid={!!errors.email}
                />
              </div>
              <FieldError id="login-email-err" message={errors.email} />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="form-label mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  tabIndex={0}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="input-icon-wrap">
                <span className="input-icon-left" aria-hidden="true"><IconLock /></span>
                <input
                  id="login-password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={errors.password ? 'form-input-icon form-input-icon-right form-input-icon-error' : 'form-input-icon form-input-icon-right'}
                  aria-describedby={errors.password ? 'login-pw-err' : undefined}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPw ? <IconEyeOff /> : <IconEyeOpen />}
                </button>
              </div>
              <FieldError id="login-pw-err" message={errors.password} />
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                id="login-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
              />
              <label htmlFor="login-remember" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Sign In Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-auth-submit"
              aria-busy={loading}
            >
              {loading ? (
                <><Spinner /> Signing in…</>
              ) : (
                <>Sign In <IconArrow /></>
              )}
            </button>
          </form>

          {/* ── OR Divider ───────────────────────────────────── */}
          <div className="auth-or-divider" role="separator" aria-label="or">
            <span>or</span>
          </div>

          {/* ── Social Login Buttons ─────────────────────────── */}
          <div className="space-y-2.5">
            <button
              type="button"
              aria-label="Continue with Google"
              className="btn-social"
              onClick={() => { window.location.href = 'http://localhost:8080/oauth2/authorization/google'; }}
            >
              <GoogleLogo />
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              aria-label="Continue with Microsoft"
              className="btn-social"
              onClick={() => { window.location.href = 'http://localhost:8080/oauth2/authorization/github'; }}
            >
              <MicrosoftLogo />
              <span>Continue with Microsoft</span>
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

