'use client';

import Link from 'next/link';
import { IconInfoCircle } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { certStatusLabels } from '@/lib/constants';
import {
  protoPharmacies,
  provinceRegion,
  provinces,
  type Region,
} from '@/mock/prototype/pharmacies';
import type { CertStatus } from '@/types/api';

const regions: Region[] = [
  'เหนือ',
  'กลาง',
  'ตะวันออกเฉียงเหนือ',
  'ตะวันออก',
  'ใต้',
];
const statuses: CertStatus[] = ['A', 'N', 'E', 'X'];
const tone: Record<CertStatus, { badge: string; bar: string }> = {
  A: { badge: 'badge-success', bar: '#16a34a' },
  N: { badge: 'badge-info', bar: 'var(--info)' },
  E: { badge: 'badge-warning', bar: 'var(--warn)' },
  X: { badge: 'badge-error', bar: 'var(--danger)' },
};

export default function MapPage() {
  return (
    <AdminLayout title="ร้านยาตามพื้นที่">
      <PrototypeBadge />
      <p
        className="mb-6 flex items-start gap-2 rounded-xl p-3 text-sm"
        style={{ background: 'var(--info-soft)', color: 'var(--info)' }}
      >
        <IconInfoCircle
          aria-hidden="true"
          size={18}
          className="shrink-0 mt-0.5"
        />
        ตอนนี้แสดงเป็นการ์ดแยกภาค — แผนที่จริงจะทำในขั้นถัดไป
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {regions.map((region, i) => {
          const inRegion = provinces.filter(
            (p) => provinceRegion[p] === region,
          );
          const total = protoPharmacies.filter(
            (p) => provinceRegion[p.province] === region,
          ).length;
          return (
            <section
              key={region}
              className="card animate-stagger min-w-0"
              style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
            >
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <h2 className="font-extrabold">ภาค{region}</h2>
                <span
                  className="text-sm tabular-nums"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  {total} ร้าน
                </span>
              </div>
              <ul className="divide-y divide-zinc-100">
                {inRegion.map((prov) => {
                  const shops = protoPharmacies.filter(
                    (p) => p.province === prov,
                  );
                  return (
                    <li key={prov}>
                      <Link
                        href={`/pharmacies?province=${encodeURIComponent(prov)}`}
                        className="block py-3 hover:bg-zinc-50"
                      >
                        <p className="font-semibold text-sm break-words">
                          {prov}{' '}
                          <span
                            className="font-normal tabular-nums"
                            style={{ color: 'var(--ink-tertiary)' }}
                          >
                            ({shops.length})
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {statuses.map((s) => (
                            <span
                              key={s}
                              className={`badge ${tone[s].badge} tabular-nums`}
                            >
                              {certStatusLabels[s]}{' '}
                              {shops.filter((p) => p.certStatus === s).length}
                            </span>
                          ))}
                        </div>
                        <div className="flex h-2 mt-2 overflow-hidden rounded-full bg-zinc-100">
                          {statuses.map((s) => {
                            const n = shops.filter(
                              (p) => p.certStatus === s,
                            ).length;
                            return n ? (
                              <div
                                key={s}
                                className="animate-grow-x h-full"
                                style={{
                                  width: `${(n / shops.length) * 100}%`,
                                  background: tone[s].bar,
                                }}
                              />
                            ) : null;
                          })}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </AdminLayout>
  );
}
