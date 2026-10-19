'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { IconFilePlus, IconSearch } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { typeLabel } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { isAlive } from '@/lib/requestRules';
import { useQueryState } from '@/lib/useQueryState';
import type { AccRequest, Pharmacy, RequestStatus } from '@/types/api';

const GROUP_KEYS = ['all', 'active', 'need_docs', 'closed'] as const;
type GroupKey = (typeof GROUP_KEYS)[number];

const groups: {
  key: GroupKey;
  label: string;
  match: (s: RequestStatus) => boolean;
}[] = [
  { key: 'all', label: 'ทั้งหมด', match: () => true },
  {
    key: 'active',
    label: 'กำลังดำเนินการ',
    match: (s) => isAlive(s) && s !== 'need_docs',
  },
  {
    key: 'need_docs',
    label: 'ต้องส่งเอกสารเพิ่ม',
    match: (s) => s === 'need_docs',
  },
  { key: 'closed', label: 'เสร็จสิ้น', match: (s) => !isAlive(s) },
];

function RequestsList() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AccRequest[] | null>(null);
  const [shops, setShops] = useState<Record<number, Pharmacy>>({});
  const [q, setQ] = useQueryState<string>('q', '');
  const [group, setGroup] = useQueryState<GroupKey>('group', 'all', GROUP_KEYS);
  // local input state: filter instantly, write to the URL only after typing pauses
  const [query, setQuery] = useState(q);
  // sync from URL on external change (back/forward) — adjust state during render
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    setQuery(q);
  }
  useEffect(() => {
    if (query === q) return;
    const t = setTimeout(() => setQ(query), 300);
    return () => clearTimeout(t);
  }, [query, q, setQ]);
  const isPharmacy = user?.role === 'pharmacy';

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.requests.list(
        isPharmacy
          ? { pharmacyId: user.pharmacyId }
          : user.role === 'assessor'
            ? { assessorId: user.id }
            : {},
      ),
      api.pharmacies.list(),
    ]).then(([reqs, list]) => {
      setRows(reqs);
      setShops(Object.fromEntries(list.map((p) => [p.id, p])));
    });
  }, [user, isPharmacy]);

  const all = rows ?? [];
  const match = groups.find((g) => g.key === group)!.match;
  const term = query.trim().toLowerCase();
  const visible = all.filter(
    (r) =>
      match(r.status) &&
      (!term ||
        r.no.toLowerCase().includes(term) ||
        shops[r.pharmacyId]?.name.toLowerCase().includes(term)),
  );

  return (
    <AdminLayout title="คำขอรับรอง">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">คำขอรับรอง</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            {isPharmacy
              ? 'คำขอทั้งหมดของร้านคุณ'
              : user?.role === 'assessor'
                ? 'คำขอที่คุณได้รับมอบหมาย'
                : 'คำขอจากร้านยาทุกร้าน'}
          </p>
        </div>
        {isPharmacy && (
          <Link href="/requests/new" className="btn-primary gap-2">
            <IconFilePlus aria-hidden="true" size={18} stroke={1.75} />
            ยื่นคำขอใหม่
          </Link>
        )}
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:p-5 border-b border-zinc-100">
          <div className="relative">
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field !pl-10"
              placeholder={
                isPharmacy ? 'ค้นหาเลขที่คำขอ…' : 'ค้นหาเลขที่คำขอหรือชื่อร้าน…'
              }
              aria-label="ค้นหาคำขอ"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => {
              const on = g.key === group;
              return (
                <button
                  key={g.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setGroup(g.key)}
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors"
                  style={
                    on
                      ? {
                          background: 'var(--accent-soft)',
                          borderColor: 'var(--accent)',
                          color: 'var(--accent)',
                        }
                      : {
                          borderColor: 'var(--border)',
                          color: 'var(--ink-secondary)',
                        }
                  }
                >
                  {g.label} (
                  <span className="tabular-nums">
                    {all.filter((r) => g.match(r.status)).length}
                  </span>
                  )
                </button>
              );
            })}
          </div>
        </div>

        {rows && visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold">ไม่พบคำขอ</p>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--ink-secondary)' }}
            >
              {all.length === 0 && isPharmacy
                ? 'ร้านคุณยังไม่เคยยื่นคำขอ'
                : 'ลองเปลี่ยนคำค้นหรือตัวกรอง'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>เลขที่คำขอ</th>
                    {!isPharmacy && <th>ร้านยา</th>}
                    <th>ประเภท</th>
                    <th>วันที่ยื่น</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r, i) => (
                    <tr
                      key={r.id}
                      className="animate-stagger"
                      style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                    >
                      <td>
                        <Link
                          href={`/requests/${r.id}`}
                          className="font-mono font-semibold hover:underline"
                          style={{ color: 'var(--accent)' }}
                        >
                          {r.no}
                        </Link>
                      </td>
                      {!isPharmacy && (
                        <td className="!text-zinc-800 font-medium">
                          {shops[r.pharmacyId]?.name}
                        </td>
                      )}
                      <td>{typeLabel(r.typeIds)}</td>
                      <td className="tabular-nums">
                        {formatDate(r.submittedAt)}
                      </td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="md:hidden divide-y divide-zinc-100">
              {visible.map((r, i) => (
                <li
                  key={r.id}
                  className="animate-stagger"
                  style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                >
                  <Link
                    href={`/requests/${r.id}`}
                    className="block px-4 py-4 hover:bg-zinc-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-mono text-sm font-semibold">
                        {r.no}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    {!isPharmacy && (
                      <p className="mt-1 text-sm font-medium">
                        {shops[r.pharmacyId]?.name}
                      </p>
                    )}
                    <p
                      className="mt-1 text-xs"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {typeLabel(r.typeIds)} · {formatDate(r.submittedAt)}
                    </p>
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

// useSearchParams ต้องอยู่ใต้ Suspense ในหน้า static ของ Next 16
export default function RequestsPage() {
  return (
    <Suspense fallback={null}>
      <RequestsList />
    </Suspense>
  );
}
