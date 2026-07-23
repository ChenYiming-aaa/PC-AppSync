import { Component } from 'react';
import { LangContext } from '../utils/i18n';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static contextType = LangContext;
  declare context: React.ContextType<typeof LangContext>;

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--md-surface-dim)', padding: 24,
        }}>
          <div style={{
            background: 'var(--md-surface)', borderRadius: 20,
            padding: 48, maxWidth: 440, width: '100%',
            boxShadow: 'var(--md-elevation-3)', textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--md-error-container)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <AlertTriangle size={28} color="var(--md-error)" />
            </div>
            <h2 style={{ marginBottom: 8, color: 'var(--md-on-surface)' }}>{this.context.t('error.title')}</h2>
            <p style={{
              color: 'var(--md-on-surface-variant)', fontSize: 14,
              marginBottom: 24, lineHeight: 1.5, wordBreak: 'break-word',
            }}>
              {this.state.error.message || this.context.t('error.unexpected')}
            </p>
            <button
              className="md-btn-filled"
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              style={{ padding: '12px 32px', fontSize: 15, fontWeight: 600 }}
            >
              <RefreshCw size={18} /> {this.context.t('error.reload')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
