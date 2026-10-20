// ผู้ใช้ตัวอย่างสำหรับหน้าจัดการผู้ใช้ (หน้าต้นแบบ)
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
