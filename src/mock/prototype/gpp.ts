// รอบและผลประเมิน GPP สมมติ — ใช้เฉพาะหน้าต้นแบบ
import { assessors } from '@/mock';
import { protoPharmacies, provinces } from './pharmacies';

export interface GppRound {
  id: string;
  province: string;
  year: number;
  open: boolean;
}
export interface GppResult {
  pharmacyId: number;
  roundId: string;
  score: number;
  assessedAt: string;
  assessor: string;
}

/** เกณฑ์ผ่าน (%) */
export const GPP_PASS = 70;

export const gppRounds: GppRound[] = provinces.flatMap((province, i) => [
  { id: `g69-${i}`, province, year: 2569, open: true },
  { id: `g68-${i}`, province, year: 2568, open: false },
]);

const roundOf = (province: string) =>
  gppRounds.find((r) => r.province === province && r.year === 2569)!;

export const gppResults: GppResult[] = protoPharmacies
  .filter((_, i) => i % 2 === 0)
  .map((p, i) => ({
    pharmacyId: p.id,
    roundId: roundOf(p.province).id,
    score: 55 + ((i * 17) % 44),
    assessedAt: `2026-0${6 + (i % 4)}-${String(5 + ((i * 3) % 20)).padStart(2, '0')}`,
    assessor: assessors[i % assessors.length].name,
  }));
