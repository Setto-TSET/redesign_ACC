'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { IconX } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { assessors } from '@/mock';
import { allocations } from '@/mock/prototype/admin';
import { provinces } from '@/mock/prototype/pharmacies';

export default function AllocationPage() {
  const [alloc, setAlloc] = useState<Record<number, string[]>>(allocations);

  const covered = new Set(Object.values(alloc).flat());
  const uncovered = provinces.filter((p) => !covered.has(p));

  const add = (id: number, p: string) => {
    if (p) setAlloc((a) => ({ ...a, [id]: [...(a[id] ?? []), p] }));
  };
  const remove = (id: number, p: string) =>
    setAlloc((a) => ({ ...a, [id]: (a[id] ?? []).filter((x) => x !== p) }));

  return (
    <AdminLayout title="มอบหมายผู้ตรวจ">
      <PrototypeBadge />
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            กำหนดจังหวัดที่ผู้ตรวจประเมินแต่ละคนรับผิดชอบ
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() =>
            toast.success('บันทึกการมอบหมายแล้ว (ต้นแบบ — ไม่ถูกเก็บ)')
          }
        >
          บันทึกการมอบหมาย
        </button>
      </div>

      <div className="card mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">
          จังหวัดที่ยังไม่มีผู้ตรวจ:
        </span>
        {uncovered.length === 0 ? (
          <span className="badge badge-success">ครบทุกจังหวัด</span>
        ) : (
          uncovered.map((p) => (
            <span key={p} className="badge badge-warning">
              {p}
            </span>
          ))
        )}
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {assessors.map((a, i) => {
          const mine = alloc[a.id] ?? [];
          const free = provinces.filter((p) => !mine.includes(p));
          return (
            <li
              key={a.id}
              className="card animate-stagger"
              style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
            >
              <p className="font-semibold break-words">{a.name}</p>
              <ul
                className="mt-3 flex flex-wrap gap-2"
                aria-label={`จังหวัดของ ${a.name}`}
              >
                {mine.length === 0 && (
                  <li
                    className="text-sm"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    ยังไม่ได้มอบหมายจังหวัด
                  </li>
                )}
                {mine.map((p) => (
                  <li key={p} className="badge badge-info gap-1">
                    {p}
                    <button
                      type="button"
                      aria-label={`เอา${p}ออก`}
                      className="relative rounded-full p-0.5 hover:bg-black/10 after:absolute after:-inset-2 after:content-['']"
                      onClick={() => remove(a.id, p)}
                    >
                      <IconX aria-hidden="true" size={12} />
                    </button>
                  </li>
                ))}
              </ul>
              <label
                htmlFor={`alloc-${a.id}`}
                className="block text-[13px] font-semibold text-slate-700 mt-4 mb-1.5"
              >
                เพิ่มจังหวัด
              </label>
              <select
                id={`alloc-${a.id}`}
                name={`alloc-${a.id}`}
                autoComplete="off"
                className="input-field"
                value=""
                onChange={(e) => add(a.id, e.target.value)}
              >
                <option value="">เลือกจังหวัด…</option>
                {free.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
    </AdminLayout>
  );
}
