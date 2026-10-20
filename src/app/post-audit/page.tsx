'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { IconSearch, IconUserShare } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { FilterChips } from '@/components/prototype/FilterChips';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/format';
import { useQueryState } from '@/lib/useQueryState';
import { assessors } from '@/mock';
import { findPharmacy } from '@/mock/prototype/pharmacies';
import {
  auditPartLabels,
  overallStatus,
  postAudits,
  type AuditPartStatus,
} from '@/mock/prototype/postAudit';
import { AuditStatusBadge } from './AuditStatusBadge';

const STATUS_KEYS = [
  'all',
  'pending',
  'notify',
  'fixing',
  'replied',
  'closed',
] as const;
type StatusKey = (typeof STATUS_KEYS)[number];

function PostAuditList() {
  const { user } = useAuth();
  const [q, setQ] = useQueryState<string>('q', '');
  const [status, setStatus] = useQueryState<StatusKey>(
    'status',
    'all',
    STATUS_KEYS,
  );
  const [year, setYear] = useQueryState<string>('year', 'all');

  const isPharmacy = user?.role === 'pharmacy';
  const isStaff = user?.role === 'admin' || user?.role === 'superadmin';
  const mine = postAudits.filter((a) =>
    isPharmacy
      ? a.pharmacyId === user?.pharmacyId
      : user?.role === 'assessor'
        ? a.assessorId === user.id
        : true,
  );
  const years = [...new Set(mine.map((a) => a.year))].sort((a, b) => b - a);
  const term = q.trim().toLowerCase();
  const byOther = mine.filter(
    (a) =>
      (year === 'all' || String(a.year) === year) &&
      (!term ||
        a.no.toLowerCase().includes(term) ||
        findPharmacy(a.pharmacyId)?.name.toLowerCase().includes(term)),
  );
  const visible = byOther.filter(
    (a) => status === 'all' || overallStatus(a) === status,
  );
  const options = STATUS_KEYS.map((k) => ({
    key: k,
    label: k === 'all' ? 'ทั้งหมด' : auditPartLabels[k as AuditPartStatus],
    count:
      k === 'all'
        ? byOther.length
        : byOther.filter((a) => overallStatus(a) === k).length,
  }));
  const title = isPharmacy ? 'ผลตรวจรักษาคุณภาพ' : 'ตรวจรักษาคุณภาพ';

  return (
    <AdminLayout title={title}>
      <PrototypeBadge />
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            {isPharmacy
              ? 'ผลการตรวจร้านยาหลังได้รับการรับรอง'
              : user?.role === 'assessor'
                ? 'ร้านที่คุณได้รับมอบหมายให้ตรวจ'
                : 'ผลตรวจรักษาคุณภาพของทุกร้าน'}
          </p>
        </div>
        {isStaff && (
          <Link href="/post-audit/assign" className="btn-primary gap-2">
            <IconUserShare aria-hidden="true" size={18} stroke={1.75} />
            มอบหมายประจำปี
          </Link>
        )}
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:p-5 border-b border-zinc-100">
          <div className="flex flex-wrap gap-3">
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
                placeholder="ค้นหาชื่อร้านหรือเลขที่…"
                aria-label="ค้นหาผลตรวจ"
              />
            </div>
            <select
              name="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="input-field !w-auto"
              aria-label="ปี"
            >
              <option value="all">ทุกปี</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  ปี {y}
                </option>
              ))}
            </select>
          </div>
          <FilterChips
            label="สถานะ"
            options={options}
            value={status}
            onChange={setStatus}
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
                setStatus('all');
                setYear('all');
              }}
            >
              ล้างตัวกรอง
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {visible.map((a, i) => {
              const shop = findPharmacy(a.pharmacyId);
              return (
                <li
                  key={a.id}
                  className="animate-stagger"
                  style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                >
                  <Link
                    href={`/post-audit/${a.id}`}
                    className="block px-4 sm:px-5 py-4 hover:bg-zinc-50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold">
                          {a.no}
                        </p>
                        <p className="font-medium mt-0.5">{shop?.name}</p>
                      </div>
                      <AuditStatusBadge status={overallStatus(a)} />
                    </div>
                    <p
                      className="text-xs mt-1.5"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {shop?.province} · ปี {a.year} · ผู้ตรวจ{' '}
                      {assessors.find((x) => x.id === a.assessorId)?.name} ·
                      นัดตรวจ {formatDate(a.visitDate)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <AuditStatusBadge
                        small
                        prefix="คุณภาพ: "
                        status={a.parts.quality.status}
                      />
                      <AuditStatusBadge
                        small
                        prefix="Common illness: "
                        status={a.parts.ci.status}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}

export default function PostAuditPage() {
  return (
    <Suspense>
      <PostAuditList />
    </Suspense>
  );
}
