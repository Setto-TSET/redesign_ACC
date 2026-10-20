import Link from 'next/link';
import type { ReactNode } from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/format';
import { seedRequests } from '@/mock';
import {
  complaintStageLabels,
  complaints,
  stageOfStep,
} from '@/mock/prototype/complaints';
import {
  auditPartLabels,
  overallStatus,
  postAudits,
} from '@/mock/prototype/postAudit';
import type { Pharmacy } from '@/types/api';

const Empty = () => (
  <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
    ยังไม่มีข้อมูล
  </p>
);

const Th = ({ children }: { children: ReactNode }) => (
  <th className="px-3 py-2 font-semibold text-left">{children}</th>
);

export function InfoTab({ shop }: { shop: Pharmacy }) {
  const rows: [string, string][] = [
    ['เลขที่ใบอนุญาต', shop.licenseNo],
    ['ผู้ดำเนินกิจการ', shop.licensee],
    ['ประเภท', shop.type],
    ['ที่อยู่', `${shop.address} จ.${shop.province}`],
    ['โทรศัพท์', shop.phone],
    ['เวลาทำการ', shop.hours],
  ];
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>
            {k}
          </dt>
          <dd className="font-medium break-words tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PharmacistTab({ shop }: { shop: Pharmacy }) {
  if (!shop.pharmacists.length) return <Empty />;
  return (
    <div className="overflow-x-auto relative">
      <table className="w-full text-sm">
        <thead style={{ color: 'var(--ink-tertiary)' }}>
          <tr>
            <Th>ชื่อ</Th>
            <Th>เลขใบประกอบ</Th>
            <Th>หน้าที่</Th>
            <Th>เวลา</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {shop.pharmacists.map((p, i) => (
            <tr key={i}>
              <td className="px-3 py-2 break-words">{p.name}</td>
              <td className="px-3 py-2 tabular-nums">{p.license}</td>
              <td className="px-3 py-2">{p.role}</td>
              <td className="px-3 py-2 tabular-nums">{p.hours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** ย้อนไป 3 ปี (อายุใบรับรอง) — รอบก่อนหน้าเป็นข้อมูลสมมติ */
const back3 = (iso: string) => `${Number(iso.slice(0, 4)) - 3}${iso.slice(4)}`;

export function CertHistoryTab({ shop }: { shop: Pharmacy }) {
  if (!shop.certIssued || !shop.certExpires) return <Empty />;
  const rows = [
    {
      label: 'รอบปัจจุบัน',
      no: shop.qualityNo,
      issued: shop.certIssued,
      expires: shop.certExpires,
    },
    {
      label: 'รอบก่อนหน้า',
      no: shop.qualityNo?.replace('2567', '2564'),
      issued: back3(shop.certIssued),
      expires: back3(shop.certExpires),
    },
  ];
  return (
    <div className="overflow-x-auto relative">
      <table className="w-full text-sm">
        <thead style={{ color: 'var(--ink-tertiary)' }}>
          <tr>
            <Th>รอบ</Th>
            <Th>เลขใบรับรอง</Th>
            <Th>วันออก</Th>
            <Th>วันหมดอายุ</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="px-3 py-2">{r.label}</td>
              <td className="px-3 py-2 tabular-nums">{r.no ?? '-'}</td>
              <td className="px-3 py-2 tabular-nums">{formatDate(r.issued)}</td>
              <td className="px-3 py-2 tabular-nums">
                {formatDate(r.expires)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const itemClass =
  'flex flex-wrap items-center justify-between gap-2 py-3 text-sm';

export function RequestsTab({
  shop,
  canOpen,
}: {
  shop: Pharmacy;
  canOpen: boolean;
}) {
  const list = seedRequests.filter((r) => r.pharmacyId === shop.id);
  if (!list.length) return <Empty />;
  return (
    <ul className="divide-y divide-zinc-100">
      {list.map((r) => (
        <li key={r.id} className={itemClass}>
          <span className="min-w-0 break-words">
            {canOpen ? (
              <Link
                href={`/requests/${r.id}`}
                className="font-mono font-semibold hover:underline"
              >
                {r.no}
              </Link>
            ) : (
              <span className="font-mono font-semibold">{r.no}</span>
            )}{' '}
            <span
              className="tabular-nums"
              style={{ color: 'var(--ink-secondary)' }}
            >
              ยื่น {formatDate(r.submittedAt)}
            </span>
          </span>
          <StatusBadge status={r.status} />
        </li>
      ))}
    </ul>
  );
}

export function AuditsTab({ shop }: { shop: Pharmacy }) {
  const list = postAudits.filter((a) => a.pharmacyId === shop.id);
  if (!list.length) return <Empty />;
  return (
    <ul className="divide-y divide-zinc-100">
      {list.map((a) => (
        <li key={a.id} className={itemClass}>
          <Link
            href={`/post-audit/${a.id}`}
            className="font-mono font-semibold hover:underline"
          >
            {a.no}
          </Link>
          <span className="tabular-nums">
            ปี {a.year} · {auditPartLabels[overallStatus(a)]}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ComplaintsTab({ shop }: { shop: Pharmacy }) {
  const list = complaints.filter((c) => c.pharmacyId === shop.id);
  if (!list.length) return <Empty />;
  return (
    <ul className="divide-y divide-zinc-100">
      {list.map((c) => (
        <li key={c.id} className={itemClass}>
          <span className="min-w-0 break-words">
            <Link
              href={`/complaints/${c.id}`}
              className="font-mono font-semibold hover:underline"
            >
              {c.no}
            </Link>{' '}
            {c.issue}
          </span>
          <span>{complaintStageLabels[stageOfStep(c.step)]}</span>
        </li>
      ))}
    </ul>
  );
}
