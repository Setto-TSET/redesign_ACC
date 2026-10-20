// ผู้ใช้ตัวอย่างสำหรับหน้าจัดการผู้ใช้ (หน้าต้นแบบ)
import { replyTemplates } from '@/lib/constants';
import { users } from '@/mock';
import type { UserRole } from '@/types/api';

export interface ProtoUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  org: string;
  province?: string;
  active: boolean;
}

const extra: Omit<ProtoUser, 'id' | 'active'>[] = [
  {
    name: 'ภญ.ศิริพร งามดี',
    username: 'pharm002',
    email: 'siriporn@example.com',
    role: 'pharmacy',
    org: 'ร้านยาเพื่อนสุขภาพ',
  },
  {
    name: 'ภก.อนันต์ รักษาสุข',
    username: 'pharm003',
    email: 'anan@example.com',
    role: 'pharmacy',
    org: 'ร้านยาใกล้บ้าน สาขาเมือง',
  },
  {
    name: 'ภก.ธนากร ตรวจดี',
    username: 'assessor02',
    email: 'thanakorn@example.com',
    role: 'assessor',
    org: 'ผู้ตรวจประเมิน',
  },
  {
    name: 'ภญ.กมลา สุขใจ',
    username: 'assessor03',
    email: 'kamala@example.com',
    role: 'assessor',
    org: 'ผู้ตรวจประเมิน',
  },
  {
    name: 'สุกัญญา ธุรการ',
    username: 'admin02',
    email: 'sukanya@example.com',
    role: 'admin',
    org: 'สำนักงานรับรองร้านยาคุณภาพ',
  },
  {
    name: 'ภก.วิชัย ประจำขอนแก่น',
    username: 'ppho-kk',
    email: 'wichai@example.com',
    role: 'ppho',
    org: 'สสจ.ขอนแก่น',
    province: 'ขอนแก่น',
  },
  {
    name: 'ภญ.นภา ประจำภูเก็ต',
    username: 'ppho-pk',
    email: 'napa@example.com',
    role: 'ppho',
    org: 'สสจ.ภูเก็ต',
    province: 'ภูเก็ต',
  },
  {
    name: 'ภก.ปรีชา ประจำสงขลา',
    username: 'ppho-sk',
    email: 'preecha@example.com',
    role: 'ppho',
    org: 'สสจ.สงขลา',
    province: 'สงขลา',
  },
  {
    name: 'ณัฐพล ผู้ดูแล',
    username: 'superadmin2',
    email: 'nattapon@example.com',
    role: 'superadmin',
    org: 'สำนักงานรับรองร้านยาคุณภาพ',
  },
  {
    name: 'ภก.เดชา ร้านยาเก่า',
    username: 'pharm004',
    email: 'decha@example.com',
    role: 'pharmacy',
    org: 'ร้านยาเดชา',
  },
];

export const protoUsers: ProtoUser[] = [
  ...users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    role: u.role,
    org: u.org,
    province: u.province,
    active: true,
  })),
  ...extra.map((u, i) => ({
    ...u,
    id: users.length + 1 + i,
    active: i !== 9,
  })),
];

// ── ข้อมูลหลัก / template / ตั้งค่า / มอบหมายผู้ตรวจ (หน้าต้นแบบ) ──

export type MasterKind = 'type' | 'group' | 'chain';
export const masterKindLabels: Record<MasterKind, string> = {
  type: 'ประเภทร้านยา',
  group: 'กลุ่มร้านยา',
  chain: 'เครือข่าย (Chain)',
};

export interface MasterItem {
  id: number;
  kind: MasterKind;
  name: string;
  code: string;
  active: boolean;
}

export const masterItems: MasterItem[] = [
  { id: 1, kind: 'type', code: 'T01', name: 'ร้านยาเดี่ยว', active: true },
  { id: 2, kind: 'type', code: 'T02', name: 'ร้านยาสาขา', active: true },
  { id: 3, kind: 'type', code: 'T03', name: 'ร้านยาในโรงพยาบาล', active: true },
  { id: 4, kind: 'type', code: 'T04', name: 'ร้านยาชุมชน', active: true },
  { id: 5, kind: 'type', code: 'T05', name: 'ร้านยาแผนเก่า', active: false },
  { id: 6, kind: 'group', code: 'G01', name: 'กลุ่ม A (ใหญ่)', active: true },
  { id: 7, kind: 'group', code: 'G02', name: 'กลุ่ม B (กลาง)', active: true },
  { id: 8, kind: 'group', code: 'G03', name: 'กลุ่ม C (เล็ก)', active: true },
  { id: 9, kind: 'group', code: 'G04', name: 'กลุ่มนำร่อง', active: false },
  { id: 10, kind: 'chain', code: 'C01', name: 'เครือสุขใจ', active: true },
  {
    id: 11,
    kind: 'chain',
    code: 'C02',
    name: 'เครือเพื่อนสุขภาพ',
    active: true,
  },
  { id: 12, kind: 'chain', code: 'C03', name: 'เครือใกล้บ้าน', active: true },
  { id: 13, kind: 'chain', code: 'C04', name: 'เครือยาดีมีสุข', active: true },
  {
    id: 14,
    kind: 'chain',
    code: 'C05',
    name: 'เครือเก่าเลิกกิจการ',
    active: false,
  },
];

export interface ReplyTemplate {
  id: number;
  name: string;
  body: string;
}

export const templates: ReplyTemplate[] = [
  ...replyTemplates.map((body, i) => ({
    id: i + 1,
    name: `ข้อความ ${i + 1}`,
    body,
  })),
  {
    id: replyTemplates.length + 1,
    name: 'แจ้งรับคำขอ',
    body: 'สรร. ได้รับคำขอเลขที่ {เลขที่คำขอ} ของ {ชื่อร้าน} เรียบร้อยแล้ว',
  },
  {
    id: replyTemplates.length + 2,
    name: 'ขอเอกสารเพิ่มเติม',
    body: 'คำขอเลขที่ {เลขที่คำขอ} ของ {ชื่อร้าน} ต้องส่งเอกสารเพิ่มเติม กรุณาดำเนินการภายใน 15 วัน',
  },
  {
    id: replyTemplates.length + 3,
    name: 'แจ้งผลการรับรอง',
    body: 'ขอแสดงความยินดี {ชื่อร้าน} ผ่านการรับรองตามคำขอเลขที่ {เลขที่คำขอ}',
  },
];

export const defaultSettings = {
  gppPass: 70,
  certYears: 3,
  acceptRequests: true,
  adminEmail: 'qa@pharmacycouncil.org',
};

/** assessor id → จังหวัดที่รับผิดชอบ */
export const allocations: Record<number, string[]> = {
  2: ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี'],
  6: ['เชียงใหม่', 'ขอนแก่น'],
  7: ['ภูเก็ต', 'สงขลา'],
};
