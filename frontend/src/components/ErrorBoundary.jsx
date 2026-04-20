import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('⚠️ [ErrorBoundary] Caught an error:', error, errorInfo);
  }

  handleReset = () => {
    window.location.href = '/dashboard';
  };

  render() {
    const { variant = 'full' } = this.props;

    if (this.state.hasError) {
      if (variant === 'inline') {
        return (
          <div style={{
            padding: '20px',
            background: 'rgba(255, 107, 157, 0.05)',
            border: '1px dashed rgba(255, 107, 157, 0.3)',
            borderRadius: '12px',
            textAlign: 'center',
            color: 'var(--text-main)'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>Component Error</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {this.state.error?.toString().substring(0, 60)}...
            </div>
            <button 
              className="btn btn-secondary btn-xs"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Retry
            </button>
          </div>
        );
      }

      return (
        <div style={{
          height: '100vh',
// ... rest of the full page code ...
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
          color: 'var(--text-main)',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'Outfit, sans-serif'
        }}>
          <div style={{
            width: 80,
            height: 80,
            background: 'rgba(255, 107, 157, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            marginBottom: 24,
            border: '1px solid rgba(255, 107, 157, 0.2)'
          }}>
            🛰️
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
            Intelligence Link Interrupted
          </h2>
          <p style={{ maxWidth: 450, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 32 }}>
            It looks like a module encountered an unexpected state. Our engineering team has been notified.
          </p>
          
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '16px 24px',
            marginBottom: 32,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: 'var(--warning)',
            maxWidth: '100%',
            overflowX: 'auto'
          }}>
            {this.state.error?.toString() || 'Unknown Runtime Exception'}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              className="btn btn-primary"
              onClick={this.handleReset}
              style={{ padding: '12px 32px' }}
            >
              🔄 Reconnect Hub
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
              style={{ padding: '12px 24px' }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
