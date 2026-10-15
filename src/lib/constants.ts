// ค่าคงที่ทางธุรกิจที่ frontend ถือเอง — ไม่ใช่ข้อมูลจาก backend จึงไม่อยู่ใน mock/
import type {
  ApplicantRelation,
  CertStatus,
  RequestAction,
  RequestStatus,
  RequestType,
} from '@/types/api';

export const requestStatusLabels: Record<RequestStatus, string> = {
  submitted: 'รอดำเนินการ',
  doc_review: 'อยู่ระหว่างตรวจสอบเอกสาร',
  need_docs: 'ขอเอกสารเพิ่มเติม',
  assigned: 'มอบหมายผู้ตรวจแล้ว',
  assessed: 'รอผู้ประเมินตรวจสอบ',
  committee: 'รอคณะกรรมการรับรอง',
  approved: 'ผ่านการรับรอง',
  rejected: 'ไม่ผ่านการรับรอง',
  cancelled: 'ยกเลิกคำขอ',
};

export const certStatusLabels: Record<CertStatus, string> = {
  N: 'ยังไม่ได้รับรอง',
  A: 'รับรองแล้ว',
  E: 'หมดอายุ',
  X: 'ถูกยกเลิก',
};

export const relationLabels: Record<ApplicantRelation, string> = {
  1: 'ผู้ดำเนินกิจการ / ผู้รับอนุญาต',
  2: 'ผู้รับอนุญาต + เภสัชกร',
  3: 'เภสัชกร',
  9: 'อื่น ๆ',
};

const LICENSE = 'สำเนาใบอนุญาตขายยา (ขย.5)';
const NEW_LICENSE = 'สำเนาใบอนุญาตขายยา (ขย.5) ฉบับใหม่';
const FLOOR_PLAN = 'แผนผังร้าน';
const PHOTOS = 'ภาพถ่ายหน้าร้านและบริเวณจ่ายยา';

// ponytail: checklist เอกสารเป็นร่าง — ระบบเดิมเก็บประเภทเอกสารใน DB (Document_GetCategory)
// และไม่ได้ผูกกับประเภทคำขอ ให้ สรร. ยืนยันรายการจริงก่อนต่อ backend
export const requestTypes: RequestType[] = [
  {
    id: 1,
    code: 'NEW',
    label: 'ขอรับรองใหม่',
    hint: 'ร้านที่ยังไม่เคยได้รับการรับรองร้านยาคุณภาพ',
    docs: [LICENSE, FLOOR_PLAN, PHOTOS],
  },
  {
    id: 7,
    code: 'NEW',
    label: 'ขอรับรองใหม่ แบบมีเงื่อนไข',
    hint: 'ร้านที่ยังไม่ครบบางเกณฑ์ และจะปรับปรุงภายในเวลาที่กำหนด',
    docs: [LICENSE, FLOOR_PLAN, PHOTOS, 'แผนการปรับปรุงร้าน'],
  },
  {
    id: 2,
    code: 'REN',
    label: 'ต่ออายุ',
    hint: 'ใบรับรองเดิมใกล้หมดอายุหรือหมดอายุแล้ว',
    docs: [LICENSE, 'สำเนาใบรับรองร้านยาคุณภาพฉบับเดิม'],
  },
  {
    id: 3,
    code: 'CHG',
    label: 'ย้าย หรือ เปลี่ยนสถานที่',
    hint: 'ร้านย้ายไปที่ตั้งใหม่',
    docs: [NEW_LICENSE, FLOOR_PLAN],
  },
  {
    id: 4,
    code: 'CHG',
    label: 'เพิ่ม/เปลี่ยนผู้มีหน้าที่ปฏิบัติการ',
    hint: 'เพิ่มหรือเปลี่ยนเภสัชกรประจำร้าน',
    docs: ['หนังสือแต่งตั้งเภสัชกร', 'สำเนาใบอนุญาตประกอบวิชาชีพ'],
  },
  {
    id: 5,
    code: 'CHG',
    label: 'เปลี่ยนผู้ดำเนินกิจการ/ผู้รับอนุญาต (สถานที่เดิม)',
    hint: 'เปลี่ยนเจ้าของหรือผู้รับอนุญาต ร้านอยู่ที่เดิม',
    docs: [NEW_LICENSE, 'หลักฐานการเปลี่ยนผู้รับอนุญาต'],
  },
  {
    id: 6,
    code: 'CHG',
    label: 'เปลี่ยนชื่อร้านยา',
    hint: 'สถานที่ ผู้รับอนุญาต และเภสัชกรคงเดิม',
    docs: [NEW_LICENSE],
  },
  {
    id: 8,
    code: 'CHG',
    label: 'เปลี่ยนแปลงเวลาผู้มีหน้าที่ปฏิบัติการ',
    hint: 'เปลี่ยนเวลาปฏิบัติงานของเภสัชกร',
    docs: ['ตารางเวลาปฏิบัติการใหม่'],
  },
];

/** ชื่อประเภทคำขอคั่นด้วย ", " — ข้าม id ที่ไม่รู้จัก */
export const typeLabel = (ids: number[]) =>
  ids
    .map((id) => requestTypes.find((t) => t.id === id)?.label)
    .filter(Boolean)
    .join(', ');

/** คำรับรองของผู้ยื่นคำขอ (Request.aspx ส่วน pnPolicy) */
export const pledgeItems = [
  'ไม่มีการจำหน่ายยาออนไลน์',
  'จัดให้มีเภสัชกรปฏิบัติหน้าที่ตลอดเวลาปฏิบัติการ (ตามใบอนุญาต ขย.5)',
  'ปฏิบัติหน้าที่และให้บริการแก่ผู้มารับบริการ ตาม พ.ร.บ.ยา และ พ.ร.บ.วิชาชีพเภสัชกรรม',
  'ร้านจะจำหน่ายเฉพาะยาสามัญประจำบ้านให้แก่ร้านชำ',
];

export const pledgeWarning =
  'หากตรวจพบภายหลังว่าคุณสมบัติไม่เป็นไปตามที่กำหนด หรือไม่ปฏิบัติตามคำรับรอง สำนักงานรับรองร้านยาคุณภาพสามารถยกเลิกการรับรอง หรือคืนคำขอโดยไม่พิจารณาได้';

export const actionLabels: Record<RequestAction, string> = {
  start_review: 'รับตรวจเอกสาร',
  request_docs: 'ขอเอกสารเพิ่มเติม',
  assign: 'มอบหมายผู้ตรวจ',
  resubmit_docs: 'ส่งเอกสารเพิ่มแล้ว',
  to_committee: 'ส่งคณะกรรมการ',
  approve: 'ผ่านการรับรอง',
  reject: 'ไม่ผ่าน',
  reply: 'ตอบกลับร้านยา',
  cancel: 'ยกเลิกคำขอ',
  override: 'เปลี่ยนสถานะอื่น',
};

export const doneLabels: Record<RequestAction, string> = {
  start_review: 'รับตรวจเอกสารแล้ว',
  request_docs: 'ส่งคำขอเอกสารเพิ่มเติมแล้ว',
  assign: 'มอบหมายผู้ตรวจแล้ว',
  resubmit_docs: 'ส่งเอกสารเพิ่มเติมแล้ว',
  to_committee: 'ส่งคณะกรรมการแล้ว',
  approve: 'บันทึกผ่านการรับรองแล้ว',
  reject: 'บันทึกไม่ผ่านการรับรองแล้ว',
  reply: 'ส่งข้อความถึงร้านยาแล้ว',
  cancel: 'ยกเลิกคำขอแล้ว',
  override: 'เปลี่ยนสถานะแล้ว',
};

/** template ข้อความตอบกลับ (TemplateText ของระบบเดิม ตาม AdminManual ข้อ 13) */
export const replyTemplates = [
  'อยู่ระหว่างการดำเนินการตรวจสอบเอกสาร',
  'กรุณาส่งเอกสารเพิ่มเติม ดังนี้',
  'สรร. ได้ตรวจประเมินเรียบร้อยแล้ว อยู่ระหว่างยื่นคณะกรรมการรับรอง',
  'ผ่านคณะกรรมการรับรองแล้ว เมื่อวันที่',
];
