'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { IconLayoutGrid, IconSearch, IconTable } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { CertBadge } from '@/components/common/StatusBadge';
import { FilterChips } from '@/components/prototype/FilterChips';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { useAuth } from '@/contexts/AuthContext';
import { certStatusLabels } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { useQueryState } from '@/lib/useQueryState';
import { protoPharmacies, provinces } from '@/mock/prototype/pharmacies';
import type { CertStatus } from '@/types/api';

const CERT_KEYS = ['all', 'N', 'A', 'E', 'X'] as const;
type CertKey = (typeof CERT_KEYS)[number];
const VIEWS = ['table', 'card'] as const;
type View = (typeof VIEWS)[number];
const types = [...new Set(protoPharmacies.map((p) => p.type))];

function PharmacyList() {
  const { user } = useAuth();
  const [q, setQ] = useQueryState<string>('q', '');
  const [provinceQ, setProvince] = useQueryState<string>('province', 'all');
  const [cert, setCert] = useQueryState<CertKey>('cert', 'all', CERT_KEYS);
  const [type, setType] = useQueryState<string>('type', 'all');
  const [view, setView] = useQueryState<View>('view', 'table', VIEWS);

  const forced = user?.role === 'ppho' ? user.province : undefined;
  const province = forced ?? provinceQ;
  const term = q.trim().toLowerCase();
  const byOther = protoPharmacies.filter(
    (p) =>
      (province === 'all' || p.province === province) &&
      (type === 'all' || p.type === type) &&
      (!term ||
        p.name.toLowerCase().includes(term) ||
        p.licenseNo.toLowerCase().includes(term) ||
        p.licensee.toLowerCase().includes(term)),
  );
  const visible = byOther.filter(
    (p) => cert === 'all' || p.certStatus === cert,
  );
  const options = CERT_KEYS.map((k) => ({
    key: k,
    label: k === 'all' ? 'ทั้งหมด' : certStatusLabels[k as CertStatus],
    count:
      k === 'all'
        ? byOther.length
        : byOther.filter((p) => p.certStatus === k).length,
  }));

  return (
    <AdminLayout title="ร้านยาทั้งหมด">
      <PrototypeBadge />
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight">
          ร้านยาทั้งหมด
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
          ค้นหาและดูข้อมูลร้านยาในระบบ
        </p>
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
                placeholder="ค้นหาชื่อร้าน เลขใบอนุญาต หรือผู้ดำเนินกิจการ…"
                aria-label="ค้นหาร้านยา"
              />
            </div>
            {forced ? (
              <p className="self-center text-sm font-semibold">
                จังหวัด{forced}
              </p>
            ) : (
              <select
                name="province"
                autoComplete="off"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="input-field !w-auto"
                aria-label="จังหวัด"
              >
                <option value="all">ทุกจังหวัด</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
            <select
              name="type"
              autoComplete="off"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input-field !w-auto"
              aria-label="ประเภทร้าน"
            >
              <option value="all">ทุกประเภท</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div
              className="hidden sm:flex gap-1"
              role="group"
              aria-label="มุมมอง"
            >
              <button
                type="button"
                aria-pressed={view === 'table'}
                aria-label="มุมมองตาราง"
                onClick={() => setView('table')}
                className={view === 'table' ? 'btn-primary' : 'btn-secondary'}
              >
                <IconTable aria-hidden="true" size={18} />
              </button>
              <button
                type="button"
                aria-pressed={view === 'card'}
                aria-label="มุมมองการ์ด"
                onClick={() => setView('card')}
                className={view === 'card' ? 'btn-primary' : 'btn-secondary'}
              >
                <IconLayoutGrid aria-hidden="true" size={18} />
              </button>
            </div>
          </div>
          <FilterChips
            label="สถานะใบรับรอง"
            options={options}
            value={cert}
            onChange={setCert}
          />
        </div>

        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold">ไม่พบร้านยาที่ตรงกับตัวกรอง</p>
            <button
              type="button"
              className="btn-secondary mt-4"
              onClick={() => {
                setQ('');
                setProvince('all');
                setCert('all');
                setType('all');
              }}
            >
              ล้างตัวกรอง
            </button>
          </div>
        ) : (
          <>
            {view === 'table' && (
              <div className="hidden sm:block overflow-x-auto relative">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className="text-left text-xs"
                      style={{ color: 'var(--ink-tertiary)' }}
                    >
                      <th className="px-5 py-3 font-semibold">ชื่อร้าน</th>
                      <th className="px-3 py-3 font-semibold">จังหวัด</th>
                      <th className="px-3 py-3 font-semibold">ประเภท</th>
                      <th className="px-3 py-3 font-semibold">ใบรับรอง</th>
                      <th className="px-5 py-3 font-semibold">หมดอายุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {visible.map((p, i) => (
                      <tr
                        key={p.id}
                        className="animate-stagger hover:bg-zinc-50"
                        style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                      >
                        <td className="px-5 py-3 break-words min-w-0">
                          <Link
                            href={`/pharmacies/${p.id}`}
                            className="font-semibold hover:underline"
                          >
                            {p.name}
                          </Link>
                        </td>
                        <td className="px-3 py-3">{p.province}</td>
                        <td className="px-3 py-3">{p.type}</td>
                        <td className="px-3 py-3">
                          <CertBadge status={p.certStatus} />
                        </td>
                        <td className="px-5 py-3 tabular-nums">
                          {formatDate(p.certExpires)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <ul
              className={`grid gap-3 p-4 sm:p-5 sm:grid-cols-2 xl:grid-cols-3 ${view === 'table' ? 'sm:hidden' : ''}`}
            >
              {visible.map((p, i) => (
                <li
                  key={p.id}
                  className="animate-stagger"
                  style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                >
                  <Link
                    href={`/pharmacies/${p.id}`}
                    className="block h-full rounded-xl border border-zinc-100 p-4 hover:bg-zinc-50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold min-w-0 break-words">
                        {p.name}
                      </p>
                      <CertBadge status={p.certStatus} />
                    </div>
                    <p
                      className="text-xs mt-1.5 break-words"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {p.province} · {p.type}
                    </p>
                    <p
                      className="text-xs mt-1 tabular-nums"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      หมดอายุ {formatDate(p.certExpires)}
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

export default function PharmaciesPage() {
  return (
    <Suspense>
      <PharmacyList />
    </Suspense>
  );
}
