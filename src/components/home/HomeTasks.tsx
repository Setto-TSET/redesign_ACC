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
import { typeLabel } from '@/lib/constants';
import { pharmacyTodos, staffTodos, type Todo } from '@/lib/requestRules';
import type { AccRequest, User } from '@/types/api';

const toneStyle: Record<Todo['tone'], { bg: string; fg: string }> = {
  warning: { bg: 'var(--warn-soft)', fg: 'var(--warn)' },
  info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
};

/** หน้าแรก: งานที่ต้องทำก่อน แล้วตามด้วยคำขอล่าสุด (หลักการ UX ข้อ 1) */
export function HomeTasks({ user }: { user: User }) {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [recent, setRecent] = useState<AccRequest[]>([]);
  const isShop = user.role === 'pharmacy';

  useEffect(() => {
    if (user.role === 'pharmacy') {
      const pharmacyId = user.pharmacyId;
      Promise.all([
        pharmacyId ? api.pharmacies.get(pharmacyId) : null,
        api.requests.list({ pharmacyId }),
      ]).then(([shop, reqs]) => {
        setTodos(shop ? pharmacyTodos(shop, reqs, new Date()) : []);
        setRecent(reqs.slice(0, 3));
      });
      return;
    }
    api.requests
      .list(user.role === 'assessor' ? { assessorId: user.id } : {})
      .then((reqs) => {
        setTodos(staffTodos(reqs, user));
        setRecent(reqs.slice(0, 5));
      });
  }, [user]);

  if (!todos) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <section>
        <h2 className="font-bold tracking-tight mb-3">งานที่รอคุณ</h2>
        {todos.length === 0 ? (
          <div className="card flex items-center gap-3">
            <IconCircleCheck
              size={22}
              aria-hidden="true"
              style={{ color: 'var(--accent)' }}
            />
            <p className="text-sm">
              {isShop
                ? 'ไม่มีงานค้าง ใบรับรองของร้านยังไม่ใกล้หมดอายุ'
                : 'ไม่มีงานค้าง'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {todos.map((t, i) => {
              const s = toneStyle[t.tone];
              const Icon =
                t.tone === 'warning' ? IconAlertTriangle : IconInfoCircle;
              return (
                <li
                  key={t.title}
                  className="card animate-stagger flex flex-wrap items-center gap-4"
                  style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                >
                  <span
                    className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center"
                    style={{ background: s.bg, color: s.fg }}
                  >
                    <Icon size={22} stroke={1.75} aria-hidden="true" />
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
          <h2 className="font-bold tracking-tight">คำขอล่าสุด</h2>
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
            {isShop ? 'ยังไม่เคยยื่นคำขอ' : 'ยังไม่มีคำขอ'}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {recent.map((r, i) => (
              <li
                key={r.id}
                className="animate-stagger"
                style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
              >
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
                      {typeLabel(r.typeIds)}
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
