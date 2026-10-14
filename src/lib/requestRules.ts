// กฎของคำขอรับรอง — pure function ไม่มี import ที่เป็นค่า (type ถูกลบตอนรัน)
// จึงรันเทสต์ด้วย node --test ได้ตรง ๆ
import type {
  AccRequest,
  Pharmacy,
  RequestDraft,
  RequestStatus,
  RequestType,
} from '@/types/api';

/** ประเภทหลัก — เลือกได้ทีละ 1 (ระบบเดิม: chkType1/7/2 ล้างกันเองใน CheckedChanged) */
export const MAIN_TYPE_IDS = [1, 7, 2];
/** ประเภทเปลี่ยนแปลง — เลือกได้หลายข้อ และเลือกคู่กับประเภทหลักได้ */
export const CHANGE_TYPE_IDS = [3, 4, 5, 6, 8];

/** สถานะที่จบแล้ว — นอกจากนี้ถือว่าคำขอยังค้าง (Request_GetStatusAlive) */
const CLOSED: RequestStatus[] = ['approved', 'rejected', 'cancelled'];

export const isAlive = (s: RequestStatus) => !CLOSED.includes(s);

export const mainTypeOf = (typeIds: number[]) =>
  typeIds.find((t) => MAIN_TYPE_IDS.includes(t)) ?? null;

export function setMainType(typeIds: number[], id: number | null): number[] {
  const rest = typeIds.filter((t) => !MAIN_TYPE_IDS.includes(t));
  return id === null ? rest : [id, ...rest];
}

export function toggleChangeType(typeIds: number[], id: number): number[] {
  return typeIds.includes(id)
    ? typeIds.filter((t) => t !== id)
    : [...typeIds, id];
}

/** คำรับรองบังคับเฉพาะคำขอรับรอง/ต่ออายุ (Request.aspx.vb cmdSave_Click) */
export const needsPledge = (typeIds: number[]) => mainTypeOf(typeIds) !== null;

export function requiredDocs(typeIds: number[], types: RequestType[]) {
  const docs = types
    .filter((t) => typeIds.includes(t.id))
    .flatMap((t) => t.docs);
  return [...new Set(docs)];
}

/** เลขคำขอ running ต่อเนื่องทั้งระบบภายในปี พ.ศ. เดียวกัน เช่น REN-6900013 */
export function nextRequestNo(
  typeIds: number[],
  existingNos: string[],
  today: Date,
): string {
  const main = mainTypeOf(typeIds);
  const prefix = main === 2 ? 'REN' : main ? 'NEW' : 'CHG';
  const yy = String((today.getFullYear() + 543) % 100).padStart(2, '0');
  const seqs = existingNos
    .map((no) => no.split('-')[1] ?? '')
    .filter((n) => n.startsWith(yy))
    .map((n) => Number(n.slice(2)));
  const next = Math.max(0, ...seqs) + 1;
  return `${prefix}-${yy}${String(next).padStart(5, '0')}`;
}

export type StepErrors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^0\d{8,9}$/;

/** ตรวจขั้นที่ step (0 ประเภท · 1 ผู้ยื่น · 2 เอกสาร · 3 ยืนยัน) คืน {} ถ้าผ่าน */
export function validateStep(
  step: number,
  d: RequestDraft,
  types: RequestType[],
): StepErrors {
  const e: StepErrors = {};
  if (step === 0 && d.typeIds.length === 0)
    e.typeIds = 'เลือกประเภทคำขออย่างน้อย 1 ข้อ';
  if (step === 1) {
    const a = d.applicant;
    if (!a.firstName.trim()) e.firstName = 'กรอกชื่อ';
    if (!a.lastName.trim()) e.lastName = 'กรอกนามสกุล';
    if (!EMAIL.test(a.email.trim())) e.email = 'อีเมลไม่ถูกต้อง';
    if (!PHONE.test(a.phone.replace(/[-\s]/g, '')))
      e.phone = 'เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9–10 หลัก';
    if (!a.relation) e.relation = 'เลือกความเกี่ยวข้องกับร้านยา';
    else if (a.relation === 9 && !a.relationOther.trim())
      e.relationOther = 'ระบุความเกี่ยวข้อง';
  }
  if (step === 2)
    for (const doc of requiredDocs(d.typeIds, types))
      if (!d.docs[doc]) e[`doc:${doc}`] = 'แนบไฟล์นี้';
  if (step === 3 && needsPledge(d.typeIds) && !d.pledged)
    e.pledged = 'ต้องรับทราบและให้คำรับรองก่อนส่งคำขอ';
  return e;
}

export interface Todo {
  tone: 'warning' | 'info';
  title: string;
  detail: string;
  href: string;
  cta: string;
  status?: RequestStatus;
}

const DAY = 86_400_000;

/** งานที่ร้านยาต้องทำต่อ — แสดงบนหน้าแรก (หลักการ UX ข้อ 1) */
export function pharmacyTodos(
  p: Pharmacy,
  reqs: AccRequest[],
  today: Date,
): Todo[] {
  const alive = reqs.find((r) => r.pharmacyId === p.id && isAlive(r.status));
  if (alive?.status === 'need_docs')
    return [
      {
        tone: 'warning',
        title: 'ส่งเอกสารเพิ่มเติม',
        detail: `คำขอ ${alive.no} ถูกขอเอกสารเพิ่ม`,
        href: `/requests/${alive.id}`,
        cta: 'ดูรายละเอียด',
        status: alive.status,
      },
    ];
  if (alive)
    return [
      {
        tone: 'info',
        title: 'คำขออยู่ระหว่างดำเนินการ',
        detail: `คำขอ ${alive.no}`,
        href: `/requests/${alive.id}`,
        cta: 'ติดตามสถานะ',
        status: alive.status,
      },
    ];
  if (p.certStatus === 'A' && p.certExpires) {
    const days = Math.ceil((Date.parse(p.certExpires) - today.getTime()) / DAY);
    if (days > 90) return [];
    return [
      {
        tone: 'warning',
        title: 'ใบรับรองใกล้หมดอายุ',
        detail:
          days < 0
            ? `หมดอายุแล้วเมื่อ ${p.certExpires}`
            : `หมดอายุในอีก ${days} วัน (${p.certExpires})`,
        href: '/requests/new',
        cta: 'ยื่นต่ออายุ',
      },
    ];
  }
  return [
    {
      tone: 'info',
      title:
        p.certStatus === 'N'
          ? 'ร้านยังไม่ได้รับการรับรอง'
          : 'ใบรับรองหมดอายุหรือถูกยกเลิก',
      detail: 'ยื่นคำขอรับรองร้านยาคุณภาพได้เลย',
      href: '/requests/new',
      cta: 'ยื่นคำขอ',
    },
  ];
}
