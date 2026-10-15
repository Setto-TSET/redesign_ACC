# F2 ตรวจคำขอและมอบหมายผู้ตรวจ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** หน้า `/requests/[id]` หน้าเดียวที่แสดงตาม role — admin ทำงานตรวจคำขอด้วยปุ่มขั้นถัดไป (รับตรวจ, ขอเอกสาร, มอบหมายผู้ตรวจ, ส่งคณะกรรมการ, ผ่าน/ไม่ผ่าน, ตอบกลับ, ยกเลิก, แก้สถานะ), ร้านยาติดตามสถานะ ส่งเอกสารเพิ่มและเพิ่มสลิป, ผู้ตรวจดูได้อย่างเดียว

**Architecture:** ตาราง "status + role → action" และการเปลี่ยนสถานะเป็น pure function ใน `src/lib/requestRules.ts` (มีเทสต์ `node --test`) `src/lib/api.ts` ตรวจสิทธิ์ เรียกกฎ แล้วบันทึกข้อมูลชุดใหม่ใน sessionStorage หน้าแยกเป็น page (state + โหลดข้อมูล), RequestHeader (สรุป + ความคืบหน้า + ปุ่ม), tabs (5 แท็บ) และ ActionDialog (modal เดียวทุก action)

**Tech Stack:** Next 16.1.1 (App Router, client components, `useParams`), React 19.2.3, Tailwind 4 + component class ใน `globals.css`, @tabler/icons-react, react-hot-toast, Node 26 `node --test`

**Spec:** `docs/superpowers/specs/2026-10-15-f2-request-review-design.md` (หลักการร่วม: `docs/superpowers/specs/2026-10-14-redesign-design.md`)

## Global Constraints

- Frontend อย่างเดียว ข้อมูลเป็น mock ไม่มี backend
- คง business flow เดิม ใช้ 9 สถานะของ `RequestStatus` เดิม
- ทุกหน้าดึงข้อมูลผ่าน `src/lib/api.ts` เท่านั้น ไม่ import `src/mock/` ตรง (ยกเว้นโค้ดเดิม: `roleLabels`, `users` ในหน้า login/หน้าแรก/Header)
- ภาษาไทยทั้งหมด ทั้ง label, ปุ่ม, placeholder
- Error แสดงใต้ช่องที่ผิด, สำเร็จแจ้งด้วย toast (`react-hot-toast`), action ที่ย้อนกลับไม่ได้ต้องมี modal ยืนยัน
- สีใช้ตัวแปร CSS (`var(--accent)`, `var(--danger)`, `var(--warn)`, `var(--warn-soft)`, `var(--danger-soft)`, `var(--ink-secondary)` ฯลฯ) — โค้ดเดิมที่ใช้ `zinc-*` ยังคงได้
- ไม่มี scroll แนวนอนที่ 375px และ 1280px (แถบ tab เลื่อนแนวนอนได้เฉพาะตัวแถบ)
- ไม่เพิ่ม dependency ใหม่ ไม่เพิ่ม test framework (ใช้ `node --test`)
- Prettier: single quote (ตาม `.prettierrc.json`)
- เวลาเก็บเป็นเวลาท้องถิ่น `YYYY-MM-DDTHH:mm:ss` ไม่มี `Z` (ตรงกับ seed) — วันที่ล้วนใช้ `new Date().toLocaleDateString('sv-SE')`
- ตารางสถานะเป็นของชั่วคราว อยู่ใน `requestRules.ts` จุดเดียว พร้อม comment ให้เทียบกับ `AssessmentStatus` ก่อนต่อ backend

## หมายเหตุก่อนเริ่ม

- repo: `D:\PharmacyCouncil_Project\Acc\acc-pharm-redesign` branch `feat/f2-request-review` (แตกจาก `feat/f1-submit-request`) — commit ท้ายทุก task
- คำสั่งตรวจ: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run format:check`, `npm run build`
- `npm test` มี warning `MODULE_TYPELESS_PACKAGE_JSON` อยู่แล้ว ไม่ต้องแก้
- ไฟล์ที่ `node --test` รันได้ต้องไม่ import ค่า (value) ผ่าน alias `@/` — import type ได้เพราะถูกลบตอนรัน (`requestRules.ts`, `constants.ts` เป็นแบบนี้)
- บัญชีทดลอง: `pharm001` (ร้านยา id 1, ร้าน pharmacyId 1), `assessor01` (id 2), `admin01` (id 3), `ppho-cm` (id 4), `superadmin` (id 5)

## File Structure

| ไฟล์ | หน้าที่ |
|---|---|
| `src/types/api.ts` (แก้) | `RequestAction`, `Payment`, `Assessor`, `ActionInput`, `ActionResult`; `AccRequest` เพิ่ม `assessorIds`, `payments`, `gppScore`; `RequestMessage` เพิ่ม `override` |
| `src/lib/constants.ts` (แก้) | เพิ่ม `typeLabel`, `actionLabels`, `replyTemplates` |
| `src/lib/constants.test.ts` (ใหม่) | เทสต์ `typeLabel` |
| `src/lib/format.ts` (ใหม่) | `formatDate`, `formatDateLong`, `formatDateTime` |
| `src/lib/requestRules.ts` (แก้) | เพิ่ม `actionsFor`, `applyAction`, `canView`, `canAddPayment` |
| `src/lib/requestActions.test.ts` (ใหม่) | เทสต์ของกฎ F2 |
| `src/mock/index.ts` (แก้) | `assessors` + field ใหม่ใน seed |
| `src/lib/api.ts` (แก้) | `localNow`, normalize ข้อมูลเก่า, `requests.get/act/addPayment`, filter `assessorId`, `assessors.list` |
| `src/app/requests/page.tsx` (แก้) | ใช้ helper ใหม่ + ผู้ตรวจเห็นเฉพาะคำขอที่ได้รับมอบหมาย |
| `src/app/my-pharmacy/page.tsx`, `src/components/home/PharmacyHome.tsx`, `src/app/requests/new/steps.tsx` (แก้) | ใช้ `typeLabel` / `formatDateLong` แทนโค้ดซ้ำ |
| `src/app/requests/[id]/ActionDialog.tsx` (ใหม่) | modal ของ action ที่ต้องกรอก/ยืนยัน |
| `src/app/requests/[id]/tabs.tsx` (ใหม่) | `InfoTab`, `DocsTab`, `PaymentsTab`, `ResultTab`, `HistoryTab` |
| `src/app/requests/[id]/RequestHeader.tsx` (ใหม่) | สรุปคำขอ, แถบความคืบหน้า, ปุ่ม action, แถบแจ้งร้านยา |
| `src/app/requests/[id]/page.tsx` (ใหม่) | โหลดข้อมูล, state ของ tab/dialog, เรียก api |

---

### Task 1: Type, helper ร่วม และ field ใหม่ของคำขอ

**Files:**
- Modify: `src/types/api.ts`
- Modify: `src/lib/constants.ts`
- Create: `src/lib/format.ts`
- Test: `src/lib/constants.test.ts`
- Modify: `src/mock/index.ts` (เฉพาะ `seedRequests`)
- Modify: `src/lib/api.ts` (เฉพาะ `requests.create`)
- Modify: `src/app/requests/page.tsx`, `src/app/my-pharmacy/page.tsx`, `src/components/home/PharmacyHome.tsx`, `src/app/requests/new/steps.tsx`

**Interfaces:**
- Consumes: ไม่มี
- Produces:
  - types: `RequestAction = 'start_review' | 'request_docs' | 'assign' | 'resubmit_docs' | 'to_committee' | 'approve' | 'reject' | 'reply' | 'cancel' | 'override'`, `Payment { amount: number; fileName: string; paidAt: string }`, `Assessor { id: number; name: string }`, `ActionInput { message?: string; assessorIds?: number[]; newDocs?: RequestDoc[]; status?: RequestStatus }`, `ActionResult = { request: AccRequest } | { error: string; field?: keyof ActionInput }`; `AccRequest.assessorIds: number[]`, `AccRequest.payments: Payment[]`, `AccRequest.gppScore?: number`; `RequestMessage.override?: boolean`
  - `typeLabel(ids: number[]): string`, `actionLabels: Record<RequestAction, string>`, `replyTemplates: string[]` (constants)
  - `formatDate(iso?: string): string`, `formatDateLong(iso?: string): string`, `formatDateTime(iso: string): string` (format)

- [ ] **Step 1: เพิ่ม type ใน `src/types/api.ts`**

ใน `interface RequestMessage` เพิ่มบรรทัดต่อจาก `status?: RequestStatus;`:

```ts
  /** รายการนี้มาจาก "เปลี่ยนสถานะอื่น" (แก้สถานะ) */
  override?: boolean;
```

ใน `interface AccRequest` เพิ่มบรรทัดต่อจาก `messages: RequestMessage[];`:

```ts
  /** ผู้ตรวจประเมินที่ได้รับมอบหมาย (Assessor.id) */
  assessorIds: number[];
  /** หลักฐานการโอนเงิน */
  payments: Payment[];
  /** คะแนน GPP เป็นเปอร์เซ็นต์ (มีหลังประเมิน) */
  gppScore?: number;
```

ต่อท้ายไฟล์:

```ts
/** action ที่ทำกับคำขอได้ — ตารางสิทธิ์อยู่ที่ lib/requestRules.ts */
export type RequestAction =
  | 'start_review'
  | 'request_docs'
  | 'assign'
  | 'resubmit_docs'
  | 'to_committee'
  | 'approve'
  | 'reject'
  | 'reply'
  | 'cancel'
  | 'override';

export interface Payment {
  amount: number;
  fileName: string;
  paidAt: string;
}

export interface Assessor {
  id: number;
  name: string;
}

/** ข้อมูลที่ action ต้องใช้ — แต่ละ action ใช้เฉพาะบางช่อง */
export interface ActionInput {
  message?: string;
  assessorIds?: number[];
  newDocs?: RequestDoc[];
  status?: RequestStatus;
}

/** ผลของ action: คำขอชุดใหม่ หรือ error พร้อมช่องที่ผิด */
export type ActionResult =
  | { request: AccRequest }
  | { error: string; field?: keyof ActionInput };
```

- [ ] **Step 2: เขียนเทสต์ที่ fail — `src/lib/constants.test.ts`**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { typeLabel } from './constants.ts';

test('typeLabel รวมชื่อประเภทและข้าม id ที่ไม่รู้จัก', () => {
  assert.equal(
    typeLabel([2, 99, 8]),
    'ต่ออายุ, เปลี่ยนแปลงเวลาผู้มีหน้าที่ปฏิบัติการ',
  );
  assert.equal(typeLabel([]), '');
});
```

- [ ] **Step 3: รันให้ fail**

Run: `npm test`
Expected: FAIL — `typeLabel` is not exported (SyntaxError / not a function)

- [ ] **Step 4: เพิ่มใน `src/lib/constants.ts`**

แก้ import บนสุดเป็น:

```ts
import type {
  ApplicantRelation,
  CertStatus,
  RequestAction,
  RequestStatus,
  RequestType,
} from '@/types/api';
```

ต่อท้าย `requestTypes` (หลังปิด array) เพิ่ม:

```ts
/** ชื่อประเภทคำขอคั่นด้วย ", " — ข้าม id ที่ไม่รู้จัก */
export const typeLabel = (ids: number[]) =>
  ids
    .map((id) => requestTypes.find((t) => t.id === id)?.label)
    .filter(Boolean)
    .join(', ');
```

ต่อท้ายไฟล์:

```ts
export const actionLabels: Record<RequestAction, string> = {
  start_review: 'รับตรวจเอกสาร',
  request_docs: 'ขอเอกสารเพิ่มเติม',
  assign: 'มอบหมายผู้ตรวจ',
  resubmit_docs: 'ส่งเอกสารเพิ่มแล้ว',
  to_committee: 'ส่งคณะกรรมการ',
  approve: 'ผ่านการรับรอง',
  reject: 'ไม่ผ่าน',
  reply: 'ตอบกลับร้านยา',
  cancel: 'ยกเลิกคำขอ',
  override: 'เปลี่ยนสถานะอื่น',
};

/** template ข้อความตอบกลับ (TemplateText ของระบบเดิม ตาม AdminManual ข้อ 13) */
export const replyTemplates = [
  'อยู่ระหว่างการดำเนินการตรวจสอบเอกสาร',
  'กรุณาส่งเอกสารเพิ่มเติม ดังนี้',
  'สรร. ได้ตรวจประเมินเรียบร้อยแล้ว อยู่ระหว่างยื่นคณะกรรมการรับรอง',
  'ผ่านคณะกรรมการรับรองแล้ว เมื่อวันที่',
];
```

- [ ] **Step 5: สร้าง `src/lib/format.ts`**

```ts
// รูปแบบวันที่ภาษาไทย (พ.ศ.) ที่ใช้ร่วมกันทุกหน้า

/** เช่น 14 ต.ค. 69 */
export const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      })
    : '-';

/** เช่น 31 ธันวาคม 2569 */
export const formatDateLong = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

/** เช่น 14 ต.ค. 69 10:15 */
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
```

- [ ] **Step 6: รันเทสต์ให้ผ่าน**

Run: `npm test`
Expected: PASS — `tests 9`, `fail 0`

- [ ] **Step 7: ใส่ field ใหม่ใน `seedRequests` ของ `src/mock/index.ts`**

ใน array `seedRequests` (ไม่ใช่ `users`) เพิ่มบรรทัดต่อจาก `pharmacyId: N,` ของแต่ละรายการ:

- `r1` (pharmacyId 2), `r2` (pharmacyId 4), `r5` (pharmacyId 1):
  ```ts
      assessorIds: [],
      payments: [],
  ```
- `r3` (pharmacyId 3):
  ```ts
      assessorIds: [2],
      payments: [],
      gppScore: 87.7,
  ```
- `r4` (pharmacyId 5):
  ```ts
      assessorIds: [6],
      payments: [],
  ```

- [ ] **Step 8: ใส่ field ใหม่ใน `requests.create` ของ `src/lib/api.ts`**

ใน object `req` เพิ่มบรรทัดต่อจาก `applicant: draft.applicant,`:

```ts
        assessorIds: [],
        payments: [],
```

- [ ] **Step 9: ใช้ helper ใหม่แทนโค้ดซ้ำ**

`src/app/requests/page.tsx`:
- แทน `import { requestTypes } from '@/lib/constants';` ด้วย
  ```ts
  import { typeLabel } from '@/lib/constants';
  import { formatDate } from '@/lib/format';
  ```
- ลบ `const typeText = …` และ `const dateText = …` ทั้งสองก้อน
- แทน `typeText(` ด้วย `typeLabel(` และ `dateText(` ด้วย `formatDate(` ทุกจุด

`src/app/my-pharmacy/page.tsx`:
- เพิ่ม `import { formatDateLong } from '@/lib/format';` ต่อจาก `import { api } from '@/lib/api';`
- ลบ `const dateText = …` ทั้งก้อน
- แทน `dateText(` ด้วย `formatDateLong(` ทุกจุด

`src/components/home/PharmacyHome.tsx`:
- แทน `import { requestTypes } from '@/lib/constants';` ด้วย `import { typeLabel } from '@/lib/constants';`
- แทนก้อน
  ```tsx
                      {r.typeIds
                        .map(
                          (id) => requestTypes.find((t) => t.id === id)?.label,
                        )
                        .join(', ')}
  ```
  ด้วย
  ```tsx
                      {typeLabel(r.typeIds)}
  ```

`src/app/requests/new/steps.tsx`:
- ใน import จาก `'@/lib/constants'` เพิ่ม `typeLabel,`
- ใน `ReviewStep` แทน
  ```ts
    ['ประเภทคำขอ', draft.typeIds.map((id) => typeById(id).label).join(', ')],
  ```
  ด้วย
  ```ts
    ['ประเภทคำขอ', typeLabel(draft.typeIds)],
  ```

- [ ] **Step 10: ตรวจ**

Run: `npx prettier --write src/types/api.ts src/lib/constants.ts src/lib/constants.test.ts src/lib/format.ts src/mock/index.ts src/lib/api.ts src/app/requests/page.tsx src/app/my-pharmacy/page.tsx src/components/home/PharmacyHome.tsx src/app/requests/new/steps.tsx; npx tsc --noEmit; npm run lint; npm test`
Expected: tsc และ lint ไม่มี error, เทสต์ 9/9 ผ่าน

- [ ] **Step 11: Commit**

```bash
git add src/types/api.ts src/lib/constants.ts src/lib/constants.test.ts src/lib/format.ts src/mock/index.ts src/lib/api.ts src/app/requests/page.tsx src/app/my-pharmacy/page.tsx src/components/home/PharmacyHome.tsx src/app/requests/new/steps.tsx
git commit -m "feat(f2): request action types, shared format helpers, assessor/payment fields"
```

---

### Task 2: กฎ action ของคำขอ (TDD)

**Files:**
- Modify: `src/lib/requestRules.ts`
- Test: `src/lib/requestActions.test.ts`

**Interfaces:**
- Consumes: types จาก Task 1, `isAlive` (มีอยู่แล้วใน `requestRules.ts`)
- Produces:
  - `actionsFor(status: RequestStatus, role: UserRole): RequestAction[]` — ลำดับ: action ตาม flow ก่อน แล้ว `reply`, `cancel`, `override`
  - `applyAction(req: AccRequest, action: RequestAction, input: ActionInput, actor: { name: string; role: UserRole }, now: string): ActionResult` — ไม่แก้ `req` เดิม
  - `canView(req: AccRequest, user: { id: number; role: UserRole; pharmacyId?: number }): boolean`
  - `canAddPayment(req: AccRequest, user: { id: number; role: UserRole; pharmacyId?: number }): boolean`

- [ ] **Step 1: เขียนเทสต์ที่ fail — `src/lib/requestActions.test.ts`**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AccRequest, RequestStatus } from '@/types/api';
import {
  actionsFor,
  applyAction,
  canAddPayment,
  canView,
} from './requestRules.ts';

const base = {
  id: 'r1',
  no: 'NEW-6900001',
  pharmacyId: 1,
  typeIds: [1],
  submittedAt: '2026-10-01T09:00:00',
  status: 'submitted',
  docs: [],
  messages: [],
  assessorIds: [],
  payments: [],
} as unknown as AccRequest;

const at = (status: RequestStatus, patch: Partial<AccRequest> = {}) => ({
  ...base,
  status,
  ...patch,
});

const admin = { name: 'พิมพ์ใจ บริหาร', role: 'admin' } as const;
const shop = { name: 'ภก.สมชาย ใจดี', role: 'pharmacy' } as const;
const NOW = '2026-10-15T10:00:00';

test('actionsFor ตามตารางสถานะและ role', () => {
  assert.deepEqual(actionsFor('submitted', 'admin'), [
    'start_review',
    'reply',
    'cancel',
    'override',
  ]);
  assert.deepEqual(actionsFor('doc_review', 'superadmin'), [
    'request_docs',
    'assign',
    'reply',
    'cancel',
    'override',
  ]);
  assert.deepEqual(actionsFor('need_docs', 'pharmacy'), [
    'resubmit_docs',
    'cancel',
  ]);
  assert.deepEqual(actionsFor('need_docs', 'admin'), [
    'reply',
    'cancel',
    'override',
  ]);
  assert.deepEqual(actionsFor('submitted', 'pharmacy'), ['cancel']);
  assert.deepEqual(actionsFor('assigned', 'pharmacy'), []);
  assert.deepEqual(actionsFor('assigned', 'admin'), [
    'reply',
    'cancel',
    'override',
  ]);
  assert.deepEqual(actionsFor('assessed', 'admin'), [
    'to_committee',
    'reply',
    'cancel',
    'override',
  ]);
  assert.deepEqual(actionsFor('committee', 'admin'), [
    'approve',
    'reject',
    'reply',
    'cancel',
    'override',
  ]);
  assert.deepEqual(actionsFor('approved', 'admin'), ['override']);
  assert.deepEqual(actionsFor('doc_review', 'assessor'), []);
  assert.deepEqual(actionsFor('submitted', 'ppho'), []);
});

test('applyAction เปลี่ยนสถานะ ต่อ timeline และไม่แก้ของเดิม', () => {
  const req = at('submitted');
  const res = applyAction(req, 'start_review', {}, admin, NOW);
  assert.ok('request' in res);
  assert.equal(res.request.status, 'doc_review');
  assert.equal(res.request.messages.length, 1);
  assert.deepEqual(res.request.messages[0], {
    from: 'พิมพ์ใจ บริหาร',
    at: NOW,
    text: 'อยู่ระหว่างการดำเนินการตรวจสอบเอกสาร',
    status: 'doc_review',
  });
  assert.equal(req.status, 'submitted');
  assert.equal(req.messages.length, 0);
});

test('applyAction ตรวจ input ที่ต้องมี', () => {
  assert.deepEqual(
    applyAction(at('doc_review'), 'assign', { assessorIds: [] }, admin, NOW),
    { error: 'เลือกผู้ตรวจอย่างน้อย 1 คน', field: 'assessorIds' },
  );
  const assigned = applyAction(
    at('doc_review'),
    'assign',
    { assessorIds: [2, 6] },
    admin,
    NOW,
  );
  assert.ok('request' in assigned);
  assert.equal(assigned.request.status, 'assigned');
  assert.deepEqual(assigned.request.assessorIds, [2, 6]);

  assert.deepEqual(
    applyAction(at('doc_review'), 'request_docs', { message: '  ' }, admin, NOW),
    { error: 'กรอกเอกสารที่ขอเพิ่ม', field: 'message' },
  );
  assert.deepEqual(
    applyAction(at('committee'), 'reject', {}, admin, NOW),
    { error: 'กรอกเหตุผล', field: 'message' },
  );
});

test('ร้านยาส่งเอกสารเพิ่มและยกเลิกได้ตามสถานะ', () => {
  const doc = { name: 'a.pdf', type: 'เอกสารเพิ่มเติม', uploadedAt: '2026-10-15' };
  assert.deepEqual(
    applyAction(at('need_docs'), 'resubmit_docs', {}, shop, NOW),
    { error: 'แนบไฟล์ใหม่อย่างน้อย 1 ไฟล์', field: 'newDocs' },
  );
  const res = applyAction(
    at('need_docs'),
    'resubmit_docs',
    { newDocs: [doc] },
    shop,
    NOW,
  );
  assert.ok('request' in res);
  assert.equal(res.request.status, 'doc_review');
  assert.deepEqual(res.request.docs, [doc]);

  const cancelled = applyAction(
    at('doc_review'),
    'cancel',
    { message: 'ยื่นผิดประเภท' },
    shop,
    NOW,
  );
  assert.ok('request' in cancelled);
  assert.equal(cancelled.request.status, 'cancelled');

  assert.deepEqual(
    applyAction(at('assigned'), 'cancel', { message: 'x' }, shop, NOW),
    { error: 'ทำรายการนี้ไม่ได้ในสถานะปัจจุบัน' },
  );
  assert.deepEqual(applyAction(at('committee'), 'approve', {}, shop, NOW), {
    error: 'ทำรายการนี้ไม่ได้ในสถานะปัจจุบัน',
  });
});

test('override ต้องเลือกสถานะใหม่และมีเหตุผล', () => {
  assert.deepEqual(
    applyAction(
      at('assigned'),
      'override',
      { status: 'assigned', message: 'x' },
      admin,
      NOW,
    ),
    { error: 'เลือกสถานะที่ต่างจากสถานะปัจจุบัน', field: 'status' },
  );
  assert.deepEqual(
    applyAction(at('assigned'), 'override', { status: 'assessed' }, admin, NOW),
    { error: 'กรอกเหตุผล', field: 'message' },
  );
  const res = applyAction(
    at('approved'),
    'override',
    { status: 'committee', message: 'ตั้งสถานะผิด' },
    admin,
    NOW,
  );
  assert.ok('request' in res);
  assert.equal(res.request.status, 'committee');
  assert.equal(res.request.messages.at(-1)?.override, true);
});

test('canView และ canAddPayment', () => {
  const req = at('doc_review', { pharmacyId: 1, assessorIds: [2] });
  assert.equal(canView(req, { id: 3, role: 'admin' }), true);
  assert.equal(canView(req, { id: 1, role: 'pharmacy', pharmacyId: 1 }), true);
  assert.equal(canView(req, { id: 9, role: 'pharmacy', pharmacyId: 2 }), false);
  assert.equal(canView(req, { id: 9, role: 'pharmacy' }), false);
  assert.equal(canView(req, { id: 2, role: 'assessor' }), true);
  assert.equal(canView(req, { id: 6, role: 'assessor' }), false);
  assert.equal(canView(req, { id: 4, role: 'ppho' }), false);

  const owner = { id: 1, role: 'pharmacy', pharmacyId: 1 } as const;
  assert.equal(canAddPayment(req, owner), true);
  assert.equal(canAddPayment(at('assigned'), owner), false);
  assert.equal(canAddPayment(req, { id: 3, role: 'admin' }), false);
});
```

- [ ] **Step 2: รันให้ fail**

Run: `npm test`
Expected: FAIL — `actionsFor` (และฟังก์ชันอื่น) ไม่ได้ export จาก `requestRules.ts`

- [ ] **Step 3: แก้ import บนสุดของ `src/lib/requestRules.ts`**

```ts
import type {
  AccRequest,
  ActionInput,
  ActionResult,
  Pharmacy,
  RequestAction,
  RequestDraft,
  RequestMessage,
  RequestStatus,
  RequestType,
  UserRole,
} from '@/types/api';
```

- [ ] **Step 4: ต่อท้าย `src/lib/requestRules.ts`**

```ts
// ---------- F2: การทำงานกับคำขอ ----------

// ponytail: ตารางสถานะเป็นของชั่วคราว ประกอบจาก AdminManual + RequestDetail.aspx.vb
// ต้องเทียบกับตาราง AssessmentStatus ใน DB ระบบเดิมก่อนต่อ backend — แก้ที่ FLOW จุดเดียว
type Step = { action: RequestAction; by: 'staff' | 'pharmacy'; to: RequestStatus };

const FLOW: Partial<Record<RequestStatus, Step[]>> = {
  submitted: [{ action: 'start_review', by: 'staff', to: 'doc_review' }],
  doc_review: [
    { action: 'request_docs', by: 'staff', to: 'need_docs' },
    { action: 'assign', by: 'staff', to: 'assigned' },
  ],
  need_docs: [{ action: 'resubmit_docs', by: 'pharmacy', to: 'doc_review' }],
  // assigned → assessed ทำโดยผู้ตรวจใน F3
  assessed: [{ action: 'to_committee', by: 'staff', to: 'committee' }],
  committee: [
    { action: 'approve', by: 'staff', to: 'approved' },
    { action: 'reject', by: 'staff', to: 'rejected' },
  ],
};

const STAFF: UserRole[] = ['admin', 'superadmin'];

/** ร้านยายกเลิก/เพิ่มสลิปได้เฉพาะก่อนมอบหมายผู้ตรวจ (ระบบเดิม: status < 30) */
const BEFORE_ASSIGN: RequestStatus[] = ['submitted', 'doc_review', 'need_docs'];

/** action ที่ role นี้ทำได้ในสถานะนี้ — ปุ่มบนหน้าและการตรวจสิทธิ์ใช้ชุดเดียวกัน */
export function actionsFor(
  status: RequestStatus,
  role: UserRole,
): RequestAction[] {
  const staff = STAFF.includes(role);
  const out = (FLOW[status] ?? [])
    .filter((s) => (s.by === 'staff' ? staff : role === 'pharmacy'))
    .map((s) => s.action);
  if (staff && isAlive(status)) out.push('reply', 'cancel');
  if (role === 'pharmacy' && BEFORE_ASSIGN.includes(status)) out.push('cancel');
  if (staff) out.push('override');
  return out;
}

/** action ที่ต้องมีข้อความ และ error เมื่อไม่ได้กรอก */
const NEEDS_TEXT: Partial<Record<RequestAction, string>> = {
  request_docs: 'กรอกเอกสารที่ขอเพิ่ม',
  reply: 'กรอกข้อความ',
  reject: 'กรอกเหตุผล',
  cancel: 'กรอกเหตุผล',
  override: 'กรอกเหตุผล',
};

/** ข้อความใน timeline เมื่อ action ไม่มีข้อความจากผู้ใช้ */
const DEFAULT_TEXT: Partial<Record<RequestAction, string>> = {
  start_review: 'อยู่ระหว่างการดำเนินการตรวจสอบเอกสาร',
  assign: 'มอบหมายผู้ตรวจประเมินแล้ว',
  resubmit_docs: 'ส่งเอกสารเพิ่มเติมแล้ว',
  to_committee:
    'สรร. ได้ตรวจประเมินเรียบร้อยแล้ว อยู่ระหว่างยื่นคณะกรรมการรับรอง',
  approve: 'ผ่านคณะกรรมการรับรองแล้ว',
};

/** ทำ action แล้วคืนคำขอชุดใหม่ (ไม่แก้ req เดิม) หรือ error พร้อมช่องที่ผิด */
export function applyAction(
  req: AccRequest,
  action: RequestAction,
  input: ActionInput,
  actor: { name: string; role: UserRole },
  now: string,
): ActionResult {
  if (!actionsFor(req.status, actor.role).includes(action))
    return { error: 'ทำรายการนี้ไม่ได้ในสถานะปัจจุบัน' };

  const patch: Partial<AccRequest> = {};
  let status =
    FLOW[req.status]?.find((s) => s.action === action)?.to ?? req.status;

  if (action === 'assign') {
    if (!input.assessorIds?.length)
      return { error: 'เลือกผู้ตรวจอย่างน้อย 1 คน', field: 'assessorIds' };
    patch.assessorIds = input.assessorIds;
  }
  if (action === 'resubmit_docs') {
    if (!input.newDocs?.length)
      return { error: 'แนบไฟล์ใหม่อย่างน้อย 1 ไฟล์', field: 'newDocs' };
    patch.docs = [...req.docs, ...input.newDocs];
  }
  if (action === 'override') {
    if (!input.status || input.status === req.status)
      return { error: 'เลือกสถานะที่ต่างจากสถานะปัจจุบัน', field: 'status' };
    status = input.status;
  }
  if (action === 'cancel') status = 'cancelled';

  const text = input.message?.trim() ?? '';
  const needs = NEEDS_TEXT[action];
  if (needs && !text) return { error: needs, field: 'message' };

  const message: RequestMessage = {
    from: actor.name,
    at: now,
    text: text || DEFAULT_TEXT[action] || '',
    status,
    ...(action === 'override' ? { override: true } : {}),
  };
  return {
    request: {
      ...req,
      ...patch,
      status,
      messages: [...req.messages, message],
    },
  };
}

type Viewer = { id: number; role: UserRole; pharmacyId?: number };

/** ใครเปิดคำขอนี้ได้ — ร้านยาเฉพาะร้านตัวเอง, ผู้ตรวจเฉพาะที่ได้รับมอบหมาย */
export function canView(req: AccRequest, user: Viewer): boolean {
  if (STAFF.includes(user.role)) return true;
  if (user.role === 'pharmacy')
    return user.pharmacyId !== undefined && req.pharmacyId === user.pharmacyId;
  if (user.role === 'assessor') return req.assessorIds.includes(user.id);
  return false;
}

/** ร้านยาเจ้าของคำขอเพิ่มสลิปได้ก่อนมอบหมายผู้ตรวจ */
export function canAddPayment(req: AccRequest, user: Viewer): boolean {
  return (
    user.role === 'pharmacy' &&
    canView(req, user) &&
    BEFORE_ASSIGN.includes(req.status)
  );
}
```

- [ ] **Step 5: รันเทสต์ให้ผ่าน**

Run: `npm test`
Expected: PASS — `tests 15`, `fail 0`

- [ ] **Step 6: ตรวจ**

Run: `npx prettier --write src/lib/requestRules.ts src/lib/requestActions.test.ts; npx tsc --noEmit; npm run lint`
Expected: ไม่มี error

- [ ] **Step 7: Commit**

```bash
git add src/lib/requestRules.ts src/lib/requestActions.test.ts
git commit -m "feat(f2): request action rules with role/status table and tests"
```

---

### Task 3: API ของรายละเอียดคำขอ และผู้ตรวจเห็นเฉพาะงานตัวเอง

**Files:**
- Modify: `src/mock/index.ts`
- Modify: `src/lib/api.ts`
- Modify: `src/app/requests/page.tsx`

**Interfaces:**
- Consumes: `applyAction`, `canView`, `canAddPayment` (Task 2); types (Task 1); `User` จาก `src/types/api.ts`
- Produces:
  - `api.requests.list(filter?: { pharmacyId?: number; assessorId?: number }): Promise<AccRequest[]>`
  - `api.requests.get(id: string, user: User): Promise<AccRequest | null>`
  - `api.requests.act(id: string, action: RequestAction, input: ActionInput, user: User): Promise<ActionResult>`
  - `api.requests.addPayment(id: string, payment: { amount: number; fileName: string }, user: User): Promise<ActionResult>`
  - `api.assessors.list(): Promise<Assessor[]>`
  - mock `assessors: Assessor[]` (id 2, 6, 7)

- [ ] **Step 1: เพิ่มผู้ตรวจใน `src/mock/index.ts`**

ใน import type บนสุดเพิ่ม `Assessor,` แล้วต่อท้ายไฟล์:

```ts
/** ผู้ตรวจประเมิน — id 2 ตรงกับบัญชีทดลอง assessor01 */
export const assessors: Assessor[] = [
  { id: 2, name: 'ภญ.วรรณา ตรวจไว' },
  { id: 6, name: 'ภก.ธนพล ตรวจดี' },
  { id: 7, name: 'ภญ.กมลา ใส่ใจ' },
];
```

- [ ] **Step 2: แก้ `src/lib/api.ts`**

แทน import ทั้งก้อนบนสุดด้วย:

```ts
import type {
  AccRequest,
  ActionInput,
  ActionResult,
  Assessor,
  LoginResponse,
  Pharmacy,
  Registration,
  RequestAction,
  RequestDraft,
  User,
} from '@/types/api';
import { assessors, pharmacies, seedRequests, users } from '@/mock';
import { requestTypes } from '@/lib/constants';
import {
  applyAction,
  canAddPayment,
  canView,
  isAlive,
  nextRequestNo,
  requiredDocs,
} from '@/lib/requestRules';
```

แทนฟังก์ชัน `loadRequests` ทั้งฟังก์ชันด้วย:

```ts
function loadRequests(): AccRequest[] {
  try {
    const stored = sessionStorage.getItem(REQUESTS_KEY);
    // คำขอที่บันทึกก่อนมี F2 ไม่มี assessorIds/payments — เติมค่าว่างให้
    if (stored)
      return (JSON.parse(stored) as AccRequest[]).map((r) => ({
        ...r,
        assessorIds: r.assessorIds ?? [],
        payments: r.payments ?? [],
      }));
  } catch {
    // sessionStorage ใช้ไม่ได้หรือข้อมูลเสีย — กลับไปใช้ seed
  }
  return seedRequests;
}

/** เวลาท้องถิ่น YYYY-MM-DDTHH:mm:ss (ตรงกับ seed) ไม่ใช่ UTC */
function localNow(now = new Date()) {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);
}

/** แทนคำขอ id นี้ด้วยชุดใหม่แล้วบันทึก (ไม่แก้ object เดิม) */
function replaceRequest(all: AccRequest[], next: AccRequest) {
  saveRequests(all.map((r) => (r.id === next.id ? next : r)));
}
```

ใน `requests.list` แทนทั้งเมธอดด้วย:

```ts
    /** เรียงใหม่สุดก่อน — ใส่ key ไว้แต่ค่าเป็น undefined = ไม่เห็นอะไรเลย (fail closed) */
    async list(
      filter: { pharmacyId?: number; assessorId?: number } = {},
    ): Promise<AccRequest[]> {
      return loadRequests()
        .filter(
          (r) =>
            (!('pharmacyId' in filter) ||
              r.pharmacyId === filter.pharmacyId) &&
            (!('assessorId' in filter) ||
              (filter.assessorId !== undefined &&
                r.assessorIds.includes(filter.assessorId))),
        )
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    },

    /** null เมื่อไม่มีคำขอนี้ หรือผู้ใช้ไม่มีสิทธิ์ดู (ไม่บอกว่ามีอยู่) */
    async get(id: string, user: User): Promise<AccRequest | null> {
      const req = loadRequests().find((r) => r.id === id);
      return req && canView(req, user) ? req : null;
    },

    async act(
      id: string,
      action: RequestAction,
      input: ActionInput,
      user: User,
    ): Promise<ActionResult> {
      const all = loadRequests();
      const req = all.find((r) => r.id === id);
      if (!req || !canView(req, user)) return { error: 'ไม่พบคำขอ' };
      const res = applyAction(
        req,
        action,
        input,
        { name: user.name, role: user.role },
        localNow(),
      );
      if ('request' in res) replaceRequest(all, res.request);
      return res;
    },

    async addPayment(
      id: string,
      payment: { amount: number; fileName: string },
      user: User,
    ): Promise<ActionResult> {
      const all = loadRequests();
      const req = all.find((r) => r.id === id);
      if (!req || !canAddPayment(req, user))
        return { error: 'เพิ่มหลักฐานการโอนไม่ได้ในสถานะนี้' };
      const request = {
        ...req,
        payments: [...req.payments, { ...payment, paidAt: localNow() }],
      };
      replaceRequest(all, request);
      return { request };
    },
```

ใน `requests.create` แทนสามบรรทัด

```ts
      const now = new Date();
      // เวลาท้องถิ่น (ตรงกับ seed) ไม่ใช่ UTC
      const at = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 19);
```

ด้วย

```ts
      const now = new Date();
      const at = localNow(now);
```

เพิ่มกลุ่มใหม่ใน object `api` ต่อจาก `pharmacies: { … },`:

```ts
  assessors: {
    async list(): Promise<Assessor[]> {
      return assessors;
    },
  },
```

- [ ] **Step 3: ผู้ตรวจเห็นเฉพาะคำขอที่ได้รับมอบหมายใน `src/app/requests/page.tsx`**

แทนบรรทัด

```ts
      api.requests.list(isPharmacy ? { pharmacyId: user.pharmacyId } : {}),
```

ด้วย

```ts
      api.requests.list(
        isPharmacy
          ? { pharmacyId: user.pharmacyId }
          : user.role === 'assessor'
            ? { assessorId: user.id }
            : {},
      ),
```

และแทนข้อความใต้หัวข้อ

```tsx
            {isPharmacy
              ? 'คำขอทั้งหมดของร้านคุณ'
              : 'คำขอจากร้านยาทุกร้าน'}
```

ด้วย

```tsx
            {isPharmacy
              ? 'คำขอทั้งหมดของร้านคุณ'
              : user?.role === 'assessor'
                ? 'คำขอที่คุณได้รับมอบหมาย'
                : 'คำขอจากร้านยาทุกร้าน'}
```

(ถ้า Prettier จัดบรรทัดของโค้ดเดิมต่างจากที่เห็นด้านบน ให้แก้ตามความหมาย — ส่วนที่เลือก filter และข้อความใต้หัวข้อ)

- [ ] **Step 4: ตรวจ**

Run: `npx prettier --write src/mock/index.ts src/lib/api.ts src/app/requests/page.tsx; npx tsc --noEmit; npm run lint; npm test`
Expected: ไม่มี error, เทสต์ 15/15 ผ่าน

- [ ] **Step 5: Commit**

```bash
git add src/mock/index.ts src/lib/api.ts src/app/requests/page.tsx
git commit -m "feat(f2): request get/act/addPayment api with access checks"
```

---

### Task 4: ActionDialog และเนื้อหาแท็บ

**Files:**
- Create: `src/app/requests/[id]/ActionDialog.tsx`
- Create: `src/app/requests/[id]/tabs.tsx`

**Interfaces:**
- Consumes: `actionLabels`, `replyTemplates`, `requestStatusLabels`, `relationLabels`, `typeLabel` (constants); `formatDate`, `formatDateTime` (format); `Field`, `inputClass` (`src/components/common/Field.tsx`); `StatusBadge` (`src/components/common/StatusBadge.tsx`); types (Task 1)
- Produces:
  - `ActionDialog({ action, current, assessors, onClose, onSubmit }: { action: RequestAction; current: RequestStatus; assessors: Assessor[]; onClose: () => void; onSubmit: (input: ActionInput) => Promise<ActionResult> })`
  - `InfoTab({ req, shop, assessors }: { req: AccRequest; shop: Pharmacy | null; assessors: Assessor[] })`
  - `DocsTab({ req, canResubmit, onResubmit }: { req: AccRequest; canResubmit: boolean; onResubmit: (docs: RequestDoc[]) => Promise<ActionResult> })`
  - `PaymentsTab({ req, canAdd, onAdd }: { req: AccRequest; canAdd: boolean; onAdd: (p: { amount: number; fileName: string }) => Promise<ActionResult> })`
  - `ResultTab({ req }: { req: AccRequest })`
  - `HistoryTab({ req }: { req: AccRequest })`

- [ ] **Step 1: สร้าง `src/app/requests/[id]/ActionDialog.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Field, inputClass } from '@/components/common/Field';
import {
  actionLabels,
  replyTemplates,
  requestStatusLabels,
} from '@/lib/constants';
import type {
  ActionInput,
  ActionResult,
  Assessor,
  RequestAction,
  RequestStatus,
} from '@/types/api';

/** ป้ายของช่องข้อความ — action ที่ไม่อยู่ในนี้ไม่มีช่องข้อความ */
const MESSAGE_LABEL: Partial<Record<RequestAction, string>> = {
  reply: 'ข้อความถึงร้านยา',
  request_docs: 'เอกสารที่ขอเพิ่ม',
  reject: 'เหตุผลที่ไม่ผ่าน',
  cancel: 'เหตุผลที่ยกเลิก',
  override: 'เหตุผลที่แก้สถานะ',
};

const WITH_TEMPLATES: RequestAction[] = ['reply', 'request_docs'];
const DANGER: RequestAction[] = ['reject', 'cancel', 'override'];

export function ActionDialog({
  action,
  current,
  assessors,
  onClose,
  onSubmit,
}: {
  action: RequestAction;
  current: RequestStatus;
  assessors: Assessor[];
  onClose: () => void;
  onSubmit: (input: ActionInput) => Promise<ActionResult>;
}) {
  const [message, setMessage] = useState('');
  const [picked, setPicked] = useState<number[]>([]);
  const [status, setStatus] = useState<RequestStatus | ''>('');
  const [error, setError] = useState<{
    field?: keyof ActionInput;
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const messageLabel = MESSAGE_LABEL[action];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const errorFor = (f: keyof ActionInput) =>
    error?.field === f ? error.text : undefined;

  const submit = async () => {
    setBusy(true);
    const res = await onSubmit({
      message,
      assessorIds: picked,
      status: status || undefined,
    });
    setBusy(false);
    if ('error' in res) setError({ field: res.field, text: res.error });
    else onClose();
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-content max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="action-title" className="text-lg font-bold">
          {actionLabels[action]}
        </h2>

        <div className="mt-5 space-y-5">
          {action === 'approve' && (
            <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
              ยืนยันว่าคำขอนี้ผ่านคณะกรรมการรับรองแล้ว
              รายละเอียดใบรับรองบันทึกได้ภายหลัง
            </p>
          )}

          {action === 'override' && (
            <Field label="สถานะใหม่" htmlFor="status" error={errorFor('status')}>
              <select
                id="status"
                className={inputClass(errorFor('status'))}
                aria-invalid={!!errorFor('status')}
                value={status}
                onChange={(e) => setStatus(e.target.value as RequestStatus)}
              >
                <option value="">เลือกสถานะ</option>
                {(Object.keys(requestStatusLabels) as RequestStatus[])
                  .filter((s) => s !== current)
                  .map((s) => (
                    <option key={s} value={s}>
                      {requestStatusLabels[s]}
                    </option>
                  ))}
              </select>
            </Field>
          )}

          {action === 'assign' && (
            <fieldset>
              <legend className="block text-[13px] font-semibold text-zinc-700 mb-2">
                ผู้ตรวจประเมิน
              </legend>
              <div className="space-y-2">
                {assessors.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[var(--accent)]"
                      checked={picked.includes(a.id)}
                      onChange={() =>
                        setPicked((p) =>
                          p.includes(a.id)
                            ? p.filter((x) => x !== a.id)
                            : [...p, a.id],
                        )
                      }
                    />
                    {a.name}
                  </label>
                ))}
              </div>
              {errorFor('assessorIds') && (
                <p
                  className="mt-1 text-xs"
                  style={{ color: 'var(--danger)' }}
                  role="alert"
                >
                  {errorFor('assessorIds')}
                </p>
              )}
            </fieldset>
          )}

          {messageLabel && (
            <Field
              label={messageLabel}
              htmlFor="message"
              error={errorFor('message')}
            >
              {WITH_TEMPLATES.includes(action) && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {replyTemplates.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="rounded-full border px-3 py-1 text-xs text-left hover:bg-zinc-50"
                      style={{ borderColor: 'var(--border)' }}
                      onClick={() => setMessage((m) => (m ? `${m}\n${t}` : t))}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                id="message"
                rows={4}
                className={inputClass(errorFor('message'))}
                aria-invalid={!!errorFor('message')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Field>
          )}

          {error && !error.field && (
            <p className="text-xs" style={{ color: 'var(--danger)' }} role="alert">
              {error.text}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            ปิด
          </button>
          <button
            type="button"
            className={DANGER.includes(action) ? 'btn-danger' : 'btn-primary'}
            disabled={busy}
            onClick={submit}
          >
            {busy ? 'กำลังบันทึก…' : `ยืนยัน${actionLabels[action]}`}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: สร้าง `src/app/requests/[id]/tabs.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { IconFileText } from '@tabler/icons-react';
import { Field, inputClass } from '@/components/common/Field';
import { StatusBadge } from '@/components/common/StatusBadge';
import { actionLabels, relationLabels, typeLabel } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';
import type {
  AccRequest,
  ActionResult,
  Assessor,
  Pharmacy,
  RequestDoc,
} from '@/types/api';

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-zinc-100">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr]">
          <dt className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            {k}
          </dt>
          <dd className="text-sm font-medium break-words min-w-0">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const Empty = ({ text }: { text: string }) => (
  <p
    className="py-8 text-center text-sm"
    style={{ color: 'var(--ink-secondary)' }}
  >
    {text}
  </p>
);

const ErrorText = ({ text }: { text?: string }) =>
  text ? (
    <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }} role="alert">
      {text}
    </p>
  ) : null;

/** วันที่ท้องถิ่น YYYY-MM-DD */
const today = () => new Date().toLocaleDateString('sv-SE');

export function InfoTab({
  req,
  shop,
  assessors,
}: {
  req: AccRequest;
  shop: Pharmacy | null;
  assessors: Assessor[];
}) {
  const a = req.applicant;
  const names = assessors
    .filter((x) => req.assessorIds.includes(x.id))
    .map((x) => x.name);
  const requestRows: [string, string][] = [
    ['ประเภทคำขอ', typeLabel(req.typeIds)],
  ];
  if (req.changeMode)
    requestRows.push([
      'การเปลี่ยนผู้รับอนุญาต',
      req.changeMode === 1
        ? 'จากบุคคล เป็น บุคคล'
        : 'จากบุคคล เป็น นิติบุคคล/บริษัท',
    ]);
  requestRows.push([
    'ผู้ตรวจประเมิน',
    names.length ? names.join(', ') : 'ยังไม่ได้มอบหมาย',
  ]);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-bold mb-1">คำขอ</h3>
        <Rows rows={requestRows} />
      </section>
      <section>
        <h3 className="font-bold mb-1">ผู้ยื่นคำขอ</h3>
        <Rows
          rows={[
            ['ชื่อ', `${a.firstName} ${a.lastName}`],
            [
              'ติดต่อ',
              [a.email, a.phone, a.lineId && `LINE ${a.lineId}`]
                .filter(Boolean)
                .join(' · '),
            ],
            [
              'ความเกี่ยวข้อง',
              a.relation === 9
                ? a.relationOther
                : a.relation
                  ? relationLabels[a.relation]
                  : '-',
            ],
          ]}
        />
      </section>
      {shop && (
        <section>
          <h3 className="font-bold mb-1">ร้านยา</h3>
          <Rows
            rows={[
              ['ชื่อร้าน', shop.name],
              ['ใบอนุญาต', shop.licenseNo],
              ['ที่ตั้ง', `${shop.address} จ.${shop.province}`],
              ['ผู้รับอนุญาต', shop.licensee],
              ['เบอร์โทร', shop.phone],
            ]}
          />
        </section>
      )}
    </div>
  );
}

export function DocsTab({
  req,
  canResubmit,
  onResubmit,
}: {
  req: AccRequest;
  canResubmit: boolean;
  onResubmit: (docs: RequestDoc[]) => Promise<ActionResult>;
}) {
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const res = await onResubmit(
      files.map((name) => ({
        name,
        type: 'เอกสารเพิ่มเติม',
        uploadedAt: today(),
      })),
    );
    setBusy(false);
    if ('error' in res) setError(res.error);
    else {
      setFiles([]);
      setError('');
    }
  };

  return (
    <div className="space-y-6">
      {req.docs.length === 0 ? (
        <Empty text="ยังไม่มีเอกสาร" />
      ) : (
        <ul className="divide-y divide-zinc-100">
          {req.docs.map((d, i) => (
            <li key={`${d.name}-${i}`} className="flex items-start gap-3 py-3">
              <IconFileText
                size={20}
                className="shrink-0 mt-0.5"
                style={{ color: 'var(--ink-tertiary)' }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium break-words">{d.name}</p>
                <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
                  {d.type} · {formatDate(d.uploadedAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canResubmit && (
        <section
          className="rounded-xl border p-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 className="font-bold">ส่งเอกสารเพิ่มเติม</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            แนบไฟล์ตามที่ สรร. ขอ แล้วกดส่ง ต้นแบบนี้เก็บเฉพาะชื่อไฟล์
          </p>
          <label className="btn-secondary mt-4 cursor-pointer">
            เลือกไฟล์
            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              className="sr-only"
              onChange={(e) => {
                const picked = [...(e.target.files ?? [])].map((f) => f.name);
                setFiles((prev) => [...prev, ...picked]);
                e.target.value = '';
              }}
            />
          </label>
          {files.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {files.map((f, i) => (
                <li key={`${f}-${i}`} className="break-words">
                  {f}
                </li>
              ))}
            </ul>
          )}
          <ErrorText text={error} />
          <button
            type="button"
            className="btn-primary mt-4"
            disabled={busy}
            onClick={submit}
          >
            {busy ? 'กำลังส่ง…' : actionLabels.resubmit_docs}
          </button>
        </section>
      )}
    </div>
  );
}

export function PaymentsTab({
  req,
  canAdd,
  onAdd,
}: {
  req: AccRequest;
  canAdd: boolean;
  onAdd: (p: { amount: number; fileName: string }) => Promise<ActionResult>;
}) {
  const [amount, setAmount] = useState('');
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!(Number(amount) > 0)) e.amount = 'กรอกจำนวนเงินมากกว่า 0';
    if (!fileName) e.file = 'แนบหลักฐานการโอน';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const res = await onAdd({ amount: Number(amount), fileName });
    setBusy(false);
    if ('error' in res) setErrors({ file: res.error });
    else {
      setAmount('');
      setFileName('');
    }
  };

  return (
    <div className="space-y-6">
      {req.payments.length === 0 ? (
        <Empty text="ยังไม่มีหลักฐานการโอนเงิน" />
      ) : (
        <ul className="divide-y divide-zinc-100">
          {req.payments.map((p, i) => (
            <li
              key={`${p.fileName}-${i}`}
              className="flex flex-wrap justify-between gap-2 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium break-words">{p.fileName}</p>
                <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
                  {formatDate(p.paidAt)}
                </p>
              </div>
              <span className="text-sm font-semibold">
                {p.amount.toLocaleString('th-TH')} บาท
              </span>
            </li>
          ))}
        </ul>
      )}

      {canAdd && (
        <section
          className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 className="font-bold">เพิ่มหลักฐานการโอนเงิน</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="จำนวนเงิน (บาท)" htmlFor="amount" error={errors.amount}>
              <input
                id="amount"
                type="number"
                min="0"
                inputMode="decimal"
                className={inputClass(errors.amount)}
                aria-invalid={!!errors.amount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <div>
              <span className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                หลักฐานการโอน
              </span>
              <label className="btn-secondary cursor-pointer">
                {fileName ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFileName(f.name);
                    e.target.value = '';
                  }}
                />
              </label>
              {fileName && <p className="mt-2 text-xs break-words">{fileName}</p>}
              <ErrorText text={errors.file} />
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={submit}
          >
            {busy ? 'กำลังบันทึก…' : 'บันทึกหลักฐานการโอน'}
          </button>
        </section>
      )}
    </div>
  );
}

export function ResultTab({ req }: { req: AccRequest }) {
  if (req.gppScore === undefined) return <Empty text="ยังไม่มีผลประเมิน" />;
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
        คะแนน GPP
      </span>
      <span className="text-3xl font-extrabold">
        {req.gppScore.toFixed(2)}%
      </span>
    </div>
  );
}

export function HistoryTab({ req }: { req: AccRequest }) {
  if (req.messages.length === 0) return <Empty text="ยังไม่มีประวัติ" />;
  return (
    <ol className="space-y-5">
      {[...req.messages].reverse().map((m, i) => (
        <li key={`${m.at}-${i}`} className="flex gap-3">
          <span
            className="mt-1.5 w-2.5 h-2.5 shrink-0 rounded-full"
            style={{ background: 'var(--accent)' }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {m.status && <StatusBadge status={m.status} />}
              {m.override && (
                <span
                  className="badge"
                  style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}
                >
                  แก้สถานะ
                </span>
              )}
            </div>
            <p className="mt-1 text-sm whitespace-pre-line break-words">
              {m.text}
            </p>
            <p
              className="mt-0.5 text-xs"
              style={{ color: 'var(--ink-secondary)' }}
            >
              {m.from} · {formatDateTime(m.at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 3: ตรวจ**

Run: `npx prettier --write "src/app/requests/[id]/ActionDialog.tsx" "src/app/requests/[id]/tabs.tsx"; npx tsc --noEmit; npm run lint; npm test`
Expected: ไม่มี error, เทสต์ 15/15 ผ่าน (component ยังไม่มีหน้าใช้ — Task 5 ต่อสาย)

- [ ] **Step 4: Commit**

```bash
git add "src/app/requests/[id]/ActionDialog.tsx" "src/app/requests/[id]/tabs.tsx"
git commit -m "feat(f2): action dialog and request detail tabs"
```

---

### Task 5: หน้า `/requests/[id]` และ RequestHeader

**Files:**
- Create: `src/app/requests/[id]/RequestHeader.tsx`
- Create: `src/app/requests/[id]/page.tsx`

**Interfaces:**
- Consumes: `api.requests.get/act/addPayment`, `api.assessors.list`, `api.pharmacies.get` (Task 3); `actionsFor`, `canAddPayment` (Task 2); `ActionDialog`, tabs (Task 4); `Stepper` (`src/components/common/Stepper.tsx`, props `{ steps: string[]; current: number }`); `StatusBadge`; `actionLabels`, `requestStatusLabels`, `typeLabel`; `formatDate`; `useAuth()` → `{ user }` (หน้าเรนเดอร์หลังโหลด auth เสร็จแล้วเสมอ เพราะ `AuthGuard` กันไว้)
- Produces: หน้า `/requests/[id]` (route นี้จะไม่ตกที่ `src/app/[...slug]/page.tsx` อีก)

- [ ] **Step 1: สร้าง `src/app/requests/[id]/RequestHeader.tsx`**

```tsx
'use client';

import { IconAlertTriangle, IconCircleX } from '@tabler/icons-react';
import { Stepper } from '@/components/common/Stepper';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  actionLabels,
  requestStatusLabels,
  typeLabel,
} from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type {
  AccRequest,
  Pharmacy,
  RequestAction,
  RequestStatus,
  UserRole,
} from '@/types/api';

const STEPS = ['รับคำขอ', 'ตรวจเอกสาร', 'มอบหมาย', 'ประเมิน', 'คณะกรรมการ', 'ผล'];

const stepOf: Partial<Record<RequestStatus, number>> = {
  submitted: 0,
  doc_review: 1,
  need_docs: 1,
  assigned: 2,
  assessed: 3,
  committee: 4,
  approved: 5,
};

/** ปุ่มรอง — ที่เหลือเป็นปุ่มหลัก */
const SECONDARY: RequestAction[] = ['reply', 'cancel', 'override'];

/** ข้อความล่าสุดที่พาคำขอมาสู่สถานะนี้ */
const lastText = (req: AccRequest, status: RequestStatus) =>
  [...req.messages].reverse().find((m) => m.status === status)?.text ?? '';

export function RequestHeader({
  req,
  shop,
  role,
  actions,
  onAction,
}: {
  req: AccRequest;
  shop: Pharmacy | null;
  role: UserRole;
  actions: RequestAction[];
  onAction: (action: RequestAction) => void;
}) {
  const step = stepOf[req.status];
  const ended = req.status === 'cancelled' || req.status === 'rejected';
  const primary = actions.filter((a) => !SECONDARY.includes(a));
  const secondary = actions.filter((a) => SECONDARY.includes(a));

  return (
    <div className="card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-mono text-xl font-bold">{req.no}</h2>
            <StatusBadge status={req.status} />
          </div>
          {shop && (
            <p className="mt-1 text-sm font-medium">
              {shop.name} · {shop.province}
            </p>
          )}
          <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-secondary)' }}>
            {typeLabel(req.typeIds)} · ยื่นเมื่อ {formatDate(req.submittedAt)}
          </p>
        </div>
        {actions.length > 0 && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            {primary.map((a) => (
              <button
                key={a}
                type="button"
                className="btn-primary"
                onClick={() => onAction(a)}
              >
                {actionLabels[a]}
              </button>
            ))}
            {secondary.map((a) => (
              <button
                key={a}
                type="button"
                className="btn-secondary"
                onClick={() => onAction(a)}
              >
                {actionLabels[a]}
              </button>
            ))}
          </div>
        )}
      </div>

      {ended ? (
        <div
          role="status"
          className="flex gap-2 rounded-xl p-4 text-sm"
          style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
        >
          <IconCircleX size={20} className="shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold">{requestStatusLabels[req.status]}</p>
            <p className="mt-1 whitespace-pre-line break-words">
              {lastText(req, req.status)}
            </p>
          </div>
        </div>
      ) : (
        step !== undefined && <Stepper steps={STEPS} current={step} />
      )}

      {role === 'pharmacy' && req.status === 'need_docs' && (
        <div
          role="alert"
          className="flex gap-2 rounded-xl p-4 text-sm"
          style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}
        >
          <IconAlertTriangle size={20} className="shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold">สรร. ขอเอกสารเพิ่มเติม</p>
            <p
              className="mt-1 whitespace-pre-line break-words"
              style={{ color: 'var(--ink)' }}
            >
              {lastText(req, 'need_docs')}
            </p>
            <p className="mt-1">
              แนบไฟล์ที่แท็บ &quot;เอกสาร&quot; แล้วกด &quot;
              {actionLabels.resubmit_docs}&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: สร้าง `src/app/requests/[id]/page.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { actionLabels } from '@/lib/constants';
import { actionsFor, canAddPayment } from '@/lib/requestRules';
import type {
  AccRequest,
  ActionInput,
  Assessor,
  Pharmacy,
  RequestAction,
} from '@/types/api';
import { ActionDialog } from './ActionDialog';
import { RequestHeader } from './RequestHeader';
import {
  DocsTab,
  HistoryTab,
  InfoTab,
  PaymentsTab,
  ResultTab,
} from './tabs';

const TABS = [
  'ข้อมูล',
  'เอกสาร',
  'การชำระเงิน',
  'ผลประเมิน',
  'ประวัติ',
] as const;
type Tab = (typeof TABS)[number];

/** action ที่ไม่ต้องกรอกอะไร — กดแล้วทำเลย */
const IMMEDIATE: RequestAction[] = ['start_review', 'to_committee'];

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  // undefined = กำลังโหลด, null = ไม่พบหรือไม่มีสิทธิ์
  const [req, setReq] = useState<AccRequest | null | undefined>();
  const [shop, setShop] = useState<Pharmacy | null>(null);
  const [assessors, setAssessors] = useState<Assessor[]>([]);
  const [tab, setTab] = useState<Tab>('ข้อมูล');
  const [dialog, setDialog] = useState<RequestAction | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.requests.get(id, user), api.assessors.list()])
      .then(([r, list]) => {
        setReq(r);
        setAssessors(list);
        if (r) return api.pharmacies.get(r.pharmacyId).then(setShop);
      })
      .catch(() => {
        toast.error('โหลดคำขอไม่สำเร็จ');
        setReq(null);
      });
  }, [id, user]);

  if (!user || req === undefined)
    return <AdminLayout title="รายละเอียดคำขอ">{null}</AdminLayout>;

  if (req === null)
    return (
      <AdminLayout title="รายละเอียดคำขอ">
        <div className="card text-center py-12">
          <p className="font-semibold">ไม่พบคำขอ</p>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            คำขอนี้ไม่มีอยู่ หรือคุณไม่มีสิทธิ์ดู
          </p>
          <Link href="/requests" className="btn-secondary mt-6">
            กลับไปรายการคำขอ
          </Link>
        </div>
      </AdminLayout>
    );

  const actions = actionsFor(req.status, user.role);

  const run = async (action: RequestAction, input: ActionInput = {}) => {
    const res = await api.requests.act(req.id, action, input, user);
    if ('request' in res) {
      setReq(res.request);
      toast.success(`${actionLabels[action]}แล้ว`);
    }
    return res;
  };

  const onAction = async (action: RequestAction) => {
    if (action === 'resubmit_docs') return setTab('เอกสาร');
    if (IMMEDIATE.includes(action)) {
      const res = await run(action);
      if ('error' in res) toast.error(res.error);
      return;
    }
    setDialog(action);
  };

  const addPayment = async (p: { amount: number; fileName: string }) => {
    const res = await api.requests.addPayment(req.id, p, user);
    if ('request' in res) {
      setReq(res.request);
      toast.success('บันทึกหลักฐานการโอนแล้ว');
    }
    return res;
  };

  const counts: Partial<Record<Tab, number>> = {
    เอกสาร: req.docs.length,
    ประวัติ: req.messages.length,
  };

  return (
    <AdminLayout title="รายละเอียดคำขอ">
      <div className="max-w-5xl space-y-6">
        <Link
          href="/requests"
          className="inline-block text-sm font-semibold"
          style={{ color: 'var(--accent)' }}
        >
          ← กลับไปรายการคำขอ
        </Link>

        <RequestHeader
          req={req}
          shop={shop}
          role={user.role}
          actions={actions}
          onAction={onAction}
        />

        <div className="card !p-0 overflow-hidden">
          <div
            role="tablist"
            aria-label="ส่วนของคำขอ"
            className="flex gap-1 overflow-x-auto border-b border-zinc-100 px-2"
          >
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={t === tab}
                onClick={() => setTab(t)}
                className="shrink-0 px-4 py-3 text-sm font-semibold border-b-2 -mb-px"
                style={
                  t === tab
                    ? { borderColor: 'var(--accent)', color: 'var(--accent)' }
                    : {
                        borderColor: 'transparent',
                        color: 'var(--ink-secondary)',
                      }
                }
              >
                {t}
                {counts[t] !== undefined && ` (${counts[t]})`}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="p-5 sm:p-6">
            {tab === 'ข้อมูล' && (
              <InfoTab req={req} shop={shop} assessors={assessors} />
            )}
            {tab === 'เอกสาร' && (
              <DocsTab
                req={req}
                canResubmit={actions.includes('resubmit_docs')}
                onResubmit={(newDocs) => run('resubmit_docs', { newDocs })}
              />
            )}
            {tab === 'การชำระเงิน' && (
              <PaymentsTab
                req={req}
                canAdd={canAddPayment(req, user)}
                onAdd={addPayment}
              />
            )}
            {tab === 'ผลประเมิน' && <ResultTab req={req} />}
            {tab === 'ประวัติ' && <HistoryTab req={req} />}
          </div>
        </div>
      </div>

      {dialog && (
        <ActionDialog
          action={dialog}
          current={req.status}
          assessors={assessors}
          onClose={() => setDialog(null)}
          onSubmit={(input) => run(dialog, input)}
        />
      )}
    </AdminLayout>
  );
}
```

- [ ] **Step 3: ตรวจ**

Run: `npx prettier --write "src/app/requests/[id]/RequestHeader.tsx" "src/app/requests/[id]/page.tsx"; npx tsc --noEmit; npm run lint; npm test; npm run build`
Expected: ไม่มี error, เทสต์ 15/15 ผ่าน, build แสดง route `ƒ /requests/[id]` หรือ `○ /requests/[id]` (ถ้า lint เตือน `react-hooks/set-state-in-effect` ให้ใส่ `/* eslint-disable react-hooks/set-state-in-effect */` บรรทัดที่ 3 แบบเดียวกับ `src/app/requests/new/page.tsx`)

- [ ] **Step 4: Commit**

```bash
git add "src/app/requests/[id]/RequestHeader.tsx" "src/app/requests/[id]/page.tsx"
git commit -m "feat(f2): request detail page with role-aware actions"
```

---

### Task 6: ตรวจ Definition of Done ของ F2 (controller)

**Files:** ไม่มีไฟล์โค้ดใหม่ (ถ้าเจอปัญหาให้ส่งกลับเป็น fix round)

- [ ] **Step 1: รัน check ทั้งหมด**

Run: `npm test; npm run lint; npx tsc --noEmit; npm run format:check; npm run build`
Expected: ผ่านทั้งหมด

- [ ] **Step 2: เดินทั้งเส้นในเบราว์เซอร์** (แท็บใหม่ ล้าง sessionStorage ก่อน สลับ role ด้วย Demo role)

1. `pharm001` ยื่นคำขอ (F1) → ได้ `NEW-6900013`
2. `admin01` เปิดคำขอจาก `/requests` → กด "รับตรวจเอกสาร" → toast + สถานะ "อยู่ระหว่างตรวจสอบเอกสาร"
3. กด "ขอเอกสารเพิ่มเติม" → กดยืนยันโดยไม่กรอก → error ใต้ช่อง → กด chip template แล้วพิมพ์ต่อ → ยืนยัน
4. `pharm001` → หน้าแรกขึ้นการ์ด "ส่งเอกสารเพิ่มเติม" → เปิดคำขอ เห็นแถบเหลือง → ปุ่ม "ส่งเอกสารเพิ่มแล้ว" พาไปแท็บเอกสาร → กดส่งโดยไม่แนบ → error → แนบไฟล์ → ส่ง → สถานะกลับเป็น "อยู่ระหว่างตรวจสอบเอกสาร"
5. แท็บการชำระเงิน: ใส่ 0 บาท → error; ใส่ 1500 + ไฟล์ → รายการขึ้น
6. `admin01` → "มอบหมายผู้ตรวจ" → ไม่เลือก → error → เลือก 2 คน (รวม ภญ.วรรณา) → สถานะ "มอบหมายผู้ตรวจแล้ว"
7. `assessor01` → `/requests` เห็นเฉพาะคำขอที่ได้รับมอบหมาย (คำขอใหม่ + `REN-6900002`) → เปิดได้ ไม่มีปุ่ม action → เปิด URL `/requests/r4` (มอบหมายให้ id 6) → "ไม่พบคำขอ"
8. `admin01` → "เปลี่ยนสถานะอื่น" เป็น "รอผู้ประเมินตรวจสอบ" (ไม่ใส่เหตุผล → error) → ประวัติมีป้าย "แก้สถานะ"
9. "ส่งคณะกรรมการ" → "ผ่านการรับรอง" (modal ยืนยัน) → แถบความคืบหน้าครบ 6 ขั้น
10. คำขออื่นที่สถานะ "รอคณะกรรมการรับรอง" (`REN-6900002`) → "ไม่ผ่าน" ไม่ใส่เหตุผล → error; ใส่เหตุผล → แถบแดงแสดงเหตุผล
11. `pharm001` เปิด URL `/requests/r1` (ร้านอื่น) → "ไม่พบคำขอ"
12. `pharm001` ยกเลิกคำขอได้เมื่อสถานะก่อนมอบหมาย (ทดสอบกับคำขอใหม่อีกรายการ ถ้าคำขอแรกจบแล้ว)

- [ ] **Step 3: ความกว้างจอ**

`/requests/[id]` ทุกแท็บ และตอนเปิด modal ที่ 375px และ 1280px: `document.documentElement.scrollWidth <= innerWidth`; แถบ tab เลื่อนแนวนอนได้เฉพาะตัวแถบ

- [ ] **Step 4: ค้นข้อความอังกฤษที่ผู้ใช้เห็น**

Run (Git Bash): `grep -rnE ">[^<{]*[A-Za-z]{3,}[^<{]*<" src/app src/components`
Expected: ไม่มีรายการใหม่ (ยอมได้: LINE, PDF, GPP)

- [ ] **Step 5: อัปเดตเอกสารแผนของทีม**

ในเอกสาร "แผน PoC Acc-Pharm (Frontend)" (Claude Docs project `5aa46c55-50c3-47a3-8597-5bdb0761ef26`) แก้บรรทัดความคืบหน้า: เพิ่ม "F2 ตรวจคำขอและมอบหมายผู้ตรวจ เสร็จแล้ว (branch `feat/f2-request-review`)" และระบุว่าตารางสถานะยังรอ สรร. ยืนยัน
