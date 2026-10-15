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

test('actionsFor ครบทุกสถานะ × role', () => {
  const flow: Record<string, string[]> = {
    submitted: ['start_review'],
    doc_review: ['request_docs', 'assign'],
    assessed: ['to_committee'],
    committee: ['approve', 'reject'],
  };
  const dead = ['approved', 'rejected', 'cancelled'];
  const statuses = [
    'submitted',
    'doc_review',
    'need_docs',
    'assigned',
    'assessed',
    'committee',
    ...dead,
  ] as RequestStatus[];
  for (const status of statuses) {
    const staff = dead.includes(status)
      ? ['override']
      : [...(flow[status] ?? []), 'reply', 'cancel', 'override'];
    const pharmacy =
      status === 'need_docs'
        ? ['resubmit_docs', 'cancel']
        : status === 'submitted' || status === 'doc_review'
          ? ['cancel']
          : [];
    const expected = {
      pharmacy,
      assessor: [],
      admin: staff,
      ppho: [],
      superadmin: staff,
    };
    for (const [role, want] of Object.entries(expected)) {
      assert.deepEqual(
        actionsFor(status, role as 'admin'),
        want,
        `${status} × ${role}`,
      );
    }
  }
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
  const orig = at('doc_review');
  const snap = structuredClone(orig);
  applyAction(orig, 'assign', { assessorIds: [] }, admin, NOW);
  assert.deepEqual(orig, snap);
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
    applyAction(
      at('doc_review'),
      'request_docs',
      { message: '  ' },
      admin,
      NOW,
    ),
    { error: 'กรอกเอกสารที่ขอเพิ่ม', field: 'message' },
  );
  assert.deepEqual(applyAction(at('committee'), 'reject', {}, admin, NOW), {
    error: 'กรอกเหตุผล',
    field: 'message',
  });
});

test('ร้านยาส่งเอกสารเพิ่มและยกเลิกได้ตามสถานะ', () => {
  const doc = {
    name: 'a.pdf',
    type: 'เอกสารเพิ่มเติม',
    uploadedAt: '2026-10-15',
  };
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
