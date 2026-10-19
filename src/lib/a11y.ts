'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * กัน focus ไว้ใน modal/drawer ระหว่างเปิด (Web Interface Guidelines: focus states)
 * เปิด → focus [data-autofocus] หรือ control แรก, Tab วนในกล่อง, ปิด → คืน focus ที่เดิม
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    const box = ref.current;
    if (!active || !box) return;
    const previous = document.activeElement as HTMLElement | null;
    const items = () =>
      [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (n) => n.getClientRects().length > 0,
      );

    (
      box.querySelector<HTMLElement>('[data-autofocus]') ??
      items()[0] ??
      box
    ).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = items();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    box.addEventListener('keydown', onKey);
    return () => {
      box.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [ref, active]);
}

/** focus ช่องแรกที่ผิด — เรียกหลัง setErrors (รอ render เฟรมถัดไป) */
export function focusFirstError(container: HTMLElement | null) {
  requestAnimationFrame(() =>
    container?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
  );
}
