# G ฐาน UX (Web Interface Guidelines + animation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ทุกหน้าของ `acc-pharm-redesign` ผ่าน Vercel Web Interface Guidelines และมี animation ระดับ "พอดี" ที่ปิดเองเมื่อผู้ใช้ตั้ง reduced motion — เป็นฐานให้ F3–F8

**Architecture:** กฎทั้งหมดที่ใช้ซ้ำอยู่ใน `src/app/globals.css` (motion, focus ring, transitions, base) และ helper สองไฟล์ (`src/lib/a11y.ts`: focus trap + focus ช่องผิด, `src/lib/useQueryState.ts`: state ใน URL) หน้าเดิมแก้เฉพาะ attribute / class / การเรียก helper — ไม่เปลี่ยน business logic

**Tech Stack:** Next 16.1.1 (App Router, `useSearchParams`, `viewport` export), React 19.2.3, Tailwind 4, @tabler/icons-react, react-hot-toast

**Spec:** `docs/superpowers/specs/2026-10-19-g-ux-foundation-design.md` · กฎเต็ม: `docs/guidelines/web-interface-guidelines.md`

## Global Constraints

- ไม่เพิ่ม dependency
- ไม่เปลี่ยน business logic, ข้อมูล, ข้อความทางธุรกิจ หรือ flow ของ F1–F2 (เปลี่ยนได้เฉพาะ placeholder ตามข้อ "`…`")
- animate เฉพาะ `transform` และ `opacity`; easing `cubic-bezier(0.16, 1, 0.3, 1)` (`var(--ease-out)`)
- เวลา: หน้า 200ms, รายการ 200ms + `--i × 30ms` (`--i` ≤ 7), modal 180ms, tab 150ms, Stepper 250ms, ปุ่มกด 100ms
- `prefers-reduced-motion: reduce` → ไม่มี translate/scale เหลือ opacity ≤ 150ms
- ห้าม `transition: all` / `transition-all`; ห้าม `outline-none` โดยไม่มีตัวแทน focus
- focus ring: `outline: 2px solid var(--accent); outline-offset: 2px` บน `:focus-visible`
- ข้อความภาษาไทยทั้งหมด; placeholder และข้อความ loading ลงท้าย `…`
- ไม่ปิดการซูม
- สีใช้ตัวแปร CSS (`zinc-*` เดิมคงไว้ได้)
- Prettier single quote

## หมายเหตุก่อนเริ่ม

- repo `D:\PharmacyCouncil_Project\Acc\acc-pharm-redesign` branch `feat/g-ux-foundation` — commit ท้ายทุก task
- คำสั่งตรวจ: `npx tsc --noEmit`, `npm run lint`, `npm test` (16 tests; warning `MODULE_TYPELESS_PACKAGE_JSON` รู้อยู่แล้ว), `npm run format:check`, `npm run build`
- path ที่มี `[id]` ต้องใส่ quote ใน shell
- ข้อความโค้ดเดิมที่แผนอ้างอาจถูก Prettier จัดบรรทัดต่างไปเล็กน้อย — แก้ตามความหมาย

## File Structure

| ไฟล์ | หน้าที่ |
|---|---|
| `src/app/globals.css` (แก้) | motion, focus ring, transitions, skip link, base |
| `src/app/layout.tsx` (แก้) | `viewport.themeColor` |
| `src/lib/a11y.ts` (ใหม่) | `useFocusTrap`, `focusFirstError` |
| `src/lib/useQueryState.ts` (ใหม่) | state ใน query string |
| `src/components/layout/AdminLayout.tsx`, `Sidebar.tsx`, `Header.tsx` (แก้) | skip link, `<main>`, drawer focus/Esc, aria |
| `src/components/common/Stepper.tsx`, `Field.tsx` (แก้) | เส้นเติมสี, aria |
| `src/app/requests/page.tsx` (แก้) | `?q=&group=`, stagger, Suspense |
| `src/app/requests/[id]/page.tsx`, `RequestHeader.tsx`, `ActionDialog.tsx`, `tabs.tsx` (แก้) | `?tab=`, fade, focus trap, focus ช่องผิด, ยืนยันทิ้งข้อความ |
| `src/app/requests/new/page.tsx`, `steps.tsx`, `src/app/register/page.tsx`, `src/app/login/page.tsx`, `src/app/my-pharmacy/page.tsx`, `src/app/page.tsx`, `src/components/home/PharmacyHome.tsx` (แก้) | focus ช่องผิด, placeholder, autocomplete, stagger, aria-hidden |

---

### Task 1: globals.css + viewport

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces (คลาส CSS ที่ task ถัดไปใช้): `animate-page`, `animate-stagger` (ต้องคู่กับ style `--i`), `animate-fade`, `animate-grow-x`, `skip-link`; ตัวแปร `--ease-out`

- [ ] **Step 1: แก้ transition ของปุ่ม input และเมนู**

ใน `.btn-primary`, `.btn-secondary`, `.btn-danger` ลบ `transition-all duration-150` ออกจาก `@apply` แล้วเพิ่มบรรทัดในแต่ละกฎ:

```css
  transition-property: background-color, border-color, color, box-shadow,
    transform, opacity;
  transition-duration: 150ms;
```

แทน `.btn-primary:active { transform: translateY(0); }` ด้วย และเพิ่มกฎ active ของอีกสองปุ่ม:

```css
.btn-primary:active,
.btn-secondary:active,
.btn-danger:active {
  transform: scale(0.98);
  transition-duration: 100ms;
}
```

ใน `.input-field` และ `.input-field-search` ลบ `outline-none transition-all duration-150` ออกจาก `@apply` แล้วเพิ่ม:

```css
  /* ไม่มี outline — :focus ด้านล่างแสดงกรอบ accent + ring แทน */
  outline: none;
  transition-property: border-color, box-shadow;
  transition-duration: 150ms;
```

ใน `.sidebar-link` ลบ `transition-all duration-150` ออกจาก `@apply` แล้วเพิ่ม:

```css
  transition-property: color, background-color;
  transition-duration: 150ms;
```

แทน `transition: background 0.1s;` ของ `.data-table tbody tr` ด้วย `transition: background-color 0.1s;`

- [ ] **Step 2: ปรับ modal**

แทนกฎ `.modal-overlay` บรรทัด `animation: overlayIn 0.15s ease-out;` ด้วย `animation: overlayIn 180ms ease-out;`

แทนกฎ `.modal-content` บรรทัด `animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);` ด้วย:

```css
  animation: modalIn 180ms var(--ease-out);
  overscroll-behavior: contain;
```

แทน `@keyframes modalIn` ทั้งก้อนด้วย:

```css
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

- [ ] **Step 3: เพิ่ม `--ease-out` ใน `:root`**

ต่อท้ายตัวแปรใน `:root` (ก่อน `}`):

```css
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
```

- [ ] **Step 4: เพิ่มฐาน, focus ring, skip link ต่อจากกฎ `body { … }`**

```css
/* ╌╌╌ BASE (Web Interface Guidelines) ╌╌╌╌╌╌╌╌╌╌╌╌ */
html {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

h1,
h2,
h3 {
  text-wrap: balance;
}

/* Windows dark mode ทำให้ select เพี้ยนถ้าไม่กำหนดสี */
select {
  background-color: var(--surface);
  color: var(--ink);
}

/* ╌╌╌ FOCUS ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ */
:where(
    a,
    button,
    summary,
    [role='tab'],
    [tabindex]:not([tabindex='-1']),
    input[type='checkbox'],
    input[type='radio']
  ):focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.sidebar :where(a, button):focus-visible {
  outline-color: var(--accent-muted);
}

/* ปุ่มเลือกไฟล์: input ซ่อนอยู่ใน label — ให้ ring ขึ้นที่ label */
label:has(> input.sr-only:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* <main tabIndex={-1}> เป็นแค่ปลายทางของ skip link ไม่ใช่ปุ่ม */
main:focus {
  outline: none;
}

.skip-link {
  position: absolute;
  left: 12px;
  top: -48px;
  z-index: 60;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: var(--surface);
  font-size: 14px;
  font-weight: 600;
  transition: transform 150ms var(--ease-out);
}

.skip-link:focus-visible {
  transform: translateY(60px);
}
```

- [ ] **Step 5: เพิ่ม motion ต่อท้ายหมวด ANIMATIONS (หลัง `.animate-scale-in { … }`)**

```css
/* ╌╌╌ MOTION (G) — transform/opacity เท่านั้น ╌╌╌╌╌╌╌╌ */
@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes fadeOnly {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes growX {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

/** เนื้อหาหลักเมื่อเปลี่ยนหน้า */
.animate-page {
  animation: pageIn 200ms var(--ease-out) both;
}

/** รายการ/การ์ด/แถว — ใส่ style={{ '--i': Math.min(index, 7) }} */
.animate-stagger {
  animation: pageIn 200ms var(--ease-out) both;
  animation-delay: calc(var(--i, 0) * 30ms);
}

/** เนื้อหา tab เมื่อสลับ */
.animate-fade {
  animation: fadeOnly 150ms ease-out both;
}

/** เส้นเชื่อม Stepper ที่เพิ่งผ่าน */
.animate-grow-x {
  transform-origin: left;
  animation: growX 250ms var(--ease-out) both;
}

@media (prefers-reduced-motion: reduce) {
  .animate-page,
  .animate-stagger,
  .animate-fade-in,
  .animate-slide-up,
  .animate-scale-in,
  .modal-overlay,
  .modal-content {
    animation: fadeOnly 150ms ease-out both;
    animation-delay: 0ms;
  }

  .animate-grow-x {
    animation: none;
  }

  .btn-primary:hover,
  .btn-primary:active,
  .btn-secondary:active,
  .btn-danger:active {
    transform: none;
  }

  .sidebar,
  .skip-link {
    transition: none;
  }
}
```

- [ ] **Step 6: เพิ่ม `viewport` ใน `src/app/layout.tsx`**

แทน `import type { Metadata } from 'next';` ด้วย `import type { Metadata, Viewport } from 'next';` แล้วเพิ่มต่อจาก object `metadata`:

```ts
// สีแถบเบราว์เซอร์มือถือ = --bg
export const viewport: Viewport = {
  themeColor: '#fafaf9',
};
```

- [ ] **Step 7: ตรวจ**

Run: `grep -rn "transition-all\|transition: all\|outline-none" src; npx prettier --write src/app/globals.css src/app/layout.tsx; npx tsc --noEmit; npm run lint; npm run build`
Expected: grep ไม่เจออะไรใน `globals.css` (อาจยังเจอใน `.tsx` — Task 3–6 แก้), tsc/lint/build ผ่าน

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat(g): motion system, focus ring, explicit transitions, base guidelines css"
```

---

### Task 2: helper a11y + query state

**Files:**
- Create: `src/lib/a11y.ts`
- Create: `src/lib/useQueryState.ts`

**Interfaces:**
- Produces:
  - `useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean): void` — ระหว่าง `active`: focus `[data-autofocus]` หรือ control แรก, Tab/Shift+Tab วนใน `ref`, เมื่อ `active` เป็น false หรือ unmount คืน focus ให้ element ที่ focus อยู่ก่อนเปิด
  - `focusFirstError(container: HTMLElement | null): void` — หลังเฟรมถัดไป focus `[aria-invalid="true"]` ตัวแรกใน container
  - `useQueryState<T extends string>(key: string, defaultValue: T, allowed?: readonly T[]): readonly [T, (next: T) => void]` — อ่าน/เขียนค่าใน query string ด้วย `router.replace(…, { scroll: false })`; ค่าเริ่มต้นหรือค่าว่างไม่ใส่ใน URL; ค่าที่ไม่อยู่ใน `allowed` ถือเป็นค่าเริ่มต้น

- [ ] **Step 1: สร้าง `src/lib/a11y.ts`**

```ts
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

    (box.querySelector<HTMLElement>('[data-autofocus]') ?? items()[0] ?? box)
      .focus();

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
    container
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus(),
  );
}
```

- [ ] **Step 2: สร้าง `src/lib/useQueryState.ts`**

```ts
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
```

- [ ] **Step 3: ตรวจ**

Run: `npx prettier --write src/lib/a11y.ts src/lib/useQueryState.ts; npx tsc --noEmit; npm run lint; npm test`
Expected: ไม่มี error, เทสต์ 16/16

- [ ] **Step 4: Commit**

```bash
git add src/lib/a11y.ts src/lib/useQueryState.ts
git commit -m "feat(g): focus trap, focus-first-error and URL query state helpers"
```

---

### Task 3: Layout, Header, Sidebar, Stepper, Field

**Files:**
- Modify: `src/components/layout/AdminLayout.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/common/Stepper.tsx`
- Modify: `src/components/common/Field.tsx`
- Modify: `src/app/login/page.tsx`, `src/app/register/page.tsx` (เฉพาะ root `animate-page`)

**Interfaces:**
- Consumes: `useFocusTrap` (`src/lib/a11y.ts`), คลาส `animate-page`, `animate-grow-x`, `skip-link` (Task 1)

- [ ] **Step 1: `AdminLayout.tsx` — skip link, main, Esc ปิด drawer**

แทน JSX ที่ return ทั้งก้อนด้วย:

```tsx
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <a href="#main" className="skip-link">
        ข้ามไปยังเนื้อหาหลัก
      </a>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40 lg:hidden animate-fade"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <Header
          title={title}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main
          id="main"
          tabIndex={-1}
          className="p-5 md:p-8 lg:p-10 max-w-[1600px] animate-page"
        >
          {children}
        </main>
      </div>
    </div>
  );
```

และเพิ่มก่อน `return` (import `useEffect` จาก `react` เพิ่ม):

```tsx
  // Esc ปิด drawer บนมือถือ
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);
```

- [ ] **Step 2: `Sidebar.tsx` — focus trap บนมือถือ, motion-reduce, aria-hidden**

- import: เพิ่ม `useRef` ใน import จาก `react` และ `import { useFocusTrap } from '@/lib/a11y';`
- ในตัว component ต่อจาก `const [collapsed, …]`:
  ```tsx
  const asideRef = useRef<HTMLElement>(null);
  // isOpen เป็น true เฉพาะ drawer บนมือถือ — desktop แสดงตลอดจึงไม่กัน focus
  useFocusTrap(asideRef, isOpen);
  ```
- `<aside` เพิ่ม `ref={asideRef}` และใน className เพิ่ม `motion-reduce:transition-none overscroll-contain`
- ไอคอนทุกตัวในไฟล์ (`<IconPill`, `<IconX`, `<ItemIcon`, `<IconChevronDown`, `<IconLogout`) เพิ่ม `aria-hidden="true"`
- `<IconChevronDown` ที่หมุนเพิ่มคลาส `motion-reduce:transition-none`
- จุดวงกลม `<span className="w-1 h-1 rounded-full shrink-0" …>` เพิ่ม `aria-hidden="true"`

- [ ] **Step 3: `Header.tsx` — aria, เมนูโปรไฟล์ปิดด้วย Esc, สถานะ hover**

- ไอคอนทุกตัว (`IconMenu2`, `IconChevronDown`, `IconUser`, `IconLogout`) เพิ่ม `aria-hidden="true"`
- ปุ่มโปรไฟล์ เพิ่ม `aria-haspopup="menu"` และ `aria-label={\`เมนูของ ${user?.name ?? 'ผู้ใช้'}\`}`
- `<select>` ของ Demo role เพิ่ม `name="demoRole"` และใน className เพิ่ม `hover:border-zinc-300`
- เพิ่ม effect ปิดเมนูด้วย Esc (import `useEffect` เพิ่ม):
  ```tsx
  useEffect(() => {
    if (!showProfileMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowProfileMenu(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showProfileMenu]);
  ```
- ปุ่มเปิดเมนูมือถือ (`aria-label="เปิดเมนู"`) เพิ่ม `type="button"`; ปุ่มอื่นในไฟล์เพิ่ม `type="button"` ด้วย

- [ ] **Step 4: `Stepper.tsx` — เส้นเชื่อมเติมสีแบบ animate**

แทน `{i < steps.length - 1 && ( … )}` ทั้งก้อนด้วย:

```tsx
            {i < steps.length - 1 && (
              <span
                className="relative h-px flex-1 min-w-3 overflow-hidden"
                style={{ background: 'var(--border)' }}
                aria-hidden="true"
              >
                {done && (
                  <span
                    className="absolute inset-0 animate-grow-x"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </span>
            )}
```

และ `<IconCheck …/>` เพิ่ม `aria-hidden="true"`; ชื่อขั้นที่ซ่อนบนมือถือ เปลี่ยน `'hidden sm:inline'` เป็น `'sr-only sm:not-sr-only'` (ให้ screen reader อ่านชื่อทุกขั้น)

- [ ] **Step 5: `Field.tsx` — ผูก error กับ input**

แทนทั้งไฟล์ด้วย:

```tsx
/** label + ช่องกรอก + error ใต้ช่อง (หลักการ UX ข้อ 5) — error มี id `${htmlFor}-error` */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-semibold text-zinc-700 mb-1.5"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p
          id={htmlFor ? `${htmlFor}-hint` : undefined}
          className="mt-1 text-xs"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          {hint}
        </p>
      )}
      {error && (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          className="mt-1 text-xs"
          style={{ color: 'var(--danger)' }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** class ของ input ตามสถานะ error */
export const inputClass = (error?: string) =>
  `input-field ${error ? '!border-[var(--danger)]' : ''}`;

/** aria ที่ผูก input กับ error/hint ของ Field */
export const fieldAria = (id: string, error?: string, hint?: string) => ({
  'aria-invalid': !!error,
  'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
});
```

- [ ] **Step 6: หน้า public — animate**

`src/app/login/page.tsx`: div นอกสุดที่ return (มี `min-h-screen`) เพิ่มคลาส `animate-page`
`src/app/register/page.tsx`: div นอกสุด (`min-h-screen px-4 py-10`) เพิ่มคลาส `animate-page`

- [ ] **Step 7: ตรวจ**

Run: `npx prettier --write src/components/layout src/components/common/Stepper.tsx src/components/common/Field.tsx src/app/login/page.tsx src/app/register/page.tsx; npx tsc --noEmit; npm run lint; npm test; npm run build`
Expected: ไม่มี error

- [ ] **Step 8: Commit**

```bash
git add src/components src/app/login/page.tsx src/app/register/page.tsx
git commit -m "feat(g): skip link, drawer focus trap, aria and animated stepper"
```

---

### Task 4: รายการคำขอ — สถานะใน URL + stagger

**Files:**
- Modify: `src/app/requests/page.tsx`

**Interfaces:**
- Consumes: `useQueryState` (Task 2), คลาส `animate-stagger` (Task 1)

- [ ] **Step 1: ย้ายคำค้นและ chip ไปไว้ใน URL**

- import เพิ่ม: `import { Suspense } from 'react';` (รวมใน import จาก `react` เดิม) และ `import { useQueryState } from '@/lib/useQueryState';`
- ประกาศ key ของ chip ต่อจาก `const groups = …`:
  ```ts
  const GROUP_KEYS = ['all', 'active', 'need_docs', 'closed'] as const;
  type GroupKey = (typeof GROUP_KEYS)[number];
  ```
  และเปลี่ยน type ของ `groups` จาก `key: string` เป็น `key: GroupKey`
- เปลี่ยนชื่อ component เดิม `export default function RequestsPage()` เป็น `function RequestsList()` (ไม่ export) แล้วเพิ่มท้ายไฟล์:
  ```tsx
  // useSearchParams ต้องอยู่ใต้ Suspense ในหน้า static ของ Next 16
  export default function RequestsPage() {
    return (
      <Suspense fallback={null}>
        <RequestsList />
      </Suspense>
    );
  }
  ```
- แทน
  ```ts
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('all');
  ```
  ด้วย
  ```ts
  const [q, setQ] = useQueryState('q', '');
  const [group, setGroup] = useQueryState<GroupKey>('group', 'all', GROUP_KEYS);
  ```

- [ ] **Step 2: ช่องค้นหาและไอคอน**

- `<input` ของช่องค้นหา เพิ่ม `type="search"`, `name="q"`, `autoComplete="off"`, `spellCheck={false}` และเปลี่ยน placeholder เป็น `'ค้นหาเลขที่คำขอ…'` / `'ค้นหาเลขที่คำขอหรือชื่อร้าน…'`
- ไอคอน `IconSearch` และ `IconFilePlus` เพิ่ม `aria-hidden="true"`

- [ ] **Step 3: stagger แถวตารางและการ์ด**

- ในตาราง: `{visible.map((r) => (` → `{visible.map((r, i) => (` และ `<tr key={r.id}>` →
  ```tsx
  <tr
    key={r.id}
    className="animate-stagger"
    style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
  >
  ```
- ในการ์ดมือถือ: `{visible.map((r) => (` → `{visible.map((r, i) => (` และ `<li key={r.id}>` →
  ```tsx
  <li
    key={r.id}
    className="animate-stagger"
    style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
  >
  ```
- คอลัมน์วันที่ `<td>{formatDate(r.submittedAt)}</td>` → `<td className="tabular-nums">{formatDate(r.submittedAt)}</td>`
- ตัวเลขใน chip `({…length})` ห่อด้วย `<span className="tabular-nums">…</span>`

- [ ] **Step 4: ตรวจ**

Run: `npx prettier --write src/app/requests/page.tsx; npx tsc --noEmit; npm run lint; npm run build`
Expected: ไม่มี error; build ไม่เตือน `useSearchParams() should be wrapped in a suspense boundary`

- [ ] **Step 5: Commit**

```bash
git add src/app/requests/page.tsx
git commit -m "feat(g): request list filters in URL and staggered rows"
```

---

### Task 5: รายละเอียดคำขอ — tab ใน URL, modal, ฟอร์มในแท็บ

**Files:**
- Modify: `src/app/requests/[id]/page.tsx`
- Modify: `src/app/requests/[id]/RequestHeader.tsx`
- Modify: `src/app/requests/[id]/ActionDialog.tsx`
- Modify: `src/app/requests/[id]/tabs.tsx`

**Interfaces:**
- Consumes: `useQueryState`, `useFocusTrap`, `focusFirstError` (Task 2); `fieldAria` (Task 3); คลาส `animate-fade`, `animate-stagger`

- [ ] **Step 1: `page.tsx` — tab ใน URL + fade**

- แทน `const TABS = [ … ] as const; type Tab = …;` ด้วย:
  ```ts
  const TABS = [
    { key: 'info', label: 'ข้อมูล' },
    { key: 'docs', label: 'เอกสาร' },
    { key: 'payments', label: 'การชำระเงิน' },
    { key: 'result', label: 'ผลประเมิน' },
    { key: 'history', label: 'ประวัติ' },
  ] as const;
  type Tab = (typeof TABS)[number]['key'];
  const TAB_KEYS = TABS.map((t) => t.key);
  ```
- แทน `const [tab, setTab] = useState<Tab>('ข้อมูล');` ด้วย `const [tab, setTab] = useQueryState<Tab>('tab', 'info', TAB_KEYS);` (import `useQueryState`)
- `if (action === 'resubmit_docs') return setTab('เอกสาร');` → `return setTab('docs');`
- `counts` เปลี่ยน key เป็น `docs: req.docs.length, history: req.messages.length`
- ปุ่ม tab: วนด้วย `TABS.map((t) => (` ใช้ `key={t.key}`, `id={\`tab-${t.key}\`}`, `aria-controls="tab-panel"`, `aria-selected={t.key === tab}`, `onClick={() => setTab(t.key)}`, ข้อความ `{t.label}{counts[t.key] !== undefined && …}` (ตัวเลขห่อ `<span className="tabular-nums">`)
- tabpanel: `<div role="tabpanel" id="tab-panel" aria-labelledby={\`tab-${tab}\`} key={tab} className="p-5 sm:p-6 animate-fade">`
- เงื่อนไขแสดงแท็บเปลี่ยนเป็น key: `tab === 'info'`, `'docs'`, `'payments'`, `'result'`, `'history'`
- ลิงก์ "← กลับไปรายการคำขอ": ห่อ `←` ด้วย `<span aria-hidden="true">←</span>`
- เพราะ `[id]` เป็น dynamic route ไม่ต้องห่อ Suspense (build ต้องผ่าน — ถ้า build เตือนเรื่อง Suspense ให้ห่อแบบ Task 4)

- [ ] **Step 2: `RequestHeader.tsx` — ไอคอน**

`IconCircleX`, `IconAlertTriangle` เพิ่ม `aria-hidden="true"`

- [ ] **Step 3: `ActionDialog.tsx` — focus trap, ปิดอย่างปลอดภัย, focus ช่องผิด**

- import เพิ่ม `useRef` และ `import { focusFirstError, useFocusTrap } from '@/lib/a11y';` และ `fieldAria` จาก Field
- ใน component:
  ```tsx
  const boxRef = useRef<HTMLDivElement>(null);
  useFocusTrap(boxRef, true);
  const dirty = message.trim() !== '' || picked.length > 0 || status !== '';

  /** ปิดได้เมื่อไม่ได้กำลังบันทึก — ถ้าพิมพ์ค้างไว้ถามก่อน */
  const requestClose = () => {
    if (busy) return;
    if (dirty && !window.confirm('ทิ้งข้อความที่กรอกไว้?')) return;
    onClose();
  };
  ```
- effect Esc: เปลี่ยน `onClose()` เป็น `requestClose()` (และ dependency เป็น `[requestClose]` — ห่อ `requestClose` ด้วย `useCallback` ที่ขึ้นกับ `busy, dirty, onClose`)
- overlay: แทน `onClick={onClose}` ด้วย
  ```tsx
  onMouseDown={(e) => {
    if (e.target === e.currentTarget) requestClose();
  }}
  ```
  และลบ `onClick={(e) => e.stopPropagation()}` ของกล่อง (ไม่จำเป็นแล้ว)
- กล่อง: เพิ่ม `ref={boxRef}`
- ปุ่ม "ปิด": `onClick={requestClose}`
- หลัง `setError(...)` ใน `submit` (กรณีมี error ทั้งจาก result และ catch) เรียก `focusFirstError(boxRef.current);`
- `<select id="status">` แทน `aria-invalid={…}` ด้วย `{...fieldAria('status', errorFor('status'))}` และเพิ่ม `name="status"`
- `<textarea id="message">` แทน `aria-invalid={…}` ด้วย `{...fieldAria('message', errorFor('message'))}`, เพิ่ม `name="message"`, `data-autofocus` (เฉพาะเมื่อไม่ใช่ override — override ให้ select เป็นตัวแรกตามลำดับอยู่แล้ว)
- checkbox ผู้ตรวจ: เพิ่ม `aria-invalid={!!errorFor('assessorIds')}` และ `name="assessorIds"`
- ปุ่ม approve (ไม่มีช่องกรอก) — ปุ่มยืนยันเพิ่ม `data-autofocus` เมื่อ `action === 'approve'`
- ข้อความ busy `'กำลังบันทึก…'` คงไว้ (มี `…` แล้ว)

- [ ] **Step 4: `tabs.tsx` — ฟอร์มและตัวเลข**

- import เพิ่ม `useRef` และ `import { focusFirstError } from '@/lib/a11y';`, `fieldAria` จาก Field
- ไอคอน `IconFileText` เพิ่ม `aria-hidden="true"` (มี `aria-hidden` บนจุด timeline แล้ว)
- `DocsTab`:
  - `const formRef = useRef<HTMLElement>(null);` ผูกกับ `<section …>` ของฟอร์มส่งเอกสาร (`ref={formRef}`)
  - `<input type="file" multiple …>` เพิ่ม `name="newDocs"`, `aria-invalid={!!error}`, `aria-label="เลือกไฟล์เอกสารเพิ่มเติม"`
  - ใน `submit`: ก่อนเรียก `onResubmit` ถ้า `files.length === 0` → `setError('แนบไฟล์อย่างน้อย 1 ไฟล์ แล้วกดส่งอีกครั้ง'); focusFirstError(formRef.current); return;` และหลัง `setError(res.error)` / catch เรียก `focusFirstError(formRef.current)`
  - รายการไฟล์ใช้ `animate-stagger` + `--i` เหมือน Task 4
- `PaymentsTab`:
  - `const formRef = useRef<HTMLElement>(null);` ผูกกับ section ฟอร์ม
  - `<input id="amount">` แทน `aria-invalid` ด้วย `{...fieldAria('amount', errors.amount)}`, เพิ่ม `name="amount"`, `autoComplete="off"`, `placeholder="1500…"`
  - `<input type="file">` ของสลิป เพิ่ม `name="slip"`, `aria-invalid={!!errors.file}`, `aria-label="เลือกไฟล์หลักฐานการโอน"`
  - หลัง `setErrors(e)` เมื่อมี error และหลัง error จาก `onAdd`/catch เรียก `focusFirstError(formRef.current)`
  - จำนวนเงินในรายการ: ใช้ `new Intl.NumberFormat('th-TH').format(p.amount)` และใส่ `tabular-nums`
- `ResultTab`: ตัวเลขคะแนนเพิ่ม `tabular-nums`
- `HistoryTab`: `<li>` ใช้ `animate-stagger` + `--i`; บรรทัดเวลาเพิ่ม `tabular-nums`

- [ ] **Step 5: ตรวจ**

Run: `npx prettier --write "src/app/requests/[id]"; npx tsc --noEmit; npm run lint; npm test; npm run build`
Expected: ไม่มี error, เทสต์ 16/16

- [ ] **Step 6: Commit**

```bash
git add "src/app/requests/[id]"
git commit -m "feat(g): request detail tab in URL, accessible dialog and tab forms"
```

---

### Task 6: ฟอร์มยื่นคำขอ, ลงทะเบียน, หน้าแรก, ร้านของฉัน

**Files:**
- Modify: `src/app/requests/new/page.tsx`, `src/app/requests/new/steps.tsx`
- Modify: `src/app/register/page.tsx`, `src/app/login/page.tsx`
- Modify: `src/app/page.tsx`, `src/components/home/PharmacyHome.tsx`, `src/app/my-pharmacy/page.tsx`

**Interfaces:**
- Consumes: `focusFirstError` (Task 2), `fieldAria` (Task 3), `animate-stagger`

- [ ] **Step 1: `requests/new/page.tsx` — focus ช่องผิด**

- import `useRef` และ `focusFirstError`
- `const cardRef = useRef<HTMLDivElement>(null);` ผูกกับ `<div className="card">` ของ stepper
- ใน `check()`: หลัง `setErrors(e)` ถ้า `Object.keys(e).length > 0` เรียก `focusFirstError(cardRef.current)`
- ข้อความ `'กำลังส่ง…'` คงไว้

- [ ] **Step 2: `steps.tsx` — aria และ placeholder**

- `TypeStep`: radio `mainType` และ checkbox ประเภทเปลี่ยนแปลง เพิ่ม `aria-invalid={!!errors.typeIds}`; radio `changeMode` เพิ่ม `name="changeMode"` (มีแล้ว — ตรวจ)
- `ApplicantStep`: ฟังก์ชัน `text(...)` — `<input>` แทน `aria-invalid` ด้วย `{...fieldAria(key, errors[key])}` และเพิ่ม `name={key}`; ช่อง `email` และ `lineId` เพิ่ม `spellCheck={false}`; placeholder เปลี่ยนเป็น `'name@example.com…'` และ `'0812345678…'`; ช่อง `lineId` เพิ่ม `autoComplete: 'off'`
- radio `relation` เพิ่ม `aria-invalid={!!errors.relation}`
- `relationOther` แทน `aria-invalid` ด้วย `{...fieldAria('relationOther', errors.relationOther)}`, เพิ่ม `name="relationOther"`, `autoComplete="off"`
- `DocsStep`: `<input type="file">` เพิ่ม `aria-invalid={!!error}`, `aria-label={\`เลือกไฟล์ ${doc}\`}`, `name={doc}`; ไอคอน `IconCircleCheckFilled`, `IconCircleDashed` เพิ่ม `aria-hidden="true"`; รายการ `<li>` ใช้ `animate-stagger` + `--i`
- `ReviewStep`: checkbox คำรับรองเพิ่ม `aria-invalid={!!errors.pledged}` และ `name="pledged"`

- [ ] **Step 3: `register/page.tsx`**

- import `useRef`, `focusFirstError`, `fieldAria`
- `const cardRef = useRef<HTMLDivElement>(null);` ผูกกับ `<div className="card">`
- ช่อง `licenseNo`: แทน `aria-invalid` ด้วย `{...fieldAria('licenseNo', errors.licenseNo, 'ระบบจะดึงข้อมูลร้านจาก อย. ให้อัตโนมัติ')}`, เพิ่ม `name="licenseNo"`, `autoComplete="off"`, `spellCheck={false}`, placeholder `'กท.28/2565…'`
- ช่องใน `FIELDS.map`: แทน `aria-invalid` ด้วย `{...fieldAria(key, errors[key])}`, เพิ่ม `name={key}`; `email` → `type="email" autoComplete="email" spellCheck={false}`; `phone` → `type="tel" autoComplete="tel" inputMode="tel"`; `operatorLicense` และ `licenseNo` → `spellCheck={false}`; ช่องอื่น `autoComplete="off"`
- หลัง `setErrors(...)` ที่มี error (ทั้งใน `lookup` และ `submit`) เรียก `focusFirstError(cardRef.current)`
- ข้อความปุ่ม `'กำลังตรวจสอบ…'`, `'กำลังส่ง…'` คงไว้

- [ ] **Step 4: `login/page.tsx`**

- `<input id="username">` เพิ่ม `name="username"`, `spellCheck={false}`, placeholder `'เช่น pharm001…'`
- `<input id="password">` เพิ่ม `name="password"`, placeholder `'ไม่ต้องกรอกในต้นแบบนี้…'`
- ข้อความ `'กำลังเข้าสู่ระบบ…'` คงไว้; ไอคอน `IconPill` เพิ่ม `aria-hidden="true"`

- [ ] **Step 5: หน้าแรกและร้านของฉัน**

- `src/components/home/PharmacyHome.tsx`: การ์ด todo `<li key={t.title} …>` และรายการคำขอล่าสุด `<li key={r.id}>` ใช้ `animate-stagger` + `--i` (ใช้ index ของ `.map`); ไอคอนทุกตัวเพิ่ม `aria-hidden="true"`
- `src/app/page.tsx`: การ์ดสถิติ `stat-card` ใช้ `animate-stagger` + `--i`; `stat-value` เพิ่ม `tabular-nums`; ไอคอนเพิ่ม `aria-hidden="true"`
- `src/app/my-pharmacy/page.tsx`: section การ์ดใช้ `animate-stagger` + `--i` (0,1,2,3 ตามลำดับ); ไอคอน `IconEdit` เพิ่ม `aria-hidden="true"`; `<dd>` เพิ่ม `break-words min-w-0`

- [ ] **Step 6: ตรวจ**

Run: `npx prettier --write src/app src/components; npx tsc --noEmit; npm run lint; npm test; npm run format:check; npm run build`
Expected: ทั้งหมดผ่าน

- [ ] **Step 7: Commit**

```bash
git add src/app src/components
git commit -m "feat(g): accessible forms, focus-first-error and staggered cards across F1 pages"
```

---

### Task 7: ตรวจตาม Web Interface Guidelines และแก้ข้อค้าง

**Files:**
- Create: `docs/guidelines/audit-2026-10-19.md` (ผลตรวจ)
- Modify: ไฟล์ใดก็ได้ใน `src/app`, `src/components` ที่มีข้อค้าง

- [ ] **Step 1: ตรวจ**

อ่าน `docs/guidelines/web-interface-guidelines.md` แล้วตรวจทุกไฟล์ `.tsx` และ `globals.css` ใน `src/app` และ `src/components` ตามกฎทุกข้อ เขียนผลลง `docs/guidelines/audit-2026-10-19.md` ตามรูปแบบ "Output Format" ของไฟล์ guidelines (จัดกลุ่มตามไฟล์, `file:line - ปัญหา`, ไฟล์ที่ผ่านเขียน `✓ pass`) — ข้ามข้อที่ spec ระบุใน "ไม่ทำ" (Title Case, รูป/วิดีโอ, virtualization, beforeunload ทั้งหน้า, dark mode) โดยเขียนไว้ท้ายไฟล์ในหัวข้อ "ข้ามตาม spec"

- [ ] **Step 2: แก้ข้อค้างทั้งหมด**

แก้ทุกรายการใน audit ที่ไม่ใช่ "ข้ามตาม spec" แล้วอัปเดตไฟล์ audit ให้ทุกไฟล์เป็น `✓ pass` (บันทึกว่าแก้อะไรในหัวข้อ "แก้แล้ว")

- [ ] **Step 3: ตรวจ**

Run: `grep -rn "transition-all\|transition: all\|outline-none\|\.\.\.'" src --include=*.tsx --include=*.css; npx tsc --noEmit; npm run lint; npm test; npm run format:check; npm run build`
Expected: grep ไม่เจอ (`...` ที่เป็น spread ใน JS ไม่นับ — pattern นี้จับเฉพาะ string ที่ลงท้าย `...'`), check ทั้งหมดผ่าน

- [ ] **Step 4: Commit**

```bash
git add docs/guidelines/audit-2026-10-19.md src
git commit -m "fix(g): resolve remaining Web Interface Guidelines findings"
```

---

### Task 8: ตรวจ Definition of Done (controller)

- [ ] **Step 1:** `npm test; npm run lint; npx tsc --noEmit; npm run format:check; npm run build` ผ่าน
- [ ] **Step 2:** เดินทั้งเส้นแบบ F2 ด้วยคีย์บอร์ดอย่างเดียว (Tab / Shift+Tab / Enter / Space / Esc) ในเบราว์เซอร์: skip link ขึ้นเมื่อกด Tab ครั้งแรก, focus ring เห็นตลอด, modal กัน focus และคืน focus เมื่อปิด, drawer มือถือกัน focus และ Esc ปิด, กดส่งฟอร์มที่ผิดแล้ว focus ไปช่องแรกที่ผิด
- [ ] **Step 3:** emulate `prefers-reduced-motion: reduce` → `getComputedStyle(main).animationName` เป็น `fadeOnly`; ไม่มี transform บนปุ่มตอนกด
- [ ] **Step 4:** เปิด `/requests?group=closed&q=REN` ตรง → chip "เสร็จสิ้น" ถูกเลือกและช่องค้นหามี `REN`; เปิด `/requests/r5?tab=history` ตรง → แท็บประวัติ; กดย้อนกลับแล้วตัวกรองยังอยู่
- [ ] **Step 5:** 375px และ 1280px ไม่มี scroll แนวนอน (ทุกหน้า + modal)
- [ ] **Step 6:** push branch → Vercel สร้าง preview ของ branch ได้
