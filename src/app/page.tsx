'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout';
import { HomeTasks } from '@/components/home/HomeTasks';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { isAlive } from '@/lib/requestRules';
import { roleLabels } from '@/mock';

type Stat = { label: string; value: number };

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stat[]>([]);
  const showStats = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    if (!showStats) return;
    Promise.all([api.pharmacies.list(), api.requests.list()]).then(
      ([shops, reqs]) =>
        // ตัวแรกคืองานที่ต้องลงมือ — แสดงเด่นสุด ที่เหลือเป็นบริบท
        setStats([
          {
            label: 'คำขอที่กำลังดำเนินการ',
            value: reqs.filter((r) => isAlive(r.status)).length,
          },
          { label: 'ร้านยาทั้งหมด', value: shops.length },
          {
            label: 'รับรองแล้ว',
            value: shops.filter((s) => s.certStatus === 'A').length,
          },
        ]),
    );
  }, [showStats]);

  return (
    <AdminLayout title="หน้าหลัก">
      <div className="mb-8">
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          {user && roleLabels[user.role]} · {user?.org}
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight mt-1">
          สวัสดี {user?.name}
        </h2>
      </div>

      {showStats && stats.length > 0 && (
        <dl className="card !p-0 mb-6 grid max-w-4xl divide-y divide-slate-100 sm:grid-cols-[1.5fr_1fr_1fr] sm:divide-x sm:divide-y-0">
          {stats.map((s, i) => (
            <div key={s.label} className="px-6 py-5">
              <dt className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
                {s.label}
              </dt>
              <dd
                className={`mt-1.5 font-extrabold leading-none tabular-nums tracking-tight ${i === 0 ? 'text-4xl' : 'text-2xl'}`}
                style={i === 0 ? { color: 'var(--accent)' } : undefined}
              >
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {user && <HomeTasks user={user} />}
    </AdminLayout>
  );
}
