// ข้อมูลสมมติของ PoC — ข้อมูลที่จะมาจาก backend ให้อ่านผ่าน lib/api.ts
import type { User, UserRole } from '@/types/api';

export const roleLabels: Record<UserRole, string> = {
  pharmacy: 'ร้านยา',
  assessor: 'ผู้ตรวจประเมิน',
  admin: 'Admin สรร.',
  ppho: 'สสจ.',
  superadmin: 'Super Admin',
};

/** บัญชีทดลอง หนึ่งบัญชีต่อหนึ่ง role */
export const users: User[] = [
  {
    id: 1,
    name: 'ภก.สมชาย ใจดี',
    username: 'pharm001',
    email: 'somchai@example.com',
    role: 'pharmacy',
    org: 'ร้านยาสุขภาพดี สาขาบางนา',
    pharmacyId: 1,
  },
  {
    id: 2,
    name: 'ภญ.วรรณา ตรวจไว',
    username: 'assessor01',
    email: 'wanna@example.com',
    role: 'assessor',
    org: 'ผู้ตรวจประเมิน',
  },
  {
    id: 3,
    name: 'พิมพ์ใจ บริหาร',
    username: 'admin01',
    email: 'pimjai@example.com',
    role: 'admin',
    org: 'สำนักงานรับรองร้านยาคุณภาพ',
  },
  {
    id: 4,
    name: 'ภก.ประเสริฐ ประจำจังหวัด',
    username: 'ppho-cm',
    email: 'prasert@example.com',
    role: 'ppho',
    org: 'สสจ.เชียงใหม่',
    province: 'เชียงใหม่',
  },
  {
    id: 5,
    name: 'ผู้ดูแลระบบ',
    username: 'superadmin',
    email: 'super@example.com',
    role: 'superadmin',
    org: 'สำนักงานรับรองร้านยาคุณภาพ',
  },
];
