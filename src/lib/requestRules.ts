// กฎของคำขอรับรอง — pure function ไม่มี import ที่เป็นค่า (type ถูกลบตอนรัน)
// จึงรันเทสต์ด้วย node --test ได้ตรง ๆ
import type {
  AccRequest,
  ActionInput,
  ActionResult,
  Pharmacy,
  RequestAction,
  RequestDraft,
  RequestMessage,
  RequestStatus,
  RequestType,
  UserRole,
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

// ---------- F2: การทำงานกับคำขอ ----------

// ponytail: ตารางสถานะเป็นของชั่วคราว ประกอบจาก AdminManual + RequestDetail.aspx.vb
// ต้องเทียบกับตาราง AssessmentStatus ใน DB ระบบเดิมก่อนต่อ backend — แก้ที่ FLOW จุดเดียว
type Step = {
  action: RequestAction;
  by: 'staff' | 'pharmacy' | 'assessor';
  to: RequestStatus;
};

const FLOW: Partial<Record<RequestStatus, Step[]>> = {
  submitted: [{ action: 'start_review', by: 'staff', to: 'doc_review' }],
  doc_review: [
    { action: 'request_docs', by: 'staff', to: 'need_docs' },
    { action: 'assign', by: 'staff', to: 'assigned' },
  ],
  need_docs: [{ action: 'resubmit_docs', by: 'pharmacy', to: 'doc_review' }],
  assigned: [{ action: 'submit_assessment', by: 'assessor', to: 'assessed' }],
  assessed: [{ action: 'to_committee', by: 'staff', to: 'committee' }],
  committee: [
    { action: 'approve', by: 'staff', to: 'approved' },
    { action: 'reject', by: 'staff', to: 'rejected' },
  ],
};

const STAFF: UserRole[] = ['admin', 'superadmin'];

/** ร้านยายกเลิก/เพิ่มสลิปได้เฉพาะก่อนมอบหมายผู้ตรวจ (ระบบเดิม: status < 30) */
const BEFORE_ASSIGN: RequestStatus[] = ['submitted', 'doc_review', 'need_docs'];

/** action ที่ role นี้ทำได้ในสถานะนี้ — ปุ่มบนหน้าและการตรวจสิทธิ์ใช้ชุดเดียวกัน */
export function actionsFor(
  status: RequestStatus,
  role: UserRole,
): RequestAction[] {
  const staff = STAFF.includes(role);
  const out = (FLOW[status] ?? [])
    .filter((s) => (s.by === 'staff' ? staff : role === s.by))
    .map((s) => s.action);
  if (staff && isAlive(status)) out.push('reply', 'cancel');
  if (role === 'pharmacy' && BEFORE_ASSIGN.includes(status)) out.push('cancel');
  if (staff) out.push('override');
  return out;
}

/** action ที่ต้องมีข้อความ และ error เมื่อไม่ได้กรอก */
const NEEDS_TEXT: Partial<Record<RequestAction, string>> = {
  request_docs: 'กรอกเอกสารที่ขอเพิ่ม',
  reply: 'กรอกข้อความ',
  reject: 'กรอกเหตุผล',
  cancel: 'กรอกเหตุผล',
  override: 'กรอกเหตุผล',
};

/** ข้อความใน timeline เมื่อ action ไม่มีข้อความจากผู้ใช้ */
const DEFAULT_TEXT: Partial<Record<RequestAction, string>> = {
  start_review: 'อยู่ระหว่างการดำเนินการตรวจสอบเอกสาร',
  assign: 'มอบหมายผู้ตรวจประเมินแล้ว',
  resubmit_docs: 'ส่งเอกสารเพิ่มเติมแล้ว',
  submit_assessment: 'ผู้ตรวจส่งผลการตรวจประเมิน GPP แล้ว',
  to_committee:
    'สรร. ได้ตรวจประเมินเรียบร้อยแล้ว อยู่ระหว่างยื่นคณะกรรมการรับรอง',
  approve: 'ผ่านคณะกรรมการรับรองแล้ว',
};

/** ทำ action แล้วคืนคำขอชุดใหม่ (ไม่แก้ req เดิม) หรือ error พร้อมช่องที่ผิด */
export function applyAction(
  req: AccRequest,
  action: RequestAction,
  input: ActionInput,
  actor: { name: string; role: UserRole },
  now: string,
): ActionResult {
  if (!actionsFor(req.status, actor.role).includes(action))
    return { error: 'ทำรายการนี้ไม่ได้ในสถานะปัจจุบัน' };

  const patch: Partial<AccRequest> = {};
  let status =
    FLOW[req.status]?.find((s) => s.action === action)?.to ?? req.status;

  if (action === 'assign') {
    if (!input.assessorIds?.length)
      return { error: 'เลือกผู้ตรวจอย่างน้อย 1 คน', field: 'assessorIds' };
    patch.assessorIds = input.assessorIds;
  }
  if (action === 'submit_assessment') {
    if (!input.assessment || input.gppScore === undefined)
      return { error: 'ยังไม่มีผลประเมิน', field: 'assessment' };
    patch.assessment = { ...input.assessment, by: actor.name, at: now };
    patch.gppScore = input.gppScore;
  }
  if (action === 'resubmit_docs') {
    if (!input.newDocs?.length)
      return { error: 'แนบไฟล์ใหม่อย่างน้อย 1 ไฟล์', field: 'newDocs' };
    patch.docs = [...req.docs, ...input.newDocs];
  }
  if (action === 'override') {
    if (!input.status || input.status === req.status)
      return { error: 'เลือกสถานะที่ต่างจากสถานะปัจจุบัน', field: 'status' };
    status = input.status;
  }
  if (action === 'cancel') status = 'cancelled';

  const text = input.message?.trim() ?? '';
  const needs = NEEDS_TEXT[action];
  if (needs && !text) return { error: needs, field: 'message' };

  const message: RequestMessage = {
    from: actor.name,
    at: now,
    text: text || DEFAULT_TEXT[action] || '',
    status,
    ...(action === 'override' ? { override: true } : {}),
  };
  return {
    request: {
      ...req,
      ...patch,
      status,
      messages: [...req.messages, message],
    },
  };
}

type Viewer = { id: number; role: UserRole; pharmacyId?: number };

/** ใครเปิดคำขอนี้ได้ — ร้านยาเฉพาะร้านตัวเอง, ผู้ตรวจเฉพาะที่ได้รับมอบหมาย */
export function canView(req: AccRequest, user: Viewer): boolean {
  if (STAFF.includes(user.role)) return true;
  if (user.role === 'pharmacy')
    return user.pharmacyId !== undefined && req.pharmacyId === user.pharmacyId;
  if (user.role === 'assessor') return req.assessorIds.includes(user.id);
  return false;
}

/** ร้านยาเจ้าของคำขอเพิ่มสลิปได้ก่อนมอบหมายผู้ตรวจ */
export function canAddPayment(req: AccRequest, user: Viewer): boolean {
  return (
    user.role === 'pharmacy' &&
    canView(req, user) &&
    BEFORE_ASSIGN.includes(req.status)
  );
}
