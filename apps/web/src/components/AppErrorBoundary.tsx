import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: "'Anthropic Sans', Arial, sans-serif",
          color: '#141413',
          background: '#faf9f5',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Error al cargar la aplicación</h1>
          <pre style={{
            background: '#f0eee6',
            padding: '1rem',
            borderRadius: '0.5rem',
            fontSize: '0.8rem',
            maxWidth: '600px',
            overflow: 'auto',
            border: '1px solid #b0aea5',
          }}>
            {this.state.error?.message ?? 'Error desconocido'}
          </pre>
          <button
            onClick={() => {
              localStorage.removeItem('mkt-agency-auth');
              window.location.href = '/login';
            }}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.5rem',
              background: '#141413',
              color: '#faf9f5',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Limpiar sesión y volver
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}