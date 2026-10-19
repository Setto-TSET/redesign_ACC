import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AccRequest, Pharmacy } from '@/types/api';
import {
  certDateError,
  certExpiry,
  nextCertNo,
  withLatestCert,
} from './certRules.ts';

test('วันหมดอายุ = +3 ปี - 1 วัน', () => {
  assert.equal(certExpiry('2024-05-10'), '2027-05-09');
  assert.equal(certExpiry('2026-01-01'), '2028-12-31');
  // 29 ก.พ. → ปีปกติเลื่อนไป 1 มี.ค. แล้วถอย 1 วัน
  assert.equal(certExpiry('2024-02-29'), '2027-02-28');
});

test('เลขรับรอง running ต่อปี พ.ศ.', () => {
  const nos = ['QP-2569-0007', 'QP-2569-0012', 'QP-2568-0099'];
  assert.equal(nextCertNo(nos, '2026-10-20'), 'QP-2569-0013');
  assert.equal(nextCertNo(nos, '2027-01-05'), 'QP-2570-0001');
  assert.equal(nextCertNo([], '2026-10-20'), 'QP-2569-0001');
});

test('ตรวจวันที่ใบรับรอง', () => {
  assert.equal(certDateError('', '2029-01-01'), 'กรอกวันที่ออกใบรับรอง');
  assert.equal(
    certDateError('2026-10-20', '2026-10-20'),
    'วันหมดอายุต้องหลังวันที่ออก',
  );
  assert.equal(certDateError('2026-10-20', '2029-10-19'), null);
});

test('ร้านได้ใบรับรองล่าสุดจากคำขอที่ผ่าน', () => {
  const p = {
    id: 4,
    certStatus: 'N',
  } as Pharmacy;
  const cert = {
    no: 'QP-2569-0001',
    issued: '2026-10-20',
    expires: '2029-10-19',
  };
  const reqs = [
    { pharmacyId: 4, cert },
    { pharmacyId: 9, cert: { ...cert, no: 'X' } },
  ] as AccRequest[];
  assert.deepEqual(withLatestCert(p, reqs), {
    id: 4,
    certStatus: 'A',
    qualityNo: 'QP-2569-0001',
    certIssued: '2026-10-20',
    certExpires: '2029-10-19',
  });
  assert.equal(withLatestCert(p, []), p);
});
