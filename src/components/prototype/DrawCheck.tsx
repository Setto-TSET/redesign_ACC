'use client';

import { useEffect, useRef } from 'react';
import { animate, svg } from 'animejs';
import { prefersReducedMotion } from './motion';

/** เครื่องหมายถูกที่วาดเส้นตอน mount */
export function DrawCheck({ size = 48 }: { size?: number }) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!pathRef.current || prefersReducedMotion()) return;
    const a = animate(svg.createDrawable(pathRef.current), {
      draw: ['0 0', '0 1'],
      duration: 450,
      ease: 'inOutQuad',
    });
    return () => {
      a.revert();
    };
  }, []);

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: 'var(--accent)' }}
    >
      <circle cx="24" cy="24" r="21" />
      <path ref={pathRef} d="M15 25l7 7 12-14" />
    </svg>
  );
}
