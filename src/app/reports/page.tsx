'use client';

import { Suspense, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AdminLayout } from '@/components/layout';
import { FilterChips } from '@/components/prototype/FilterChips';
import { prefersReducedMotion } from '@/components/prototype/motion';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryState } from '@/lib/useQueryState';
import { provinces } from '@/mock/prototype/pharmacies';
import {
  buildReport,
  reportKinds,
  type ReportKind,
} from '@/mock/prototype/reports';

const KIND_KEYS = reportKinds.map((k) => k.key);

function Reports() {
  const { user } = useAuth();
  const [kind, setKind] = useQueryState<ReportKind>(
    'kind',
    'requests',
    KIND_KEYS,
  );
  const [provinceQ, setProvince] = useQueryState<string>('province', 'all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // อ่าน media query หลัง mount เพื่อไม่ให้ hydration ไม่ตรงกับ server
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(prefersReducedMotion());
  }, []);

  if (!user) return null;
  const forced = user.role === 'ppho' ? user.province : undefined;
  const province = forced ?? provinceQ;
  const meta = reportKinds.find((k) => k.key === kind)!;
  const data = buildReport(kind, { from, to, province });
  const total = data.chart.reduce((s, c) => s + c.value, 0);

  return (
    <AdminLayout title="รายงาน">
      <PrototypeBadge />
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight">รายงาน</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
          สรุปตัวเลขและส่งออกเป็นไฟล์ Excel
        </p>
      </div>

      <div className="mb-4">
        <FilterChips
          label="ประเภทรายงาน"
          options={reportKinds}
          value={kind}
          onChange={setKind}
        />
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        {forced ? (
          <p className="text-sm font-semibold">จังหวัด{forced}</p>
        ) : (
          <label className="text-xs font-semibold block">
            จังหวัด
            <select
              name="province"
              autoComplete="off"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="input-field mt-1 !w-auto"
            >
              <option value="all">ทุกจังหวัด</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-xs font-semibold block">
          ตั้งแต่วันที่
          <input
            type="date"
            name="from"
            autoComplete="off"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className="input-field mt-1 !w-auto tabular-nums"
          />
        </label>
        <label className="text-xs font-semibold block">
          ถึงวันที่
          <input
            type="date"
            name="to"
            autoComplete="off"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className="input-field mt-1 !w-auto tabular-nums"
          />
        </label>
        <button
          type="button"
          className="btn-primary sm:ml-auto"
          onClick={() => toast(`ต้นแบบ: ระบบจริงจะได้${meta.excel}`)}
        >
          ส่งออก Excel
        </button>
      </div>

      <div key={kind} className="mb-6 grid gap-4 grid-cols-2 xl:grid-cols-4">
        {data.cards.map((c, i) => (
          <div
            key={c.label}
            className="stat-card animate-stagger"
            style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
          >
            <div>
              <div className="stat-value tabular-nums">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <figure className="card mb-6 !m-0 min-w-0">
        <figcaption className="sr-only">
          กราฟแท่ง{meta.label}:{' '}
          {data.chart.map((c) => `${c.name} ${c.value}`).join(', ')}
        </figcaption>
        <div className="mb-3 text-sm font-bold" aria-hidden="true">
          {meta.label}{' '}
          <span
            className="font-normal tabular-nums"
            style={{ color: 'var(--ink-tertiary)' }}
          >
            (รวม {total})
          </span>
        </div>
        {total === 0 ? (
          <p
            className="py-16 text-center text-sm"
            style={{ color: 'var(--ink-tertiary)' }}
          >
            ไม่มีข้อมูลในช่วงที่เลือก
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data.chart}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={72}
              />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="value"
                name="จำนวน"
                fill="var(--accent)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={!reduced}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </figure>

      <div className="card !p-0 overflow-hidden min-w-0">
        <div className="overflow-x-auto relative">
          <table className="data-table w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs"
                style={{ color: 'var(--ink-tertiary)' }}
              >
                {data.columns.map((c) => (
                  <th key={c} className="px-4 py-3 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={data.columns.length}
                    className="px-4 py-10 text-center"
                    style={{ color: 'var(--ink-tertiary)' }}
                  >
                    ไม่มีข้อมูลในช่วงที่เลือก
                  </td>
                </tr>
              )}
              {data.rows.map((r, i) => (
                <tr
                  key={`${kind}-${i}`}
                  className="animate-stagger"
                  style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                >
                  {r.map((v, j) => (
                    <td
                      key={j}
                      className={`px-4 py-3 break-words ${typeof v === 'number' || /\d/.test(v) ? 'tabular-nums' : ''}`}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function ReportsPage() {
  return (
    <Suspense>
      <Reports />
    </Suspense>
  );
}
