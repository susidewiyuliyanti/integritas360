import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[INTEGRITAS360] React render failure:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: '100vh', background: '#111827', color: '#f9fafb', padding: '32px', fontFamily: 'system-ui, sans-serif' }}>
          <section style={{ maxWidth: 900, margin: '8vh auto', padding: 24, border: '1px solid #7f1d1d', borderRadius: 16, background: '#1f2937' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Dashboard gagal ditampilkan</h1>
            <p style={{ marginBottom: 12, color: '#d1d5db' }}>Aplikasi mengalami kesalahan saat merender halaman. Detail teknis:</p>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: '#fecaca', fontSize: 13 }}>{this.state.error.message || String(this.state.error)}</pre>
            <button onClick={() => window.location.assign('/login')} style={{ marginTop: 20, padding: '10px 16px', borderRadius: 10, background: '#f59e0b', color: '#111827', fontWeight: 700, cursor: 'pointer' }}>Kembali ke Login</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<main style="padding:32px;color:white;background:#111827;min-height:100vh;font-family:system-ui">INTEGRITAS360: elemen root aplikasi tidak ditemukan.</main>';
} else {
  // Surface startup errors instead of leaving users with an entirely black screen.
  const showStartupError = (message: string) => {
    rootElement.innerHTML = '';
    const panel = document.createElement('main');
    panel.style.cssText = 'min-height:100vh;padding:32px;background:#111827;color:#f9fafb;font:14px system-ui';
    const heading = document.createElement('h1');
    heading.textContent = 'Aplikasi gagal dimulai';
    heading.style.cssText = 'font-size:22px;font-weight:800;margin-bottom:12px';
    const detail = document.createElement('pre');
    detail.textContent = message;
    detail.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;color:#fecaca';
    panel.append(heading, detail);
    rootElement.append(panel);
  };

  window.addEventListener('error', (event) => {
    showStartupError(event.message || 'Kesalahan JavaScript saat memulai aplikasi.');
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    showStartupError(reason instanceof Error ? reason.message : String(reason ?? 'Promise gagal tanpa detail.'));
  });

  createRoot(rootElement).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>,
  );
}
