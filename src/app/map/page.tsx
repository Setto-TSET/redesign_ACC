'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { IconArrowLeft, IconChevronRight } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { certStatusLabels } from '@/lib/constants';
import { MAP_VIEWBOX, provinceShapes } from '@/lib/thailandMap';
import { useQueryState } from '@/lib/useQueryState';
import { protoPharmacies, type Region } from '@/mock/prototype/pharmacies';
import type { CertStatus, Pharmacy } from '@/types/api';

const regions: Region[] = [
  'เหนือ',
  'ตะวันออกเฉียงเหนือ',
  'กลาง',
  'ตะวันออก',
  'ใต้',
];
const regionColor: Record<Region, string> = {
  เหนือ: '#2f855a',
  ตะวันออกเฉียงเหนือ: '#c2410c',
  กลาง: '#2563eb',
  ตะวันออก: '#7c3aed',
  ใต้: '#0d9488',
};
const statuses: CertStatus[] = ['A', 'N', 'E', 'X'];
const tone: Record<CertStatus, { badge: string; bar: string }> = {
  A: { badge: 'badge-success', bar: '#16a34a' },
  N: { badge: 'badge-info', bar: 'var(--info)' },
  E: { badge: 'badge-warning', bar: 'var(--warn)' },
  X: { badge: 'badge-error', bar: 'var(--danger)' },
};

// จังหวัดจากแผนที่เป็นแหล่งจริงของภาค — ร้านที่จังหวัดไม่อยู่ในแผนที่จะไม่ถูกนับ
const regionOf = Object.fromEntries(
  provinceShapes.map((p) => [p.name, p.region]),
) as Record<string, Region>;

function bbox(ds: string[]) {
  const n = ds
    .join(' ')
    .match(/-?\d+(\.\d+)?/g)!
    .map(Number);
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n.length; i += 2) {
    x0 = Math.min(x0, n[i]);
    x1 = Math.max(x1, n[i]);
    y0 = Math.min(y0, n[i + 1]);
    y1 = Math.max(y1, n[i + 1]);
  }
  const pad = 12;
  return `${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}`;
}

function StatusBar({ shops }: { shops: Pharmacy[] }) {
  return (
    <div className="flex h-2 mt-2 overflow-hidden rounded-full bg-zinc-100">
      {statuses.map((s) => {
        const n = shops.filter((p) => p.certStatus === s).length;
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
  );
}

function StatusBadges({ shops }: { shops: Pharmacy[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {statuses.map((s) => (
        <span key={s} className={`badge ${tone[s].badge} tabular-nums`}>
          {certStatusLabels[s]} {shops.filter((p) => p.certStatus === s).length}
        </span>
      ))}
    </div>
  );
}

function RegionMap() {
  const [region, setRegion] = useQueryState<Region | ''>('region', '', regions);
  const [hover, setHover] = useState<string | null>(null);

  const byProvince = useMemo(() => {
    const m: Record<string, Pharmacy[]> = {};
    for (const p of protoPharmacies) (m[p.province] ??= []).push(p);
    return m;
  }, []);
  const byRegion = (r: Region) =>
    protoPharmacies.filter((p) => regionOf[p.province] === r);

  const viewBoxes = useMemo(
    () =>
      Object.fromEntries(
        regions.map((r) => [
          r,
          bbox(provinceShapes.filter((p) => p.region === r).map((p) => p.d)),
        ]),
      ) as Record<Region, string>,
    [],
  );

  const shops = region ? byRegion(region) : protoPharmacies;
  const regionProvinces = region
    ? provinceShapes
        .filter((p) => p.region === region)
        .map((p) => ({ name: p.name, shops: byProvince[p.name] ?? [] }))
        .sort((a, b) => b.shops.length - a.shops.length)
    : [];
  const maxInRegion = Math.max(
    1,
    ...regionProvinces.map((p) => p.shops.length),
  );
  const withShops = regionProvinces.filter((p) => p.shops.length);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="card min-w-0 relative">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="font-extrabold">
            {region ? `ภาค${region}` : 'ประเทศไทย'}
          </h2>
          {region && (
            <button
              type="button"
              className="btn-secondary gap-1.5"
              onClick={() => setRegion('')}
            >
              <IconArrowLeft aria-hidden="true" size={16} />
              ทั้งประเทศ
            </button>
          )}
        </div>
        <svg
          viewBox={region ? viewBoxes[region] : MAP_VIEWBOX}
          className="w-full max-h-[70vh]"
          style={{ transition: 'all .4s var(--ease-out)' }}
          role="img"
          aria-label={
            region ? `แผนที่ภาค${region}` : 'แผนที่ประเทศไทยแบ่งตามภาค'
          }
        >
          {provinceShapes.map((p) => {
            const inRegion = !region || p.region === region;
            const count = byProvince[p.name]?.length ?? 0;
            const opacity = !region
              ? hover === p.region
                ? 0.95
                : 0.75
              : inRegion
                ? 0.25 + 0.75 * (count / maxInRegion)
                : 0.08;
            return (
              <path
                key={p.name}
                d={p.d}
                fill={regionColor[p.region]}
                fillOpacity={opacity}
                stroke="#fff"
                strokeWidth={region ? 0.6 : 0.5}
                strokeDasharray="2 1.5"
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer"
                style={{ transition: 'fill-opacity .2s' }}
                onMouseEnter={() => setHover(region ? p.name : p.region)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setRegion(p.region)}
              >
                <title>{`${p.name} (ภาค${p.region}) — ${count} ร้าน`}</title>
              </path>
            );
          })}
          {region &&
            provinceShapes
              .filter((p) => p.region === region)
              .map((p) => (
                <text
                  key={p.name}
                  x={p.label[0]}
                  y={p.label[1]}
                  textAnchor="middle"
                  fontSize={region === 'ตะวันออก' || region === 'กลาง' ? 3 : 5}
                  fontWeight={byProvince[p.name] ? 700 : 400}
                  fill="var(--ink)"
                  pointerEvents="none"
                >
                  {p.name}
                </text>
              ))}
        </svg>
        {region && hover && regionOf[hover] && (
          <p
            className="absolute top-16 right-4 rounded-lg bg-white/90 px-3 py-1.5 text-sm shadow"
            aria-live="polite"
          >
            {hover} · {byProvince[hover]?.length ?? 0} ร้าน
          </p>
        )}
        {!region && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
            {regions.map((r) => (
              <li key={r} className="flex items-center gap-1.5">
                <span
                  className="inline-block size-3 rounded-sm"
                  style={{ background: regionColor[r] }}
                />
                {r}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="min-w-0">
        <div className="card mb-4">
          <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            {region ? `ร้านยาในภาค${region}` : 'ร้านยาทั้งหมด'}
          </p>
          <p className="text-3xl font-extrabold tabular-nums">
            {shops.length} <span className="text-base font-normal">ร้าน</span>
          </p>
          <StatusBadges shops={shops} />
          <StatusBar shops={shops} />
        </div>

        {!region ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {regions.map((r, i) => {
              const s = byRegion(r);
              return (
                <li
                  key={r}
                  className="animate-stagger"
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => setRegion(r)}
                    onMouseEnter={() => setHover(r)}
                    onMouseLeave={() => setHover(null)}
                    className="card w-full text-left hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="inline-block size-3 shrink-0 rounded-sm"
                          style={{ background: regionColor[r] }}
                        />
                        ภาค{r}
                      </h3>
                      <IconChevronRight aria-hidden="true" size={16} />
                    </div>
                    <p
                      className="text-sm tabular-nums"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {s.length} ร้าน ·{' '}
                      {provinceShapes.filter((p) => p.region === r).length}{' '}
                      จังหวัด
                    </p>
                    <StatusBar shops={s} />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="card">
            <h3 className="font-bold mb-1">รายจังหวัด</h3>
            <p
              className="text-sm mb-2"
              style={{ color: 'var(--ink-tertiary)' }}
            >
              มีร้าน {withShops.length} จาก {regionProvinces.length} จังหวัด
            </p>
            <ul className="divide-y divide-zinc-100">
              {withShops.map(({ name, shops }) => (
                <li
                  key={name}
                  onMouseEnter={() => setHover(name)}
                  onMouseLeave={() => setHover(null)}
                >
                  <Link
                    href={`/pharmacies?province=${encodeURIComponent(name)}`}
                    className="block py-3 hover:bg-zinc-50"
                  >
                    <p className="font-semibold text-sm break-words">
                      {name}{' '}
                      <span
                        className="font-normal tabular-nums"
                        style={{ color: 'var(--ink-tertiary)' }}
                      >
                        ({shops.length})
                      </span>
                    </p>
                    <StatusBadges shops={shops} />
                    <StatusBar shops={shops} />
                  </Link>
                </li>
              ))}
            </ul>
            {withShops.length < regionProvinces.length && (
              <p
                className="text-sm pt-3 break-words"
                style={{ color: 'var(--ink-tertiary)' }}
              >
                ยังไม่มีร้าน:{' '}
                {regionProvinces
                  .filter((p) => !p.shops.length)
                  .map((p) => p.name)
                  .join(', ')}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default function MapPage() {
  return (
    <AdminLayout title="ร้านยาตามพื้นที่">
      <PrototypeBadge />
      <Suspense>
        <RegionMap />
      </Suspense>
    </AdminLayout>
  );
}
