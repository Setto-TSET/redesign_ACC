// รายงานต้นแบบ — คำนวณจากข้อมูลสมมติ (ไม่ใช่ตัวเลขตายตัว)
import { seedRequests } from '@/mock';
import {
  certStatusLabels,
  requestStatusLabels,
  typeLabel,
} from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { RequestStatus } from '@/types/api';
import { complaints, complaintStageLabels, stageOfStep } from './complaints';
import { GPP_PASS, gppResults } from './gpp';
import { findPharmacy, protoPharmacies } from './pharmacies';

export type ReportKind =
  'requests' | 'pharmacies' | 'expiring' | 'gpp' | 'complaints';

export const reportKinds: { key: ReportKind; label: string; excel: string }[] =
  [
    {
      key: 'requests',
      label: 'คำขอตามสถานะ',
      excel: 'ไฟล์ .xlsx 1 sheet: เลขที่คำขอ, ร้าน, ประเภท, สถานะ, วันที่ยื่น',
    },
    {
      key: 'pharmacies',
      label: 'ร้านยาตามจังหวัด',
      excel: 'ไฟล์ .xlsx 1 sheet: ร้าน, จังหวัด, สถานะใบรับรอง, วันหมดอายุ',
    },
    {
      key: 'expiring',
      label: 'ใบรับรองใกล้หมดอายุ',
      excel: 'ไฟล์ .xlsx 1 sheet: ร้าน, จังหวัด, วันหมดอายุ, เหลืออีก (วัน)',
    },
    {
      key: 'gpp',
      label: 'ผลประเมิน GPP',
      excel: 'ไฟล์ .xlsx 1 sheet: ร้าน, จังหวัด, คะแนน, ผล, วันที่ประเมิน',
    },
    {
      key: 'complaints',
      label: 'ข้อร้องเรียน',
      excel:
        'ไฟล์ .xlsx 1 sheet: เลขที่, ร้าน, ขั้นตอน, ระดับ, วันที่รับเรื่อง',
    },
  ];

export interface ReportData {
  cards: { label: string; value: number }[];
  chart: { name: string; value: number }[];
  columns: string[];
  rows: (string | number)[][];
}

interface Filter {
  from?: string;
  to?: string;
  province?: string;
}

interface Req {
  no: string;
  pharmacyId: number;
  typeIds: number[];
  status: RequestStatus;
  submittedAt: string;
}

const statuses = Object.keys(requestStatusLabels) as RequestStatus[];
const typeIdPool = [1, 7, 2, 3];

// คำขอสมมติ 30 รายการกระจายเดือนและสถานะ เพื่อให้กราฟมีเนื้อ
const sampleRequests: Req[] = Array.from({ length: 30 }, (_, i) => ({
  no: `SMP-69${String(i + 1).padStart(5, '0')}`,
  pharmacyId: protoPharmacies[(i * 7) % protoPharmacies.length].id,
  typeIds: [typeIdPool[i % typeIdPool.length]],
  status: statuses[(i * 5) % statuses.length],
  submittedAt: `2026-0${1 + (i % 9)}-${String(2 + ((i * 4) % 26)).padStart(2, '0')}T09:00:00`,
}));

const allRequests: Req[] = [...seedRequests, ...sampleRequests];

const day = (iso: string) => iso.slice(0, 10);
const inRange = (iso: string, f: Filter) =>
  (!f.from || day(iso) >= f.from) && (!f.to || day(iso) <= f.to);
const provOk = (province: string, f: Filter) =>
  !f.province || f.province === 'all' || province === f.province;

const localIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const DAY_MS = 86_400_000;

const gppBands = [
  ['50–59', 50, 59],
  ['60–69', 60, 69],
  ['70–79', 70, 79],
  ['80–89', 80, 89],
  ['90–100', 90, 100],
] as const;

export const buildReport = (kind: ReportKind, f: Filter): ReportData => {
  const prov = (id: number) => findPharmacy(id)?.province ?? '-';
  const shop = (id: number) => findPharmacy(id)?.name ?? '-';

  if (kind === 'requests') {
    const items = allRequests.filter(
      (r) => inRange(r.submittedAt, f) && provOk(prov(r.pharmacyId), f),
    );
    const n = (...ss: RequestStatus[]) =>
      items.filter((r) => ss.includes(r.status)).length;
    return {
      cards: [
        { label: 'คำขอทั้งหมด', value: items.length },
        {
          label: 'กำลังดำเนินการ',
          value: n(
            'submitted',
            'doc_review',
            'need_docs',
            'assigned',
            'assessed',
            'committee',
          ),
        },
        { label: 'ผ่านการรับรอง', value: n('approved') },
        { label: 'ไม่ผ่าน / ยกเลิก', value: n('rejected', 'cancelled') },
      ],
      chart: statuses.map((s) => ({
        name: requestStatusLabels[s],
        value: n(s),
      })),
      columns: ['เลขที่คำขอ', 'ร้าน', 'ประเภท', 'สถานะ', 'วันที่ยื่น'],
      rows: items.map((r) => [
        r.no,
        shop(r.pharmacyId),
        typeLabel(r.typeIds),
        requestStatusLabels[r.status],
        formatDate(r.submittedAt),
      ]),
    };
  }

  if (kind === 'pharmacies') {
    const items = protoPharmacies.filter((p) => provOk(p.province, f));
    const names = [...new Set(items.map((p) => p.province))].sort((a, b) =>
      a.localeCompare(b, 'th'),
    );
    return {
      cards: [
        { label: 'ร้านทั้งหมด', value: items.length },
        {
          label: 'รับรองแล้ว',
          value: items.filter((p) => p.certStatus === 'A').length,
        },
        {
          label: 'หมดอายุ',
          value: items.filter((p) => p.certStatus === 'E').length,
        },
        { label: 'จังหวัด', value: names.length },
      ],
      chart: names.map((name) => ({
        name,
        value: items.filter((p) => p.province === name).length,
      })),
      columns: ['ร้าน', 'จังหวัด', 'สถานะใบรับรอง', 'วันหมดอายุ'],
      rows: items.map((p) => [
        p.name,
        p.province,
        certStatusLabels[p.certStatus],
        formatDate(p.certExpires),
      ]),
    };
  }

  if (kind === 'expiring') {
    const now = new Date();
    const today = localIso(now);
    const limit = localIso(new Date(now.getTime() + 90 * DAY_MS));
    const items = protoPharmacies
      .filter(
        (p) =>
          p.certExpires &&
          p.certExpires >= today &&
          p.certExpires <= limit &&
          provOk(p.province, f),
      )
      .sort((a, b) => a.certExpires!.localeCompare(b.certExpires!));
    const left = (iso: string) =>
      Math.round(
        (new Date(`${iso}T00:00:00`).getTime() -
          new Date(`${today}T00:00:00`).getTime()) /
          DAY_MS,
      );
    const months = [...new Set(items.map((p) => p.certExpires!.slice(0, 7)))];
    const within30 = items.filter((p) => left(p.certExpires!) <= 30).length;
    return {
      cards: [
        { label: 'ใกล้หมดอายุ (90 วัน)', value: items.length },
        { label: 'ภายใน 30 วัน', value: within30 },
        { label: 'ภายใน 31–90 วัน', value: items.length - within30 },
      ],
      chart: months.map((m) => ({
        // เช่น "ธ.ค. 69" — ตัดวันออกจาก formatDate
        name: formatDate(`${m}-01`).replace(/^\d+\s/, ''),
        value: items.filter((p) => p.certExpires!.startsWith(m)).length,
      })),
      columns: ['ร้าน', 'จังหวัด', 'วันหมดอายุ', 'เหลืออีก (วัน)'],
      rows: items.map((p) => [
        p.name,
        p.province,
        formatDate(p.certExpires),
        left(p.certExpires!),
      ]),
    };
  }

  if (kind === 'gpp') {
    const items = gppResults.filter(
      (r) => inRange(r.assessedAt, f) && provOk(prov(r.pharmacyId), f),
    );
    const passed = items.filter((r) => r.score >= GPP_PASS).length;
    const avg = items.length
      ? Math.round(items.reduce((s, r) => s + r.score, 0) / items.length)
      : 0;
    return {
      cards: [
        { label: 'ประเมินแล้ว', value: items.length },
        { label: 'ผ่าน', value: passed },
        { label: 'ไม่ผ่าน', value: items.length - passed },
        { label: 'คะแนนเฉลี่ย (%)', value: avg },
      ],
      chart: gppBands.map(([name, lo, hi]) => ({
        name,
        value: items.filter((r) => r.score >= lo && r.score <= hi).length,
      })),
      columns: ['ร้าน', 'จังหวัด', 'คะแนน (%)', 'ผล', 'วันที่ประเมิน'],
      rows: items.map((r) => [
        shop(r.pharmacyId),
        prov(r.pharmacyId),
        r.score,
        r.score >= GPP_PASS ? 'ผ่าน' : 'ไม่ผ่าน',
        formatDate(r.assessedAt),
      ]),
    };
  }

  const items = complaints.filter(
    (c) =>
      inRange(c.receivedAt, f) &&
      provOk(c.pharmacyId ? prov(c.pharmacyId) : '-', f),
  );
  const closed = items.filter((c) => stageOfStep(c.step) === 'closed').length;
  const stageKeys = Object.keys(
    complaintStageLabels,
  ) as (keyof typeof complaintStageLabels)[];
  return {
    cards: [
      { label: 'ข้อร้องเรียนทั้งหมด', value: items.length },
      { label: 'ปิดแล้ว', value: closed },
      { label: 'อยู่ระหว่างดำเนินการ', value: items.length - closed },
      {
        label: 'ระดับสูง',
        value: items.filter((c) => c.severity === 'สูง').length,
      },
    ],
    chart: stageKeys.map((k) => ({
      name: complaintStageLabels[k],
      value: items.filter((c) => stageOfStep(c.step) === k).length,
    })),
    columns: ['เลขที่', 'ร้าน', 'ขั้นตอน', 'ระดับ', 'วันที่รับเรื่อง'],
    rows: items.map((c) => [
      c.no,
      (c.pharmacyId ? shop(c.pharmacyId) : c.pharmacyText) ?? '-',
      complaintStageLabels[stageOfStep(c.step)],
      c.severity,
      formatDate(c.receivedAt),
    ]),
  };
};
