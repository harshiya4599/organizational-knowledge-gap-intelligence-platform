import React from 'react';

/**
 * ErrorBoundary
 * Catches any unexpected JS rendering errors in child components
 * and renders a clean error view with diagnostic information.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-fadeIn my-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl mb-4 text-amber-600 shadow-sm">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Display Notice</h2>
          <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
            The requested module experienced a temporary rendering issue. Click below to refresh and reload presentation data.
          </p>

          {/* Diagnostic Error Details */}
          {this.state.error && (
            <div className="w-full text-left bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs text-slate-700 font-mono overflow-x-auto max-h-48">
              <p className="font-bold text-red-600 mb-1">{this.state.error?.toString()}</p>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[10px] text-slate-500 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="btn-primary text-xs flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Reload Page Data
            </button>
            <a
              href="/dashboard"
              className="btn-outline text-xs"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
