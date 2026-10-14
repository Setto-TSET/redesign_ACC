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
  {
    id: 2,
    code: 'REN',
    label: 'ต่ออายุ',
    hint: '',
    docs: ['ขย.5', 'ใบรับรองเดิม'],
  },
  {
    id: 4,
    code: 'CHG',
    label: 'เปลี่ยนเภสัชกร',
    hint: '',
    docs: ['หนังสือแต่งตั้ง'],
  },
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
  assert.deepEqual(
    Object.keys(validateStep(0, draft({ typeIds: [] }), types)),
    ['typeIds'],
  );
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
