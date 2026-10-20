'use client';

import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { IconCheck } from '@tabler/icons-react';
import { formatDate } from '@/lib/format';
import { prefersReducedMotion } from './motion';

/** current = index ขั้นปัจจุบัน; current >= steps.length = เสร็จทุกขั้น */
export function CycleTimeline({
  steps,
  current,
  orientation = 'horizontal',
}: {
  steps: { label: string; date?: string; note?: string }[];
  current: number;
  orientation?: 'horizontal' | 'vertical';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const horiz = orientation === 'horizontal';

  useEffect(() => {
    const box = ref.current;
    if (!box || prefersReducedMotion()) return;
    const lines = box.querySelectorAll('[data-line]');
    const dot = box.querySelector('[aria-current="step"] [data-dot]');
    const a = animate(lines, {
      scale: [0, 1],
      duration: 220,
      delay: stagger(Math.min(60, 360 / Math.max(lines.length, 1))),
      ease: 'outQuad',
    });
    const b = dot
      ? animate(dot, {
          scale: [0.6, 1.12, 1],
          duration: 420,
          delay: Math.min(lines.length * 60, 180),
          ease: 'outBack',
        })
      : null;
    return () => {
      a.revert();
      b?.revert();
    };
  }, [current, orientation]);

  return (
    <div ref={ref} className={horiz ? 'sm:overflow-x-auto' : undefined}>
      <ol
        className={`flex flex-col ${horiz ? 'sm:flex-row sm:min-w-max' : ''}`}
      >
        {steps.map((s, i) => {
          const done = i < current;
          const now = i === current;
          const last = i === steps.length - 1;
          return (
            <li
              key={i}
              aria-current={now ? 'step' : undefined}
              className={`relative flex gap-3 ${last ? '' : 'pb-6'} ${
                horiz ? 'sm:flex-col sm:flex-1 sm:min-w-36 sm:pb-0 sm:pr-3' : ''
              }`}
            >
              {/* เส้นเชื่อมไปขั้นถัดไป — เคลื่อนไหวเฉพาะขั้นที่ผ่านแล้ว */}
              {!last && (
                <span
                  aria-hidden="true"
                  data-line={done ? '' : undefined}
                  className={`absolute left-[15px] top-8 bottom-0 w-0.5 origin-top ${
                    horiz
                      ? 'sm:left-8 sm:top-[15px] sm:bottom-auto sm:right-0 sm:h-0.5 sm:w-auto sm:origin-left'
                      : ''
                  }`}
                  style={{
                    background: done ? 'var(--accent)' : 'var(--border)',
                  }}
                />
              )}
              <span
                data-dot
                className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-white"
                style={
                  done
                    ? {
                        background: 'var(--accent)',
                        borderColor: 'var(--accent)',
                        color: '#fff',
                      }
                    : { borderColor: now ? 'var(--accent)' : 'var(--border)' }
                }
              >
                {done ? (
                  <IconCheck aria-hidden="true" size={16} />
                ) : (
                  <span
                    className="text-xs font-semibold tabular-nums"
                    style={{
                      color: now ? 'var(--accent)' : 'var(--ink-secondary)',
                    }}
                  >
                    {i + 1}
                  </span>
                )}
              </span>
              <div className={`min-w-0 ${horiz ? 'sm:mt-2' : ''}`}>
                <p
                  className="text-sm font-semibold break-words"
                  style={now ? { color: 'var(--accent)' } : undefined}
                >
                  {s.label}
                </p>
                {s.date && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    {formatDate(s.date)}
                  </p>
                )}
                {s.note && (
                  <p
                    className="text-xs mt-1 break-words"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    {s.note}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
