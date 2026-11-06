'use client';

import { Suspense, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
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
const PALETTE = [
  '#059669',
  '#2563eb',
  '#d97706',
  '#7c3aed',
  '#e11d48',
  '#0891b2',
  '#64748b',
];
const tooltipProps = {
  cursor: { fill: 'var(--border-light)' },
  contentStyle: {
    borderRadius: 12,
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-md)',
    fontSize: 13,
  },
  formatter: (v: unknown) => [`${v} รายการ`, 'จำนวน'] as [string, string],
};

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
  // ใบรับรองใกล้หมดอายุเป็นรายเดือน — คงลำดับเวลาเป็นแท่งตั้ง; ที่เหลือเป็นหมวดหมู่ ใช้แท่งนอนให้อ่านชื่อไทยได้เต็ม
  const timeSeries = kind === 'expiring';
  // วงโดนัทอ่านง่ายเมื่อหมวดไม่เกิน 6 — มากกว่านั้นใช้แท่งสีเดียวพอ
  const showShare = !timeSeries && data.chart.length <= 6;
  const rows = data.chart.map((c, i) => {
    const pct = total ? Math.round((c.value / total) * 100) : 0;
    return {
      ...c,
      pct,
      color: showShare ? PALETTE[i % PALETTE.length] : 'var(--accent)',
      label: `${c.value} (${pct}%)`,
    };
  });

  return (
    <AdminLayout title="รายงาน">
      <PrototypeBadge />
      <div className="mb-6">
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

      {total === 0 ? (
        <p
          className="card mb-6 py-16 text-center text-sm"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          ไม่มีข้อมูลในช่วงที่เลือก
        </p>
      ) : (
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <figure
            className={`card !m-0 min-w-0 ${showShare ? 'lg:col-span-2' : 'lg:col-span-3'}`}
          >
            <figcaption className="sr-only">
              กราฟแท่ง{meta.label}:{' '}
              {rows.map((c) => `${c.name} ${c.value}`).join(', ')}
            </figcaption>
            <div
              className="mb-4 flex items-baseline justify-between gap-2"
              aria-hidden="true"
            >
              <h2 className="font-bold">{meta.label}</h2>
              <span
                className="text-sm tabular-nums"
                style={{ color: 'var(--ink-tertiary)' }}
              >
                รวม {total}
              </span>
            </div>
            {timeSeries ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={rows}
                  margin={{ top: 20, right: 8, left: -24, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border-light)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: 'var(--ink-secondary)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--ink-tertiary)' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip {...tooltipProps} />
                  <Bar
                    dataKey="value"
                    name="จำนวน"
                    fill="var(--accent)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                    isAnimationActive={!reduced}
                  >
                    <LabelList
                      dataKey="value"
                      position="top"
                      fontSize={12}
                      fill="var(--ink)"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={rows.length * 44 + 8}>
                <BarChart
                  data={rows}
                  layout="vertical"
                  margin={{ top: 0, right: 64, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 13, fill: 'var(--ink-secondary)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip {...tooltipProps} />
                  <Bar
                    dataKey="value"
                    name="จำนวน"
                    radius={[0, 6, 6, 0]}
                    barSize={22}
                    background={{ fill: 'var(--border-light)', radius: 6 }}
                    isAnimationActive={!reduced}
                  >
                    {rows.map((r) => (
                      <Cell key={r.name} fill={r.color} />
                    ))}
                    <LabelList
                      dataKey="label"
                      position="right"
                      fontSize={12}
                      fill="var(--ink)"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </figure>

          {showShare && (
            <figure className="card !m-0 min-w-0">
              <figcaption className="mb-2 font-bold">สัดส่วน</figcaption>
              <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={rows.filter((r) => r.value)}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={56}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                      isAnimationActive={!reduced}
                    >
                      {rows
                        .filter((r) => r.value)
                        .map((r) => (
                          <Cell key={r.name} fill={r.color} />
                        ))}
                    </Pie>
                    <Tooltip {...tooltipProps} />
                  </PieChart>
                </ResponsiveContainer>
                <p className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold tabular-nums">
                    {total}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: 'var(--ink-tertiary)' }}
                  >
                    ทั้งหมด
                  </span>
                </p>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {rows.map((r) => (
                  <li key={r.name} className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: r.color }}
                    />
                    <span className="min-w-0 flex-1 truncate">{r.name}</span>
                    <span className="tabular-nums font-semibold">{r.pct}%</span>
                  </li>
                ))}
              </ul>
            </figure>
          )}
        </div>
      )}

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
            <tbody className="divide-y divide-slate-100">
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
