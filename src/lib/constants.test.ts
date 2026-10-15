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
