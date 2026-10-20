# ต้นแบบหน้าเว็บ + ปุ่มข้อเสนอแนะ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ทุกเมนูที่ยังเป็น "กำลังพัฒนา" กลายเป็นหน้าต้นแบบที่กดเล่นได้ด้วยข้อมูลตัวอย่าง และมีปุ่มข้อเสนอแนะทุกหน้าที่ดาวน์โหลดเป็น CSV ได้

**Architecture:** หน้าต้นแบบเป็น client component ใต้ `AdminLayout` อ่านข้อมูลตัวอย่างจาก `src/mock/prototype/*.ts` ตรง ๆ และเก็บการกดเล่นใน `useState` (รีเฟรชแล้วกลับค่าเดิม) ของที่ใช้ซ้ำ (ป้ายต้นแบบ, modal, tabs, animation) อยู่ใน `src/components/prototype/` ปุ่มข้อเสนอแนะอยู่ใน root layout จึงขึ้นทุกหน้ารวม login/register

**Tech Stack:** Next 16.1.1 App Router, React 19.2.3, Tailwind 4 + component class ใน `globals.css`, @tabler/icons-react, react-hot-toast, animejs ^4.5.0, recharts (เพิ่มใน Task 6)

**Spec:** `docs/superpowers/specs/2026-10-19-prototype-pages-design.md`

## Global Constraints

- ห้ามแก้ `src/lib/api.ts`, `src/lib/*Rules.ts`, เทสต์เดิม, `src/mock/index.ts` และหน้าของ F0–F4 (`/`, `/requests/**`, `/my-pharmacy`, `/register`, `/login`, `/schedule`, `/certificates/**`) — อ่าน/import ได้
- ข้อมูลตัวอย่างอยู่ใน `src/mock/prototype/` หน้าต้นแบบ import ตรงได้ (ข้อยกเว้นของกฎ "ผ่าน api.ts" เฉพาะหน้าต้นแบบ)
- การกดเล่นใช้ `useState` — ไม่เขียน sessionStorage/localStorage (ยกเว้นข้อเสนอแนะ key `accpharm_feedback` และชื่อผู้ให้ความเห็น key `accpharm_feedback_name`)
- ทุกหน้าต้นแบบมี `<PrototypeBadge />` เป็นบรรทัดแรกของเนื้อหา (ใต้ header) ข้อความ "ต้นแบบ — ข้อมูลตัวอย่าง"
- ทุก modal ใช้ `<Modal>` จาก `src/components/prototype/Modal.tsx` (focus trap, Esc ปิด, คลิก overlay ปิดเมื่อ mousedown เริ่มบน overlay)
- ลบ/ปิดใช้งาน/ปิดเรื่อง/ปิดรอบ ต้องยืนยันด้วย `window.confirm` ก่อน
- ฟอร์ม: error แสดงใต้ช่องด้วย `Field` + `inputClass` + `fieldAria` จาก `@/components/common/Field`; กดส่งแล้วผิด → `focusFirstError(container)` จาก `@/lib/a11y`; ช่องมี `name` และ `autoComplete` (ไม่ใช่ข้อมูลส่วนตัว → `"off"`); placeholder ลงท้าย `…`; อีเมล/username/เลขใบอนุญาต `spellCheck={false}`
- ตัวกรองหลักของหน้ารายการเก็บใน URL ด้วย `useQueryState` จาก `@/lib/useQueryState` และหน้าที่ใช้ต้องห่อด้วย `<Suspense>` (แบบ `src/app/requests/page.tsx`)
- motion: `animate-page` มีอยู่แล้วใน `<main>`; รายการ/การ์ดใช้ `animate-stagger` + `style={{ '--i': Math.min(i, 7) } as React.CSSProperties}`; tabpanel ใช้ `animate-fade` + `key={tab}`; ห้าม `transition-all`
- animejs: เฉพาะ transform / opacity / stroke, ≤ 600ms, ไม่เล่นเมื่อ `prefersReducedMotion()` เป็นจริง (แสดงสถานะสุดท้ายทันที)
- ตัวเลขใช้ `tabular-nums`; จำนวนเงิน `Intl.NumberFormat('th-TH')`; วันที่ผ่าน `formatDate` / `formatDateLong` / `formatDateTime` จาก `@/lib/format`; `…` ไม่ใช่ `...`; ไอคอนตกแต่ง `aria-hidden="true"`; ปุ่มไอคอนอย่างเดียวมี `aria-label` ภาษาไทย; ข้อความผู้ใช้ใส่ `break-words`, flex child ข้อความยาว `min-w-0`
- ภาษาไทยทั้งหมด; 375px และ 1280px ไม่มี scroll แนวนอน (ตารางกว้างอยู่ใน `overflow-x-auto relative`)
- Dependency เพิ่มได้แค่ `recharts` (Task 6) — ไม่เพิ่มอย่างอื่น
- เทสต์ใหม่มีไฟล์เดียว: `src/components/feedback/csv.test.ts`
- ก่อน commit ทุก task: `npm run lint` (0 warning), `npx tsc --noEmit`, `npm test`, `npm run format:check` ผ่าน (`npm run build` ตรวจใน task สุดท้ายและเมื่อ task แตะ layout/route)
- Commit message ลงท้าย `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## File Structure

```
src/components/prototype/
  PrototypeBadge.tsx    ป้าย "ต้นแบบ — ข้อมูลตัวอย่าง"
  Modal.tsx             dialog ใช้ร่วม (focus trap, Esc, overlay)
  Tabs.tsx              tablist + tabpanel ผูก ?tab= (คีย์บอร์ดลูกศร/Home/End)
  motion.ts             prefersReducedMotion()
  CycleTimeline.tsx     timeline ขั้นตอนแนวนอน/แนวตั้ง + เส้นวาดด้วย animejs (ใช้ทั้ง post-audit 5 ขั้น และข้อร้องเรียน 15 ขั้น)
  ScoreRing.tsx         วงแหวน "ผ่าน n/total" + ตัวเลขนับขึ้น
  DrawCheck.tsx         เครื่องหมายถูกวาดเส้น
  FilterChips.tsx       chip ตัวกรองสถานะ (radiogroup)
src/components/feedback/
  csv.ts / csv.test.ts  แปลงข้อเสนอแนะเป็น CSV
  store.ts              อ่าน/เขียน localStorage
  FeedbackButton.tsx    ปุ่มลอย + modal
src/mock/prototype/
  pharmacies.ts         ร้านตัวอย่าง ~24 ร้าน + ภาค/จังหวัด
  postAudit.ts          ผลตรวจรักษาคุณภาพ + หมวด + checklist 12 ข้อ
  complaints.ts         ข้อร้องเรียน + 15 ขั้น
  reports.ts            ชุดข้อมูลรายงาน
  content.ts            ข่าว + เอกสาร
  admin.ts              ผู้ใช้, master data, template, ตั้งค่า, การมอบหมาย
src/app/post-audit/{page,assign/page,[id]/page,[id]/inspect/page}.tsx
src/app/complaints/{page,new/page,[id]/page}.tsx
src/app/pharmacies/{page,[id]/page}.tsx, src/app/map/page.tsx, src/app/gpp/page.tsx
src/app/reports/page.tsx
src/app/news/{page,[id]/page}.tsx, src/app/documents/page.tsx, src/app/users/page.tsx
src/app/master-data/page.tsx, src/app/templates/page.tsx, src/app/settings/page.tsx
src/app/allocation/page.tsx, src/app/profile/page.tsx
แก้: src/app/layout.tsx, src/contexts/AuthContext.tsx, src/components/layout/Sidebar.tsx
ลบ: src/app/[...slug]/page.tsx (Task 8)
```

หน้าละไฟล์เป็นหลัก ถ้าไฟล์เกิน ~350 บรรทัดให้แยก component ย่อยไว้ข้างหน้าในโฟลเดอร์เดียวกัน (แบบ `src/app/requests/[id]/tabs.tsx`)

---

### Task 1: ชุด component ต้นแบบ

**Files:**
- Create: `src/components/prototype/{PrototypeBadge,Modal,Tabs,FilterChips,CycleTimeline,ScoreRing,DrawCheck}.tsx`, `src/components/prototype/motion.ts`

**Interfaces:**
- Produces (ทุก task ถัดไปใช้):
  - `PrototypeBadge(): JSX`
  - `Modal({ title, onClose, children, footer, size?, busy? }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; size?: 'md' | 'lg'; busy?: boolean })` — `id` หัวข้อสร้างด้วย `useId()`
  - `Tabs<T extends string>({ label, tabs, value, onChange, children }: { label: string; tabs: { key: T; label: string; count?: number }[]; value: T; onChange: (k: T) => void; children: ReactNode })`
  - `FilterChips<T extends string>({ label, options, value, onChange }: { label: string; options: { key: T; label: string; count?: number }[]; value: T; onChange: (k: T) => void })`
  - `CycleTimeline({ steps, current, orientation? }: { steps: { label: string; date?: string; note?: string }[]; current: number; orientation?: 'horizontal' | 'vertical' })` — `current` = index ขั้นปัจจุบัน; `current >= steps.length` = เสร็จทุกขั้น
  - `ScoreRing({ value, total, label }: { value: number; total: number; label: string })`
  - `DrawCheck({ size? }: { size?: number })`
  - `prefersReducedMotion(): boolean`

- [ ] **Step 1: `motion.ts` และ `PrototypeBadge.tsx`**

```ts
// src/components/prototype/motion.ts
/** ผู้ใช้ขอลดการเคลื่อนไหว — animejs ต้องข้ามไปสถานะสุดท้าย */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

```tsx
// src/components/prototype/PrototypeBadge.tsx
import { IconFlask } from '@tabler/icons-react';

/** บอกผู้ทดลองว่าหน้านี้เป็นต้นแบบ — ข้อมูลไม่ถูกบันทึก */
export function PrototypeBadge() {
  return (
    <p
      className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}
    >
      <IconFlask aria-hidden="true" size={14} />
      ต้นแบบ — ข้อมูลตัวอย่าง
    </p>
  );
}
```

- [ ] **Step 2: `Modal.tsx`** — โครงเดียวกับ `src/app/requests/[id]/ActionDialog.tsx` (overlay `modal-overlay`, กล่อง `modal-content`, `useFocusTrap(boxRef, true)`, Esc เรียก `onClose` เมื่อไม่ `busy`)

```tsx
'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconX } from '@tabler/icons-react';
import { useFocusTrap } from '@/lib/a11y';

/** dialog ใช้ร่วมของหน้าต้นแบบ — ผู้เรียกจัดการ "ทิ้งข้อมูลที่กรอก?" เองใน onClose ถ้าต้องการ */
export function Modal({
  title,
  onClose,
  children,
  footer,
  size = 'md',
  busy = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
  busy?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(boxRef, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`modal-content ${size === 'lg' ? 'max-w-2xl' : 'max-w-lg'} p-6 max-h-[90vh] overflow-y-auto overscroll-contain`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold min-w-0 break-words">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="ปิด"
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500"
          >
            <IconX aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
        {footer && (
          <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `Tabs.tsx`** — ย้ายรูปแบบ tablist ของ `src/app/requests/[id]/page.tsx:185-250` มาเป็น component (ไม่แก้ไฟล์ F2) `id` ของ tab ใช้ prefix จาก `useId()` เพื่อไม่ชนกัน

```tsx
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
        className="flex gap-1 overflow-x-auto border-b border-zinc-100 px-2"
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
            className="shrink-0 px-4 py-3 text-sm font-semibold border-b-2 -mb-px hover:bg-zinc-50"
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
```

- [ ] **Step 4: `FilterChips.tsx`** — radiogroup ของปุ่ม chip (`role="radiogroup"`, ปุ่ม `role="radio"` + `aria-checked`, ลูกศรซ้าย/ขวาเลื่อน) ดูรูปแบบ chip กลุ่มสถานะของ `src/app/requests/page.tsx` แล้วใช้ class/สีเดียวกัน; แสดง `count` เป็น `tabular-nums` ถ้ามี

- [ ] **Step 5: `CycleTimeline.tsx`**
  - แสดงขั้นเป็น `<ol>`; แต่ละ `<li>` มีวงกลม (ผ่านแล้ว = พื้น `--accent` + `IconCheck`, ปัจจุบัน = ขอบ `--accent` + `aria-current="step"`, ต่อไป = ขอบ `--border`), label, `date` ผ่าน `formatDate`, `note` (`break-words`)
  - `horizontal` = แถวเลื่อนแนวนอนได้ใน `overflow-x-auto` (สำหรับ ≤ 6 ขั้น), `vertical` = รายการแนวตั้ง (15 ขั้นข้อร้องเรียน); มือถือ (<640px) ใช้แนวตั้งเสมอ (`sm:` class)
  - เส้นเชื่อมระหว่างขั้นที่ผ่านแล้วเป็น `<span data-line>` สี `--accent`; หลัง mount ถ้าไม่ `prefersReducedMotion()`:

```ts
useEffect(() => {
  const box = ref.current;
  if (!box || prefersReducedMotion()) return;
  const lines = box.querySelectorAll('[data-line]');
  const dot = box.querySelector('[aria-current="step"] [data-dot]');
  const a = animate(lines, {
    scale: [0, 1], // แนวนอนใช้ scaleX ผ่าน origin-left, แนวตั้งใช้ origin-top — ตั้งด้วย class
    duration: 220,
    delay: stagger(60),
    ease: 'outQuad',
  });
  const b = dot
    ? animate(dot, { scale: [0.6, 1.12, 1], duration: 420, delay: lines.length * 60, ease: 'outBack' })
    : null;
  return () => {
    a.revert();
    b?.revert();
  };
}, [current, orientation]);
```
  (`import { animate, stagger } from 'animejs'`; รวมเวลาไม่เกิน 600ms — ถ้ามีเส้นมาก ให้ `delay: stagger(Math.min(60, 360 / lines.length))`)

- [ ] **Step 6: `ScoreRing.tsx`** — SVG วงกลม r=36, stroke 8; วงพื้น `--border-light`, วงค่า `--accent` `strokeDasharray={C}` `strokeDashoffset={C * (1 - value/total)}` (C = 2πr) หมุน -90°; ตัวเลขกลาง `<span data-count>{value}</span>/{total}` + `label` ใต้วง; `role="img"` `aria-label={`${label} ${value} จาก ${total}`}` animejs (ไม่ reduced motion): วง `strokeDashoffset: [C, ค่าจริง]` 600ms `outQuad` และตัวเลขนับขึ้นจาก 0:

```ts
const n = { v: 0 };
const c = animate(n, {
  v: value,
  duration: 600,
  ease: 'outQuad',
  modifier: utils.round(0),
  onUpdate: () => {
    if (countRef.current) countRef.current.textContent = String(n.v);
  },
});
```

- [ ] **Step 7: `DrawCheck.tsx`** — SVG วงกลม + path ถูก (`stroke="currentColor"`, สี `--accent`), `aria-hidden="true"`; mount แล้ว (ไม่ reduced motion) `animate(svg.createDrawable(path), { draw: ['0 0', '0 1'], duration: 450, ease: 'inOutQuad' })` (`import { animate, svg } from 'animejs'`)

- [ ] **Step 8: ตรวจ + commit**

Run: `npm run lint && npx tsc --noEmit && npm test && npm run format:check`
Expected: ผ่านทั้งหมด (lint 0 warning)

```bash
git add src/components/prototype
git commit -m "feat(proto): shared prototype kit (badge, modal, tabs, chips, timeline, ring, check)"
```

---

### Task 2: ปุ่มข้อเสนอแนะ

**Files:**
- Create: `src/components/feedback/csv.ts`, `src/components/feedback/csv.test.ts`, `src/components/feedback/store.ts`, `src/components/feedback/FeedbackButton.tsx`
- Modify: `src/app/layout.tsx` (วาง `<FeedbackButton />` ใน `AuthProvider` ต่อจาก `<AuthGuard>`)

**Interfaces:**
- Consumes: `Modal` (Task 1), `useAuth` (`user?.role`), `roleLabels` จาก `@/mock` (ชื่อ role ภาษาไทย)
- Produces: `FeedbackEntry`, `feedbackKinds`, `toCsv(entries): string`, `loadFeedback()`, `saveFeedback(list)`

- [ ] **Step 1: เขียนเทสต์ที่ล้ม** `src/components/feedback/csv.test.ts`

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCsv, type FeedbackEntry } from './csv.ts';

const base: FeedbackEntry = {
  id: '1',
  at: '2026-10-20T09:30:00.000Z',
  page: 'คำขอรับรอง',
  path: '/requests?group=closed',
  role: 'Admin สรร.',
  kind: 'bug',
  message: 'ปุ่มกดไม่ได้',
  name: 'สมชาย',
};

test('เริ่มด้วย BOM และหัวคอลัมน์ภาษาไทยตามลำดับ', () => {
  const lines = toCsv([]).split('\r\n');
  assert.equal(lines[0], '﻿เวลา,หน้า,path,role,ประเภท,ข้อความ,ชื่อ');
});

test('แปลงประเภทเป็นป้ายภาษาไทย และเวลาเป็นเวลาท้องถิ่น', () => {
  const row = toCsv([base]).split('\r\n')[1];
  assert.match(row, /,ปัญหาการใช้งาน,/);
  assert.ok(row.startsWith(new Date(base.at).toLocaleString('th-TH') + ','));
});

test('ครอบด้วยเครื่องหมายคำพูดเมื่อมีจุลภาค คำพูด หรือขึ้นบรรทัด', () => {
  const csv = toCsv([
    { ...base, message: 'ก, ข', name: 'เขาว่า "ดี"', page: 'บรรทัด\nสอง' },
  ]);
  assert.ok(csv.includes('"ก, ข"'));
  assert.ok(csv.includes('"เขาว่า ""ดี"""'));
  assert.ok(csv.includes('"บรรทัด\nสอง"'));
});

test('ชื่อว่างได้ และหลายแถวคั่นด้วย CRLF', () => {
  const csv = toCsv([{ ...base, name: '' }, { ...base, id: '2', kind: 'idea' }]);
  const lines = csv.split('\r\n');
  assert.equal(lines.length, 3);
  assert.ok(lines[1].endsWith(','));
  assert.match(lines[2], /อยากให้มีเพิ่ม/);
});
```

- [ ] **Step 2: รันให้ล้ม**

Run: `node --test src/components/feedback/csv.test.ts`
Expected: FAIL — ไม่พบโมดูล `./csv.ts`

- [ ] **Step 3: เขียน `csv.ts`**

```ts
export const feedbackKinds = {
  bug: 'ปัญหาการใช้งาน',
  idea: 'อยากให้มีเพิ่ม',
  data: 'ข้อมูลไม่ถูกต้อง',
  other: 'อื่น ๆ',
} as const;

export type FeedbackKind = keyof typeof feedbackKinds;

export interface FeedbackEntry {
  id: string;
  /** ISO time */
  at: string;
  /** ชื่อหน้า */
  page: string;
  /** path + query */
  path: string;
  /** ชื่อ role ภาษาไทย หรือ "ยังไม่เข้าสู่ระบบ" */
  role: string;
  kind: FeedbackKind;
  message: string;
  name: string;
}

const cell = (v: string) =>
  /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

/** CSV ที่ Excel เปิดภาษาไทยได้ (BOM + CRLF ตาม RFC 4180) */
export function toCsv(entries: FeedbackEntry[]): string {
  const head = ['เวลา', 'หน้า', 'path', 'role', 'ประเภท', 'ข้อความ', 'ชื่อ'];
  const rows = entries.map((e) =>
    [
      new Date(e.at).toLocaleString('th-TH'),
      e.page,
      e.path,
      e.role,
      feedbackKinds[e.kind],
      e.message,
      e.name,
    ]
      .map(cell)
      .join(','),
  );
  return '﻿' + [head.join(','), ...rows].join('\r\n');
}
```

- [ ] **Step 4: รันเทสต์ให้ผ่าน**

Run: `npm test`
Expected: PASS ทุกไฟล์ (เดิม 29 + ใหม่ 4)

- [ ] **Step 5: `store.ts`**

```ts
import type { FeedbackEntry } from './csv';

const KEY = 'accpharm_feedback';
const NAME_KEY = 'accpharm_feedback_name';

/** อ่านแบบทนข้อมูลเสีย/ถูกบล็อก — คืน [] แทนการ throw */
export function loadFeedback(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveFeedback(list: FeedbackEntry[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export const loadName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
};

export const saveName = (name: string) => {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* ไม่จำชื่อได้ก็ไม่เป็นไร */
  }
};
```

- [ ] **Step 6: `FeedbackButton.tsx`**
  - ปุ่มลอย `fixed bottom-5 right-5 z-30 print:hidden` class `btn-primary rounded-full shadow-lg` ไอคอน `IconMessageCircle` + ข้อความ "ข้อเสนอแนะ" (ซ่อนข้อความบนจอ < 640px — ปุ่มมี `aria-label="ส่งข้อเสนอแนะ"`), มี badge จำนวนที่เก็บไว้ (`tabular-nums`) เมื่อ > 0
  - list โหลดจาก `loadFeedback()` ใน `useEffect` ตอน mount (หลีกเลี่ยง hydration mismatch); ฟัง `storage` event เพื่อซิงก์ข้ามแท็บ
  - เปิด → `<Modal title="ส่งข้อเสนอแนะ" size="lg">` มีสองส่วนด้วย `<Tabs label="ข้อเสนอแนะ">` (`state` ภายใน ไม่ผูก URL): "เขียนใหม่" / "ที่ส่งไว้" (count = จำนวน)
  - **เขียนใหม่:** บรรทัดเล็กแสดงสิ่งที่จะแนบอัตโนมัติ "หน้า: {ชื่อหน้า} · {role}"; fieldset ประเภท (radio 4 ตัวจาก `feedbackKinds`, บังคับ — error "เลือกประเภท"); textarea ข้อความ (บังคับ — error "กรอกข้อความ", `data-autofocus`); input ชื่อ (`name="feedbackName"`, `autoComplete="name"`, ค่าเริ่มจาก `loadName()`); ปุ่ม "บันทึก"
  - กดบันทึก: ตรวจ → ผิดแล้ว `focusFirstError(box)`; ถูก → สร้าง entry `{ id: crypto.randomUUID(), at: new Date().toISOString(), page, path: location.pathname + location.search, role: user ? roleLabels[user.role] : 'ยังไม่เข้าสู่ระบบ', kind, message: message.trim(), name: name.trim() }` โดย `page = document.querySelector('h1')?.textContent?.trim() || document.title`; `saveFeedback([entry, ...list])` → `saveName(name)` → `toast.success('บันทึกข้อเสนอแนะแล้ว ขอบคุณ')` → ล้างประเภท/ข้อความ ปิด modal; ถ้า `saveFeedback` คืน false → `toast.error('บันทึกไม่ได้ เบราว์เซอร์ไม่อนุญาตให้เก็บข้อมูล')` และไม่ปิด
  - ปิด modal ขณะมีข้อความค้าง → `window.confirm('ทิ้งข้อความที่พิมพ์ไว้?')`
  - **ที่ส่งไว้:** ว่าง → "ยังไม่มีข้อเสนอแนะ"; มี → `<ul>` แต่ละรายการ: ประเภท (badge), `formatDateTime(at)`, หน้า + path (`break-words`), role, ข้อความ (`whitespace-pre-wrap break-words`), ชื่อ, ปุ่ม "ลบ" (`aria-label={`ลบข้อเสนอแนะ ${formatDateTime(at)}`}`, ยืนยัน `window.confirm('ลบข้อเสนอแนะนี้?')`); ด้านบนปุ่ม **"ดาวน์โหลดทั้งหมด (.csv)"** (disabled เมื่อว่าง):

```ts
const download = () => {
  const blob = new Blob([toCsv(list)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `accpharm-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
```

- [ ] **Step 7: วางใน `src/app/layout.tsx`**

```tsx
<AuthProvider>
  <AuthGuard>{children}</AuthGuard>
  <FeedbackButton />
  <ToastProvider />
</AuthProvider>
```

- [ ] **Step 8: ตรวจ + commit**

Run: `npm run lint && npx tsc --noEmit && npm test && npm run format:check && npm run build`
Expected: ผ่านทั้งหมด

```bash
git add src/components/feedback src/app/layout.tsx
git commit -m "feat(proto): feedback button with localStorage and CSV export"
```

---

### Task 3: F5a ตรวจรักษาคุณภาพ

**Files:**
- Create: `src/mock/prototype/pharmacies.ts`, `src/mock/prototype/postAudit.ts`, `src/app/post-audit/page.tsx`, `src/app/post-audit/assign/page.tsx`, `src/app/post-audit/[id]/page.tsx`, `src/app/post-audit/[id]/inspect/page.tsx`
- Modify: `src/contexts/AuthContext.tsx` (เพิ่ม `'/post-audit'` ใน `rolePageAccess.pharmacy` ต่อจาก `'/requests'`), `src/components/layout/Sidebar.tsx` (ป้ายตาม role)

**Interfaces:**
- Consumes: Task 1 ทั้งหมด, `pharmacies` + `assessors` + `users` จาก `@/mock` (อ่านอย่างเดียว), `useAuth`, `useQueryState`
- Produces (Task 4–6 ใช้):

```ts
// src/mock/prototype/pharmacies.ts
import type { Pharmacy } from '@/types/api';
export type Region = 'เหนือ' | 'กลาง' | 'ตะวันออกเฉียงเหนือ' | 'ใต้' | 'ตะวันออก';
export const provinceRegion: Record<string, Region>;   // ครอบทุกจังหวัดที่ใช้ใน protoPharmacies
export const protoPharmacies: Pharmacy[];              // = [...pharmacies จาก @/mock, ...ร้านเพิ่ม 19 ร้าน id 101–119]
export const findPharmacy: (id: number) => Pharmacy | undefined;
export const provinces: string[];                      // เรียงตามตัวอักษรไทย (localeCompare 'th')
```

```ts
// src/mock/prototype/postAudit.ts
export type AuditPartStatus = 'pending' | 'notify' | 'fixing' | 'replied' | 'closed';
export const auditPartLabels: Record<AuditPartStatus, string>; // รอตรวจ / รอแจ้งร้าน / รอร้านแก้ไข / ร้านแจ้งกลับแล้ว / ปิดแล้ว
export type AuditPart = 'quality' | 'ci';
export const auditPartTitles: Record<AuditPart, string>; // ระบบร้านยาคุณภาพ / มาตรฐานบริการ Common illness
export const qualityCategories: string[];   // 5 หมวด ตามลำดับด้านล่าง
export const ciChecklist: string[];         // 12 ข้อ ตามลำดับด้านล่าง
export const satisfactionLevels: string[];  // ['น้อยที่สุด','น้อย','ปานกลาง','มาก','มากที่สุด']
export interface AuditFinding { category: string; text: string; photos: number }
export interface AuditPartResult {
  status: AuditPartStatus;
  findings: AuditFinding[];      // ใช้กับ quality
  checklist: (boolean | null)[]; // ใช้กับ ci — 12 ช่อง; null = ยังไม่ตรวจ
  checklistNotes: string[];      // 12 ช่อง
  satisfaction?: number;         // 1–5 ใช้กับ ci
  summary: string;
  notifiedAt?: string; repliedAt?: string; reply?: string; closedAt?: string;
}
export interface PostAudit {
  id: string; no: string; pharmacyId: number; year: number;
  assessorId: number; visitDate: string; method: 'onsite' | 'online';
  parts: Record<AuditPart, AuditPartResult>;
  history: { at: string; by: string; text: string }[];
}
export const postAudits: PostAudit[]; // 10 รายการ ปี 2568–2569 กระจายทุกสถานะ; อย่างน้อย 2 รายการของ pharmacyId 1 (ร้านของ user ร้านยา) โดย 1 รายการมีส่วนที่ 'fixing'
export const overallStatus: (a: PostAudit) => AuditPartStatus; // สถานะ "ช้าสุด" ของ 2 ส่วนตามลำดับ pending < notify < fixing < replied < closed
export const cycleSteps: string[]; // ['ตรวจ','แจ้งร้าน','ร้านแจ้งกลับ','พิจารณา','ปิด']
export const cycleIndex: (s: AuditPartStatus) => number; // pending 0 · notify 1 · fixing 2 · replied 3 · closed 5 (เสร็จทุกขั้น)
```

ค่าตายตัว (จาก `Acc-Pharm/CPAQA/CPAQA/PostAudit.aspx`):

```ts
export const qualityCategories = [
  'หมวดสถานที่',
  'หมวดอุปกรณ์',
  'หมวดบุคลากร',
  'หมวดการควบคุมคุณภาพยา',
  'การปฏิบัติตามวิธีปฏิบัติทางเภสัชกรรมชุมชน',
];

export const ciChecklist = [
  'การบริการโดยเภสัชกร',
  'การซักถามอาการ',
  'การจ่ายยา',
  'การแนะนำการใช้ยา',
  'การติดตามหลังจ่ายยา (72 ชั่วโมง)',
  'ไม่พบการรับยาแทน',
  'การประชาสัมพันธ์ถูกต้อง',
  'การเก็บรายงานการให้บริการ',
  'การจัดทำทะเบียน',
  'ไม่พบมีการจัดบริการ CI + PP แบบ Package',
  'มีเอกสารเพื่อการส่งต่อ (Refer)',
  'การให้บริการภายในเวลาที่ระบุใน ขย.5',
];
```

- [ ] **Step 1: mock `pharmacies.ts`** — ร้านเพิ่ม 19 ร้าน ชื่อร้านสมมติ (เช่น "ร้านยาสุขใจฟาร์มาซี") กระจาย 12 จังหวัดอย่างน้อย 1 จังหวัดต่อภาค, `certStatus` ผสม A/N/E/X, เลขใบอนุญาตรูปแบบ `ขย.5 เลขที่ 12/2565`, เภสัชกร 1–2 คน (ชื่อสมมติ, `license: 'ภ.12345'`); `provinceRegion` ครอบทุกจังหวัดรวมของ `@/mock`
- [ ] **Step 2: mock `postAudit.ts`** ตาม interface ข้างบน
- [ ] **Step 3: สิทธิ์และเมนู** — `AuthContext.tsx` เพิ่ม `'/post-audit'` ให้ pharmacy; `Sidebar.tsx` เพิ่ม field ไม่บังคับ `roleLabel?: Partial<Record<UserRole, string>>` ใน item แบบ link, ใส่ `roleLabel: { pharmacy: 'ผลตรวจรักษาคุณภาพ' }` ที่ `/post-audit` และตอน render ใช้ `item.roleLabel?.[user.role] ?? item.label` (`const { hasAccess, logout, user } = useAuth()`)
- [ ] **Step 4: `/post-audit`** — หัวหน้า: `PrototypeBadge`; ช่องค้นหา (ชื่อร้าน/เลขที่, `useQueryState('q','')`), `FilterChips` สถานะรวม (`all` + 5 สถานะ, `useQueryState('status','all', keys)` + count), select ปี (`useQueryState('year','all')`); ร้านยาเห็นเฉพาะ `pharmacyId === user.pharmacyId`, ผู้ตรวจเห็นเฉพาะ `assessorId === user.id`; admin/superadmin มีปุ่ม "มอบหมายประจำปี" → `/post-audit/assign`; รายการเป็นการ์ด (`animate-stagger`) แสดงเลขที่, ร้าน, จังหวัด, ปี, ผู้ตรวจ, วันนัด, badge สถานะรวม + 2 badge เล็กต่อส่วน; ลิงก์ไป `/post-audit/[id]`; ว่าง → "ไม่พบรายการที่ตรงกับตัวกรอง" + ปุ่ม "ล้างตัวกรอง"; ห่อ `<Suspense>`
- [ ] **Step 5: `/post-audit/assign`** — role อื่นนอกจาก admin/superadmin เห็นการ์ด "หน้านี้สำหรับเจ้าหน้าที่ สรร." + ลิงก์กลับ; `Stepper` (จาก `@/components/common/Stepper`) 3 ขั้น "เลือกร้าน" / "ผู้ตรวจและวันนัด" / "ยืนยัน": ขั้น 1 select ปี + ค้นหา + กรองจังหวัด + checkbox ร้าน (`certStatus === 'A'` และยังไม่มี `postAudits` ของปีนั้น) + "เลือกทั้งหมดที่แสดง" (error "เลือกอย่างน้อย 1 ร้าน"); ขั้น 2 ผู้ตรวจ (select จาก `assessors`), วันนัด (date, ต้องไม่ก่อนวันนี้), วิธีตรวจ (radio onsite/online); ขั้น 3 สรุป → "ยืนยันมอบหมาย" → `toast.success(`มอบหมาย ${n} ร้านแล้ว`)` → `router.push('/post-audit')`
- [ ] **Step 6: `/post-audit/[id]`** — ไม่พบ id → การ์ด "ไม่พบผลตรวจนี้" + ลิงก์กลับ; ร้านยาเปิดรายการของร้านอื่น → ข้อความเดียวกัน; โหลด audit เข้า `useState` (clone) เพื่อกดเปลี่ยนสถานะได้; ส่วนหัวการ์ด: ร้าน, เลขที่, ปี, ผู้ตรวจ, วันนัด + วิธี, badge รวม + 2 ส่วน; `Tabs` (`useQueryState('tab','info',[...])`, ห่อ `<Suspense>`) แท็บ: ข้อมูล / ระบบร้านยาคุณภาพ / มาตรฐานบริการ / ประวัติ
  - แท็บข้อมูล: ข้อมูลร้าน (ที่อยู่, ผู้ดำเนินกิจการ, ใบอนุญาต) + ปุ่ม "เริ่มตรวจ" (ผู้ตรวจที่ได้รับมอบหมาย และส่วนใดยัง `pending`) → `/post-audit/[id]/inspect`
  - แท็บส่วน (ทั้งสอง): `CycleTimeline steps={cycleSteps} current={cycleIndex(status)}` (horizontal) + วันที่ใน `note`; ผลตรวจ (quality: findings ตามหมวด พร้อมจำนวนรูป; ci: `ScoreRing value={ผ่าน} total={12} label="ผ่าน"` + ตาราง 12 ข้อ ตรง/ไม่ตรง + หมายเหตุ + ความพึงพอใจ) + สรุป; ปุ่มตาม role + สถานะ:
    - admin/superadmin: `notify` → "แจ้งร้าน" (ยืนยัน) ⇒ `fixing`; `replied` → "ปิดผล" ⇒ `closed` + `<DrawCheck />` แสดงข้างหัวส่วน, "ให้แก้ไขเพิ่ม" → `Modal` ช่องเหตุผล (บังคับ) ⇒ `fixing`; ทุกครั้ง push `history` + toast
    - pharmacy เมื่อ `fixing`: ฟอร์ม "ส่งการแก้ไข" — textarea (บังคับ) + input file `accept="image/*" multiple` (1–4 รูป, error "แนบรูป 1–4 รูป"; แสดงชื่อไฟล์) ⇒ `replied` + toast
    - ส่วนที่ `closed` แสดง `<DrawCheck />` + "ปิดผลเมื่อ {formatDate}"
  - แท็บประวัติ: `<ol>` เรียงใหม่→เก่า `formatDateTime(at)` · by · text
- [ ] **Step 7: `/post-audit/[id]/inspect`** — เฉพาะ assessor/admin/superadmin (อื่น ๆ เห็นการ์ดไม่มีสิทธิ์); `Stepper` 3 ขั้น:
  1. ระบบร้านยาคุณภาพ: แต่ละหมวด (5) เป็น `<fieldset>` มีรายการข้อที่ไม่เป็นไปตามมาตรฐาน + ปุ่ม "เพิ่มข้อ" เปิด `Modal` (ข้อความ บังคับ + รูป input file 0–4) แก้ไข/ลบ (ยืนยัน) ได้; textarea สรุปความเห็น (บังคับ)
  2. มาตรฐานบริการ Common illness: ตาราง 12 ข้อ radio "ตรง"/"ไม่ตรง" ต่อข้อ (บังคับทุกข้อ — error ใต้ตาราง "ตอบให้ครบ 12 ข้อ" และ focus ข้อแรกที่ยังไม่ตอบ), ไม่ตรง → ช่อง "ระบุ" (บังคับ); ความพึงพอใจ 5 ระดับ (radio, บังคับ); สรุป (บังคับ); มี `ScoreRing` แสดงผ่าน n/12 สด
  3. ตรวจทาน: สรุปทั้งสองส่วนแบบอ่านอย่างเดียว + ปุ่ม "บันทึกผลตรวจ" → toast "บันทึกผลตรวจแล้ว (ต้นแบบ — ไม่ถูกเก็บ)" → `router.push(`/post-audit/${id}?tab=quality`)`
  - ปุ่ม "ย้อนกลับ"/"ถัดไป" ระหว่างขั้น; ถัดไปตรวจเฉพาะขั้นนั้น
- [ ] **Step 8: ตรวจ + commit**

Run: `npm run lint && npx tsc --noEmit && npm test && npm run format:check && npm run build`
Expected: ผ่าน; build มี route `/post-audit`, `/post-audit/assign`, `/post-audit/[id]`, `/post-audit/[id]/inspect`

```bash
git add src/mock/prototype src/app/post-audit src/contexts/AuthContext.tsx src/components/layout/Sidebar.tsx
git commit -m "feat(proto): post-audit prototype pages"
```

---

### Task 4: F5b ข้อร้องเรียน

**Files:**
- Create: `src/mock/prototype/complaints.ts`, `src/app/complaints/page.tsx`, `src/app/complaints/new/page.tsx`, `src/app/complaints/[id]/page.tsx`

**Interfaces:**
- Consumes: Task 1, `protoPharmacies`/`findPharmacy` (Task 3), `formatDate`
- Produces (Task 5–6 ใช้):

```ts
export type ComplaintStage = 'intake' | 'factfinding' | 'subcommittee' | 'council' | 'resolution' | 'closed';
export const complaintStageLabels: Record<ComplaintStage, string>; // รับเรื่อง / แสวงหาข้อเท็จจริง / คณะอนุกรรมการ / คณะกรรมการสภาฯ / ดำเนินการตามมติ / ปิดแล้ว
export const complaintSteps: string[];          // 15 ขั้น ด้านล่าง
export const stageOfStep: (step: number) => ComplaintStage; // step = จำนวนขั้นที่บันทึกแล้ว: ≤6 intake · 7–9 factfinding · 10–11 subcommittee · 12–13 council · 14 resolution · 15 closed
export const channels: string[];       // ['โทรศัพท์','อีเมล','จดหมาย','Walk-in','สปสช.','อื่น ๆ']
export const severities: string[];     // ['ต่ำ','ปานกลาง','สูง']
export const standards: string[];      // ['มาตรฐานที่ 1 สถานที่','มาตรฐานที่ 2 อุปกรณ์','มาตรฐานที่ 3 บุคลากร','มาตรฐานที่ 4 การควบคุมคุณภาพยา','มาตรฐานที่ 5 การปฏิบัติทางเภสัชกรรมชุมชน']
export const services: string[];       // ['Common illness','บริการเลิกบุหรี่','บริการเภสัชกรรมทางไกล','ร้านยาใกล้บ้านใกล้ใจ','อื่น ๆ']
export const actionOptions: string[];  // ['จำหน่าย','ตักเตือนด้วยวาจา','ตักเตือนด้วยจดหมาย','เสนอกรรมการสภาเภสัชกรรม','แจ้งให้หยุดการบริการ','ส่งเรื่อง สปสช.']
export const councilResults: string[]; // ['ดำเนินการจรรยาบรรณ','แจ้งอนุกรรมการดำเนินการ','อื่น ๆ']
export const findingResults: string[]; // ['ไม่มีมูลความจริง','เป็นเรื่องจริงตามข้อร้องเรียน','อื่น ๆ']
export interface Complaint {
  id: string; no: string; receivedAt: string; channel: string;
  complainant: { name: string; contact: string };
  pharmacyId?: number; pharmacyText?: string; // ระบุเองเมื่อไม่อยู่ในรายชื่อ
  receiver: string; standards: string[]; service: string; issue: string;
  severity: string; detail: string; photos: number;
  /** ขั้นที่บันทึกแล้ว — index ของ complaintSteps ที่ถัดไปคือขั้นปัจจุบัน */
  step: number;
  log: { step: number; date: string; text: string }[];
}
export const complaints: Complaint[]; // 8 รายการ กระจายทุก stage
```

15 ขั้น (จาก `Acc-Pharm/CPAQA/CPAQA/ComplainDetail.aspx`):

```ts
export const complaintSteps = [
  'ช่องทางการแจ้งเรื่อง',
  'ผู้ร้องเรียน',
  'ร้านที่ถูกร้องเรียน',
  'ผู้รับคำร้องเรียน',
  'ประเด็นปัญหา',
  'มาตรฐานและบริการที่เกี่ยวข้อง',
  'ส่งคณะทำงานแสวงหาข้อเท็จจริง',
  'แสวงหาและสืบค้น',
  'คณะทำงานสรุป',
  'คณะอนุกรรมการฯ สรุป',
  'พิจารณาดำเนินการ',
  'เข้าคณะกรรมการสภาฯ',
  'ผลการพิจารณา',
  'อนุกรรมการฯ ดำเนินการตามมติ',
  'ปิดข้อร้องเรียน',
];
```

- [ ] **Step 1: mock `complaints.ts`** — ทุกรายการมี `step >= 6` (ขั้น 1–6 กรอกตอนรับเรื่อง) และ `log` ตาม step
- [ ] **Step 2: `/complaints`** — admin/superadmin เท่านั้น (AuthGuard จัดการแล้ว); ค้นหา (เลขที่/ร้าน/ผู้ร้อง, `useQueryState('q','')`), `FilterChips` stage (`all` + 6), ช่วงวันที่ (2 date input "ตั้งแต่"/"ถึง" — state ในหน้า); ปุ่ม "รับเรื่องใหม่" → `/complaints/new`; ตาราง `data-table` ใน `overflow-x-auto relative` คอลัมน์ เลขที่ · วันที่รับ · ร้าน · ประเด็น · ความรุนแรง · สถานะ; มือถือแสดงเป็นการ์ด (`sm:hidden` / `hidden sm:block`); ห่อ `<Suspense>`
- [ ] **Step 3: `/complaints/new`** — ฟอร์มเดียว 4 ส่วน (`<fieldset>` + `<legend>`): ช่องทาง (select, บังคับ) · ผู้ร้องเรียน ชื่อ (บังคับ, `autoComplete="name"`), ติดต่อ (บังคับ, placeholder `081-234-5678 หรือ name@example.com…`) · ร้าน: ช่องค้นหา + รายการผลลัพธ์ให้เลือก (`role="listbox"` ไม่ต้อง — ใช้ radio list ≤ 8 ผล) หรือ checkbox "ไม่อยู่ในรายชื่อ ระบุเอง" → input ชื่อร้าน/ที่อยู่ (บังคับอย่างใดอย่างหนึ่ง) · ผู้รับเรื่อง (ค่าเริ่ม `user.name`), มาตรฐาน (checkbox หลายข้อ), บริการ (select), ประเด็น (input บังคับ), ความรุนแรง (radio บังคับ), รายละเอียด (textarea บังคับ), รูปหลักฐาน (file `accept="image/*" multiple` ไม่บังคับ); ผิด → error ใต้ช่อง + `focusFirstError`; ถูก → toast "รับเรื่องแล้ว เลขที่ ร.2569/009 (ต้นแบบ)" → `router.push('/complaints')`; ออกจากหน้าโดยไม่บันทึกไม่ต้องเตือน
- [ ] **Step 4: `/complaints/[id]`** — ไม่พบ → การ์ด "ไม่พบข้อร้องเรียนนี้"; state = clone; ซ้าย (lg: 2/3) ข้อมูลเรื่องเป็น `<dl>` + ร้าน (ลิงก์ไป `/pharmacies/[id]` ถ้ามี `pharmacyId`); ขวา (lg: 1/3) `CycleTimeline orientation="vertical" steps={complaintSteps} current={step}` พร้อม `note` = text ของ log ขั้นนั้น + `date`
  - ปุ่ม "บันทึกขั้นถัดไป: {complaintSteps[step]}" (เมื่อ `step < 15`) เปิด `Modal` ช่องตามขั้น:
    - ขั้น 7, 9, 10, 12, 14 (index 6, 8, 9, 11, 13): วันที่ (บังคับ) + รายละเอียด; index 9 เพิ่ม ผลการสรุป (radio `findingResults`, บังคับ) + ความรุนแรง (select); index 11 เพิ่ม "ครั้งที่" (number ≥ 1, บังคับ)
    - ขั้น 8 (index 7): รายละเอียดการแสวงหา (textarea บังคับ)
    - ขั้น 11 (index 10): การดำเนินการ (radio `actionOptions`, บังคับ); "แจ้งให้หยุดการบริการ" → วันที่ให้หยุดบริการ (บังคับ); "ส่งเรื่อง สปสช." → หน่วยงาน (บังคับ); ตักเตือน → "ตักเตือนโดย" (บังคับ)
    - ขั้น 13 (index 12): ผล (radio `councilResults`, บังคับ) + ระบุเมื่อ "อื่น ๆ"
    - ขั้น 15 (index 14): วันที่ปิด (บังคับ) + ผู้ปิด (ค่าเริ่ม `user.name`)
    - บันทึก → push log, `step + 1`, toast "บันทึกขั้น {ชื่อขั้น} แล้ว"
  - ปุ่ม "ปิดเรื่อง" (`btn-secondary`, เมื่อยังไม่ปิด) = ข้ามไปขั้น 15 ทันที ยืนยัน `window.confirm('ปิดเรื่องนี้โดยข้ามขั้นที่เหลือ?')`
- [ ] **Step 5: ตรวจ + commit**

Run: `npm run lint && npx tsc --noEmit && npm test && npm run format:check && npm run build`

```bash
git add src/mock/prototype/complaints.ts src/app/complaints
git commit -m "feat(proto): complaints prototype pages"
```

---

### Task 5: F6 ร้านยา, พื้นที่, GPP

**Files:**
- Create: `src/app/pharmacies/page.tsx`, `src/app/pharmacies/[id]/page.tsx`, `src/app/map/page.tsx`, `src/app/gpp/page.tsx`, `src/mock/prototype/gpp.ts`

**Interfaces:**
- Consumes: `protoPharmacies`, `findPharmacy`, `provinces`, `provinceRegion` (Task 3), `postAudits`, `overallStatus`, `auditPartLabels` (Task 3), `complaints`, `complaintStageLabels`, `stageOfStep` (Task 4), `seedRequests` จาก `@/mock`, `CertBadge`/`StatusBadge` จาก `@/components/common/StatusBadge`, `certStatusLabels` จาก `@/lib/constants`
- Produces:

```ts
// src/mock/prototype/gpp.ts
export interface GppRound { id: string; province: string; year: number; open: boolean }
export interface GppResult { pharmacyId: number; roundId: string; score: number; assessedAt: string; assessor: string }
export const gppRounds: GppRound[];   // รอบปี 2569 ของทุกจังหวัดใน provinces (open: true) + ปี 2568 (open: false)
export const gppResults: GppResult[]; // ผลของร้านใน protoPharmacies ครึ่งหนึ่ง คะแนน 55–98
export const GPP_PASS = 70;           // เกณฑ์ผ่าน (%)
```

- [ ] **Step 1: `/pharmacies`** — ค้นหา (ชื่อ/ใบอนุญาต/ผู้ดำเนินกิจการ `useQueryState('q','')`), select จังหวัด (`useQueryState('province','all')` — `/map` ลิงก์มาด้วย `?province=`), `FilterChips` สถานะใบรับรอง (`all` + N/A/E/X + count), select ประเภท (`type` ที่มีในข้อมูล); role `ppho` บังคับจังหวัด = `user.province` (ซ่อน select จังหวัด แสดงข้อความ "จังหวัด{province}"); สลับมุมมอง ตาราง/การ์ด (`useQueryState('view','table',['table','card'])`, ปุ่ม `aria-pressed`); มือถือแสดงการ์ดเสมอ; ตารางคอลัมน์ ชื่อร้าน · จังหวัด · ประเภท · ใบรับรอง (`CertBadge`) · หมดอายุ; แถวกดได้ด้วยลิงก์ที่ชื่อร้าน; ห่อ `<Suspense>`
- [ ] **Step 2: `/pharmacies/[id]`** — ไม่พบ → การ์ด; ppho เปิดร้านนอกจังหวัด → "ร้านนี้อยู่นอกจังหวัดที่รับผิดชอบ"; ส่วนหัว: ชื่อ, `CertBadge`, เลขใบรับรอง, จังหวัด; `Tabs` (`useQueryState('tab','info',...)`, `<Suspense>`): ข้อมูลร้าน (`<dl>`) / เภสัชกร (ตาราง ชื่อ · เลขใบประกอบ · หน้าที่ · เวลา) / ประวัติการรับรอง (สร้างจาก `certIssued`/`certExpires` + รายการสมมติก่อนหน้า 1 รอบ) / คำขอ (`seedRequests` ของร้าน → ลิงก์ `/requests/[id]` เฉพาะ role ที่ `hasAccess('/requests')`) / ตรวจรักษาคุณภาพ (`postAudits` ของร้าน → ลิงก์) / ข้อร้องเรียน (เฉพาะ admin/superadmin; `complaints` ของร้าน → ลิงก์) — แท็บที่ว่างแสดง "ยังไม่มีข้อมูล"
- [ ] **Step 3: `/map`** — ป้าย info ด้านบน "ตอนนี้แสดงเป็นการ์ดแยกภาค — แผนที่จริงจะทำในขั้นถัดไป"; การ์ดต่อภาค (เรียงตาม `Region`) หัวการ์ด: ภาค + จำนวนร้านรวม; ในการ์ด: แถวต่อจังหวัด เป็น `Link href={`/pharmacies?province=${encodeURIComponent(p)}`}` แสดงชื่อจังหวัด + จำนวนแยก รับรองแล้ว/ยังไม่รับรอง/หมดอายุ/ถูกยกเลิก (badge เล็ก + `tabular-nums`) + แถบสัดส่วนสี (div กว้างตาม %, `animate-grow-x`); grid `sm:grid-cols-2 xl:grid-cols-3`
- [ ] **Step 4: `/gpp`** — ppho เห็นเฉพาะ `user.province`, superadmin มี select จังหวัด; การ์ดสรุป (`stat-card`) ร้านทั้งหมด · ประเมินแล้ว · ผ่าน (≥ `GPP_PASS`) · ไม่ผ่าน; ตาราง ร้าน · คะแนน (`tabular-nums` + แถบ) · ผล (badge ผ่าน/ไม่ผ่าน/ยังไม่ประเมิน) · วันที่ · ผู้ประเมิน; การ์ดรอบประเมิน: ปี + สถานะ "เปิดอยู่"/"ปิดแล้ว" + ปุ่ม "ปิดรอบประเมิน" (ยืนยัน `window.confirm('ปิดรอบประเมินปี 2569 ของจังหวัด…? ร้านที่ยังไม่ประเมินจะไม่สามารถส่งผลได้')`) → state `open=false` + toast
- [ ] **Step 5: ตรวจ + commit**

Run: `npm run lint && npx tsc --noEmit && npm test && npm run format:check && npm run build`

```bash
git add src/mock/prototype/gpp.ts src/app/pharmacies src/app/map src/app/gpp
git commit -m "feat(proto): pharmacies, area cards and GPP prototype pages"
```

---

### Task 6: F7 รายงาน

**Files:**
- Modify: `package.json`, `package-lock.json` (`npm install recharts`)
- Create: `src/mock/prototype/reports.ts`, `src/app/reports/page.tsx`

**Interfaces:**
- Consumes: `protoPharmacies`, `provinces` (Task 3), `gppResults`, `GPP_PASS` (Task 5), `complaints`, `stageOfStep`, `complaintStageLabels` (Task 4), `seedRequests` จาก `@/mock`, `requestStatusLabels`, `certStatusLabels`
- Produces:

```ts
// src/mock/prototype/reports.ts
export type ReportKind = 'requests' | 'pharmacies' | 'expiring' | 'gpp' | 'complaints';
export const reportKinds: { key: ReportKind; label: string; excel: string }[];
// label: คำขอตามสถานะ / ร้านยาตามจังหวัด / ใบรับรองใกล้หมดอายุ / ผลประเมิน GPP / ข้อร้องเรียน
// excel: คำอธิบายไฟล์ เช่น 'ไฟล์ .xlsx 1 sheet: เลขที่คำขอ, ร้าน, ประเภท, สถานะ, วันที่ยื่น'
export interface ReportData {
  cards: { label: string; value: number }[];
  chart: { name: string; value: number }[];
  columns: string[];
  rows: (string | number)[][];
}
export const buildReport: (kind: ReportKind, f: { from?: string; to?: string; province?: string }) => ReportData;
```
`buildReport` คำนวณจาก mock (ไม่ใช่ตัวเลขตายตัว): requests นับตามสถานะ (ตัวอย่างเพิ่มคำขอสมมติ 30 รายการกระจายเดือน/สถานะในไฟล์นี้เพื่อให้กราฟมีเนื้อ), pharmacies นับตามจังหวัด, expiring = `certExpires` ภายใน 90 วันจากวันนี้ (กราฟรายเดือน), gpp = ช่วงคะแนน 50–59/60–69/70–79/80–89/90–100, complaints นับตาม stage

- [ ] **Step 1:** `npm install recharts` (ตรวจว่ารองรับ React 19 — ถ้า peer dependency ขัด ให้หยุดและรายงาน ไม่ใช้ `--force`)
- [ ] **Step 2: mock `reports.ts`**
- [ ] **Step 3: `/reports`** — ตัวเลือก (`useQueryState`: `kind` ค่าเริ่ม `requests`, `province` `all`; ช่วงวันที่เป็น state) — ประเภทเป็น `FilterChips`; การ์ดสรุป `stat-card` (`animate-stagger`); กราฟ `ResponsiveContainer` สูง 280 + `BarChart` (`Bar fill="var(--accent)"`, `XAxis`/`YAxis` `tick={{ fontSize: 12 }}`, `Tooltip`) ห่อด้วย `<figure>` + `<figcaption className="sr-only">` อธิบายกราฟ และ `isAnimationActive={!prefersReducedMotion()}` (อ่านใน `useEffect` → state); ตาราง `data-table` ใน `overflow-x-auto relative`; ปุ่ม "ส่งออก Excel" → `toast(`ต้นแบบ: ระบบจริงจะได้${excel}`)`; หน้าห่อ `<Suspense>`; recharts เป็น client-only — ใช้ใน component `'use client'` ได้ตรง ๆ
- [ ] **Step 4: ตรวจ + commit**

Run: `npm run lint && npx tsc --noEmit && npm test && npm run format:check && npm run build`

```bash
git add package.json package-lock.json src/mock/prototype/reports.ts src/app/reports
git commit -m "feat(proto): reports prototype with recharts"
```

---

### Task 7: F8 ข่าว เอกสาร ผู้ใช้

**Files:**
- Create: `src/mock/prototype/content.ts`, `src/mock/prototype/admin.ts`, `src/app/news/page.tsx`, `src/app/news/[id]/page.tsx`, `src/app/documents/page.tsx`, `src/app/users/page.tsx`

**Interfaces:**
- Consumes: Task 1, `users`, `roleLabels` จาก `@/mock`, `provinces` (Task 3)
- Produces:

```ts
// src/mock/prototype/content.ts
export const newsCategories: string[]; // ['ประกาศ','ข่าวกิจกรรม','อบรม/ประชุม']
export interface NewsItem { id: string; title: string; category: string; publishedAt: string; summary: string; body: string[]; pinned?: boolean }
export const news: NewsItem[]; // 8 รายการ
export const docCategories: string[]; // ['ระเบียบ/ประกาศ','แบบฟอร์ม','คู่มือ']
export interface DocItem { id: string; title: string; category: string; fileType: 'PDF' | 'DOCX' | 'XLSX'; sizeKb: number; updatedAt: string }
export const documents: DocItem[]; // 10 รายการ

// src/mock/prototype/admin.ts
export interface ProtoUser { id: number; name: string; username: string; email: string; role: UserRole; org: string; province?: string; active: boolean }
export const protoUsers: ProtoUser[]; // = users จาก @/mock (active: true) + 10 คนสมมติ ครบทุก role
```

- [ ] **Step 1: mock `content.ts` และส่วน users ของ `admin.ts`**
- [ ] **Step 2: `/news`** — `FilterChips` หมวด (`all` + 3, `useQueryState('cat','all')`), ข่าวปักหมุดอยู่บน, การ์ด (`animate-stagger`) วันที่ · หมวด · หัวข้อ (ลิงก์ `/news/[id]`) · สรุป; admin/superadmin มีปุ่ม "เพิ่มข่าว" และปุ่ม "แก้ไข" ต่อการ์ด → `Modal` (หัวข้อ บังคับ, หมวด select, สรุป บังคับ, เนื้อหา textarea บังคับ, ปักหมุด checkbox) → อัปเดต state + toast; `<Suspense>`
- [ ] **Step 3: `/news/[id]`** — ไม่พบ → การ์ด; ลิงก์ "← ข่าวทั้งหมด", หัวข้อ `h2`, วันที่ `formatDateLong`, หมวด, ย่อหน้า `body` (`max-w-prose`); ข่าวอื่นในหมวดเดียวกัน 3 รายการ
- [ ] **Step 4: `/documents`** — ค้นหา + `FilterChips` หมวด; รายการ: ไอคอนตามชนิดไฟล์, ชื่อ, ชนิด · ขนาด (`Intl.NumberFormat('th-TH')` + " KB") · ปรับปรุง; ปุ่ม "ดาวน์โหลด" (`aria-label={`ดาวน์โหลด ${title}`}`) → `toast('ต้นแบบ: ระบบจริงจะดาวน์โหลดไฟล์ …')`; admin/superadmin เพิ่ม/แก้ไข (`Modal`: ชื่อ บังคับ, หมวด, ไฟล์ input file บังคับเมื่อเพิ่ม) และลบ (ยืนยัน)
- [ ] **Step 5: `/users`** — ค้นหา (ชื่อ/username/อีเมล) + `FilterChips` role (`all` + 5 จาก `roleLabels`) + checkbox "แสดงผู้ใช้ที่ปิดใช้งาน"; ตาราง ชื่อ · username · role · หน่วยงาน · จังหวัด · สถานะ; ปุ่ม "เพิ่มผู้ใช้" / "แก้ไข" → `Modal`: ชื่อ (บังคับ, `autoComplete="off"`), username (บังคับ, `[a-z0-9._]{4,}` error "ใช้ a–z, 0–9, จุด, ขีดล่าง อย่างน้อย 4 ตัว", ซ้ำไม่ได้, `spellCheck={false}`), อีเมล (บังคับ, `type="email"`, `spellCheck={false}`), role (select), หน่วยงาน (บังคับ), จังหวัด (select `provinces` — แสดงและบังคับเมื่อ role = ppho); ปุ่ม "ปิดใช้งาน"/"เปิดใช้งาน" (ปิดต้องยืนยัน) → toast; ห้ามปิดใช้งานตัวเอง (ปุ่ม disabled + `title`)
- [ ] **Step 6: ตรวจ + commit**

Run: `npm run lint && npx tsc --noEmit && npm test && npm run format:check && npm run build`

```bash
git add src/mock/prototype/content.ts src/mock/prototype/admin.ts src/app/news src/app/documents src/app/users
git commit -m "feat(proto): news, documents and users prototype pages"
```

---

### Task 8: F8 งานผู้ดูแลที่เหลือ + ลบหน้า "กำลังพัฒนา"

**Files:**
- Modify: `src/mock/prototype/admin.ts` (เพิ่มข้อมูลด้านล่าง)
- Create: `src/app/master-data/page.tsx`, `src/app/templates/page.tsx`, `src/app/settings/page.tsx`, `src/app/allocation/page.tsx`, `src/app/profile/page.tsx`
- Delete: `src/app/[...slug]/page.tsx`

**Interfaces:**
- Consumes: Task 1, `protoUsers` (Task 7), `provinces` + `provinceRegion` (Task 3), `assessors` จาก `@/mock`, `replyTemplates` จาก `@/lib/constants`
- Produces (ใน `admin.ts`):

```ts
export type MasterKind = 'type' | 'group' | 'chain';
export const masterKindLabels: Record<MasterKind, string>; // ประเภทร้านยา / กลุ่มร้านยา / เครือข่าย (Chain)
export interface MasterItem { id: number; kind: MasterKind; name: string; code: string; active: boolean }
export const masterItems: MasterItem[]; // 4–6 ต่อ kind
export interface ReplyTemplate { id: number; name: string; body: string }
export const templates: ReplyTemplate[]; // จาก replyTemplates (ชื่อ "ข้อความ 1…") + 3 รายการใหม่ ที่มีตัวแปร {ชื่อร้าน} {เลขที่คำขอ}
export const defaultSettings: { gppPass: number; certYears: number; acceptRequests: boolean; adminEmail: string };
// { gppPass: 70, certYears: 3, acceptRequests: true, adminEmail: 'qa@pharmacycouncil.org' }
export const allocations: Record<number, string[]>; // assessor id → จังหวัดที่รับผิดชอบ
```

- [ ] **Step 1: เพิ่มข้อมูลใน `admin.ts`**
- [ ] **Step 2: `/master-data`** — `Tabs` 3 แท็บตาม `MasterKind` (`useQueryState('tab','type',...)`, `<Suspense>`); ในแต่ละแท็บ ตาราง รหัส · ชื่อ · สถานะ + ปุ่ม "เพิ่ม" / "แก้ไข" (`Modal`: รหัส บังคับและไม่ซ้ำใน kind, ชื่อ บังคับ, ใช้งาน checkbox) / "ลบ" (ยืนยัน) → toast
- [ ] **Step 3: `/templates`** — รายการ template (ชื่อ + ข้อความย่อ 2 บรรทัด `line-clamp-2`); "แก้ไข"/"เพิ่ม" → `Modal size="lg"`: ชื่อ (บังคับ), ข้อความ (บังคับ), ปุ่มแทรกตัวแปร `{ชื่อร้าน}` `{เลขที่คำขอ}` (แทรกที่ cursor ของ textarea), กล่อง "ตัวอย่าง" แสดงข้อความที่แทนตัวแปรด้วย "ร้านยาสุขใจฟาร์มาซี" และ "REN-2569-0012" สด; ลบ (ยืนยัน)
- [ ] **Step 4: `/settings`** — superadmin (AuthGuard จัดการแล้ว); ฟอร์มเดียว: เกณฑ์ผ่าน GPP (number 50–100, `inputMode="numeric"`, หน่วย %), อายุใบรับรอง (number 1–5 ปี), เปิดรับคำขอ (checkbox แบบ switch `role="switch"` `aria-checked`), อีเมลผู้ดูแล (email บังคับ); ปุ่ม "บันทึก" (disabled เมื่อไม่มีอะไรเปลี่ยน) → ตรวจ → toast "บันทึกการตั้งค่าแล้ว (ต้นแบบ — ไม่ถูกเก็บ)"; ปุ่ม "คืนค่าเดิม"
- [ ] **Step 5: `/allocation`** — superadmin; รายการผู้ตรวจ (`assessors`) แต่ละคนเป็นการ์ด: ชื่อ + chip จังหวัดที่รับผิดชอบ (ปุ่มลบ chip มี `aria-label={`เอา${p}ออก`}`) + select "เพิ่มจังหวัด" (เฉพาะจังหวัดที่ยังไม่ถูกเลือกในการ์ดนั้น); ด้านบนแสดง "จังหวัดที่ยังไม่มีผู้ตรวจ: …" (คำนวณสด, badge warning); ปุ่ม "บันทึกการมอบหมาย" → toast
- [ ] **Step 6: `/profile`** — ทุก role; การ์ดข้อมูลส่วนตัวจาก `user` (ชื่อ, username, อีเมล, role, หน่วยงาน, จังหวัด) ช่องแก้ได้: ชื่อ (`autoComplete="name"`), อีเมล (`autoComplete="email"`) → "บันทึก" → toast (ไม่เปลี่ยน AuthContext); การ์ดเปลี่ยนรหัสผ่าน: รหัสเดิม (`type="password"` `autoComplete="current-password"` บังคับ), รหัสใหม่ (`autoComplete="new-password"`, ≥ 8 ตัว มีตัวอักษรและตัวเลข — hint แสดงเงื่อนไข), ยืนยันรหัสใหม่ (ต้องตรง) → ถูก → ล้างช่อง + toast "เปลี่ยนรหัสผ่านแล้ว (ต้นแบบ — ไม่ได้ส่งจริง)"; ไม่ log หรือเก็บค่ารหัสที่ใด
- [ ] **Step 7: ลบ `src/app/[...slug]/page.tsx`** แล้วยืนยันว่าทุก href ใน `menuStructure` ของ `Sidebar.tsx` และลิงก์ `/profile` ใน `Header.tsx` มี `page.tsx`:

Run (bash): `for p in $(grep -o "href: '/[^']*'" src/components/layout/Sidebar.tsx | cut -d"'" -f2) /profile; do f="src/app${p%/}/page.tsx"; [ "$p" = / ] && f=src/app/page.tsx; [ -f "$f" ] || echo "MISSING $p"; done`
Expected: ไม่มีบรรทัด `MISSING`

- [ ] **Step 8: ตรวจ + commit**

Run: `npm run lint && npx tsc --noEmit && npm test && npm run format:check && npm run build`
Expected: ผ่าน; build ไม่มี route `/[...slug]`

```bash
git add -A src/app src/mock/prototype/admin.ts
git commit -m "feat(proto): master data, templates, settings, allocation, profile; remove coming-soon page"
```

---

## หลังทุก task (controller ทำเอง ไม่ใช่ subagent)

1. Final whole-branch review
2. ตรวจในเบราว์เซอร์บน prod build (`acc-pharm-redesign-prod` port 3002): login ครบ 5 role, เปิดทุกเมนู, กดเล่นตาม DoD 4, ส่งข้อเสนอแนะ 3 รายการจากหลายหน้า/role แล้วดาวน์โหลด CSV ตรวจ BOM + คอลัมน์, คีย์บอร์ด + reduced motion, 375px/1280px ไม่มี scroll แนวนอน
3. ตรวจไฟล์ใหม่ตาม `docs/guidelines/web-interface-guidelines.md`
4. Merge `feat/prototype-pages` เข้า `main` แล้ว push (Vercel production deploy อัตโนมัติ)
