'use client';

/** กลุ่ม chip เลือกได้ค่าเดียว (radiogroup) — คลาสเดียวกับ chip สถานะหน้าคำขอ */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (k: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-wrap gap-2"
      onKeyDown={(e) => {
        const n = options.length;
        const i = options.findIndex((o) => o.key === value);
        const j =
          e.key === 'ArrowRight' || e.key === 'ArrowDown'
            ? (i + 1) % n
            : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
              ? (i - 1 + n) % n
              : -1;
        if (j < 0) return;
        e.preventDefault();
        onChange(options[j].key);
        e.currentTarget
          .querySelectorAll<HTMLElement>('[role=radio]')
          [j]?.focus();
      }}
    >
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.key)}
            className="min-h-10 sm:min-h-0 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors hover:bg-slate-50"
            style={
              on
                ? {
                    background: 'var(--accent-soft)',
                    borderColor: 'var(--accent)',
                    color: 'var(--accent)',
                  }
                : {
                    borderColor: 'var(--border)',
                    color: 'var(--ink-secondary)',
                  }
            }
          >
            {o.label}
            {o.count !== undefined && (
              <>
                {' ('}
                <span className="tabular-nums">{o.count}</span>
                {')'}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
