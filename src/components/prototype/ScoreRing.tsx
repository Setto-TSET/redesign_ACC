'use client';

import { useEffect, useRef } from 'react';
import { animate, utils } from 'animejs';
import { prefersReducedMotion } from './motion';

const R = 36;
const C = 2 * Math.PI * R;

export function ScoreRing({
  value,
  total,
  label,
}: {
  value: number;
  total: number;
  label: string;
}) {
  const arcRef = useRef<SVGCircleElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const target = total > 0 ? C * (1 - value / total) : C;

  useEffect(() => {
    const count = countRef.current;
    if (!arcRef.current || !count || prefersReducedMotion()) return;
    const a = animate(arcRef.current, {
      strokeDashoffset: [C, target],
      duration: 600,
      ease: 'outQuad',
    });
    const n = { v: 0 };
    const c = animate(n, {
      v: value,
      duration: 600,
      ease: 'outQuad',
      modifier: utils.round(0),
      onUpdate: () => {
        count.textContent = String(n.v);
      },
    });
    return () => {
      a.revert();
      c.revert();
      count.textContent = String(value);
    };
  }, [value, target]);

  return (
    <div
      role="img"
      aria-label={`${label} ${value} จาก ${total}`}
      className="inline-flex flex-col items-center gap-1"
    >
      <div className="relative h-24 w-24">
        <svg
          viewBox="0 0 88 88"
          className="h-full w-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="44"
            cy="44"
            r={R}
            fill="none"
            strokeWidth="8"
            stroke="var(--border-light)"
          />
          <circle
            ref={arcRef}
            cx="44"
            cy="44"
            r={R}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            stroke="var(--accent)"
            strokeDasharray={C}
            strokeDashoffset={target}
          />
        </svg>
        <p
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums"
        >
          <span data-count ref={countRef}>
            {value}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--ink-secondary)' }}
          >
            /{total}
          </span>
        </p>
      </div>
      <span
        aria-hidden="true"
        className="text-xs font-semibold"
        style={{ color: 'var(--ink-secondary)' }}
      >
        {label}
      </span>
    </div>
  );
}
