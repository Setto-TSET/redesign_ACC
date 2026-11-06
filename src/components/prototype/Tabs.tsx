'use client';

import { useId, type ReactNode } from 'react';

export function Tabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
  children,
}: {
  label: string;
  tabs: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (k: T) => void;
  children: ReactNode;
}) {
  const base = useId();
  const tabId = (k: T) => `${base}-tab-${k}`;
  const panelId = `${base}-panel`;

  return (
    <div className="card !p-0 overflow-hidden">
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2"
        onKeyDown={(e) => {
          const el = (e.target as HTMLElement).closest('[role=tab]');
          if (!el) return;
          const i = tabs.findIndex((t) => tabId(t.key) === el.id);
          const n = tabs.length;
          const j =
            e.key === 'ArrowRight'
              ? (i + 1) % n
              : e.key === 'ArrowLeft'
                ? (i - 1 + n) % n
                : e.key === 'Home'
                  ? 0
                  : e.key === 'End'
                    ? n - 1
                    : -1;
          if (j < 0) return;
          e.preventDefault();
          onChange(tabs[j].key);
          document.getElementById(tabId(tabs[j].key))?.focus();
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            id={tabId(t.key)}
            type="button"
            role="tab"
            aria-controls={panelId}
            aria-selected={t.key === value}
            tabIndex={t.key === value ? 0 : -1}
            onClick={() => onChange(t.key)}
            className="shrink-0 px-4 py-3 text-sm font-semibold border-b-2 -mb-px hover:bg-slate-50"
            style={
              t.key === value
                ? { borderColor: 'var(--accent)', color: 'var(--accent)' }
                : { borderColor: 'transparent', color: 'var(--ink-secondary)' }
            }
          >
            {t.label}
            {t.count !== undefined && (
              <>
                {' ('}
                <span className="tabular-nums">{t.count}</span>
                {')'}
              </>
            )}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId(value)}
        key={value}
        className="p-5 sm:p-6 animate-fade"
      >
        {children}
      </div>
    </div>
  );
}
