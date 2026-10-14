// ข้อมูลสมมติของ PoC — ข้อมูลที่จะมาจาก backend ให้อ่านผ่าน lib/api.ts
import type {
  AccRequest,
  Applicant,
  ApplicantRelation,
  Pharmacy,
  User,
  UserRole,
} from '@/types/api';

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

/** ร้านยาตัวอย่าง — id 1 ผูกกับบัญชี pharm001 */
export const pharmacies: Pharmacy[] = [
  {
    id: 1,
    name: 'ร้านยาสุขภาพดี สาขาบางนา',
    licenseNo: 'กท.101/2560',
    qualityNo: 'QP-2566-0101',
    type: 'ร้านยาเครือข่าย (Chain)',
    address: '12/3 ถ.บางนา-ตราด แขวงบางนา เขตบางนา',
    province: 'กรุงเทพมหานคร',
    licensee: 'บริษัท สุขภาพดี จำกัด',
    phone: '02-000-1001',
    certStatus: 'A',
    certIssued: '2023-12-31',
    certExpires: '2026-12-31',
    hours: 'ทุกวัน 08:00–21:00',
    pharmacists: [
      {
        name: 'ภก.สมชาย ใจดี',
        license: 'ภ.12345',
        role: 'ผู้มีหน้าที่ปฏิบัติการ',
        hours: '08:00–17:00',
      },
      {
        name: 'ภญ.ศิริพร งามดี',
        license: 'ภ.23456',
        role: 'ผู้มีหน้าที่ปฏิบัติการ',
        hours: '13:00–21:00',
      },
    ],
  },
  {
    id: 2,
    name: 'ร้านยาเภสัชรักษ์',
    licenseNo: 'นบ.55/2562',
    type: 'ร้านยาเดี่ยว',
    address: '88 ถ.รัตนาธิเบศร์ ต.บางกระสอ อ.เมือง',
    province: 'นนทบุรี',
    licensee: 'ภญ.อรุณี มีสุข',
    phone: '02-000-1002',
    certStatus: 'N',
    hours: 'ทุกวัน 09:00–20:00',
    pharmacists: [
      {
        name: 'ภญ.อรุณี มีสุข',
        license: 'ภ.34567',
        role: 'ผู้มีหน้าที่ปฏิบัติการ',
        hours: '09:00–20:00',
      },
    ],
  },
  {
    id: 3,
    name: 'ร้านยาดอยคำเภสัช',
    licenseNo: 'ชม.302/2561',
    qualityNo: 'QP-2565-0311',
    type: 'ร้านยาเดี่ยว',
    address: '9 ถ.นิมมานเหมินท์ ต.สุเทพ อ.เมือง',
    province: 'เชียงใหม่',
    licensee: 'ภก.อนันต์ ดอยคำ',
    phone: '053-000-104',
    certStatus: 'E',
    certIssued: '2022-11-15',
    certExpires: '2025-11-14',
    hours: 'ทุกวัน 09:00–21:00',
    pharmacists: [
      {
        name: 'ภก.อนันต์ ดอยคำ',
        license: 'ภ.56789',
        role: 'ผู้มีหน้าที่ปฏิบัติการ',
        hours: '09:00–21:00',
      },
    ],
  },
  {
    id: 4,
    name: 'ร้านยาขอนแก่นฟาร์มา',
    licenseNo: 'ขก.77/2563',
    type: 'ร้านยาเดี่ยว',
    address: '200 ถ.มิตรภาพ ต.ในเมือง อ.เมือง',
    province: 'ขอนแก่น',
    licensee: 'ภญ.สุนิสา แก่นใจ',
    phone: '043-000-105',
    certStatus: 'N',
    hours: 'ทุกวัน 08:30–20:30',
    pharmacists: [
      {
        name: 'ภญ.สุนิสา แก่นใจ',
        license: 'ภ.67890',
        role: 'ผู้มีหน้าที่ปฏิบัติการ',
        hours: '08:30–20:30',
      },
    ],
  },
  {
    id: 5,
    name: 'ร้านยาใกล้บ้าน รังสิต',
    licenseNo: 'ปท.21/2558',
    qualityNo: 'QP-2563-0450',
    type: 'ร้านยาเครือข่าย (Chain)',
    address: '45 ถ.พหลโยธิน ต.ประชาธิปัตย์ อ.ธัญบุรี',
    province: 'ปทุมธานี',
    licensee: 'บริษัท ใกล้บ้าน จำกัด',
    phone: '02-000-1003',
    certStatus: 'A',
    certIssued: '2024-05-10',
    certExpires: '2027-05-09',
    hours: 'ทุกวัน 08:00–22:00',
    pharmacists: [
      {
        name: 'ภก.วิทยา รอบรู้',
        license: 'ภ.45678',
        role: 'ผู้มีหน้าที่ปฏิบัติการ',
        hours: '08:00–16:00',
      },
    ],
  },
];

const applicant = (
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  relation: ApplicantRelation,
): Applicant => ({
  firstName,
  lastName,
  email,
  phone,
  lineId: '',
  relation,
  relationOther: '',
});

/** คำขอตั้งต้น — คำขอที่ยื่นระหว่าง demo เก็บต่อใน sessionStorage (ดู lib/api.ts) */
export const seedRequests: AccRequest[] = [
  {
    id: 'r1',
    no: 'NEW-6900012',
    pharmacyId: 2,
    typeIds: [1],
    submittedAt: '2026-09-02T10:15:00',
    status: 'doc_review',
    applicant: applicant(
      'อรุณี',
      'มีสุข',
      'arunee@example.com',
      '0810000002',
      1,
    ),
    docs: [
      {
        name: 'ขย5-เภสัชรักษ์.pdf',
        type: 'สำเนาใบอนุญาตขายยา (ขย.5)',
        uploadedAt: '2026-09-02',
      },
    ],
    messages: [
      {
        from: 'ระบบ',
        at: '2026-09-02T10:15:00',
        text: 'ได้รับคำขอแล้ว',
        status: 'submitted',
      },
      {
        from: 'พิมพ์ใจ บริหาร',
        at: '2026-09-04T09:00:00',
        text: 'อยู่ระหว่างการดำเนินการตรวจสอบเอกสาร',
        status: 'doc_review',
      },
    ],
  },
  {
    id: 'r2',
    no: 'NEW-6900009',
    pharmacyId: 4,
    typeIds: [7],
    submittedAt: '2026-08-11T09:40:00',
    status: 'need_docs',
    applicant: applicant(
      'สุนิสา',
      'แก่นใจ',
      'sunisa@example.com',
      '0810000004',
      2,
    ),
    docs: [],
    messages: [
      {
        from: 'พิมพ์ใจ บริหาร',
        at: '2026-08-15T10:00:00',
        text: 'กรุณาส่งเอกสารเพิ่มเติม ดังนี้ 1) แผนผังร้าน 2) ภาพถ่ายบริเวณจ่ายยา',
        status: 'need_docs',
      },
    ],
  },
  {
    id: 'r3',
    no: 'REN-6900002',
    pharmacyId: 3,
    typeIds: [2, 8],
    submittedAt: '2026-05-18T16:46:00',
    status: 'committee',
    applicant: applicant(
      'อนันต์',
      'ดอยคำ',
      'anan@example.com',
      '0810000003',
      1,
    ),
    docs: [],
    messages: [
      {
        from: 'พิมพ์ใจ บริหาร',
        at: '2026-08-01T09:00:00',
        text: 'สรร. ได้ตรวจประเมินเรียบร้อยแล้ว อยู่ระหว่างยื่นคณะกรรมการรับรอง',
        status: 'committee',
      },
    ],
  },
  {
    id: 'r4',
    no: 'CHG-6900003',
    pharmacyId: 5,
    typeIds: [6],
    submittedAt: '2026-03-14T10:00:00',
    status: 'cancelled',
    applicant: applicant(
      'วิทยา',
      'รอบรู้',
      'wittaya@example.com',
      '0810000005',
      3,
    ),
    docs: [],
    messages: [
      {
        from: 'วิทยา รอบรู้',
        at: '2026-03-20T09:00:00',
        text: 'ขอยกเลิกคำขอ',
        status: 'cancelled',
      },
    ],
  },
  {
    id: 'r5',
    no: 'REN-6600031',
    pharmacyId: 1,
    typeIds: [2],
    submittedAt: '2023-06-20T14:00:00',
    status: 'approved',
    applicant: applicant(
      'สมชาย',
      'ใจดี',
      'somchai@example.com',
      '0810000001',
      3,
    ),
    docs: [],
    messages: [
      {
        from: 'พิมพ์ใจ บริหาร',
        at: '2023-12-20T10:00:00',
        text: 'ผ่านคณะกรรมการรับรองแล้ว',
        status: 'approved',
      },
    ],
  },
];
