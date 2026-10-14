# F1 ยื่นคำขอ (ร้านยา) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ร้านยายื่นคำขอรับรอง/ต่ออายุ/เปลี่ยนแปลงข้อมูลผ่าน stepper 4 ขั้น ดูรายการคำขอและข้อมูลร้านของตัวเอง เห็น "งานที่รอคุณ" บนหน้าแรก และร้านใหม่ลงทะเบียนได้ — ทั้งหมดเป็น frontend + mock

**Architecture:** กฎทางธุรกิจ (ประเภทคำขอ, การตรวจฟอร์ม, เลขคำขอ, งานที่รอ) อยู่ในไฟล์ pure เดียว `src/lib/requestRules.ts` ที่มีเทสต์ `node --test` หน้าจอดึงข้อมูลผ่าน `src/lib/api.ts` เท่านั้น ซึ่งตอนนี้อ่าน seed จาก `src/mock/` และเก็บคำขอที่สร้างใหม่ใน sessionStorage ค่าคงที่ที่ไม่ได้มาจาก backend (label, ประเภทคำขอ, คำรับรอง) อยู่ใน `src/lib/constants.ts`

**Tech Stack:** Next 16.1.1 (App Router, client components), React 19.2.3, Tailwind 4 + component class ใน `globals.css`, @tabler/icons-react, react-hot-toast, Node 26 `node --test` (รัน .ts ได้ตรง)

**Spec:** `docs/superpowers/specs/2026-10-14-redesign-design.md`

## Global Constraints

- Frontend อย่างเดียว ข้อมูลเป็น mock ไม่มี backend
- คง business flow เดิม: status, ลำดับ, role ตาม AdminManual
- ทุกหน้าดึงข้อมูลผ่าน `src/lib/api.ts` เท่านั้น ไม่ import `src/mock/` ตรง (ยกเว้นโค้ดเดิมที่มีอยู่แล้ว: `roleLabels`, `users` ในหน้า login/หน้าแรก/Header)
- ภาษาไทยทั้งหมด ทั้ง label, ปุ่ม, placeholder (placeholder ที่เป็นตัวอย่างข้อมูล เช่น `name@example.com` ได้)
- Error แสดงใต้ช่องที่ผิด, สำเร็จแจ้งด้วย toast (`react-hot-toast`), action ที่ย้อนกลับไม่ได้ต้องมี modal ยืนยัน
- ฟอร์มยาวเป็น stepper มีแถบความคืบหน้า บันทึกร่างอัตโนมัติใน sessionStorage ตรวจความถูกต้องทีละขั้น
- หน้ารายการ: ช่องค้นหา, chip กรอง status, `data-table` บน desktop และ card บนมือถือ
- ไม่มี scroll แนวนอนที่ 375px และ 1280px
- ไม่เพิ่ม dependency ใหม่ ไม่เพิ่ม test framework (ใช้ `node --test`)
- Prettier: single quote (ตาม `.prettierrc.json`)
- Accent `#0E6B45` ผ่านตัวแปร `var(--accent)` / `var(--accent-soft)` ห้าม hardcode สี

## หมายเหตุก่อนเริ่ม

- โปรเจกต์ยังไม่เป็น git repo จุด checkpoint ของแต่ละ task คือรัน check ให้ผ่าน ถ้า `git init` แล้ว ให้ commit ท้ายทุก task ด้วยข้อความที่ให้ไว้
- คำสั่งทั้งหมดรันใน `D:\PharmacyCouncil_Project\Acc\acc-pharm-redesign`
- `src/app/[...slug]/page.tsx` รับทุก route ที่ยังไม่มีไฟล์ — `/requests/[id]` (รายละเอียดคำขอ) เป็นของ F2 ใน F1 ลิงก์ไปหน้านั้นได้ และจะเห็นหน้า "กำลังพัฒนา" ไปก่อน
- กฎที่ยึดจากระบบเดิม (`Acc-Pharm/CPAQA/CPAQA/Request.aspx.vb`):
  - ประเภท 1 (ขอรับรองใหม่), 7 (ขอรับรองใหม่แบบมีเงื่อนไข), 2 (ต่ออายุ) เลือกได้ทีละ 1 — `chkType*_CheckedChanged` ล้างกันเอง
  - ประเภท 3, 4, 5, 6, 8 (เปลี่ยนแปลง) เลือกได้หลายข้อ และเลือกคู่กับประเภทหลักได้
  - ประเภท 5 มีตัวเลือกย่อย: จากบุคคลเป็นบุคคล (1) / จากบุคคลเป็นนิติบุคคล (2)
  - คำรับรอง (`chkAllow`) บังคับเฉพาะเมื่อเลือกประเภทหลัก
  - ชื่อ, นามสกุล, อีเมล, เบอร์โทรบังคับ
  - ร้านที่มีคำขอค้างอยู่ยื่นใหม่ไม่ได้ (`Request_GetStatusAlive`)
  - เลขคำขอ running ต่อเนื่องทั้งระบบ รูปแบบ `NEW|REN|CHG-<ปี พ.ศ. 2 หลัก><ลำดับ 5 หลัก>`

## File Structure

| ไฟล์ | หน้าที่ |
|---|---|
| `tsconfig.json` (แก้) | เปิด `allowImportingTsExtensions` ให้เทสต์ import `./x.ts` ได้ |
| `package.json` (แก้) | เพิ่ม script `test` |
| `src/types/api.ts` (แก้) | type ของร้านยา คำขอ ร่างคำขอ การลงทะเบียน |
| `src/lib/constants.ts` (ใหม่) | label ของ status/ใบรับรอง/ความเกี่ยวข้อง, ประเภทคำขอ + checklist เอกสาร, ข้อความคำรับรอง |
| `src/lib/requestRules.ts` (ใหม่) | กฎ pure: เลือกประเภท, คำรับรอง, เอกสาร, เลขคำขอ, ตรวจฟอร์มทีละขั้น, งานที่รอร้านยา |
| `src/lib/requestRules.test.ts` (ใหม่) | เทสต์ของไฟล์ด้านบน |
| `src/mock/index.ts` (แก้) | seed ร้านยา 5 ร้าน และคำขอ 5 รายการ |
| `src/lib/api.ts` (แก้) | `pharmacies`, `requests` (เก็บใน sessionStorage), `fda.lookup`, `registrations.create` |
| `src/components/common/StatusBadge.tsx` (ใหม่) | `StatusBadge` (สถานะคำขอ) และ `CertBadge` (สถานะใบรับรอง) |
| `src/components/common/Stepper.tsx` (ใหม่) | แถบขั้นตอน |
| `src/components/common/Field.tsx` (ใหม่) | label + ช่องกรอก + error ใต้ช่อง |
| `src/app/requests/page.tsx` (ใหม่) | รายการคำขอ |
| `src/app/requests/new/page.tsx` (ใหม่) | stepper ยื่นคำขอ: state, ร่าง, ปุ่มถัดไป/ส่ง |
| `src/app/requests/new/steps.tsx` (ใหม่) | เนื้อหาแต่ละขั้น 4 component |
| `src/app/my-pharmacy/page.tsx` (ใหม่) | ข้อมูลร้านของฉัน |
| `src/components/home/PharmacyHome.tsx` (ใหม่) | หน้าแรกของ role ร้านยา: งานที่รอคุณ + คำขอล่าสุด |
| `src/app/page.tsx` (แก้) | แสดง `PharmacyHome` เมื่อเป็นร้านยา |
| `src/app/register/page.tsx` (ใหม่) | ลงทะเบียนร้านยาใหม่ 2 ขั้น |
| `src/components/auth/AuthGuard.tsx` (แก้) | `/register` เป็นหน้า public |
| `src/app/login/page.tsx` (แก้) | ลิงก์ไปหน้าลงทะเบียน |

ไม่สร้าง `ListPage` กลางใน F1 — มีหน้ารายการแค่หน้าเดียว (`/requests`) จะแยกเป็น component เมื่อ F6 มีหน้ารายการที่สอง

---

### Task 1: Type, ค่าคงที่ และกฎของคำขอ (TDD)

**Files:**
- Modify: `tsconfig.json`
- Modify: `package.json` (scripts)
- Modify: `src/types/api.ts` (ต่อท้ายไฟล์)
- Create: `src/lib/constants.ts`
- Create: `src/lib/requestRules.ts`
- Test: `src/lib/requestRules.test.ts`

**Interfaces:**
- Consumes: ไม่มี
- Produces:
  - types: `RequestStatus`, `CertStatus`, `Pharmacist`, `Pharmacy`, `RequestType`, `ApplicantRelation`, `Applicant`, `RequestDoc`, `RequestMessage`, `AccRequest`, `RequestDraft`, `Registration`
  - constants: `requestStatusLabels`, `certStatusLabels`, `relationLabels`, `requestTypes`, `pledgeItems`, `pledgeWarning`
  - rules: `MAIN_TYPE_IDS: number[]`, `CHANGE_TYPE_IDS: number[]`, `isAlive(s: RequestStatus): boolean`, `mainTypeOf(typeIds: number[]): number | null`, `setMainType(typeIds: number[], id: number | null): number[]`, `toggleChangeType(typeIds: number[], id: number): number[]`, `needsPledge(typeIds: number[]): boolean`, `requiredDocs(typeIds: number[], types: RequestType[]): string[]`, `nextRequestNo(typeIds: number[], existingNos: string[], today: Date): string`, `type StepErrors = Record<string, string>`, `validateStep(step: number, d: RequestDraft, types: RequestType[]): StepErrors`, `interface Todo`, `pharmacyTodos(p: Pharmacy, reqs: AccRequest[], today: Date): Todo[]`

- [ ] **Step 1: เปิดให้ import นามสกุล .ts และเพิ่ม script test**

`tsconfig.json` — เพิ่มบรรทัดนี้ใน `compilerOptions` ต่อจาก `"noEmit": true,`:

```json
    "allowImportingTsExtensions": true,
```

`package.json` — เพิ่มใน `scripts` ต่อจาก `"lint": "eslint",`:

```json
    "test": "node --test \"src/**/*.test.ts\"",
```

- [ ] **Step 2: เพิ่ม type ท้าย `src/types/api.ts`**

```ts
/**
 * สถานะคำขอ — ระบบเดิมเก็บในตาราง AssessmentStatus
 * ประกอบจากคู่มือ Admin ต้องยืนยันกับ DB จริงก่อนเริ่ม F2
 */
export type RequestStatus =
  | 'submitted'
  | 'doc_review'
  | 'need_docs'
  | 'assigned'
  | 'assessed'
  | 'committee'
  | 'approved'
  | 'rejected'
  | 'cancelled';

/** สถานะใบรับรอง: N ยังไม่ได้รับรอง · A รับรองแล้ว · E หมดอายุ · X ถูกยกเลิก */
export type CertStatus = 'N' | 'A' | 'E' | 'X';

export interface Pharmacist {
  name: string;
  license: string;
  role: string;
  hours: string;
}

export interface Pharmacy {
  id: number;
  name: string;
  /** เลขที่ใบอนุญาตขายยา ขย.5 */
  licenseNo: string;
  /** เลขที่ใบรับรองร้านยาคุณภาพ */
  qualityNo?: string;
  type: string;
  address: string;
  province: string;
  licensee: string;
  phone: string;
  certStatus: CertStatus;
  certIssued?: string;
  certExpires?: string;
  /** เวลาทำการ เช่น 'ทุกวัน 08:00–21:00' */
  hours: string;
  pharmacists: Pharmacist[];
}

export interface RequestType {
  id: number;
  code: 'NEW' | 'REN' | 'CHG';
  label: string;
  /** คำอธิบายสั้นใต้ตัวเลือก */
  hint: string;
  /** เอกสารที่ต้องแนบ */
  docs: string[];
}

/** ความเกี่ยวข้องกับร้านยา (ddlRequesterType ของระบบเดิม) */
export type ApplicantRelation = 1 | 2 | 3 | 9;

export interface Applicant {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lineId: string;
  relation: ApplicantRelation | null;
  /** ใช้เมื่อ relation = 9 (อื่น ๆ) */
  relationOther: string;
}

export interface RequestDoc {
  /** ชื่อไฟล์ */
  name: string;
  /** ประเภทเอกสาร ตรงกับรายการใน RequestType.docs */
  type: string;
  uploadedAt: string;
}

export interface RequestMessage {
  from: string;
  at: string;
  text: string;
  status?: RequestStatus;
}

export interface AccRequest {
  id: string;
  no: string;
  pharmacyId: number;
  typeIds: number[];
  /** ประเภท 5: 1 บุคคล→บุคคล · 2 บุคคล→นิติบุคคล */
  changeMode?: 1 | 2;
  submittedAt: string;
  status: RequestStatus;
  applicant: Applicant;
  docs: RequestDoc[];
  messages: RequestMessage[];
}

/** ร่างคำขอระหว่างกรอก stepper (เก็บใน sessionStorage) */
export interface RequestDraft {
  typeIds: number[];
  changeMode: 1 | 2;
  applicant: Applicant;
  /** ประเภทเอกสาร → ชื่อไฟล์ */
  docs: Record<string, string>;
  pledged: boolean;
}

/** ข้อมูลลงทะเบียนร้านยาใหม่ */
export interface Registration {
  licenseNo: string;
  name: string;
  address: string;
  province: string;
  licensee: string;
  /** ผู้มีหน้าที่ปฏิบัติการ */
  operator: string;
  /** เลขใบประกอบวิชาชีพของผู้มีหน้าที่ปฏิบัติการ */
  operatorLicense: string;
  phone: string;
  email: string;
}
```

- [ ] **Step 3: สร้าง `src/lib/constants.ts`**

```ts
// ค่าคงที่ทางธุรกิจที่ frontend ถือเอง — ไม่ใช่ข้อมูลจาก backend จึงไม่อยู่ใน mock/
import type {
  ApplicantRelation,
  CertStatus,
  RequestStatus,
  RequestType,
} from '@/types/api';

export const requestStatusLabels: Record<RequestStatus, string> = {
  submitted: 'รอดำเนินการ',
  doc_review: 'อยู่ระหว่างตรวจสอบเอกสาร',
  need_docs: 'ขอเอกสารเพิ่มเติม',
  assigned: 'มอบหมายผู้ตรวจแล้ว',
  assessed: 'รอผู้ประเมินตรวจสอบ',
  committee: 'รอคณะกรรมการรับรอง',
  approved: 'ผ่านการรับรอง',
  rejected: 'ไม่ผ่านการรับรอง',
  cancelled: 'ยกเลิกคำขอ',
};

export const certStatusLabels: Record<CertStatus, string> = {
  N: 'ยังไม่ได้รับรอง',
  A: 'รับรองแล้ว',
  E: 'หมดอายุ',
  X: 'ถูกยกเลิก',
};

export const relationLabels: Record<ApplicantRelation, string> = {
  1: 'ผู้ดำเนินกิจการ / ผู้รับอนุญาต',
  2: 'ผู้รับอนุญาต + เภสัชกร',
  3: 'เภสัชกร',
  9: 'อื่น ๆ',
};

const LICENSE = 'สำเนาใบอนุญาตขายยา (ขย.5)';
const NEW_LICENSE = 'สำเนาใบอนุญาตขายยา (ขย.5) ฉบับใหม่';
const FLOOR_PLAN = 'แผนผังร้าน';
const PHOTOS = 'ภาพถ่ายหน้าร้านและบริเวณจ่ายยา';

// ponytail: checklist เอกสารเป็นร่าง — ระบบเดิมเก็บประเภทเอกสารใน DB (Document_GetCategory)
// และไม่ได้ผูกกับประเภทคำขอ ให้ สรร. ยืนยันรายการจริงก่อนต่อ backend
export const requestTypes: RequestType[] = [
  {
    id: 1,
    code: 'NEW',
    label: 'ขอรับรองใหม่',
    hint: 'ร้านที่ยังไม่เคยได้รับการรับรองร้านยาคุณภาพ',
    docs: [LICENSE, FLOOR_PLAN, PHOTOS],
  },
  {
    id: 7,
    code: 'NEW',
    label: 'ขอรับรองใหม่ แบบมีเงื่อนไข',
    hint: 'ร้านที่ยังไม่ครบบางเกณฑ์ และจะปรับปรุงภายในเวลาที่กำหนด',
    docs: [LICENSE, FLOOR_PLAN, PHOTOS, 'แผนการปรับปรุงร้าน'],
  },
  {
    id: 2,
    code: 'REN',
    label: 'ต่ออายุ',
    hint: 'ใบรับรองเดิมใกล้หมดอายุหรือหมดอายุแล้ว',
    docs: [LICENSE, 'สำเนาใบรับรองร้านยาคุณภาพฉบับเดิม'],
  },
  {
    id: 3,
    code: 'CHG',
    label: 'ย้าย หรือ เปลี่ยนสถานที่',
    hint: 'ร้านย้ายไปที่ตั้งใหม่',
    docs: [NEW_LICENSE, FLOOR_PLAN],
  },
  {
    id: 4,
    code: 'CHG',
    label: 'เพิ่ม/เปลี่ยนผู้มีหน้าที่ปฏิบัติการ',
    hint: 'เพิ่มหรือเปลี่ยนเภสัชกรประจำร้าน',
    docs: ['หนังสือแต่งตั้งเภสัชกร', 'สำเนาใบอนุญาตประกอบวิชาชีพ'],
  },
  {
    id: 5,
    code: 'CHG',
    label: 'เปลี่ยนผู้ดำเนินกิจการ/ผู้รับอนุญาต (สถานที่เดิม)',
    hint: 'เปลี่ยนเจ้าของหรือผู้รับอนุญาต ร้านอยู่ที่เดิม',
    docs: [NEW_LICENSE, 'หลักฐานการเปลี่ยนผู้รับอนุญาต'],
  },
  {
    id: 6,
    code: 'CHG',
    label: 'เปลี่ยนชื่อร้านยา',
    hint: 'สถานที่ ผู้รับอนุญาต และเภสัชกรคงเดิม',
    docs: [NEW_LICENSE],
  },
  {
    id: 8,
    code: 'CHG',
    label: 'เปลี่ยนแปลงเวลาผู้มีหน้าที่ปฏิบัติการ',
    hint: 'เปลี่ยนเวลาปฏิบัติงานของเภสัชกร',
    docs: ['ตารางเวลาปฏิบัติการใหม่'],
  },
];

/** คำรับรองของผู้ยื่นคำขอ (Request.aspx ส่วน pnPolicy) */
export const pledgeItems = [
  'ไม่มีการจำหน่ายยาออนไลน์',
  'จัดให้มีเภสัชกรปฏิบัติหน้าที่ตลอดเวลาปฏิบัติการ (ตามใบอนุญาต ขย.5)',
  'ปฏิบัติหน้าที่และให้บริการแก่ผู้มารับบริการ ตาม พ.ร.บ.ยา และ พ.ร.บ.วิชาชีพเภสัชกรรม',
  'ร้านจะจำหน่ายเฉพาะยาสามัญประจำบ้านให้แก่ร้านชำ',
];

export const pledgeWarning =
  'หากตรวจพบภายหลังว่าคุณสมบัติไม่เป็นไปตามที่กำหนด หรือไม่ปฏิบัติตามคำรับรอง สำนักงานรับรองร้านยาคุณภาพสามารถยกเลิกการรับรอง หรือคืนคำขอโดยไม่พิจารณาได้';
```

- [ ] **Step 4: เขียนเทสต์ที่ fail — `src/lib/requestRules.test.ts`**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type {
  AccRequest,
  Pharmacy,
  RequestDraft,
  RequestStatus,
  RequestType,
} from '@/types/api';
import {
  isAlive,
  needsPledge,
  nextRequestNo,
  pharmacyTodos,
  requiredDocs,
  setMainType,
  toggleChangeType,
  validateStep,
} from './requestRules.ts';

const types: RequestType[] = [
  { id: 1, code: 'NEW', label: 'ใหม่', hint: '', docs: ['ขย.5', 'แผนผัง'] },
  { id: 2, code: 'REN', label: 'ต่ออายุ', hint: '', docs: ['ขย.5', 'ใบรับรองเดิม'] },
  { id: 4, code: 'CHG', label: 'เปลี่ยนเภสัชกร', hint: '', docs: ['หนังสือแต่งตั้ง'] },
];

const draft = (patch: Partial<RequestDraft> = {}): RequestDraft => ({
  typeIds: [2],
  changeMode: 1,
  applicant: {
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    email: 'a@b.co',
    phone: '081-234-5678',
    lineId: '',
    relation: 1,
    relationOther: '',
  },
  docs: {},
  pledged: false,
  ...patch,
});

test('ประเภทหลักเลือกได้ทีละ 1 และไม่ล้างประเภทเปลี่ยนแปลง', () => {
  assert.deepEqual(setMainType([1, 4], 2), [2, 4]);
  assert.deepEqual(setMainType([7, 4, 8], null), [4, 8]);
});

test('ประเภทเปลี่ยนแปลงสลับเปิดปิดได้', () => {
  assert.deepEqual(toggleChangeType([2], 4), [2, 4]);
  assert.deepEqual(toggleChangeType([2, 4], 4), [2]);
});

test('คำรับรองบังคับเฉพาะเมื่อมีประเภทหลัก', () => {
  assert.equal(needsPledge([7, 3]), true);
  assert.equal(needsPledge([3, 8]), false);
});

test('รวมเอกสารตามประเภทโดยไม่ซ้ำ', () => {
  assert.deepEqual(requiredDocs([2, 4], types), [
    'ขย.5',
    'ใบรับรองเดิม',
    'หนังสือแต่งตั้ง',
  ]);
});

test('คำขอค้างคือสถานะที่ยังไม่จบ', () => {
  assert.equal(isAlive('need_docs'), true);
  assert.equal(isAlive('cancelled'), false);
});

test('เลขคำขอต่อจากเลขสูงสุดของปี พ.ศ. ปัจจุบัน', () => {
  const today = new Date('2026-10-14');
  assert.equal(
    nextRequestNo([2], ['NEW-6900012', 'CHG-6900003', 'REN-6600031'], today),
    'REN-6900013',
  );
  assert.equal(nextRequestNo([4], [], today), 'CHG-6900001');
  assert.equal(nextRequestNo([7, 4], ['REN-6800099'], today), 'NEW-6900001');
});

test('ตรวจฟอร์มทีละขั้น', () => {
  assert.deepEqual(Object.keys(validateStep(0, draft({ typeIds: [] }), types)), [
    'typeIds',
  ]);
  assert.deepEqual(validateStep(1, draft(), types), {});

  const bad = validateStep(
    1,
    draft({
      applicant: {
        firstName: ' ',
        lastName: 'x',
        email: 'no',
        phone: '12',
        lineId: '',
        relation: 9,
        relationOther: '',
      },
    }),
    types,
  );
  assert.deepEqual(Object.keys(bad).sort(), [
    'email',
    'firstName',
    'phone',
    'relationOther',
  ]);

  assert.deepEqual(
    Object.keys(validateStep(2, draft({ docs: { 'ขย.5': 'a.pdf' } }), types)),
    ['doc:ใบรับรองเดิม'],
  );
  assert.ok(validateStep(3, draft(), types).pledged);
  assert.deepEqual(validateStep(3, draft({ typeIds: [4] }), types), {});
});

const shop: Pharmacy = {
  id: 1,
  name: 'ร้าน',
  licenseNo: '',
  type: '',
  address: '',
  province: '',
  licensee: '',
  phone: '',
  certStatus: 'A',
  certExpires: '2026-12-31',
  hours: '',
  pharmacists: [],
};

const req = (status: RequestStatus, pharmacyId = 1) =>
  ({ id: 'r1', no: 'REN-6900013', pharmacyId, status }) as AccRequest;

test('งานที่รอร้านยา', () => {
  const today = new Date('2026-10-14');
  assert.equal(
    pharmacyTodos(shop, [req('need_docs')], today)[0].title,
    'ส่งเอกสารเพิ่มเติม',
  );
  assert.equal(
    pharmacyTodos(shop, [req('doc_review')], today)[0].href,
    '/requests/r1',
  );
  assert.equal(
    pharmacyTodos(shop, [req('approved')], today)[0].cta,
    'ยื่นต่ออายุ',
  );
  assert.match(
    pharmacyTodos({ ...shop, certExpires: '2026-10-01' }, [], today)[0].detail,
    /หมดอายุแล้ว/,
  );
  assert.deepEqual(
    pharmacyTodos({ ...shop, certExpires: '2027-12-31' }, [], today),
    [],
  );
  assert.equal(
    pharmacyTodos(
      { ...shop, certStatus: 'N', certExpires: undefined },
      [req('doc_review', 2)],
      today,
    )[0].cta,
    'ยื่นคำขอ',
  );
});
```

- [ ] **Step 5: รันเทสต์ให้ fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '...requestRules.ts'`

- [ ] **Step 6: เขียน `src/lib/requestRules.ts`**

```ts
// กฎของคำขอรับรอง — pure function ไม่มี import ที่เป็นค่า (type ถูกลบตอนรัน)
// จึงรันเทสต์ด้วย node --test ได้ตรง ๆ
import type {
  AccRequest,
  Pharmacy,
  RequestDraft,
  RequestStatus,
  RequestType,
} from '@/types/api';

/** ประเภทหลัก — เลือกได้ทีละ 1 (ระบบเดิม: chkType1/7/2 ล้างกันเองใน CheckedChanged) */
export const MAIN_TYPE_IDS = [1, 7, 2];
/** ประเภทเปลี่ยนแปลง — เลือกได้หลายข้อ และเลือกคู่กับประเภทหลักได้ */
export const CHANGE_TYPE_IDS = [3, 4, 5, 6, 8];

/** สถานะที่จบแล้ว — นอกจากนี้ถือว่าคำขอยังค้าง (Request_GetStatusAlive) */
const CLOSED: RequestStatus[] = ['approved', 'rejected', 'cancelled'];

export const isAlive = (s: RequestStatus) => !CLOSED.includes(s);

export const mainTypeOf = (typeIds: number[]) =>
  typeIds.find((t) => MAIN_TYPE_IDS.includes(t)) ?? null;

export function setMainType(typeIds: number[], id: number | null): number[] {
  const rest = typeIds.filter((t) => !MAIN_TYPE_IDS.includes(t));
  return id === null ? rest : [id, ...rest];
}

export function toggleChangeType(typeIds: number[], id: number): number[] {
  return typeIds.includes(id)
    ? typeIds.filter((t) => t !== id)
    : [...typeIds, id];
}

/** คำรับรองบังคับเฉพาะคำขอรับรอง/ต่ออายุ (Request.aspx.vb cmdSave_Click) */
export const needsPledge = (typeIds: number[]) => mainTypeOf(typeIds) !== null;

export function requiredDocs(typeIds: number[], types: RequestType[]) {
  const docs = types
    .filter((t) => typeIds.includes(t.id))
    .flatMap((t) => t.docs);
  return [...new Set(docs)];
}

/** เลขคำขอ running ต่อเนื่องทั้งระบบภายในปี พ.ศ. เดียวกัน เช่น REN-6900013 */
export function nextRequestNo(
  typeIds: number[],
  existingNos: string[],
  today: Date,
): string {
  const main = mainTypeOf(typeIds);
  const prefix = main === 2 ? 'REN' : main ? 'NEW' : 'CHG';
  const yy = String((today.getFullYear() + 543) % 100).padStart(2, '0');
  const seqs = existingNos
    .map((no) => no.split('-')[1] ?? '')
    .filter((n) => n.startsWith(yy))
    .map((n) => Number(n.slice(2)));
  const next = Math.max(0, ...seqs) + 1;
  return `${prefix}-${yy}${String(next).padStart(5, '0')}`;
}

export type StepErrors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^0\d{8,9}$/;

/** ตรวจขั้นที่ step (0 ประเภท · 1 ผู้ยื่น · 2 เอกสาร · 3 ยืนยัน) คืน {} ถ้าผ่าน */
export function validateStep(
  step: number,
  d: RequestDraft,
  types: RequestType[],
): StepErrors {
  const e: StepErrors = {};
  if (step === 0 && d.typeIds.length === 0)
    e.typeIds = 'เลือกประเภทคำขออย่างน้อย 1 ข้อ';
  if (step === 1) {
    const a = d.applicant;
    if (!a.firstName.trim()) e.firstName = 'กรอกชื่อ';
    if (!a.lastName.trim()) e.lastName = 'กรอกนามสกุล';
    if (!EMAIL.test(a.email.trim())) e.email = 'อีเมลไม่ถูกต้อง';
    if (!PHONE.test(a.phone.replace(/[-\s]/g, '')))
      e.phone = 'เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9–10 หลัก';
    if (!a.relation) e.relation = 'เลือกความเกี่ยวข้องกับร้านยา';
    else if (a.relation === 9 && !a.relationOther.trim())
      e.relationOther = 'ระบุความเกี่ยวข้อง';
  }
  if (step === 2)
    for (const doc of requiredDocs(d.typeIds, types))
      if (!d.docs[doc]) e[`doc:${doc}`] = 'แนบไฟล์นี้';
  if (step === 3 && needsPledge(d.typeIds) && !d.pledged)
    e.pledged = 'ต้องรับทราบและให้คำรับรองก่อนส่งคำขอ';
  return e;
}

export interface Todo {
  tone: 'warning' | 'info';
  title: string;
  detail: string;
  href: string;
  cta: string;
  status?: RequestStatus;
}

const DAY = 86_400_000;

/** งานที่ร้านยาต้องทำต่อ — แสดงบนหน้าแรก (หลักการ UX ข้อ 1) */
export function pharmacyTodos(
  p: Pharmacy,
  reqs: AccRequest[],
  today: Date,
): Todo[] {
  const alive = reqs.find((r) => r.pharmacyId === p.id && isAlive(r.status));
  if (alive?.status === 'need_docs')
    return [
      {
        tone: 'warning',
        title: 'ส่งเอกสารเพิ่มเติม',
        detail: `คำขอ ${alive.no} ถูกขอเอกสารเพิ่ม`,
        href: `/requests/${alive.id}`,
        cta: 'ดูรายละเอียด',
        status: alive.status,
      },
    ];
  if (alive)
    return [
      {
        tone: 'info',
        title: 'คำขออยู่ระหว่างดำเนินการ',
        detail: `คำขอ ${alive.no}`,
        href: `/requests/${alive.id}`,
        cta: 'ติดตามสถานะ',
        status: alive.status,
      },
    ];
  if (p.certStatus === 'A' && p.certExpires) {
    const days = Math.ceil((Date.parse(p.certExpires) - today.getTime()) / DAY);
    if (days > 90) return [];
    return [
      {
        tone: 'warning',
        title: 'ใบรับรองใกล้หมดอายุ',
        detail:
          days < 0
            ? `หมดอายุแล้วเมื่อ ${p.certExpires}`
            : `หมดอายุในอีก ${days} วัน (${p.certExpires})`,
        href: '/requests/new',
        cta: 'ยื่นต่ออายุ',
      },
    ];
  }
  return [
    {
      tone: 'info',
      title:
        p.certStatus === 'N'
          ? 'ร้านยังไม่ได้รับการรับรอง'
          : 'ใบรับรองหมดอายุหรือถูกยกเลิก',
      detail: 'ยื่นคำขอรับรองร้านยาคุณภาพได้เลย',
      href: '/requests/new',
      cta: 'ยื่นคำขอ',
    },
  ];
}
```

- [ ] **Step 7: รันเทสต์ให้ผ่าน**

Run: `npm test`
Expected: PASS — `tests 8`, `pass 8`, `fail 0`

- [ ] **Step 8: ตรวจ type และ lint**

Run: `npx tsc --noEmit; npm run lint`
Expected: ไม่มี error

- [ ] **Step 9: Commit (ถ้ามี git)**

```bash
git add tsconfig.json package.json src/types/api.ts src/lib/constants.ts src/lib/requestRules.ts src/lib/requestRules.test.ts
git commit -m "feat(f1): request types, constants and rules with tests"
```

---

### Task 2: Mock data และ api

**Files:**
- Modify: `src/mock/index.ts` (แก้บรรทัด import และต่อท้ายไฟล์)
- Modify: `src/lib/api.ts` (เขียนใหม่ทั้งไฟล์)

**Interfaces:**
- Consumes: types และ `requestTypes` จาก Task 1, `isAlive`, `nextRequestNo`, `requiredDocs` จาก `requestRules`
- Produces:
  - `api.pharmacies.list(): Promise<Pharmacy[]>`
  - `api.pharmacies.get(id: number): Promise<Pharmacy | null>`
  - `api.requests.list(filter?: { pharmacyId?: number }): Promise<AccRequest[]>` เรียงใหม่สุดก่อน
  - `api.requests.create(draft: RequestDraft, pharmacyId: number): Promise<AccRequest>` throw `Error` ถ้าร้านมีคำขอค้าง
  - `api.fda.lookup(licenseNo: string): Promise<Registration | null>`
  - `api.registrations.create(input: Registration): Promise<{ success: true }>`
  - mock: `pharmacies: Pharmacy[]` (id 1–5), `seedRequests: AccRequest[]`

- [ ] **Step 1: แก้บรรทัด import บนสุดของ `src/mock/index.ts`**

แทนที่:

```ts
import type { User, UserRole } from '@/types/api';
```

ด้วย:

```ts
import type {
  AccRequest,
  Applicant,
  ApplicantRelation,
  Pharmacy,
  User,
  UserRole,
} from '@/types/api';
```

- [ ] **Step 2: ต่อท้าย `src/mock/index.ts`**

```ts
/** ร้านยาตัวอย่าง — id 1 ผูกกับบัญชี pharm001 */
export const pharmacies: Pharmacy[] = [
  {
    id: 1,
    name: 'ร้านยาสุขภาพดี สาขาบางนา',
    licenseNo: 'กท.101/2560',
    qualityNo: 'QP-2566-0101',
    type: 'ร้านยาเครือข่าย (Chain)',
    address: '12/3 ถ.บางนา-ตราด แขวงบางนา เขตบางนา',
    province: 'กรุงเทพมหานคร',
    licensee: 'บริษัท สุขภาพดี จำกัด',
    phone: '02-000-1001',
    certStatus: 'A',
    certIssued: '2023-12-31',
    certExpires: '2026-12-31',
    hours: 'ทุกวัน 08:00–21:00',
    pharmacists: [
      {
        name: 'ภก.สมชาย ใจดี',
        license: 'ภ.12345',
        role: 'ผู้มีหน้าที่ปฏิบัติการ',
        hours: '08:00–17:00',
      },
      {
        name: 'ภญ.ศิริพร งามดี',
        license: 'ภ.23456',
        role: 'ผู้มีหน้าที่ปฏิบัติการ',
        hours: '13:00–21:00',
      },
    ],
  },
  {
    id: 2,
    name: 'ร้านยาเภสัชรักษ์',
    licenseNo: 'นบ.55/2562',
    type: 'ร้านยาเดี่ยว',
    address: '88 ถ.รัตนาธิเบศร์ ต.บางกระสอ อ.เมือง',
    province: 'นนทบุรี',
    licensee: 'ภญ.อรุณี มีสุข',
    phone: '02-000-1002',
    certStatus: 'N',
    hours: 'ทุกวัน 09:00–20:00',
    pharmacists: [
      {
        name: 'ภญ.อรุณี มีสุข',
        license: 'ภ.34567',
        role: 'ผู้มีหน้าที่ปฏิบัติการ',
        hours: '09:00–20:00',
      },
    ],
  },
  {
    id: 3,
    name: 'ร้านยาดอยคำเภสัช',
    licenseNo: 'ชม.302/2561',
    qualityNo: 'QP-2565-0311',
    type: 'ร้านยาเดี่ยว',
    address: '9 ถ.นิมมานเหมินท์ ต.สุเทพ อ.เมือง',
    province: 'เชียงใหม่',
    licensee: 'ภก.อนันต์ ดอยคำ',
    phone: '053-000-104',
    certStatus: 'E',
    certIssued: '2022-11-15',
    certExpires: '2025-11-14',
    hours: 'ทุกวัน 09:00–21:00',
    pharmacists: [
      {
        name: 'ภก.อนันต์ ดอยคำ',
        license: 'ภ.56789',
        role: 'ผู้มีหน้าที่ปฏิบัติการ',
        hours: '09:00–21:00',
      },
    ],
  },
  {
    id: 4,
    name: 'ร้านยาขอนแก่นฟาร์มา',
    licenseNo: 'ขก.77/2563',
    type: 'ร้านยาเดี่ยว',
    address: '200 ถ.มิตรภาพ ต.ในเมือง อ.เมือง',
    province: 'ขอนแก่น',
    licensee: 'ภญ.สุนิสา แก่นใจ',
    phone: '043-000-105',
    certStatus: 'N',
    hours: 'ทุกวัน 08:30–20:30',
    pharmacists: [
      {
        name: 'ภญ.สุนิสา แก่นใจ',
        license: 'ภ.67890',
        role: 'ผู้มีหน้าที่ปฏิบัติการ',
        hours: '08:30–20:30',
      },
    ],
  },
  {
    id: 5,
    name: 'ร้านยาใกล้บ้าน รังสิต',
    licenseNo: 'ปท.21/2558',
    qualityNo: 'QP-2563-0450',
    type: 'ร้านยาเครือข่าย (Chain)',
    address: '45 ถ.พหลโยธิน ต.ประชาธิปัตย์ อ.ธัญบุรี',
    province: 'ปทุมธานี',
    licensee: 'บริษัท ใกล้บ้าน จำกัด',
    phone: '02-000-1003',
    certStatus: 'A',
    certIssued: '2024-05-10',
    certExpires: '2027-05-09',
    hours: 'ทุกวัน 08:00–22:00',
    pharmacists: [
      {
        name: 'ภก.วิทยา รอบรู้',
        license: 'ภ.45678',
        role: 'ผู้มีหน้าที่ปฏิบัติการ',
        hours: '08:00–16:00',
      },
    ],
  },
];

const applicant = (
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  relation: ApplicantRelation,
): Applicant => ({
  firstName,
  lastName,
  email,
  phone,
  lineId: '',
  relation,
  relationOther: '',
});

/** คำขอตั้งต้น — คำขอที่ยื่นระหว่าง demo เก็บต่อใน sessionStorage (ดู lib/api.ts) */
export const seedRequests: AccRequest[] = [
  {
    id: 'r1',
    no: 'NEW-6900012',
    pharmacyId: 2,
    typeIds: [1],
    submittedAt: '2026-09-02T10:15:00',
    status: 'doc_review',
    applicant: applicant('อรุณี', 'มีสุข', 'arunee@example.com', '0810000002', 1),
    docs: [
      {
        name: 'ขย5-เภสัชรักษ์.pdf',
        type: 'สำเนาใบอนุญาตขายยา (ขย.5)',
        uploadedAt: '2026-09-02',
      },
    ],
    messages: [
      {
        from: 'ระบบ',
        at: '2026-09-02T10:15:00',
        text: 'ได้รับคำขอแล้ว',
        status: 'submitted',
      },
      {
        from: 'พิมพ์ใจ บริหาร',
        at: '2026-09-04T09:00:00',
        text: 'อยู่ระหว่างการดำเนินการตรวจสอบเอกสาร',
        status: 'doc_review',
      },
    ],
  },
  {
    id: 'r2',
    no: 'NEW-6900009',
    pharmacyId: 4,
    typeIds: [7],
    submittedAt: '2026-08-11T09:40:00',
    status: 'need_docs',
    applicant: applicant('สุนิสา', 'แก่นใจ', 'sunisa@example.com', '0810000004', 2),
    docs: [],
    messages: [
      {
        from: 'พิมพ์ใจ บริหาร',
        at: '2026-08-15T10:00:00',
        text: 'กรุณาส่งเอกสารเพิ่มเติม ดังนี้ 1) แผนผังร้าน 2) ภาพถ่ายบริเวณจ่ายยา',
        status: 'need_docs',
      },
    ],
  },
  {
    id: 'r3',
    no: 'REN-6900002',
    pharmacyId: 3,
    typeIds: [2, 8],
    submittedAt: '2026-05-18T16:46:00',
    status: 'committee',
    applicant: applicant('อนันต์', 'ดอยคำ', 'anan@example.com', '0810000003', 1),
    docs: [],
    messages: [
      {
        from: 'พิมพ์ใจ บริหาร',
        at: '2026-08-01T09:00:00',
        text: 'สรร. ได้ตรวจประเมินเรียบร้อยแล้ว อยู่ระหว่างยื่นคณะกรรมการรับรอง',
        status: 'committee',
      },
    ],
  },
  {
    id: 'r4',
    no: 'CHG-6900003',
    pharmacyId: 5,
    typeIds: [6],
    submittedAt: '2026-03-14T10:00:00',
    status: 'cancelled',
    applicant: applicant('วิทยา', 'รอบรู้', 'wittaya@example.com', '0810000005', 3),
    docs: [],
    messages: [
      {
        from: 'วิทยา รอบรู้',
        at: '2026-03-20T09:00:00',
        text: 'ขอยกเลิกคำขอ',
        status: 'cancelled',
      },
    ],
  },
  {
    id: 'r5',
    no: 'REN-6600031',
    pharmacyId: 1,
    typeIds: [2],
    submittedAt: '2023-06-20T14:00:00',
    status: 'approved',
    applicant: applicant('สมชาย', 'ใจดี', 'somchai@example.com', '0810000001', 3),
    docs: [],
    messages: [
      {
        from: 'พิมพ์ใจ บริหาร',
        at: '2023-12-20T10:00:00',
        text: 'ผ่านคณะกรรมการรับรองแล้ว',
        status: 'approved',
      },
    ],
  },
];
```

- [ ] **Step 3: เขียน `src/lib/api.ts` ใหม่ทั้งไฟล์**

```ts
// จุดเดียวที่ดึงข้อมูล — PoC คืนค่าจาก mock
// ตอนต่อ backend ให้แก้แค่ไฟล์นี้เป็น fetch(`${process.env.NEXT_PUBLIC_API_URL}/...`)
import type {
  AccRequest,
  LoginResponse,
  Pharmacy,
  Registration,
  RequestDraft,
} from '@/types/api';
import { pharmacies, seedRequests, users } from '@/mock';
import { requestTypes } from '@/lib/constants';
import { isAlive, nextRequestNo, requiredDocs } from '@/lib/requestRules';

// PoC: คำขอที่ยื่นระหว่าง demo เก็บใน sessionStorage ของแท็บ
// สลับ role ผ่าน "Demo role" ในแท็บเดียวกันแล้วเห็นข้อมูลชุดเดียวกัน
const REQUESTS_KEY = 'accpharm_requests';

function loadRequests(): AccRequest[] {
  try {
    const stored = sessionStorage.getItem(REQUESTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // sessionStorage ใช้ไม่ได้หรือข้อมูลเสีย — กลับไปใช้ seed
  }
  return seedRequests;
}

function saveRequests(list: AccRequest[]) {
  try {
    sessionStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
  } catch {
    // PoC: บันทึกไม่ได้ก็ยังใช้งานต่อได้ แค่ข้อมูลไม่คงอยู่
  }
}

export const api = {
  auth: {
    // PoC: ไม่ตรวจรหัสผ่าน — ระบบจริงตรวจที่ API แล้วคืน JWT
    async login({ username }: { username: string }): Promise<LoginResponse> {
      const user = users.find((u) => u.username === username.trim());
      if (!user) return { success: false, error: 'ไม่พบชื่อผู้ใช้นี้' };
      return { success: true, user, token: `mock-${user.id}` };
    },
  },

  pharmacies: {
    async list(): Promise<Pharmacy[]> {
      return pharmacies;
    },
    async get(id: number): Promise<Pharmacy | null> {
      return pharmacies.find((p) => p.id === id) ?? null;
    },
  },

  requests: {
    /** เรียงใหม่สุดก่อน */
    async list(filter: { pharmacyId?: number } = {}): Promise<AccRequest[]> {
      return loadRequests()
        .filter((r) => !filter.pharmacyId || r.pharmacyId === filter.pharmacyId)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    },

    async create(draft: RequestDraft, pharmacyId: number): Promise<AccRequest> {
      const all = loadRequests();
      if (all.some((r) => r.pharmacyId === pharmacyId && isAlive(r.status)))
        throw new Error('ร้านนี้มีคำขอที่กำลังดำเนินการอยู่');
      const now = new Date();
      const at = now.toISOString().slice(0, 19);
      const req: AccRequest = {
        id: `r${now.getTime()}`,
        no: nextRequestNo(
          draft.typeIds,
          all.map((r) => r.no),
          now,
        ),
        pharmacyId,
        typeIds: draft.typeIds,
        changeMode: draft.typeIds.includes(5) ? draft.changeMode : undefined,
        submittedAt: at,
        status: 'submitted',
        applicant: draft.applicant,
        // เก็บเฉพาะเอกสารที่ประเภทคำขอปัจจุบันต้องใช้ (ร่างอาจมีไฟล์ค้างจากประเภทที่เลือกออกไปแล้ว)
        docs: requiredDocs(draft.typeIds, requestTypes)
          .filter((type) => draft.docs[type])
          .map((type) => ({
            type,
            name: draft.docs[type],
            uploadedAt: at.slice(0, 10),
          })),
        messages: [
          { from: 'ระบบ', at, text: 'ได้รับคำขอแล้ว', status: 'submitted' },
        ],
      };
      saveRequests([req, ...all]);
      return req;
    },
  },

  fda: {
    // PoC: ระบบเดิมเรียก SOAP ของ อย. — ที่นี่คืนข้อมูลตัวอย่างเมื่อรูปแบบเลขถูกต้อง
    async lookup(licenseNo: string): Promise<Registration | null> {
      const no = licenseNo.trim();
      if (!/^[ก-๙]{2,3}\.\s?\d+\/\d{4}$/.test(no)) return null;
      return {
        licenseNo: no,
        name: 'ร้านยาตัวอย่าง',
        address: '1 ถ.ตัวอย่าง ต.ตัวอย่าง อ.เมือง',
        province: 'นนทบุรี',
        licensee: 'ภก.ตัวอย่าง ทดลอง',
        operator: 'ภก.ตัวอย่าง ทดลอง',
        operatorLicense: 'ภ.00000',
        phone: '',
        email: '',
      };
    },
  },

  registrations: {
    // PoC: ไม่บันทึกจริง — ระบบจริงส่งให้ สรร. อนุมัติ (RegisterList)
    async create(input: Registration): Promise<{ success: true }> {
      void input;
      return { success: true };
    },
  },
};
```

- [ ] **Step 4: ตรวจ type, lint และเทสต์เดิม**

Run: `npx tsc --noEmit; npm run lint; npm test`
Expected: ไม่มี error, เทสต์ผ่าน 8/8

- [ ] **Step 5: Commit (ถ้ามี git)**

```bash
git add src/mock/index.ts src/lib/api.ts
git commit -m "feat(f1): pharmacy and request mock data behind api"
```

---

### Task 3: หน้ารายการคำขอ `/requests` + `StatusBadge`

**Files:**
- Create: `src/components/common/StatusBadge.tsx`
- Create: `src/app/requests/page.tsx`

**Interfaces:**
- Consumes: `api.requests.list`, `api.pharmacies.list`, `requestStatusLabels`, `certStatusLabels`, `requestTypes`, `isAlive`, `useAuth()` (`user`, `user.role`, `user.pharmacyId`)
- Produces: `StatusBadge({ status }: { status: RequestStatus })`, `CertBadge({ status }: { status: CertStatus })`

- [ ] **Step 1: สร้าง `src/components/common/StatusBadge.tsx`**

```tsx
import type { CertStatus, RequestStatus } from '@/types/api';
import { certStatusLabels, requestStatusLabels } from '@/lib/constants';

const requestTone: Record<RequestStatus, string> = {
  submitted: 'badge-info',
  doc_review: 'badge-info',
  need_docs: 'badge-warning',
  assigned: 'badge-info',
  assessed: 'badge-warning',
  committee: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-error',
  cancelled: 'bg-zinc-100 text-zinc-500',
};

const certTone: Record<CertStatus, string> = {
  N: 'badge-info',
  A: 'badge-success',
  E: 'badge-warning',
  X: 'badge-error',
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`badge ${requestTone[status]}`}>
      {requestStatusLabels[status]}
    </span>
  );
}

export function CertBadge({ status }: { status: CertStatus }) {
  return (
    <span className={`badge ${certTone[status]}`}>
      {certStatusLabels[status]}
    </span>
  );
}
```

- [ ] **Step 2: สร้าง `src/app/requests/page.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IconFilePlus, IconSearch } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { requestTypes } from '@/lib/constants';
import { isAlive } from '@/lib/requestRules';
import type { AccRequest, Pharmacy, RequestStatus } from '@/types/api';

const groups: {
  key: string;
  label: string;
  match: (s: RequestStatus) => boolean;
}[] = [
  { key: 'all', label: 'ทั้งหมด', match: () => true },
  {
    key: 'active',
    label: 'กำลังดำเนินการ',
    match: (s) => isAlive(s) && s !== 'need_docs',
  },
  {
    key: 'need_docs',
    label: 'ต้องส่งเอกสารเพิ่ม',
    match: (s) => s === 'need_docs',
  },
  { key: 'closed', label: 'เสร็จสิ้น', match: (s) => !isAlive(s) },
];

const typeText = (ids: number[]) =>
  ids.map((id) => requestTypes.find((t) => t.id === id)?.label).join(', ');

const dateText = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });

export default function RequestsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AccRequest[] | null>(null);
  const [shops, setShops] = useState<Record<number, Pharmacy>>({});
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('all');
  const isPharmacy = user?.role === 'pharmacy';

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.requests.list(isPharmacy ? { pharmacyId: user.pharmacyId } : {}),
      api.pharmacies.list(),
    ]).then(([reqs, list]) => {
      setRows(reqs);
      setShops(Object.fromEntries(list.map((p) => [p.id, p])));
    });
  }, [user, isPharmacy]);

  const all = rows ?? [];
  const match = groups.find((g) => g.key === group)!.match;
  const term = q.trim().toLowerCase();
  const visible = all.filter(
    (r) =>
      match(r.status) &&
      (!term ||
        r.no.toLowerCase().includes(term) ||
        shops[r.pharmacyId]?.name.toLowerCase().includes(term)),
  );

  return (
    <AdminLayout title="คำขอรับรอง">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">คำขอรับรอง</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            {isPharmacy
              ? 'คำขอทั้งหมดของร้านคุณ'
              : 'คำขอจากร้านยาทุกร้าน'}
          </p>
        </div>
        {isPharmacy && (
          <Link href="/requests/new" className="btn-primary gap-2">
            <IconFilePlus size={18} stroke={1.75} />
            ยื่นคำขอใหม่
          </Link>
        )}
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:p-5 border-b border-zinc-100">
          <div className="relative">
            <IconSearch
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--ink-tertiary)' }}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input-field !pl-10"
              placeholder={
                isPharmacy ? 'ค้นหาเลขที่คำขอ' : 'ค้นหาเลขที่คำขอหรือชื่อร้าน'
              }
              aria-label="ค้นหาคำขอ"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => {
              const on = g.key === group;
              return (
                <button
                  key={g.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setGroup(g.key)}
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors"
                  style={
                    on
                      ? {
                          background: 'var(--accent-soft)',
                          borderColor: 'var(--accent)',
                          color: 'var(--accent)',
                        }
                      : {
                          borderColor: 'var(--border)',
                          color: 'var(--ink-secondary)',
                        }
                  }
                >
                  {g.label} ({all.filter((r) => g.match(r.status)).length})
                </button>
              );
            })}
          </div>
        </div>

        {rows && visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold">ไม่พบคำขอ</p>
            <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
              {all.length === 0 && isPharmacy
                ? 'ร้านคุณยังไม่เคยยื่นคำขอ'
                : 'ลองเปลี่ยนคำค้นหรือตัวกรอง'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>เลขที่คำขอ</th>
                    {!isPharmacy && <th>ร้านยา</th>}
                    <th>ประเภท</th>
                    <th>วันที่ยื่น</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link
                          href={`/requests/${r.id}`}
                          className="font-mono font-semibold hover:underline"
                          style={{ color: 'var(--accent)' }}
                        >
                          {r.no}
                        </Link>
                      </td>
                      {!isPharmacy && (
                        <td className="!text-zinc-800 font-medium">
                          {shops[r.pharmacyId]?.name}
                        </td>
                      )}
                      <td>{typeText(r.typeIds)}</td>
                      <td>{dateText(r.submittedAt)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="md:hidden divide-y divide-zinc-100">
              {visible.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/requests/${r.id}`}
                    className="block px-4 py-4 hover:bg-zinc-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-mono text-sm font-semibold">
                        {r.no}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    {!isPharmacy && (
                      <p className="mt-1 text-sm font-medium">
                        {shops[r.pharmacyId]?.name}
                      </p>
                    )}
                    <p
                      className="mt-1 text-xs"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {typeText(r.typeIds)} · {dateText(r.submittedAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 3: ตรวจ type และ lint**

Run: `npx tsc --noEmit; npm run lint`
Expected: ไม่มี error (ถ้า lint เตือน `react-hooks/set-state-in-effect` ให้ใส่ `/* eslint-disable react-hooks/set-state-in-effect */` บรรทัดที่ 3 แบบเดียวกับ `src/contexts/AuthContext.tsx`)

- [ ] **Step 4: ตรวจในเบราว์เซอร์**

Run: `npm run dev` แล้วเปิด `http://localhost:3001/login`
- login `pharm001` → เมนู "คำขอรับรอง" → เห็นคำขอ 1 รายการ (`REN-6600031`, ผ่านการรับรอง) ไม่มีคอลัมน์ร้านยา มีปุ่ม "ยื่นคำขอใหม่"
- chip "เสร็จสิ้น (1)" กดแล้วยังเห็นรายการ, chip "กำลังดำเนินการ (0)" → "ไม่พบคำขอ"
- สลับ Demo role เป็น admin → เห็น 5 รายการ มีคอลัมน์ร้านยา ไม่มีปุ่มยื่นคำขอ, พิมพ์ "ขอนแก่น" → เหลือ `NEW-6900009`
- ปรับความกว้าง 375px → เป็น card ไม่มี scroll แนวนอน

- [ ] **Step 5: Commit (ถ้ามี git)**

```bash
git add src/components/common/StatusBadge.tsx src/app/requests/page.tsx
git commit -m "feat(f1): request list with search and status chips"
```

---

### Task 4: Stepper ยื่นคำขอ `/requests/new`

**Files:**
- Create: `src/components/common/Stepper.tsx`
- Create: `src/components/common/Field.tsx`
- Create: `src/app/requests/new/steps.tsx`
- Create: `src/app/requests/new/page.tsx`

**Interfaces:**
- Consumes: `api.requests.list`, `api.requests.create`, `requestTypes`, `relationLabels`, `pledgeItems`, `pledgeWarning`, rules จาก Task 1, `StatusBadge`
- Produces:
  - `Stepper({ steps, current }: { steps: string[]; current: number })`
  - `Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor?: string; error?: string; hint?: string; children: React.ReactNode })`
  - `TypeStep`, `ApplicantStep`, `DocsStep`, `ReviewStep` รับ `StepProps = { draft: RequestDraft; update: (patch: Partial<RequestDraft>) => void; errors: StepErrors }`

- [ ] **Step 1: สร้าง `src/components/common/Stepper.tsx`**

```tsx
import { IconCheck } from '@tabler/icons-react';

/** แถบขั้นตอนของฟอร์มยาว — บนมือถือแสดงชื่อเฉพาะขั้นปัจจุบัน */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
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
```

- [ ] **Step 2: สร้าง `src/components/common/Field.tsx`**

```tsx
/** label + ช่องกรอก + error ใต้ช่อง (หลักการ UX ข้อ 5) */
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
        <p className="mt-1 text-xs" style={{ color: 'var(--ink-tertiary)' }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** class ของ input ตามสถานะ error */
export const inputClass = (error?: string) =>
  `input-field ${error ? '!border-red-500' : ''}`;
```

- [ ] **Step 3: สร้าง `src/app/requests/new/steps.tsx`**

```tsx
'use client';

import { IconCircleCheckFilled, IconCircleDashed } from '@tabler/icons-react';
import { Field, inputClass } from '@/components/common/Field';
import {
  pledgeItems,
  pledgeWarning,
  relationLabels,
  requestTypes,
} from '@/lib/constants';
import {
  CHANGE_TYPE_IDS,
  MAIN_TYPE_IDS,
  mainTypeOf,
  needsPledge,
  requiredDocs,
  setMainType,
  toggleChangeType,
  type StepErrors,
} from '@/lib/requestRules';
import type { Applicant, ApplicantRelation, RequestDraft } from '@/types/api';

export interface StepProps {
  draft: RequestDraft;
  update: (patch: Partial<RequestDraft>) => void;
  errors: StepErrors;
}

const typeById = (id: number) => requestTypes.find((t) => t.id === id)!;

const ErrorText = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="mt-2 text-xs" style={{ color: 'var(--danger)' }} role="alert">
      {msg}
    </p>
  ) : null;

const optionClass = (on: boolean) =>
  `flex gap-3 items-start rounded-xl border p-4 cursor-pointer transition-colors ${
    on
      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
      : 'border-[var(--border)] hover:border-zinc-300'
  }`;

const Muted = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm mb-3" style={{ color: 'var(--ink-secondary)' }}>
    {children}
  </p>
);

export function TypeStep({ draft, update, errors }: StepProps) {
  const main = mainTypeOf(draft.typeIds);
  const mainOptions = [
    ...MAIN_TYPE_IDS.map((id) => {
      const t = typeById(id);
      return { id: t.id as number | null, label: t.label, hint: t.hint };
    }),
    {
      id: null,
      label: 'ไม่ขอรับรองหรือต่ออายุ',
      hint: 'แจ้งเปลี่ยนแปลงข้อมูลร้านอย่างเดียว',
    },
  ];

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="font-bold mb-1">ขอรับรองหรือต่ออายุ</legend>
        <Muted>เลือกได้ 1 ข้อ</Muted>
        <div className="grid gap-2">
          {mainOptions.map((o) => (
            <label key={o.id ?? 0} className={optionClass(main === o.id)}>
              <input
                type="radio"
                name="mainType"
                className="mt-1 accent-[var(--accent)]"
                checked={main === o.id}
                onChange={() =>
                  update({ typeIds: setMainType(draft.typeIds, o.id) })
                }
              />
              <span>
                <span className="block text-sm font-semibold">{o.label}</span>
                <span
                  className="block text-xs mt-0.5"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  {o.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-bold mb-1">แจ้งเปลี่ยนแปลงข้อมูลร้าน</legend>
        <Muted>เลือกได้หลายข้อ หรือไม่เลือกเลยก็ได้</Muted>
        <div className="grid gap-2">
          {CHANGE_TYPE_IDS.map(typeById).map((t) => {
            const on = draft.typeIds.includes(t.id);
            return (
              <div key={t.id}>
                <label className={optionClass(on)}>
                  <input
                    type="checkbox"
                    className="mt-1 accent-[var(--accent)]"
                    checked={on}
                    onChange={() =>
                      update({ typeIds: toggleChangeType(draft.typeIds, t.id) })
                    }
                  />
                  <span>
                    <span className="block text-sm font-semibold">{t.label}</span>
                    <span
                      className="block text-xs mt-0.5"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {t.hint}
                    </span>
                  </span>
                </label>
                {t.id === 5 && on && (
                  <div className="flex flex-wrap gap-x-6 gap-y-2 px-4 py-3 text-sm">
                    {(
                      [
                        [1, 'จากบุคคล เป็น บุคคล'],
                        [2, 'จากบุคคล เป็น นิติบุคคล/บริษัท'],
                      ] as const
                    ).map(([v, l]) => (
                      <label key={v} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="changeMode"
                          className="accent-[var(--accent)]"
                          checked={draft.changeMode === v}
                          onChange={() => update({ changeMode: v })}
                        />
                        {l}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <ErrorText msg={errors.typeIds} />
    </div>
  );
}

type TextKey = 'firstName' | 'lastName' | 'email' | 'phone' | 'lineId';

export function ApplicantStep({ draft, update, errors }: StepProps) {
  const a = draft.applicant;
  const set = (patch: Partial<Applicant>) =>
    update({ applicant: { ...a, ...patch } });

  const text = (
    key: TextKey,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <Field label={label} htmlFor={key} error={errors[key]}>
      <input
        id={key}
        className={inputClass(errors[key])}
        aria-invalid={!!errors[key]}
        value={a[key]}
        onChange={(e) => set({ [key]: e.target.value } as Partial<Applicant>)}
        {...props}
      />
    </Field>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {text('firstName', 'ชื่อ', { autoComplete: 'given-name' })}
        {text('lastName', 'นามสกุล', { autoComplete: 'family-name' })}
        {text('email', 'อีเมล', {
          type: 'email',
          autoComplete: 'email',
          placeholder: 'name@example.com',
        })}
        {text('phone', 'เบอร์โทร', {
          type: 'tel',
          autoComplete: 'tel',
          placeholder: '0812345678',
        })}
        {text('lineId', 'LINE ID (ถ้ามี)')}
      </div>

      <fieldset>
        <legend className="block text-[13px] font-semibold text-zinc-700 mb-2">
          ความเกี่ยวข้องกับร้านยา
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(relationLabels).map(([v, l]) => {
            const value = Number(v) as ApplicantRelation;
            return (
              <label key={v} className={optionClass(a.relation === value)}>
                <input
                  type="radio"
                  name="relation"
                  className="mt-1 accent-[var(--accent)]"
                  checked={a.relation === value}
                  onChange={() => set({ relation: value })}
                />
                <span className="text-sm">{l}</span>
              </label>
            );
          })}
        </div>
        <ErrorText msg={errors.relation} />
      </fieldset>

      {a.relation === 9 && (
        <Field
          label="ระบุความเกี่ยวข้อง"
          htmlFor="relationOther"
          error={errors.relationOther}
        >
          <input
            id="relationOther"
            className={inputClass(errors.relationOther)}
            aria-invalid={!!errors.relationOther}
            value={a.relationOther}
            onChange={(e) => set({ relationOther: e.target.value })}
          />
        </Field>
      )}
    </div>
  );
}

export function DocsStep({ draft, update, errors }: StepProps) {
  const docs = requiredDocs(draft.typeIds, requestTypes);
  return (
    <div className="space-y-4">
      <Muted>
        เอกสารที่ต้องแนบสำหรับคำขอนี้ {docs.length} รายการ รองรับไฟล์ PDF หรือรูปภาพ
      </Muted>
      <ul className="space-y-3">
        {docs.map((doc) => {
          const file = draft.docs[doc];
          const error = errors[`doc:${doc}`];
          return (
            <li
              key={doc}
              className="rounded-xl border p-4"
              style={{ borderColor: error ? 'var(--danger)' : 'var(--border)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {file ? (
                    <IconCircleCheckFilled
                      size={20}
                      className="shrink-0"
                      style={{ color: 'var(--accent)' }}
                    />
                  ) : (
                    <IconCircleDashed
                      size={20}
                      className="shrink-0"
                      style={{ color: 'var(--ink-faint)' }}
                    />
                  )}
                  <span className="text-sm font-medium">{doc}</span>
                </div>
                <label className="btn-secondary cursor-pointer !py-1.5 !px-4 !text-xs">
                  {file ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) update({ docs: { ...draft.docs, [doc]: f.name } });
                    }}
                  />
                </label>
              </div>
              {file && (
                <p
                  className="mt-2 pl-7 text-xs truncate"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  {file}
                </p>
              )}
              {error && (
                <p
                  className="mt-2 pl-7 text-xs"
                  style={{ color: 'var(--danger)' }}
                  role="alert"
                >
                  {error}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>
        ต้นแบบนี้เก็บเฉพาะชื่อไฟล์ ยังไม่อัปโหลดจริง
      </p>
    </div>
  );
}

export function ReviewStep({ draft, update, errors }: StepProps) {
  const a = draft.applicant;
  const rows: [string, string][] = [
    ['ประเภทคำขอ', draft.typeIds.map((id) => typeById(id).label).join(', ')],
    ['ผู้ยื่นคำขอ', `${a.firstName} ${a.lastName}`],
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
    [
      'เอกสาร',
      `${requiredDocs(draft.typeIds, requestTypes).length} รายการ`,
    ],
  ];

  return (
    <div className="space-y-6">
      <dl className="divide-y divide-zinc-100">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-3 sm:grid-cols-[160px_1fr]">
            <dt className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
              {k}
            </dt>
            <dd className="text-sm font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      {needsPledge(draft.typeIds) && (
        <div className="rounded-xl p-5" style={{ background: 'var(--bg)' }}>
          <h3 className="font-bold">คำรับรองของผู้ยื่นคำขอ</h3>
          <ol className="mt-3 space-y-1.5 text-sm list-decimal pl-5">
            {pledgeItems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs" style={{ color: 'var(--ink-secondary)' }}>
            {pledgeWarning}
          </p>
          <label className="mt-4 flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-[var(--accent)]"
              checked={draft.pledged}
              onChange={(e) => update({ pledged: e.target.checked })}
            />
            รับทราบและให้คำรับรอง
          </label>
          <ErrorText msg={errors.pledged} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: สร้าง `src/app/requests/new/page.tsx`**

```tsx
'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout';
import { Stepper } from '@/components/common/Stepper';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { requestTypes } from '@/lib/constants';
import { isAlive, validateStep, type StepErrors } from '@/lib/requestRules';
import type { AccRequest, RequestDraft } from '@/types/api';
import { ApplicantStep, DocsStep, ReviewStep, TypeStep } from './steps';

const STEPS = ['ประเภทคำขอ', 'ผู้ยื่นคำขอ', 'เอกสาร', 'ตรวจสอบและยืนยัน'];
const LAST = STEPS.length - 1;
const DRAFT_KEY = 'accpharm_request_draft';

const emptyDraft = (email: string): RequestDraft => ({
  typeIds: [],
  changeMode: 1,
  applicant: {
    firstName: '',
    lastName: '',
    email,
    phone: '',
    lineId: '',
    relation: null,
    relationOther: '',
  },
  docs: {},
  pledged: false,
});

export default function NewRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => emptyDraft(user?.email ?? ''));
  const [errors, setErrors] = useState<StepErrors>({});
  // undefined = กำลังโหลด, null = ไม่มีคำขอค้าง
  const [active, setActive] = useState<AccRequest | null | undefined>();
  const [restored, setRestored] = useState(false);
  const [saving, setSaving] = useState(false);

  // กู้ร่างจาก sessionStorage (อ่านหลัง mount เพื่อไม่ให้ hydration ไม่ตรง)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(DRAFT_KEY);
      if (stored) {
        const saved: RequestDraft = JSON.parse(stored);
        setDraft(saved);
        if (saved.typeIds.length > 0)
          toast('กู้คืนร่างที่บันทึกไว้แล้ว', { id: 'draft-restored' });
      }
    } catch {
      sessionStorage.removeItem(DRAFT_KEY);
    }
    setRestored(true);
  }, []);

  // บันทึกร่างอัตโนมัติทุกครั้งที่แก้
  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // บันทึกร่างไม่ได้ก็ยังกรอกต่อได้
    }
  }, [draft, restored]);

  useEffect(() => {
    if (!user?.pharmacyId) return;
    api.requests
      .list({ pharmacyId: user.pharmacyId })
      .then((list) => setActive(list.find((r) => isAlive(r.status)) ?? null));
  }, [user]);

  const update = (patch: Partial<RequestDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const check = () => {
    const e = validateStep(step, draft, requestTypes);
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goTo = (s: number) => {
    setStep(s);
    window.scrollTo({ top: 0 });
  };

  const submit = async () => {
    if (!check() || !user?.pharmacyId) return;
    setSaving(true);
    try {
      const req = await api.requests.create(draft, user.pharmacyId);
      sessionStorage.removeItem(DRAFT_KEY);
      toast.success(`ส่งคำขอ ${req.no} แล้ว`);
      router.push('/requests');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ส่งคำขอไม่สำเร็จ');
      setSaving(false);
    }
  };

  if (!user?.pharmacyId)
    return (
      <AdminLayout title="ยื่นคำขอรับรอง">
        <div className="card text-center py-12">
          <p className="font-semibold">ยื่นคำขอได้จากบัญชีร้านยาเท่านั้น</p>
          <Link href="/requests" className="btn-secondary mt-6">
            กลับไปรายการคำขอ
          </Link>
        </div>
      </AdminLayout>
    );

  if (active === undefined) return <AdminLayout title="ยื่นคำขอรับรอง">{null}</AdminLayout>;

  if (active)
    return (
      <AdminLayout title="ยื่นคำขอรับรอง">
        <div className="card max-w-xl">
          <h2 className="text-lg font-bold">มีคำขอที่กำลังดำเนินการอยู่</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="font-mono font-semibold">{active.no}</span>
            <StatusBadge status={active.status} />
          </div>
          <p className="mt-3 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            ยื่นคำขอใหม่ได้เมื่อคำขอนี้เสร็จสิ้นหรือถูกยกเลิก
          </p>
          <Link href={`/requests/${active.id}`} className="btn-primary mt-6">
            ดูคำขอนี้
          </Link>
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout title="ยื่นคำขอรับรอง">
      <div className="max-w-3xl">
        <Stepper steps={STEPS} current={step} />
        <div className="card">
          <h2 className="text-lg font-bold mb-5">{STEPS[step]}</h2>
          {step === 0 && <TypeStep draft={draft} update={update} errors={errors} />}
          {step === 1 && (
            <ApplicantStep draft={draft} update={update} errors={errors} />
          )}
          {step === 2 && <DocsStep draft={draft} update={update} errors={errors} />}
          {step === 3 && (
            <ReviewStep draft={draft} update={update} errors={errors} />
          )}

          <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-zinc-100">
            <button
              type="button"
              className="btn-secondary"
              disabled={step === 0}
              onClick={() => {
                setErrors({});
                goTo(step - 1);
              }}
            >
              ย้อนกลับ
            </button>
            {step < LAST ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (check()) goTo(step + 1);
                }}
              >
                ถัดไป
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                disabled={saving}
                onClick={submit}
              >
                {saving ? 'กำลังส่ง…' : 'ส่งคำขอ'}
              </button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--ink-tertiary)' }}>
          ระบบบันทึกร่างให้อัตโนมัติ ปิดหน้านี้แล้วกลับมาทำต่อได้
        </p>
      </div>
    </AdminLayout>
  );
}
```

หมายเหตุ: ไม่ใส่ modal ยืนยันตอนส่ง — ขั้น "ตรวจสอบและยืนยัน" ทำหน้าที่นั้นแล้ว และคำขอยังยกเลิกภายหลังได้ (สถานะ `cancelled`)

- [ ] **Step 5: ตรวจ type, lint และเทสต์**

Run: `npx tsc --noEmit; npm run lint; npm test`
Expected: ไม่มี error, เทสต์ผ่าน 8/8

- [ ] **Step 6: ตรวจในเบราว์เซอร์**

ใช้ dev server จาก Task 3 (ถ้าเคยยื่นคำขอไปแล้วในแท็บนั้น ให้ลบ `accpharm_requests` และ `accpharm_request_draft` ใน sessionStorage ก่อน)
- login `pharm001` → `/requests/new` → กด "ถัดไป" ทันที → เห็น "เลือกประเภทคำขออย่างน้อย 1 ข้อ"
- เลือก "ต่ออายุ" แล้วเลือก "ขอรับรองใหม่" → "ต่ออายุ" หลุดออกเอง; ติ๊ก "เปลี่ยนผู้ดำเนินกิจการ…" → เห็นตัวเลือกบุคคล/นิติบุคคล
- ขั้นผู้ยื่น: อีเมลเติมจากบัญชีแล้ว; ปล่อยชื่อว่าง ใส่เบอร์ "12" → error ใต้ช่องชื่อและเบอร์
- เลือก "อื่น ๆ" → มีช่องระบุ
- ขั้นเอกสาร: รายการตรงกับประเภทที่เลือก ไม่ซ้ำ; กด "ถัดไป" โดยไม่แนบ → กรอบแดงทุกรายการ; แนบครบ → ไปต่อได้
- รีโหลดหน้า → toast "กู้คืนร่างที่บันทึกไว้แล้ว" ข้อมูลยังอยู่ (กลับไปเริ่มขั้นที่ 1)
- ขั้นยืนยัน: กด "ส่งคำขอ" โดยไม่ติ๊กคำรับรอง → error; ติ๊กแล้วส่ง → toast `ส่งคำขอ NEW-6900013 แล้ว` และกลับไปรายการ เห็นคำขอใหม่สถานะ "รอดำเนินการ"
- เปิด `/requests/new` อีกครั้ง → เห็น "มีคำขอที่กำลังดำเนินการอยู่"
- สลับเป็น admin แล้วเปิด `/requests/new` → "ยื่นคำขอได้จากบัญชีร้านยาเท่านั้น"; ที่ `/requests` เห็นคำขอใหม่ 6 รายการ
- ทดสอบอีกรอบโดยเลือกแค่ประเภทเปลี่ยนแปลง → ขั้นยืนยันไม่มีคำรับรอง ส่งได้ เลขขึ้นต้น `CHG-`
- ความกว้าง 375px: stepper แสดงชื่อเฉพาะขั้นปัจจุบัน ไม่มี scroll แนวนอน

- [ ] **Step 7: Commit (ถ้ามี git)**

```bash
git add src/components/common/Stepper.tsx src/components/common/Field.tsx src/app/requests/new
git commit -m "feat(f1): 4-step request form with draft autosave"
```

---

### Task 5: ข้อมูลร้านของฉัน `/my-pharmacy`

**Files:**
- Create: `src/app/my-pharmacy/page.tsx`

**Interfaces:**
- Consumes: `api.pharmacies.get`, `CertBadge`, `useAuth()`
- Produces: ไม่มี

- [ ] **Step 1: สร้าง `src/app/my-pharmacy/page.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IconEdit } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { CertBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { Pharmacy } from '@/types/api';

const dateText = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-zinc-100">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr]">
          <dt className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            {k}
          </dt>
          <dd className="text-sm font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function MyPharmacyPage() {
  const { user } = useAuth();
  const [shop, setShop] = useState<Pharmacy | null>(null);

  useEffect(() => {
    if (user?.pharmacyId) api.pharmacies.get(user.pharmacyId).then(setShop);
  }, [user]);

  return (
    <AdminLayout title="ข้อมูลร้านของฉัน">
      {shop && (
        <div className="max-w-4xl space-y-6">
          <div className="card flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold tracking-tight">
                {shop.name}
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: 'var(--ink-secondary)' }}
              >
                ใบอนุญาต {shop.licenseNo} · {shop.province}
              </p>
              <div className="mt-3">
                <CertBadge status={shop.certStatus} />
              </div>
            </div>
            <Link href="/requests/new" className="btn-secondary gap-2">
              <IconEdit size={16} stroke={1.75} />
              ขอเปลี่ยนแปลงข้อมูล
            </Link>
          </div>

          <p className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>
            การแก้ไขข้อมูลร้านต้องยื่นเป็นคำขอเปลี่ยนแปลง เพื่อให้ สรร. ตรวจสอบก่อน
          </p>

          <section className="card">
            <h3 className="font-bold mb-2">การรับรอง</h3>
            <Rows
              rows={[
                ['เลขที่ใบรับรอง', shop.qualityNo ?? '-'],
                ['วันที่รับรอง', dateText(shop.certIssued)],
                ['วันหมดอายุ', dateText(shop.certExpires)],
              ]}
            />
          </section>

          <section className="card">
            <h3 className="font-bold mb-2">ข้อมูลร้าน</h3>
            <Rows
              rows={[
                ['ประเภทร้าน', shop.type],
                ['ที่ตั้ง', `${shop.address} จ.${shop.province}`],
                ['ผู้รับอนุญาต', shop.licensee],
                ['เบอร์โทร', shop.phone],
                ['เวลาทำการ', shop.hours],
              ]}
            />
          </section>

          <section className="card">
            <h3 className="font-bold mb-3">เภสัชกร</h3>
            <ul className="divide-y divide-zinc-100">
              {shop.pharmacists.map((p) => (
                <li
                  key={p.license}
                  className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {p.role} · {p.license}
                    </p>
                  </div>
                  <span className="text-sm">{p.hours}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
```

- [ ] **Step 2: ตรวจ type และ lint**

Run: `npx tsc --noEmit; npm run lint`
Expected: ไม่มี error

- [ ] **Step 3: ตรวจในเบราว์เซอร์**

- login `pharm001` → เมนู "ข้อมูลร้านของฉัน" → เห็น "ร้านยาสุขภาพดี สาขาบางนา", badge "รับรองแล้ว", วันหมดอายุ 31 ธันวาคม 2569, เภสัชกร 2 คน
- ปุ่ม "ขอเปลี่ยนแปลงข้อมูล" ไป `/requests/new`
- 375px ไม่มี scroll แนวนอน

- [ ] **Step 4: Commit (ถ้ามี git)**

```bash
git add src/app/my-pharmacy/page.tsx
git commit -m "feat(f1): my pharmacy page"
```

---

### Task 6: หน้าแรกของร้านยา — งานที่รอคุณ

**Files:**
- Create: `src/components/home/PharmacyHome.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `api.pharmacies.get`, `api.requests.list`, `pharmacyTodos`, `StatusBadge`, `requestTypes`
- Produces: `PharmacyHome({ pharmacyId }: { pharmacyId: number })`

- [ ] **Step 1: สร้าง `src/components/home/PharmacyHome.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
} from '@tabler/icons-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { api } from '@/lib/api';
import { requestTypes } from '@/lib/constants';
import { pharmacyTodos, type Todo } from '@/lib/requestRules';
import type { AccRequest } from '@/types/api';

const toneStyle: Record<Todo['tone'], { bg: string; fg: string }> = {
  warning: { bg: 'var(--warn-soft)', fg: 'var(--warn)' },
  info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
};

/** หน้าแรกของร้านยา: งานที่ต้องทำก่อน แล้วตามด้วยคำขอล่าสุด (หลักการ UX ข้อ 1) */
export function PharmacyHome({ pharmacyId }: { pharmacyId: number }) {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [recent, setRecent] = useState<AccRequest[]>([]);

  useEffect(() => {
    Promise.all([
      api.pharmacies.get(pharmacyId),
      api.requests.list({ pharmacyId }),
    ]).then(([shop, reqs]) => {
      setTodos(shop ? pharmacyTodos(shop, reqs, new Date()) : []);
      setRecent(reqs.slice(0, 3));
    });
  }, [pharmacyId]);

  if (!todos) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <section>
        <h3 className="font-bold tracking-tight mb-3">งานที่รอคุณ</h3>
        {todos.length === 0 ? (
          <div className="card flex items-center gap-3">
            <IconCircleCheck size={22} style={{ color: 'var(--accent)' }} />
            <p className="text-sm">ไม่มีงานค้าง ใบรับรองของร้านยังไม่ใกล้หมดอายุ</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {todos.map((t) => {
              const s = toneStyle[t.tone];
              const Icon =
                t.tone === 'warning' ? IconAlertTriangle : IconInfoCircle;
              return (
                <li
                  key={t.title}
                  className="card flex flex-wrap items-center gap-4"
                >
                  <span
                    className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center"
                    style={{ background: s.bg, color: s.fg }}
                  >
                    <Icon size={22} stroke={1.75} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{t.title}</p>
                    <p
                      className="text-sm mt-0.5 flex flex-wrap items-center gap-2"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {t.detail}
                      {t.status && <StatusBadge status={t.status} />}
                    </p>
                  </div>
                  <Link href={t.href} className="btn-primary">
                    {t.cta}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 className="font-bold tracking-tight">คำขอล่าสุด</h3>
          <Link
            href="/requests"
            className="text-sm font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            ดูทั้งหมด
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm py-4" style={{ color: 'var(--ink-secondary)' }}>
            ยังไม่เคยยื่นคำขอ
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/requests/${r.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <span>
                    <span className="font-mono text-sm font-semibold">
                      {r.no}
                    </span>
                    <span
                      className="block text-xs mt-0.5"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {r.typeIds
                        .map((id) => requestTypes.find((t) => t.id === id)?.label)
                        .join(', ')}
                    </span>
                  </span>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: แก้ `src/app/page.tsx` ให้ร้านยาเห็น `PharmacyHome`**

เพิ่ม import ต่อจาก `import { AdminLayout } from '@/components/layout';`:

```tsx
import { PharmacyHome } from '@/components/home/PharmacyHome';
```

ใน `DashboardPage` หลังบล็อก `<div className="mb-8">…</div>` (ทักทาย) ให้ห่อเนื้อหาเดิมทั้งหมด (grid stat-card และ card ตาราง) ด้วยเงื่อนไข:

```tsx
      {user?.role === 'pharmacy' && user.pharmacyId ? (
        <PharmacyHome pharmacyId={user.pharmacyId} />
      ) : (
        <>
          {/* grid stat-card และ card "คำขอล่าสุด" เดิม — ไม่แก้เนื้อใน */}
        </>
      )}
```

แก้ comment บนสุดของ `stats` เป็น:

```tsx
// ตัวเลขยังเป็นค่าตัวอย่างสำหรับ role อื่นนอกจากร้านยา — F2 เป็นต้นไปจะดึงจาก lib/api.ts ตาม role
```

- [ ] **Step 3: ตรวจ type และ lint**

Run: `npx tsc --noEmit; npm run lint`
Expected: ไม่มี error

- [ ] **Step 4: ตรวจในเบราว์เซอร์**

ลบ `accpharm_requests` ใน sessionStorage ก่อน
- login `pharm001` → หน้าแรกเห็น "ใบรับรองใกล้หมดอายุ · หมดอายุในอีก N วัน (2026-12-31)" ปุ่ม "ยื่นต่ออายุ" และ "คำขอล่าสุด" 1 รายการ
- ยื่นคำขอใหม่ตาม Task 4 → กลับหน้าแรก → การ์ดเปลี่ยนเป็น "คำขออยู่ระหว่างดำเนินการ" พร้อม badge "รอดำเนินการ" และปุ่ม "ติดตามสถานะ"
- สลับเป็น admin → หน้าแรกเป็น stat-card และตารางเดิม
- 375px ไม่มี scroll แนวนอน

- [ ] **Step 5: Commit (ถ้ามี git)**

```bash
git add src/components/home/PharmacyHome.tsx src/app/page.tsx
git commit -m "feat(f1): pharmacy home with pending tasks"
```

---

### Task 7: ลงทะเบียนร้านยาใหม่ `/register`

**Files:**
- Create: `src/app/register/page.tsx`
- Modify: `src/components/auth/AuthGuard.tsx:8`
- Modify: `src/app/login/page.tsx` (ต่อจาก `</form>`)

**Interfaces:**
- Consumes: `api.fda.lookup`, `api.registrations.create`, `Stepper`, `Field`, `inputClass`
- Produces: ไม่มี

- [ ] **Step 1: เพิ่ม `/register` เป็นหน้า public ใน `src/components/auth/AuthGuard.tsx`**

```ts
const publicPaths = ['/login', '/register'];
```

- [ ] **Step 2: สร้าง `src/app/register/page.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { IconPill } from '@tabler/icons-react';
import { Field, inputClass } from '@/components/common/Field';
import { Stepper } from '@/components/common/Stepper';
import { api } from '@/lib/api';
import type { Registration } from '@/types/api';

const FIELDS: [keyof Registration, string][] = [
  ['name', 'ชื่อร้านยา'],
  ['address', 'ที่ตั้ง'],
  ['province', 'จังหวัด'],
  ['licensee', 'ชื่อผู้รับอนุญาต'],
  ['operator', 'ผู้มีหน้าที่ปฏิบัติการ'],
  ['operatorLicense', 'เลขใบประกอบวิชาชีพ'],
  ['phone', 'เบอร์โทร'],
  ['email', 'อีเมล'],
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const [licenseNo, setLicenseNo] = useState('');
  const [form, setForm] = useState<Registration | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const lookup = async () => {
    setBusy(true);
    const found = await api.fda.lookup(licenseNo);
    setBusy(false);
    if (!found) {
      setErrors({
        licenseNo: 'ไม่พบเลขที่ใบอนุญาตนี้ ตรวจสอบรูปแบบ เช่น กท.28/2565',
      });
      return;
    }
    setErrors({});
    setForm(found);
  };

  const submit = async () => {
    if (!form) return;
    const e: Record<string, string> = {};
    for (const [key, label] of FIELDS)
      if (!form[key].trim()) e[key] = `กรอก${label}`;
    if (form.email && !EMAIL.test(form.email.trim()))
      e.email = 'อีเมลไม่ถูกต้อง';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    await api.registrations.create(form);
    toast.success('ส่งข้อมูลลงทะเบียนแล้ว สรร. จะตรวจสอบและแจ้งบัญชีผู้ใช้ทางอีเมล');
    router.push('/login');
  };

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'var(--accent)' }}
          >
            <IconPill size={22} stroke={1.75} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              ลงทะเบียนร้านยา
            </h1>
            <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
              ระบบรับรองร้านยาคุณภาพ
            </p>
          </div>
        </div>

        <Stepper steps={['ตรวจสอบใบอนุญาต', 'ข้อมูลร้าน']} current={form ? 1 : 0} />

        <div className="card">
          {!form ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                lookup();
              }}
              className="space-y-5"
            >
              <Field
                label="เลขที่ใบอนุญาตขายยา (ขย.5)"
                htmlFor="licenseNo"
                error={errors.licenseNo}
                hint="ระบบจะดึงข้อมูลร้านจาก อย. ให้อัตโนมัติ"
              >
                <input
                  id="licenseNo"
                  className={inputClass(errors.licenseNo)}
                  aria-invalid={!!errors.licenseNo}
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  placeholder="กท.28/2565"
                />
              </Field>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? 'กำลังตรวจสอบ…' : 'ดึงข้อมูลจาก อย.'}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
                ใบอนุญาต {form.licenseNo} — ตรวจสอบและแก้ไขข้อมูลให้ถูกต้อง
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                {FIELDS.map(([key, label]) => (
                  <Field key={key} label={label} htmlFor={key} error={errors[key]}>
                    <input
                      id={key}
                      className={inputClass(errors[key])}
                      aria-invalid={!!errors[key]}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </Field>
                ))}
              </div>
              <div className="flex justify-between gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setForm(null);
                    setErrors({});
                  }}
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={submit}
                >
                  {busy ? 'กำลังส่ง…' : 'ส่งข้อมูลลงทะเบียน'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-sm text-center">
          มีบัญชีแล้ว?{' '}
          <Link
            href="/login"
            className="font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: เพิ่มลิงก์ใน `src/app/login/page.tsx`**

เพิ่ม `import Link from 'next/link';` ต่อจาก `import { useState } from 'react';` แล้วใส่ต่อจาก `</form>`:

```tsx
          <p className="mt-5 text-sm text-center text-zinc-600">
            ร้านยายังไม่มีบัญชี?{' '}
            <Link
              href="/register"
              className="font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              ลงทะเบียนร้านยา
            </Link>
          </p>
```

- [ ] **Step 4: ตรวจ type และ lint**

Run: `npx tsc --noEmit; npm run lint`
Expected: ไม่มี error

- [ ] **Step 5: ตรวจในเบราว์เซอร์**

- logout → หน้า login มีลิงก์ "ลงทะเบียนร้านยา" → ไป `/register` ได้โดยไม่ถูกเด้งกลับ
- ใส่ "abc" → error "ไม่พบเลขที่ใบอนุญาตนี้…"; ใส่ "กท.28/2565" → ขั้นที่ 2 พร้อมข้อมูลตัวอย่าง
- เบอร์โทรและอีเมลว่าง → กดส่ง → error ใต้ 2 ช่อง; กรอกครบ → toast และกลับหน้า login
- login อยู่แล้วเปิด `/register` → ถูกส่งไป `/`
- 375px ไม่มี scroll แนวนอน

- [ ] **Step 6: Commit (ถ้ามี git)**

```bash
git add src/app/register/page.tsx src/components/auth/AuthGuard.tsx src/app/login/page.tsx
git commit -m "feat(f1): pharmacy self-registration with mock FDA lookup"
```

---

### Task 8: ตรวจ Definition of Done ของ F1

**Files:**
- ไม่มีไฟล์โค้ดใหม่ (แก้เฉพาะจุดที่ตรวจเจอ)

**Interfaces:**
- Consumes: ทุก task ก่อนหน้า
- Produces: F1 พร้อมให้ทีมรีวิว

- [ ] **Step 1: รัน check ทั้งหมด**

Run: `npm test; npm run lint; npx tsc --noEmit; npm run format:check; npm run build`
Expected: ทุกคำสั่งผ่าน (ถ้า `format:check` ไม่ผ่าน ให้รัน `npx prettier --write src` แล้วรันซ้ำ)

- [ ] **Step 2: เดิน flow หลักจนจบ**

แท็บใหม่ (sessionStorage ว่าง): login `pharm001` → หน้าแรก "ยื่นต่ออายุ" → stepper ครบ 4 ขั้น → ส่ง → รายการคำขอ → หน้าแรกเปลี่ยนเป็น "ติดตามสถานะ" → สลับ Demo role เป็น admin → `/requests` เห็นคำขอใหม่

- [ ] **Step 3: ตรวจ 375px และ 1280px**

ทุกหน้า: `/`, `/requests`, `/requests/new` (ทั้ง 4 ขั้น), `/my-pharmacy`, `/register` — ไม่มี scroll แนวนอน (เช็คด้วย `document.documentElement.scrollWidth <= window.innerWidth` ใน console)

- [ ] **Step 4: ตรวจ checklist หลักการ UX ร่วม**

1. หน้าแรกร้านยาเริ่มด้วย "งานที่รอคุณ" ✔
2. ไม่มี dropdown เปลี่ยนสถานะ (ร้านยาไม่เปลี่ยนสถานะเองใน F1) ✔
3. หน้ารายละเอียด tab + timeline — เป็นของ F2
4. ฟอร์มยาวเป็น stepper + บันทึกร่าง + ตรวจทีละขั้น ✔
5. ค้นหาข้อความภาษาอังกฤษที่ผู้ใช้เห็น (Git Bash): `grep -rnE ">[^<{]*[A-Za-z]{3,}[^<{]*<" src/app src/components` — ยอมได้เฉพาะ LINE ID, PDF และชื่อบัญชีทดลองในหน้า login
6. หน้ารายการมีค้นหา + chip + ตาราง/การ์ด ✔

- [ ] **Step 5: route ของ F1 ไม่ตกที่หน้า "กำลังพัฒนา"**

เปิด `/requests`, `/requests/new`, `/my-pharmacy`, `/register` — ไม่มีหน้าไหนแสดง "หน้านี้อยู่ในขั้นที่ 2–3 ของแผน PoC" (`/requests/[id]` ยังแสดงได้ เป็นของ F2) ยังไม่ลบ `src/app/[...slug]/page.tsx`

- [ ] **Step 6: อัปเดตเอกสารแผนของทีม**

ในเอกสาร "แผน PoC Acc-Pharm (Frontend)" (Claude Docs project `5aa46c55-50c3-47a3-8597-5bdb0761ef26`) แก้บรรทัดความคืบหน้าเป็น: `F1 ยื่นคำขอ (ร้านยา) เสร็จแล้ว — รอทีมรีวิวก่อนเริ่ม F2` และเพิ่มข้อที่ต้องตัดสินใจ: "checklist เอกสารตามประเภทคำขอใน `src/lib/constants.ts` เป็นร่าง — สรร. ยืนยันรายการจริง"

- [ ] **Step 7: Commit (ถ้ามี git)**

```bash
git add -A
git commit -m "chore(f1): definition of done checks"
```
