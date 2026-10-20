// ผลตรวจรักษาคุณภาพหลังรับรอง (Post-audit) สมมติ — ค่าตายตัวมาจาก CPAQA/PostAudit.aspx

export type AuditPartStatus =
  'pending' | 'notify' | 'fixing' | 'replied' | 'closed';

export const auditPartLabels: Record<AuditPartStatus, string> = {
  pending: 'รอตรวจ',
  notify: 'รอแจ้งร้าน',
  fixing: 'รอร้านแก้ไข',
  replied: 'ร้านแจ้งกลับแล้ว',
  closed: 'ปิดแล้ว',
};

export type AuditPart = 'quality' | 'ci';
export const auditPartTitles: Record<AuditPart, string> = {
  quality: 'ระบบร้านยาคุณภาพ',
  ci: 'มาตรฐานบริการ Common illness',
};

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

export const satisfactionLevels = [
  'น้อยที่สุด',
  'น้อย',
  'ปานกลาง',
  'มาก',
  'มากที่สุด',
];

export interface AuditFinding {
  category: string;
  text: string;
  photos: number;
}

export interface AuditPartResult {
  status: AuditPartStatus;
  findings: AuditFinding[];
  /** 12 ช่อง; null = ยังไม่ตรวจ */
  checklist: (boolean | null)[];
  checklistNotes: string[];
  /** 1–5 */
  satisfaction?: number;
  summary: string;
  notifiedAt?: string;
  repliedAt?: string;
  reply?: string;
  closedAt?: string;
}

export interface PostAudit {
  id: string;
  no: string;
  pharmacyId: number;
  year: number;
  assessorId: number;
  visitDate: string;
  method: 'onsite' | 'online';
  parts: Record<AuditPart, AuditPartResult>;
  history: { at: string; by: string; text: string }[];
}

const blank = (): AuditPartResult => ({
  status: 'pending',
  findings: [],
  checklist: Array(12).fill(null),
  checklistNotes: Array(12).fill(''),
  summary: '',
});

/** ส่วนระบบร้านยาคุณภาพ — ตรวจแล้วที่สถานะ s */
const quality = (
  s: AuditPartStatus,
  extra: Partial<AuditPartResult> = {},
): AuditPartResult => ({
  ...blank(),
  status: s,
  findings: [
    {
      category: qualityCategories[0],
      text: 'ป้ายชื่อร้านและเวลาทำการซีดจาง อ่านยาก',
      photos: 2,
    },
    {
      category: qualityCategories[3],
      text: 'พบยาหมดอายุ 2 รายการในชั้นวางหน้าร้าน',
      photos: 3,
    },
  ],
  summary: 'โดยรวมเป็นไปตามมาตรฐาน มีข้อที่ต้องแก้ไข 2 ข้อ',
  ...extra,
});

/** ส่วน Common illness — ผ่าน 10 จาก 12 */
const ci = (
  s: AuditPartStatus,
  extra: Partial<AuditPartResult> = {},
): AuditPartResult => ({
  ...blank(),
  status: s,
  checklist: ciChecklist.map((_, i) => i !== 4 && i !== 8),
  checklistNotes: ciChecklist.map((_, i) =>
    i === 4
      ? 'ไม่พบบันทึกการติดตามผู้ป่วยภายใน 72 ชั่วโมง'
      : i === 8
        ? 'ทะเบียนผู้รับบริการไม่เป็นปัจจุบัน'
        : '',
  ),
  satisfaction: 4,
  summary: 'บริการได้มาตรฐาน ควรปรับปรุงการติดตามผลและทะเบียน',
  ...extra,
});

const reply = {
  repliedAt: '2026-10-05T10:20:00',
  reply: 'ร้านได้เปลี่ยนป้ายใหม่และคัดยาหมดอายุออกแล้ว แนบรูปหลักฐาน 3 รูป',
};

export const postAudits: PostAudit[] = [
  {
    id: 'pa1',
    no: 'PA-2568-0001',
    pharmacyId: 1,
    year: 2568,
    assessorId: 2,
    visitDate: '2025-06-12',
    method: 'onsite',
    parts: {
      quality: quality('closed', {
        notifiedAt: '2025-06-20T09:00:00',
        ...reply,
        repliedAt: '2025-07-02T10:00:00',
        closedAt: '2025-07-10T14:00:00',
      }),
      ci: ci('closed', {
        notifiedAt: '2025-06-20T09:00:00',
        repliedAt: '2025-07-02T10:00:00',
        closedAt: '2025-07-10T14:00:00',
      }),
    },
    history: [
      {
        at: '2025-06-12T11:00:00',
        by: 'ภญ.วรรณา ตรวจไว',
        text: 'บันทึกผลตรวจ',
      },
      {
        at: '2025-06-20T09:00:00',
        by: 'พิมพ์ใจ บริหาร',
        text: 'แจ้งร้านให้แก้ไข',
      },
      {
        at: '2025-07-10T14:00:00',
        by: 'พิมพ์ใจ บริหาร',
        text: 'ปิดผลทั้งสองส่วน',
      },
    ],
  },
  {
    id: 'pa2',
    no: 'PA-2569-0001',
    pharmacyId: 1,
    year: 2569,
    assessorId: 2,
    visitDate: '2026-08-20',
    method: 'onsite',
    parts: {
      quality: quality('fixing', { notifiedAt: '2026-09-02T09:30:00' }),
      ci: ci('replied', {
        notifiedAt: '2026-09-02T09:30:00',
        repliedAt: '2026-09-15T13:00:00',
        reply: 'ร้านจัดทำแบบติดตามผู้ป่วยและปรับปรุงทะเบียนแล้ว',
      }),
    },
    history: [
      {
        at: '2026-08-20T12:00:00',
        by: 'ภญ.วรรณา ตรวจไว',
        text: 'บันทึกผลตรวจ',
      },
      {
        at: '2026-09-02T09:30:00',
        by: 'พิมพ์ใจ บริหาร',
        text: 'แจ้งร้านให้แก้ไข',
      },
      {
        at: '2026-09-15T13:00:00',
        by: 'ภก.สมชาย ใจดี',
        text: 'ร้านส่งการแก้ไข (มาตรฐานบริการ)',
      },
    ],
  },
  {
    id: 'pa3',
    no: 'PA-2569-0002',
    pharmacyId: 5,
    year: 2569,
    assessorId: 2,
    visitDate: '2026-11-05',
    method: 'onsite',
    parts: { quality: blank(), ci: blank() },
    history: [
      {
        at: '2026-10-01T09:00:00',
        by: 'พิมพ์ใจ บริหาร',
        text: 'มอบหมายผู้ตรวจ',
      },
    ],
  },
  {
    id: 'pa4',
    no: 'PA-2569-0003',
    pharmacyId: 101,
    year: 2569,
    assessorId: 6,
    visitDate: '2026-10-08',
    method: 'online',
    parts: { quality: quality('notify'), ci: blank() },
    history: [
      {
        at: '2026-10-01T09:00:00',
        by: 'พิมพ์ใจ บริหาร',
        text: 'มอบหมายผู้ตรวจ',
      },
      {
        at: '2026-10-08T15:00:00',
        by: 'ภก.ธนพล ตรวจดี',
        text: 'บันทึกผลตรวจ (ระบบคุณภาพ)',
      },
    ],
  },
  {
    id: 'pa5',
    no: 'PA-2569-0004',
    pharmacyId: 102,
    year: 2569,
    assessorId: 2,
    visitDate: '2026-09-25',
    method: 'onsite',
    parts: { quality: quality('notify'), ci: ci('notify') },
    history: [
      {
        at: '2026-09-25T16:00:00',
        by: 'ภญ.วรรณา ตรวจไว',
        text: 'บันทึกผลตรวจ',
      },
    ],
  },
  {
    id: 'pa6',
    no: 'PA-2568-0002',
    pharmacyId: 103,
    year: 2568,
    assessorId: 7,
    visitDate: '2025-09-10',
    method: 'onsite',
    parts: {
      quality: quality('fixing', { notifiedAt: '2025-09-18T09:00:00' }),
      ci: ci('fixing', { notifiedAt: '2025-09-18T09:00:00' }),
    },
    history: [
      { at: '2025-09-10T12:00:00', by: 'ภญ.กมลา ใส่ใจ', text: 'บันทึกผลตรวจ' },
      {
        at: '2025-09-18T09:00:00',
        by: 'พิมพ์ใจ บริหาร',
        text: 'แจ้งร้านให้แก้ไข',
      },
    ],
  },
  {
    id: 'pa7',
    no: 'PA-2568-0003',
    pharmacyId: 105,
    year: 2568,
    assessorId: 6,
    visitDate: '2025-08-14',
    method: 'online',
    parts: {
      quality: quality('replied', {
        notifiedAt: '2025-08-22T09:00:00',
        ...reply,
      }),
      ci: ci('replied', { notifiedAt: '2025-08-22T09:00:00', ...reply }),
    },
    history: [
      { at: '2025-08-14T12:00:00', by: 'ภก.ธนพล ตรวจดี', text: 'บันทึกผลตรวจ' },
      { at: '2025-10-05T10:20:00', by: 'ร้านยา', text: 'ร้านส่งการแก้ไข' },
    ],
  },
  {
    id: 'pa8',
    no: 'PA-2569-0005',
    pharmacyId: 107,
    year: 2569,
    assessorId: 2,
    visitDate: '2026-07-30',
    method: 'onsite',
    parts: {
      quality: quality('closed', {
        notifiedAt: '2026-09-01T09:00:00',
        ...reply,
        closedAt: '2026-10-10T11:00:00',
      }),
      ci: ci('replied', { notifiedAt: '2026-09-01T09:00:00', ...reply }),
    },
    history: [
      {
        at: '2026-07-30T12:00:00',
        by: 'ภญ.วรรณา ตรวจไว',
        text: 'บันทึกผลตรวจ',
      },
      {
        at: '2026-10-10T11:00:00',
        by: 'พิมพ์ใจ บริหาร',
        text: 'ปิดผล (ระบบคุณภาพ)',
      },
    ],
  },
  {
    id: 'pa9',
    no: 'PA-2568-0004',
    pharmacyId: 108,
    year: 2568,
    assessorId: 7,
    visitDate: '2025-05-20',
    method: 'onsite',
    parts: {
      quality: quality('closed', { closedAt: '2025-07-01T10:00:00', ...reply }),
      ci: ci('closed', { closedAt: '2025-07-01T10:00:00', ...reply }),
    },
    history: [
      {
        at: '2025-07-01T10:00:00',
        by: 'พิมพ์ใจ บริหาร',
        text: 'ปิดผลทั้งสองส่วน',
      },
    ],
  },
  {
    id: 'pa10',
    no: 'PA-2569-0006',
    pharmacyId: 110,
    year: 2569,
    assessorId: 2,
    visitDate: '2026-12-02',
    method: 'online',
    parts: { quality: blank(), ci: blank() },
    history: [
      {
        at: '2026-10-12T09:00:00',
        by: 'พิมพ์ใจ บริหาร',
        text: 'มอบหมายผู้ตรวจ',
      },
    ],
  },
];

const order: AuditPartStatus[] = [
  'pending',
  'notify',
  'fixing',
  'replied',
  'closed',
];

/** สถานะ "ช้าสุด" ของสองส่วน */
export const overallStatus = (a: PostAudit): AuditPartStatus =>
  order[
    Math.min(
      order.indexOf(a.parts.quality.status),
      order.indexOf(a.parts.ci.status),
    )
  ];

export const cycleSteps = [
  'ตรวจ',
  'แจ้งร้าน',
  'ร้านแจ้งกลับ',
  'พิจารณา',
  'ปิด',
];

/** pending 0 · notify 1 · fixing 2 · replied 3 · closed 5 (เสร็จทุกขั้น) */
export const cycleIndex = (s: AuditPartStatus) =>
  ({ pending: 0, notify: 1, fixing: 2, replied: 3, closed: 5 })[s];
