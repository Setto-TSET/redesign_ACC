// คิดคะแนน GPP — pure function รับข้อประเมินเป็นพารามิเตอร์ จึงรันเทสต์ด้วย node --test ได้ตรง ๆ
// สูตรตาม CalculateScore() ใน AsmGPP.aspx.vb ของระบบเดิม
import type { GppAnswer, GppSection } from '@/types/api';

/** ponytail: เกณฑ์ผ่านสมมติไว้ 80% — ระบบเดิมคิด FinalResult ใน stored procedure ต้องยืนยันกับ สรร. */
export const GPP_PASS_PERCENT = 80;

export interface ScorePart {
  got: number;
  max: number;
  /** ร้อยละ ทศนิยม 2 ตำแหน่ง (max = 0 → 0) */
  percent: number;
}

export interface GppScore extends ScorePart {
  sections: (ScorePart & { id: number; title: string })[];
  /** จำนวนข้อที่ตอบแล้ว / ทั้งหมด */
  answered: number;
  total: number;
  /** ข้อที่ยังไม่ได้ตอบ */
  missing: string[];
  /** ข้อ Critical ที่ได้ 0 */
  criticalFails: string[];
  passed: boolean;
}

const pct = (got: number, max: number) =>
  max ? Math.round((got / max) * 10000) / 100 : 0;

/**
 * คะแนนข้อ = ระดับ × น้ำหนัก, คะแนนเต็มข้อ = ระดับสูงสุด × น้ำหนัก
 * ข้อที่เลือก "ไม่มี" ไม่นับคะแนนเต็ม ข้อที่ยังไม่ตอบได้ 0 แต่นับคะแนนเต็ม
 */
export function scoreGpp(
  sections: GppSection[],
  answers: Record<string, GppAnswer | undefined>,
): GppScore {
  const missing: string[] = [];
  const criticalFails: string[] = [];
  let total = 0;

  const parts = sections.map((s) => {
    let got = 0;
    let max = 0;
    for (const item of s.items) {
      total++;
      const level = answers[item.id]?.level;
      if (level === undefined) missing.push(item.id);
      if (level === 'na' && item.canNa) continue;
      max += Math.max(...item.levels) * item.weight;
      if (typeof level === 'number') {
        got += level * item.weight;
        if (item.critical && level === 0) criticalFails.push(item.id);
      }
    }
    return { id: s.id, title: s.title, got, max, percent: pct(got, max) };
  });

  const got = parts.reduce((n, p) => n + p.got, 0);
  const max = parts.reduce((n, p) => n + p.max, 0);
  const percent = pct(got, max);
  return {
    got,
    max,
    percent,
    sections: parts,
    answered: total - missing.length,
    total,
    missing,
    criticalFails,
    passed: missing.length === 0 && percent >= GPP_PASS_PERCENT,
  };
}
