'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { FilterChips } from '@/components/prototype/FilterChips';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { formatDate } from '@/lib/format';
import { useQueryState } from '@/lib/useQueryState';
import {
  complaints,
  complaintStageLabels,
  stageOfStep,
  type Complaint,
  type ComplaintStage,
} from '@/mock/prototype/complaints';
import { findPharmacy } from '@/mock/prototype/pharmacies';
import { SeverityBadge, StageBadge } from './ComplaintBadges';

const STAGE_KEYS = [
  'all',
  'intake',
  'factfinding',
  'subcommittee',
  'council',
  'resolution',
  'closed',
] as const;
type StageKey = (typeof STAGE_KEYS)[number];

const shopName = (c: Complaint) =>
  (c.pharmacyId ? findPharmacy(c.pharmacyId)?.name : c.pharmacyText) ?? '-';

function ComplaintList() {
  const [q, setQ] = useQueryState<string>('q', '');
  const [stage, setStage] = useQueryState<StageKey>('stage', 'all', STAGE_KEYS);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const term = q.trim().toLowerCase();
  const byOther = complaints.filter(
    (c) =>
      (!from || c.receivedAt >= from) &&
      (!to || c.receivedAt <= to) &&
      (!term ||
        c.no.toLowerCase().includes(term) ||
        shopName(c).toLowerCase().includes(term) ||
        c.complainant.name.toLowerCase().includes(term)),
  );
  const visible = byOther.filter(
    (c) => stage === 'all' || stageOfStep(c.step) === stage,
  );
  const options = STAGE_KEYS.map((k) => ({
    key: k,
    label: k === 'all' ? 'ทั้งหมด' : complaintStageLabels[k as ComplaintStage],
    count:
      k === 'all'
        ? byOther.length
        : byOther.filter((c) => stageOfStep(c.step) === k).length,
  }));

  return (
    <AdminLayout title="ข้อร้องเรียน">
      <PrototypeBadge />
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            ติดตามข้อร้องเรียนร้านยาตั้งแต่รับเรื่องจนปิดเรื่อง
          </p>
        </div>
        <Link href="/complaints/new" className="btn-primary gap-2">
          <IconPlus aria-hidden="true" size={18} stroke={1.75} />
          รับเรื่องใหม่
        </Link>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:p-5 border-b border-slate-100">
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative flex-1 min-w-56">
              <IconSearch
                aria-hidden="true"
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--ink-tertiary)' }}
              />
              <input
                type="search"
                name="q"
                autoComplete="off"
                spellCheck={false}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="input-field !pl-10"
                placeholder="ค้นหาเลขที่ ร้าน หรือผู้ร้องเรียน…"
                aria-label="ค้นหาข้อร้องเรียน"
              />
            </div>
            <label className="text-xs font-semibold text-slate-700">
              ตั้งแต่
              <input
                type="date"
                name="from"
                autoComplete="off"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
                className="input-field mt-1 !w-auto block"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              ถึง
              <input
                type="date"
                name="to"
                autoComplete="off"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
                className="input-field mt-1 !w-auto block"
              />
            </label>
          </div>
          <FilterChips
            label="สถานะ"
            options={options}
            value={stage}
            onChange={setStage}
          />
        </div>

        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold">ไม่พบรายการที่ตรงกับตัวกรอง</p>
            <button
              type="button"
              className="btn-secondary mt-4"
              onClick={() => {
                setQ('');
                setStage('all');
                setFrom('');
                setTo('');
              }}
            >
              ล้างตัวกรอง
            </button>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto relative">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>เลขที่</th>
                    <th>วันที่รับ</th>
                    <th>ร้าน</th>
                    <th>ประเด็น</th>
                    <th>ความรุนแรง</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c, i) => (
                    <tr
                      key={c.id}
                      className="animate-stagger"
                      style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                    >
                      <td className="font-mono font-semibold whitespace-nowrap">
                        <Link
                          href={`/complaints/${c.id}`}
                          className="underline-offset-2 hover:underline"
                          style={{ color: 'var(--accent)' }}
                        >
                          {c.no}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap tabular-nums">
                        {formatDate(c.receivedAt)}
                      </td>
                      <td className="break-words">{shopName(c)}</td>
                      <td className="break-words">{c.issue}</td>
                      <td>
                        <SeverityBadge severity={c.severity} />
                      </td>
                      <td>
                        <StageBadge stage={stageOfStep(c.step)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="sm:hidden divide-y divide-slate-100">
              {visible.map((c, i) => (
                <li
                  key={c.id}
                  className="animate-stagger"
                  style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                >
                  <Link
                    href={`/complaints/${c.id}`}
                    className="block px-4 py-4 hover:bg-slate-50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-mono text-sm font-semibold">{c.no}</p>
                      <StageBadge stage={stageOfStep(c.step)} />
                    </div>
                    <p className="font-medium mt-0.5 break-words">
                      {shopName(c)}
                    </p>
                    <p className="text-sm mt-0.5 break-words">{c.issue}</p>
                    <div
                      className="flex items-center gap-2 mt-2 text-xs"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      <SeverityBadge severity={c.severity} />
                      รับ{' '}
                      <span className="tabular-nums">
                        {formatDate(c.receivedAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default function ComplaintsPage() {
  return (
    <Suspense>
      <ComplaintList />
    </Suspense>
  );
}
