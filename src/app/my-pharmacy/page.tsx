'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IconEdit } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { CertBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { Pharmacy } from '@/types/api';

const dateText = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-zinc-100">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr]">
          <dt className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            {k}
          </dt>
          <dd className="text-sm font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function MyPharmacyPage() {
  const { user } = useAuth();
  const [shop, setShop] = useState<Pharmacy | null>(null);

  useEffect(() => {
    if (user?.pharmacyId) api.pharmacies.get(user.pharmacyId).then(setShop);
  }, [user]);

  return (
    <AdminLayout title="ข้อมูลร้านของฉัน">
      {shop && (
        <div className="max-w-4xl space-y-6">
          <div className="card flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold tracking-tight">
                {shop.name}
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: 'var(--ink-secondary)' }}
              >
                ใบอนุญาต {shop.licenseNo} · {shop.province}
              </p>
              <div className="mt-3">
                <CertBadge status={shop.certStatus} />
              </div>
            </div>
            <Link href="/requests/new" className="btn-secondary gap-2">
              <IconEdit size={16} stroke={1.75} />
              ขอเปลี่ยนแปลงข้อมูล
            </Link>
          </div>

          <p className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>
            การแก้ไขข้อมูลร้านต้องยื่นเป็นคำขอเปลี่ยนแปลง เพื่อให้ สรร.
            ตรวจสอบก่อน
          </p>

          <section className="card">
            <h3 className="font-bold mb-2">การรับรอง</h3>
            <Rows
              rows={[
                ['เลขที่ใบรับรอง', shop.qualityNo ?? '-'],
                ['วันที่รับรอง', dateText(shop.certIssued)],
                ['วันหมดอายุ', dateText(shop.certExpires)],
              ]}
            />
          </section>

          <section className="card">
            <h3 className="font-bold mb-2">ข้อมูลร้าน</h3>
            <Rows
              rows={[
                ['ประเภทร้าน', shop.type],
                ['ที่ตั้ง', `${shop.address} จ.${shop.province}`],
                ['ผู้รับอนุญาต', shop.licensee],
                ['เบอร์โทร', shop.phone],
                ['เวลาทำการ', shop.hours],
              ]}
            />
          </section>

          <section className="card">
            <h3 className="font-bold mb-3">เภสัชกร</h3>
            <ul className="divide-y divide-zinc-100">
              {shop.pharmacists.map((p) => (
                <li
                  key={p.license}
                  className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {p.role} · {p.license}
                    </p>
                  </div>
                  <span className="text-sm">{p.hours}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
