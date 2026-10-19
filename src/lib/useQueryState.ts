'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * เก็บ state ใน query string (Web Interface Guidelines: URL reflects state)
 * ค่าเริ่มต้นไม่ใส่ใน URL — หน้าที่เรียกต้องอยู่ใต้ <Suspense> เมื่อเป็นหน้า static
 */
export function useQueryState<T extends string>(
  key: string,
  defaultValue: T,
  allowed?: readonly T[],
) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = params.get(key);
  const value = (
    raw !== null && (!allowed || allowed.includes(raw as T))
      ? raw
      : defaultValue
  ) as T;

  const setValue = useCallback(
    (next: T) => {
      const p = new URLSearchParams(params.toString());
      if (next === defaultValue || next === '') p.delete(key);
      else p.set(key, next);
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, router, pathname, key, defaultValue],
  );

  return [value, setValue] as const;
}
