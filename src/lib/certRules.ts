// กฎใบรับรองร้านยาคุณภาพ — pure function รันเทสต์ด้วย node --test ได้ตรง ๆ
import type { AccRequest, Pharmacy } from '@/types/api';

/** อายุใบรับรอง (ปี) */
export const CERT_YEARS = 3;

/** วันหมดอายุ = วันออก + n ปี - 1 วัน เช่น 2024-05-10 → 2027-05-09 (ตามข้อมูลระบบเดิม) */
export function certExpiry(issued: string, years = CERT_YEARS): string {
  const [y, m, d] = issued.split('-').map(Number);
  const end = new Date(Date.UTC(y + years, m - 1, d - 1));
  return end.toISOString().slice(0, 10);
}

/** เลขรับรอง running ต่อปี พ.ศ. เช่น QP-2569-0001 */
export function nextCertNo(existing: string[], issued: string): string {
  const be = Number(issued.slice(0, 4)) + 543;
  const prefix = `QP-${be}-`;
  const seqs = existing
    .filter((no) => no.startsWith(prefix))
    .map((no) => Number(no.slice(prefix.length)) || 0);
  return `${prefix}${String(Math.max(0, ...seqs) + 1).padStart(4, '0')}`;
}

/** ตรวจวันที่ที่กรอก คืนข้อความ error หรือ null */
export function certDateError(issued: string, expires: string): string | null {
  if (!issued) return 'กรอกวันที่ออกใบรับรอง';
  if (!expires) return 'กรอกวันหมดอายุ';
  if (expires <= issued) return 'วันหมดอายุต้องหลังวันที่ออก';
  return null;
}

/** ข้อมูลร้านที่รวมใบรับรองใหม่จากคำขอที่ผ่านแล้ว (ใบล่าสุดชนะ) */
export function withLatestCert(p: Pharmacy, reqs: AccRequest[]): Pharmacy {
  const latest = reqs
    .filter((r) => r.pharmacyId === p.id && r.cert)
    .sort((a, b) => b.cert!.issued.localeCompare(a.cert!.issued))[0]?.cert;
  if (!latest || (p.certIssued && p.certIssued > latest.issued)) return p;
  return {
    ...p,
    qualityNo: latest.no,
    certStatus: 'A',
    certIssued: latest.issued,
    certExpires: latest.expires,
  };
}
