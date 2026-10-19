'use client';

import { useEffect, useState } from 'react';
import {
  IconBuildingStore,
  IconCertificate,
  IconFileCertificate,
} from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { HomeTasks } from '@/components/home/HomeTasks';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { isAlive } from '@/lib/requestRules';
import { roleLabels } from '@/mock';

type Stat = { label: string; value: number; icon: typeof IconCertificate };

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stat[]>([]);
  const showStats = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    if (!showStats) return;
    Promise.all([api.pharmacies.list(), api.requests.list()]).then(
      ([shops, reqs]) =>
        setStats([
          {
            label: 'ร้านยาทั้งหมด',
            value: shops.length,
            icon: IconBuildingStore,
          },
          {
            label: 'รับรองแล้ว',
            value: shops.filter((s) => s.certStatus === 'A').length,
            icon: IconCertificate,
          },
          {
            label: 'คำขอที่กำลังดำเนินการ',
            value: reqs.filter((r) => isAlive(r.status)).length,
            icon: IconFileCertificate,
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
        <div className="mb-6 grid max-w-4xl gap-4 sm:grid-cols-3">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="stat-card animate-stagger"
              style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
            >
              <div
                className="stat-icon"
                style={{
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                }}
              >
                <s.icon size={22} stroke={1.5} aria-hidden="true" />
              </div>
              <div>
                <div className="stat-value tabular-nums">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {user && <HomeTasks user={user} />}
    </AdminLayout>
  );
}
