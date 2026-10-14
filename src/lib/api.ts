// จุดเดียวที่ดึงข้อมูล — PoC คืนค่าจาก mock
// ตอนต่อ backend ให้แก้แค่ไฟล์นี้เป็น fetch(`${process.env.NEXT_PUBLIC_API_URL}/...`)
import type {
  AccRequest,
  LoginResponse,
  Pharmacy,
  Registration,
  RequestDraft,
} from '@/types/api';
import { pharmacies, seedRequests, users } from '@/mock';
import { requestTypes } from '@/lib/constants';
import { isAlive, nextRequestNo, requiredDocs } from '@/lib/requestRules';

// PoC: คำขอที่ยื่นระหว่าง demo เก็บใน sessionStorage ของแท็บ
// สลับ role ผ่าน "Demo role" ในแท็บเดียวกันแล้วเห็นข้อมูลชุดเดียวกัน
const REQUESTS_KEY = 'accpharm_requests';

function loadRequests(): AccRequest[] {
  try {
    const stored = sessionStorage.getItem(REQUESTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // sessionStorage ใช้ไม่ได้หรือข้อมูลเสีย — กลับไปใช้ seed
  }
  return seedRequests;
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

  requests: {
    /** เรียงใหม่สุดก่อน */
    async list(filter: { pharmacyId?: number } = {}): Promise<AccRequest[]> {
      return loadRequests()
        .filter(
          (r) =>
            !('pharmacyId' in filter) || r.pharmacyId === filter.pharmacyId,
        )
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    },

    async create(draft: RequestDraft, pharmacyId: number): Promise<AccRequest> {
      const all = loadRequests();
      if (all.some((r) => r.pharmacyId === pharmacyId && isAlive(r.status)))
        throw new Error('ร้านนี้มีคำขอที่กำลังดำเนินการอยู่');
      const now = new Date();
      // เวลาท้องถิ่น (ตรงกับ seed) ไม่ใช่ UTC
      const at = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 19);
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
