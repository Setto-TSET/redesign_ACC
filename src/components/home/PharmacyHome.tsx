'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
} from '@tabler/icons-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { api } from '@/lib/api';
import { requestTypes } from '@/lib/constants';
import { pharmacyTodos, type Todo } from '@/lib/requestRules';
import type { AccRequest } from '@/types/api';

const toneStyle: Record<Todo['tone'], { bg: string; fg: string }> = {
  warning: { bg: 'var(--warn-soft)', fg: 'var(--warn)' },
  info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
};

/** หน้าแรกของร้านยา: งานที่ต้องทำก่อน แล้วตามด้วยคำขอล่าสุด (หลักการ UX ข้อ 1) */
export function PharmacyHome({ pharmacyId }: { pharmacyId: number }) {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [recent, setRecent] = useState<AccRequest[]>([]);

  useEffect(() => {
    Promise.all([
      api.pharmacies.get(pharmacyId),
      api.requests.list({ pharmacyId }),
    ]).then(([shop, reqs]) => {
      setTodos(shop ? pharmacyTodos(shop, reqs, new Date()) : []);
      setRecent(reqs.slice(0, 3));
    });
  }, [pharmacyId]);

  if (!todos) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <section>
        <h3 className="font-bold tracking-tight mb-3">งานที่รอคุณ</h3>
        {todos.length === 0 ? (
          <div className="card flex items-center gap-3">
            <IconCircleCheck size={22} style={{ color: 'var(--accent)' }} />
            <p className="text-sm">
              ไม่มีงานค้าง ใบรับรองของร้านยังไม่ใกล้หมดอายุ
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {todos.map((t) => {
              const s = toneStyle[t.tone];
              const Icon =
                t.tone === 'warning' ? IconAlertTriangle : IconInfoCircle;
              return (
                <li
                  key={t.title}
                  className="card flex flex-wrap items-center gap-4"
                >
                  <span
                    className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center"
                    style={{ background: s.bg, color: s.fg }}
                  >
                    <Icon size={22} stroke={1.75} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{t.title}</p>
                    <p
                      className="text-sm mt-0.5 flex flex-wrap items-center gap-2"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {t.detail}
                      {t.status && <StatusBadge status={t.status} />}
                    </p>
                  </div>
                  <Link href={t.href} className="btn-primary">
                    {t.cta}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 className="font-bold tracking-tight">คำขอล่าสุด</h3>
          <Link
            href="/requests"
            className="text-sm font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            ดูทั้งหมด
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm py-4" style={{ color: 'var(--ink-secondary)' }}>
            ยังไม่เคยยื่นคำขอ
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/requests/${r.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <span>
                    <span className="font-mono text-sm font-semibold">
                      {r.no}
                    </span>
                    <span
                      className="block text-xs mt-0.5"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {r.typeIds
                        .map(
                          (id) => requestTypes.find((t) => t.id === id)?.label,
                        )
                        .join(', ')}
                    </span>
                  </span>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
