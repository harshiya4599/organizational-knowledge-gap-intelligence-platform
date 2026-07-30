import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword as apiForgotPassword } from '../../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setToken('');

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiForgotPassword(email.trim());
      setMessage(response.message || 'If the account exists, a reset token has been sent.');
      setToken(response.token || '');
    } catch (err) {
      setError(err.message || 'Unable to submit forgot password request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split-page">
      <div className="auth-left-panel">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-10 -left-16 w-80 h-80 rounded-full bg-blue-500/10" />
        <div className="absolute top-1/2 -right-8 w-40 h-40 rounded-full bg-indigo-500/10" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">KnowledgeGap</p>
              <p className="text-blue-300 text-[10px] font-medium">Intelligence Platform</p>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-white leading-tight mb-4 text-balance">
            Recover your account securely.
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed mb-10 max-w-sm">
            Enter your email address to receive a password reset token. For development, the token will be shown directly after submission.
          </p>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-form-container animate-fadeIn">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Forgot Password</h2>
            <p className="text-sm text-slate-500">We’ll send a reset token to your email address.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold">
              {message}
              {token && <div className="mt-3 text-slate-700 break-all">Token: {token}</div>}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm mt-2"
            >
              {loading ? 'Submitting…' : 'Send reset token'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Remembered your password?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
