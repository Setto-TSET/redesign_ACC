'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * เก็บ state ใน query string (Web Interface Guidelines: URL reflects state)
 * ค่าเริ่มต้นไม่ใส่ใน URL — หน้าที่เรียกต้องอยู่ใต้ <Suspense> เมื่อเป็นหน้า static
 * เขียนผ่าน History API จาก URL ปัจจุบัน (Next ซิงก์เข้า useSearchParams) เพื่อไม่ให้การเขียนซ้อนกันทับกัน
 */
export function useQueryState<T extends string>(
  key: string,
  defaultValue: T,
  allowed?: readonly T[],
) {
  const params = useSearchParams();

  const raw = params.get(key);
  const value = (
    raw !== null && (!allowed || allowed.includes(raw as T))
      ? raw
      : defaultValue
  ) as T;

  const setValue = useCallback(
    (next: T) => {
      const p = new URLSearchParams(window.location.search);
      if (next === defaultValue || next === '') p.delete(key);
      else p.set(key, next);
      const qs = p.toString();
      window.history.replaceState(
        null,
        '',
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
      );
    },
    [key, defaultValue],
  );

  return [value, setValue] as const;
}
