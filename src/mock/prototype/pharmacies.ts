// ร้านยาสมมติเพิ่มสำหรับหน้าต้นแบบ — ชื่อและเลขทั้งหมดเป็นข้อมูลสมมติ
import { pharmacies } from '@/mock';
import type { CertStatus, Pharmacy } from '@/types/api';

export type Region =
  'เหนือ' | 'กลาง' | 'ตะวันออกเฉียงเหนือ' | 'ใต้' | 'ตะวันออก';

export const provinceRegion: Record<string, Region> = {
  เชียงใหม่: 'เหนือ',
  เชียงราย: 'เหนือ',
  พิษณุโลก: 'เหนือ',
  กรุงเทพมหานคร: 'กลาง',
  นนทบุรี: 'กลาง',
  ปทุมธานี: 'กลาง',
  นครปฐม: 'กลาง',
  ขอนแก่น: 'ตะวันออกเฉียงเหนือ',
  นครราชสีมา: 'ตะวันออกเฉียงเหนือ',
  อุดรธานี: 'ตะวันออกเฉียงเหนือ',
  ภูเก็ต: 'ใต้',
  สงขลา: 'ใต้',
  สุราษฎร์ธานี: 'ใต้',
  ชลบุรี: 'ตะวันออก',
  ระยอง: 'ตะวันออก',
};

const names = [
  ['สุขใจฟาร์มาซี', 'เชียงราย', 'A'],
  ['เภสัชพิษณุโลก', 'พิษณุโลก', 'A'],
  ['ร้านยาปทุมสุขภาพ', 'ปทุมธานี', 'A'],
  ['นครปฐมเภสัช', 'นครปฐม', 'N'],
  ['อีสานฟาร์มา', 'นครราชสีมา', 'A'],
  ['อุดรเภสัชกรรม', 'อุดรธานี', 'E'],
  ['อันดามันฟาร์มาซี', 'ภูเก็ต', 'A'],
  ['หาดใหญ่เภสัช', 'สงขลา', 'A'],
  ['สุราษฎร์ใกล้บ้าน', 'สุราษฎร์ธานี', 'X'],
  ['ชลบุรีสุขภาพดี', 'ชลบุรี', 'A'],
  ['ระยองเภสัชรักษ์', 'ระยอง', 'A'],
  ['เชียงใหม่ยาดี', 'เชียงใหม่', 'A'],
  ['ขอนแก่นเภสัชพลัส', 'ขอนแก่น', 'N'],
  ['บางกะปิฟาร์มา', 'กรุงเทพมหานคร', 'A'],
  ['นนทเภสัชชุมชน', 'นนทบุรี', 'E'],
  ['ลาดพร้าวร้านยาดี', 'กรุงเทพมหานคร', 'A'],
  ['พัทยาเฮลท์ฟาร์มา', 'ชลบุรี', 'A'],
  ['ภูเก็ตยาชุมชน', 'ภูเก็ต', 'X'],
  ['เมืองเหนือเภสัช', 'เชียงราย', 'A'],
] as const;

const extra: Pharmacy[] = names.map(([n, province, certStatus], i) => {
  const id = 101 + i;
  const owner = `ภก.ทดสอบ ${n.slice(0, 6)}`;
  const issued = certStatus === 'A' || certStatus === 'E';
  return {
    id,
    name: `ร้านยา${n}`,
    licenseNo: `ขย.5 เลขที่ ${10 + i}/${2560 + (i % 6)}`,
    qualityNo: issued ? `QP-2567-${String(id).padStart(4, '0')}` : undefined,
    type: i % 3 === 0 ? 'ร้านยาเครือข่าย (Chain)' : 'ร้านยาเดี่ยว',
    address: `${20 + i} ถ.สุขภาพ ต.ในเมือง อ.เมือง`,
    province,
    licensee: owner,
    phone: `02-000-${2000 + i}`,
    certStatus: certStatus as CertStatus,
    certIssued: issued ? '2024-03-01' : undefined,
    certExpires: issued
      ? certStatus === 'E'
        ? '2026-09-30'
        : '2027-02-28'
      : undefined,
    hours: 'ทุกวัน 09:00–20:00',
    pharmacists: [
      {
        name: owner,
        license: 'ภ.12345',
        role: 'ผู้มีหน้าที่ปฏิบัติการ',
        hours: '09:00–20:00',
      },
      ...(i % 2 === 0
        ? [
            {
              name: `ภญ.สมมติ ${i + 1}`,
              license: 'ภ.12345',
              role: 'ผู้มีหน้าที่ปฏิบัติการ',
              hours: '12:00–20:00',
            },
          ]
        : []),
    ],
  };
});

export const protoPharmacies: Pharmacy[] = [...pharmacies, ...extra];

export const findPharmacy = (id: number) =>
  protoPharmacies.find((p) => p.id === id);

export const provinces: string[] = [
  ...new Set(protoPharmacies.map((p) => p.province)),
].sort((a, b) => a.localeCompare(b, 'th'));
