import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { GppSection } from '@/types/api';
import { scoreGpp } from './gppRules.ts';

const sections: GppSection[] = [
  {
    id: 1,
    title: 'สถานที่',
    items: [
      { id: '1.1', text: '', weight: 2, levels: [0, 2], critical: true },
      { id: '1.2', text: '', weight: 1, levels: [0, 1, 2], canNa: true },
    ],
  },
  {
    id: 2,
    title: 'อุปกรณ์',
    items: [{ id: '2.1', text: '', weight: 2, levels: [0, 1, 2] }],
  },
];

test('ยังไม่ตอบ: ได้ 0 นับคะแนนเต็มทุกข้อ และไม่ผ่าน', () => {
  const s = scoreGpp(sections, {});
  assert.equal(s.max, 4 + 2 + 4);
  assert.equal(s.got, 0);
  assert.deepEqual(s.missing, ['1.1', '1.2', '2.1']);
  assert.equal(s.passed, false);
});

test('คะแนน = ระดับ × น้ำหนัก แยกตามหมวด', () => {
  const s = scoreGpp(sections, {
    '1.1': { level: 2 },
    '1.2': { level: 1 },
    '2.1': { level: 1 },
  });
  assert.equal(s.got, 4 + 1 + 2);
  assert.equal(s.max, 10);
  assert.equal(s.percent, 70);
  assert.deepEqual(
    s.sections.map((p) => [p.got, p.max, p.percent]),
    [
      [5, 6, 83.33],
      [2, 4, 50],
    ],
  );
  assert.equal(s.passed, false);
});

test('"ไม่มี" ตัดออกจากคะแนนเต็ม เฉพาะข้อที่มีตัวเลือกนี้', () => {
  const s = scoreGpp(sections, {
    '1.1': { level: 2 },
    '1.2': { level: 'na' },
    '2.1': { level: 2 },
  });
  assert.equal(s.max, 8);
  assert.equal(s.percent, 100);
  assert.equal(s.passed, true);
  assert.deepEqual(s.missing, []);

  const bad = scoreGpp(sections, { '2.1': { level: 'na' } });
  assert.equal(bad.max, 10);
});

test('Critical ที่ได้ 0 ถูกรายงาน', () => {
  const s = scoreGpp(sections, {
    '1.1': { level: 0 },
    '1.2': { level: 2 },
    '2.1': { level: 2 },
  });
  assert.deepEqual(s.criticalFails, ['1.1']);
});

test('ข้อประเมินจริงมีคะแนนเต็มรวม 114 ตามระบบเดิม', async () => {
  const { gppSections } = await import('./gppItems.ts');
  const s = scoreGpp(gppSections, {});
  assert.equal(s.total, 39);
  assert.equal(s.max, 114);
  assert.deepEqual(
    s.sections.map((p) => p.max),
    [26, 16, 12, 22, 38],
  );
});
