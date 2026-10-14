import { IconCheck } from '@tabler/icons-react';

/** แถบขั้นตอนของฟอร์มยาว — บนมือถือแสดงชื่อเฉพาะขั้นปัจจุบัน */
export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex items-center gap-2 mb-6" aria-label="ขั้นตอน">
      {steps.map((s, i) => {
        const done = i < current;
        const reached = i <= current;
        return (
          <li
            key={s}
            className="flex items-center gap-2 flex-1 min-w-0 last:flex-none"
            aria-current={i === current ? 'step' : undefined}
          >
            <span
              className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
              style={
                reached
                  ? { background: 'var(--accent)', color: '#fff' }
                  : {
                      background: 'var(--border-light)',
                      color: 'var(--ink-tertiary)',
                    }
              }
            >
              {done ? <IconCheck size={14} stroke={3} /> : i + 1}
            </span>
            <span
              className={`text-sm truncate ${i === current ? 'font-semibold' : 'hidden sm:inline'}`}
              style={{ color: reached ? 'var(--ink)' : 'var(--ink-tertiary)' }}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <span
                className="h-px flex-1 min-w-3"
                style={{ background: done ? 'var(--accent)' : 'var(--border)' }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
