'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { IconCalendarEvent } from '@tabler/icons-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AdminLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { visitMethodLabels } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { AccRequest, Pharmacy } from '@/types/api';

/** ตารางนัดตรวจ — ผู้ตรวจเห็นเฉพาะที่ได้รับมอบหมาย, เจ้าหน้าที่เห็นทั้งหมด */
export default function SchedulePage() {
  const { user } = useAuth();
  const [reqs, setReqs] = useState<AccRequest[] | null>(null);
  const [shops, setShops] = useState<Pharmacy[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.requests.list(
        user.role === 'assessor' ? { assessorId: user.id } : {},
      ),
      api.pharmacies.list(),
    ])
      .then(([r, p]) => {
        setReqs(r.filter((x) => x.visit));
        setShops(p);
      })
      .catch(() => toast.error('โหลดตารางนัดไม่สำเร็จ'));
  }, [user]);

  const byDate = (a: AccRequest, b: AccRequest) =>
    (a.visit?.date ?? '').localeCompare(b.visit?.date ?? '');
  const todo = (reqs ?? []).filter((r) => r.status === 'assigned').sort(byDate);
  const done = (reqs ?? []).filter((r) => r.status !== 'assigned').sort(byDate);

  const row = (r: AccRequest) => {
    const shop = shops.find((s) => s.id === r.pharmacyId);
    return (
      <li key={r.id} className="card flex flex-wrap items-center gap-4">
        <span
          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-xs font-bold"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          <IconCalendarEvent aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {r.visit && formatDate(r.visit.date)} ·{' '}
            {r.visit && visitMethodLabels[r.visit.method]}
          </p>
          <p className="text-sm">
            {shop?.name ?? '-'} · {shop?.province}
          </p>
          <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
            {r.no}
          </p>
        </div>
        <StatusBadge status={r.status} />
        {r.status === 'assigned' && user?.role === 'assessor' ? (
          <Link href={`/requests/${r.id}/assess`} className="btn-primary">
            เริ่มประเมิน
          </Link>
        ) : (
          <Link href={`/requests/${r.id}`} className="btn-secondary">
            ดูคำขอ
          </Link>
        )}
      </li>
    );
  };

  return (
    <AdminLayout title="ตารางผู้ตรวจ">
      <div className="max-w-4xl space-y-8">
        <section>
          <h2 className="text-lg font-bold">นัดที่รอประเมิน ({todo.length})</h2>
          {reqs && todo.length === 0 ? (
            <p
              className="mt-3 text-sm"
              style={{ color: 'var(--ink-secondary)' }}
            >
              ไม่มีนัดที่รอประเมิน
            </p>
          ) : (
            <ul className="mt-3 space-y-3">{todo.map(row)}</ul>
          )}
        </section>
        {done.length > 0 && (
          <section>
            <h2 className="text-lg font-bold">ประเมินแล้ว</h2>
            <ul className="mt-3 space-y-3">{done.map(row)}</ul>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
