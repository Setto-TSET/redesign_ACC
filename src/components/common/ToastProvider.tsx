'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--toast-bg)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
        },
        success: {
          style: { background: 'var(--accent)' },
          iconTheme: { primary: '#fff', secondary: 'var(--accent)' },
        },
        error: {
          style: { background: 'var(--danger)' },
          iconTheme: { primary: '#fff', secondary: 'var(--danger)' },
        },
      }}
    />
  );
}
