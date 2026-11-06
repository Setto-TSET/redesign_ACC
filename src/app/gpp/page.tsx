'use client';

import { Suspense, useState } from 'react';
import { AdminLayout } from '@/components/layout';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/format';
import { useQueryState } from '@/lib/useQueryState';
import {
  GPP_PASS,
  gppResults,
  gppRounds,
  type GppRound,
} from '@/mock/prototype/gpp';
import { protoPharmacies, provinces } from '@/mock/prototype/pharmacies';

function Gpp() {
  const { user } = useAuth();
  const [provinceQ, setProvince] = useQueryState<string>(
    'province',
    provinces[0],
  );
  const [rounds, setRounds] = useState<GppRound[]>(gppRounds);

  if (!user) return null;
  const forced = user.role === 'ppho' ? user.province : undefined;
  const province = forced ?? provinceQ;
  const shops = protoPharmacies.filter((p) => p.province === province);
  const thisYear = rounds.find(
    (r) => r.province === province && r.year === 2569,
  );
  const rows = shops.map((p) => ({
    shop: p,
    result: gppResults.find((r) => r.pharmacyId === p.id),
  }));
  const done = rows.filter((r) => r.result);
  const passed = done.filter((r) => r.result!.score >= GPP_PASS).length;
  const stats = [
    ['ร้านทั้งหมด', shops.length],
    ['ประเมินแล้ว', done.length],
    ['ผ่าน', passed],
    ['ไม่ผ่าน', done.length - passed],
  ];

  const closeRound = (r: GppRound) => {
    if (
      !window.confirm(
        `ปิดรอบประเมินปี 2569 ของจังหวัด${r.province}? ร้านที่ยังไม่ประเมินจะไม่สามารถส่งผลได้`,
      )
    )
      return;
    setRounds((all) =>
      all.map((x) => (x.id === r.id ? { ...x, open: false } : x)),
    );
  };

  return (
    <AdminLayout title="ประเมิน GPP">
      <PrototypeBadge />
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            ผลประเมินร้านยาในจังหวัด
          </p>
        </div>
        {forced ? (
          <p className="text-sm font-semibold">จังหวัด{forced}</p>
        ) : (
          <select
            name="province"
            autoComplete="off"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="input-field !w-auto"
            aria-label="จังหวัด"
          >
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mb-6 grid gap-4 grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, n], i) => (
          <div
            key={label}
            className="stat-card animate-stagger"
            style={{ '--i': i } as React.CSSProperties}
          >
            <div>
              <div className="stat-value tabular-nums">{n}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem] items-start">
        <div className="card !p-0 overflow-hidden min-w-0">
          <div className="overflow-x-auto relative">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-xs"
                  style={{ color: 'var(--ink-tertiary)' }}
                >
                  <th className="px-5 py-3 font-semibold">ร้าน</th>
                  <th className="px-3 py-3 font-semibold">คะแนน</th>
                  <th className="px-3 py-3 font-semibold">ผล</th>
                  <th className="px-3 py-3 font-semibold">วันที่</th>
                  <th className="px-5 py-3 font-semibold">ผู้ประเมิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(({ shop, result }, i) => (
                  <tr
                    key={shop.id}
                    className="animate-stagger"
                    style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                  >
                    <td className="px-5 py-3 break-words min-w-40">
                      {shop.name}
                    </td>
                    <td className="px-3 py-3 min-w-32">
                      {result ? (
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums w-10">
                            {result.score}%
                          </span>
                          <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="animate-grow-x h-full"
                              style={{
                                width: `${result.score}%`,
                                background:
                                  result.score >= GPP_PASS
                                    ? 'var(--accent)'
                                    : 'var(--danger)',
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {result ? (
                        <span
                          className={`badge ${result.score >= GPP_PASS ? 'badge-success' : 'badge-error'}`}
                        >
                          {result.score >= GPP_PASS ? 'ผ่าน' : 'ไม่ผ่าน'}
                        </span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-600">
                          ยังไม่ประเมิน
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {formatDate(result?.assessedAt)}
                    </td>
                    <td className="px-5 py-3 break-words">
                      {result?.assessor ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          {rounds
            .filter((r) => r.province === province)
            .sort((a, b) => b.year - a.year)
            .map((r, i) => (
              <div
                key={r.id}
                className="card animate-stagger"
                style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold tabular-nums">รอบปี {r.year}</p>
                  <span
                    className={`badge ${r.open ? 'badge-success' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {r.open ? 'เปิดอยู่' : 'ปิดแล้ว'}
                  </span>
                </div>
                {r.open && r === thisYear && (
                  <button
                    type="button"
                    className="btn-secondary mt-3"
                    onClick={() => closeRound(r)}
                  >
                    ปิดรอบประเมิน
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function GppPage() {
  return (
    <Suspense>
      <Gpp />
    </Suspense>
  );
}
