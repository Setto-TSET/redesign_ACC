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
