// จุดเดียวที่ดึงข้อมูล — PoC คืนค่าจาก mock
// ตอนต่อ backend ให้แก้แค่ไฟล์นี้เป็น fetch(`${process.env.NEXT_PUBLIC_API_URL}/...`)
import type {
  AccRequest,
  ActionInput,
  ActionResult,
  Assessor,
  GppAssessment,
  LoginResponse,
  Pharmacy,
  Registration,
  RequestAction,
  RequestDraft,
  User,
} from '@/types/api';
import { assessors, pharmacies, seedRequests, users } from '@/mock';
import { requestTypes } from '@/lib/constants';
import { gppSections } from '@/lib/gppItems';
import { scoreGpp } from '@/lib/gppRules';
import {
  applyAction,
  canAddPayment,
  canView,
  isAlive,
  nextRequestNo,
  requiredDocs,
} from '@/lib/requestRules';

// PoC: คำขอที่ยื่นระหว่าง demo เก็บใน sessionStorage ของแท็บ
// สลับ role ผ่าน "Demo role" ในแท็บเดียวกันแล้วเห็นข้อมูลชุดเดียวกัน
const REQUESTS_KEY = 'accpharm_requests';

function loadRequests(): AccRequest[] {
  try {
    const stored = sessionStorage.getItem(REQUESTS_KEY);
    // คำขอที่บันทึกก่อนมี F2 ไม่มี assessorIds/payments — เติมค่าว่างให้
    if (stored)
      return (JSON.parse(stored) as AccRequest[]).map((r) => ({
        ...r,
        assessorIds: r.assessorIds ?? [],
        payments: r.payments ?? [],
      }));
  } catch {
    // sessionStorage ใช้ไม่ได้หรือข้อมูลเสีย — กลับไปใช้ seed
  }
  return seedRequests;
}

/** เวลาท้องถิ่น YYYY-MM-DDTHH:mm:ss (ตรงกับ seed) ไม่ใช่ UTC */
function localNow(now = new Date()) {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);
}

/** แทนคำขอ id นี้ด้วยชุดใหม่แล้วบันทึก (ไม่แก้ object เดิม) */
function replaceRequest(all: AccRequest[], next: AccRequest) {
  saveRequests(all.map((r) => (r.id === next.id ? next : r)));
}

function saveRequests(list: AccRequest[]) {
  try {
    sessionStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
  } catch {
    // PoC: บันทึกไม่ได้ก็ยังใช้งานต่อได้ แค่ข้อมูลไม่คงอยู่
  }
}

export const api = {
  auth: {
    // PoC: ไม่ตรวจรหัสผ่าน — ระบบจริงตรวจที่ API แล้วคืน JWT
    async login({ username }: { username: string }): Promise<LoginResponse> {
      const user = users.find((u) => u.username === username.trim());
      if (!user) return { success: false, error: 'ไม่พบชื่อผู้ใช้นี้' };
      return { success: true, user, token: `mock-${user.id}` };
    },
  },

  pharmacies: {
    async list(): Promise<Pharmacy[]> {
      return pharmacies;
    },
    async get(id: number): Promise<Pharmacy | null> {
      return pharmacies.find((p) => p.id === id) ?? null;
    },
  },

  assessors: {
    async list(): Promise<Assessor[]> {
      return assessors;
    },
  },

  requests: {
    /** เรียงใหม่สุดก่อน — ใส่ key ไว้แต่ค่าเป็น undefined = ไม่เห็นอะไรเลย (fail closed) */
    async list(
      filter: { pharmacyId?: number; assessorId?: number } = {},
    ): Promise<AccRequest[]> {
      return loadRequests()
        .filter(
          (r) =>
            (!('pharmacyId' in filter) || r.pharmacyId === filter.pharmacyId) &&
            (!('assessorId' in filter) ||
              (filter.assessorId !== undefined &&
                r.assessorIds.includes(filter.assessorId))),
        )
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    },

    /** null เมื่อไม่มีคำขอนี้ หรือผู้ใช้ไม่มีสิทธิ์ดู (ไม่บอกว่ามีอยู่) */
    async get(id: string, user: User): Promise<AccRequest | null> {
      const req = loadRequests().find((r) => r.id === id);
      return req && canView(req, user) ? req : null;
    },

    async act(
      id: string,
      action: RequestAction,
      input: ActionInput,
      user: User,
    ): Promise<ActionResult> {
      const all = loadRequests();
      const req = all.find((r) => r.id === id);
      if (!req || !canView(req, user)) return { error: 'ไม่พบคำขอ' };
      if (action === 'submit_assessment' && input.assessment) {
        const score = scoreGpp(gppSections, input.assessment.answers);
        if (score.missing.length)
          return {
            error: `ยังไม่ได้ประเมิน ${score.missing.length} ข้อ`,
            field: 'assessment',
          };
        input = { ...input, gppScore: score.percent };
      }
      const res = applyAction(
        req,
        action,
        input,
        { name: user.name, role: user.role },
        localNow(),
      );
      if ('request' in res) replaceRequest(all, res.request);
      return res;
    },

    async addPayment(
      id: string,
      payment: { amount: number; fileName: string },
      user: User,
    ): Promise<ActionResult> {
      const all = loadRequests();
      const req = all.find((r) => r.id === id);
      if (!req || !canAddPayment(req, user))
        return { error: 'เพิ่มหลักฐานการโอนไม่ได้ในสถานะนี้' };
      const request = {
        ...req,
        payments: [...req.payments, { ...payment, paidAt: localNow() }],
      };
      replaceRequest(all, request);
      return { request };
    },

    async create(draft: RequestDraft, pharmacyId: number): Promise<AccRequest> {
      const all = loadRequests();
      if (all.some((r) => r.pharmacyId === pharmacyId && isAlive(r.status)))
        throw new Error('ร้านนี้มีคำขอที่กำลังดำเนินการอยู่');
      const now = new Date();
      const at = localNow(now);
      const req: AccRequest = {
        id: `r${now.getTime()}`,
        no: nextRequestNo(
          draft.typeIds,
          all.map((r) => r.no),
          now,
        ),
        pharmacyId,
        typeIds: draft.typeIds,
        changeMode: draft.typeIds.includes(5) ? draft.changeMode : undefined,
        submittedAt: at,
        status: 'submitted',
        applicant: draft.applicant,
        assessorIds: [],
        payments: [],
        // เก็บเฉพาะเอกสารที่ประเภทคำขอปัจจุบันต้องใช้ (ร่างอาจมีไฟล์ค้างจากประเภทที่เลือกออกไปแล้ว)
        docs: requiredDocs(draft.typeIds, requestTypes)
          .filter((type) => draft.docs[type])
          .map((type) => ({
            type,
            name: draft.docs[type],
            uploadedAt: at.slice(0, 10),
          })),
        messages: [
          { from: 'ระบบ', at, text: 'ได้รับคำขอแล้ว', status: 'submitted' },
        ],
      };
      saveRequests([req, ...all]);
      return req;
    },
  },

  // PoC: ร่างผลประเมินเก็บใน sessionStorage ต่อคำขอ — ระบบจริงบันทึกที่ API
  assessmentDrafts: {
    load(requestId: string): GppAssessment | null {
      try {
        const raw = sessionStorage.getItem(`accpharm_gpp_${requestId}`);
        return raw ? (JSON.parse(raw) as GppAssessment) : null;
      } catch {
        return null;
      }
    },
    save(requestId: string, draft: GppAssessment) {
      try {
        sessionStorage.setItem(
          `accpharm_gpp_${requestId}`,
          JSON.stringify(draft),
        );
      } catch {
        // บันทึกร่างไม่ได้ก็ยังกรอกต่อได้
      }
    },
    clear(requestId: string) {
      try {
        sessionStorage.removeItem(`accpharm_gpp_${requestId}`);
      } catch {
        // ไม่มีร่างให้ลบ
      }
    },
  },

  fda: {
    // PoC: ระบบเดิมเรียก SOAP ของ อย. — ที่นี่คืนข้อมูลตัวอย่างเมื่อรูปแบบเลขถูกต้อง
    async lookup(licenseNo: string): Promise<Registration | null> {
      const no = licenseNo.trim();
      if (!/^[ก-๙]{2,3}\.\s?\d+\/\d{4}$/.test(no)) return null;
      return {
        licenseNo: no,
        name: 'ร้านยาตัวอย่าง',
        address: '1 ถ.ตัวอย่าง ต.ตัวอย่าง อ.เมือง',
        province: 'นนทบุรี',
        licensee: 'ภก.ตัวอย่าง ทดลอง',
        operator: 'ภก.ตัวอย่าง ทดลอง',
        operatorLicense: 'ภ.00000',
        phone: '',
        email: '',
      };
    },
  },

  registrations: {
    // PoC: ไม่บันทึกจริง — ระบบจริงส่งให้ สรร. อนุมัติ (RegisterList)
    async create(input: Registration): Promise<{ success: true }> {
      void input;
      return { success: true };
    },
  },
};
