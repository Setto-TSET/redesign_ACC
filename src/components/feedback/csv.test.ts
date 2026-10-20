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
  const csv = toCsv([
    { ...base, name: '' },
    { ...base, id: '2', kind: 'idea' },
  ]);
  const lines = csv.split('\r\n');
  assert.equal(lines.length, 3);
  assert.ok(lines[1].endsWith(','));
  assert.match(lines[2], /อยากให้มีเพิ่ม/);
});
