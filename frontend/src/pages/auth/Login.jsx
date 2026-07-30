import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login as apiLogin } from '../../services/authService';

const FEATURES = [
  { icon: '📊', text: 'Executive analytics dashboard with real-time KPIs' },
  { icon: '🧠', text: 'AI-powered skill gap detection and recommendations' },
  { icon: '🗺️', text: 'Personalized learning roadmaps for every employee' },
  { icon: '🔬', text: 'Competency matrix across departments and roles' },
];

const STATS = [
  { value: '2,400+', label: 'Employees Tracked' },
  { value: '94%',   label: 'Gap Reduction Rate' },
  { value: '18K',   label: 'Skills Mapped' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name] || errors.form) setErrors(prev => ({ ...prev, [name]: '', form: '' }));
  }

  function validate() {
    const e = {};
    if (!form.email.trim())   e.email    = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password)       e.password = 'Password is required.';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      const res = await apiLogin(form.email, form.password);
      login(res.user, res.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors({ form: err.message || 'Login failed. Invalid email or password.' });
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="auth-split-page">

      {/* ── Left Brand Panel ───────────────────────────── */}
      <div className="auth-left-panel">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-10 -left-16 w-80 h-80 rounded-full bg-blue-500/10" />
        <div className="absolute top-1/2 -right-8 w-40 h-40 rounded-full bg-indigo-500/10" />

        {/* Top: Logo */}
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
            Enterprise-grade HR analytics that identifies, tracks, and resolves organizational knowledge gaps at every level.
          </p>

          {/* Feature list */}
          <div className="space-y-3.5">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-item text-blue-100">
                <div className="feature-icon">
                  <span className="text-xs">{f.icon}</span>
                </div>
                <span className="text-sm leading-snug">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Stats */}
        <div className="relative z-10 mt-10">
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/15">
            {STATS.map((s, i) => (
              <div key={i}>
                <p className="text-xl font-extrabold text-white">{s.value}</p>
                <p className="text-[11px] text-blue-300 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ───────────────────────────── */}
      <div className="auth-right-panel">
        <div className="auth-form-container animate-fadeIn">

          {/* Mobile logo (visible only on small screens) */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-btn-primary">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-sm">KnowledgeGap Platform</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Welcome back</h2>
            <p className="text-sm text-slate-500">Sign in to your workspace to continue</p>
          </div>

          {errors.form && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{errors.form}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            <div>
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email" name="email" type="email" autoComplete="email"
                value={form.email} onChange={handleChange}
                placeholder="you@company.com"
                className={errors.email ? 'form-input-error' : 'form-input'}
                aria-describedby={errors.email ? 'email-err' : undefined}
              />
              {errors.email && (
                <p id="email-err" className="form-error">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="form-label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline font-medium">Forgot password?</Link>
              </div>
              <input
                id="password" name="password" type="password" autoComplete="current-password"
                value={form.password} onChange={handleChange}
                placeholder="••••••••"
                className={errors.password ? 'form-input-error' : 'form-input'}
                aria-describedby={errors.password ? 'pw-err' : undefined}
              />
              {errors.password && (
                <p id="pw-err" className="form-error">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {errors.password}
                </p>
              )}
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm mt-2"
            >
              {loading ? (
                <><span className="loading-spinner w-4 h-4 border-2" /> Signing in…</>
              ) : (
                <>Sign In <svg className="w-3.5 h-3.5 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-semibold">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
