'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { AdminLayout } from '@/components/layout';
import { CertBadge } from '@/components/common/StatusBadge';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { Tabs } from '@/components/prototype/Tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryState } from '@/lib/useQueryState';
import { findPharmacy } from '@/mock/prototype/pharmacies';
import {
  AuditsTab,
  CertHistoryTab,
  ComplaintsTab,
  InfoTab,
  PharmacistTab,
  RequestsTab,
} from './tabs';

const TAB_KEYS = [
  'info',
  'pharmacists',
  'certs',
  'requests',
  'audits',
  'complaints',
] as const;
type Tab = (typeof TAB_KEYS)[number];

function Message({ text }: { text: string }) {
  return (
    <AdminLayout title="ข้อมูลร้านยา">
      <PrototypeBadge />
      <div className="card text-center py-12">
        <p className="font-semibold">{text}</p>
        <Link href="/pharmacies" className="btn-secondary mt-6">
          กลับไปรายการ
        </Link>
      </div>
    </AdminLayout>
  );
}

function Detail() {
  const { id } = useParams<{ id: string }>();
  const { user, hasAccess } = useAuth();
  const [tab, setTab] = useQueryState<Tab>('tab', 'info', TAB_KEYS);
  const shop = findPharmacy(Number(id));

  if (!user) return null;
  if (!shop) return <Message text="ไม่พบร้านยานี้" />;
  if (user.role === 'ppho' && shop.province !== user.province)
    return <Message text="ร้านนี้อยู่นอกจังหวัดที่รับผิดชอบ" />;

  const isStaff = user.role === 'admin' || user.role === 'superadmin';
  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: 'ข้อมูลร้าน' },
    { key: 'pharmacists', label: 'เภสัชกร' },
    { key: 'certs', label: 'ประวัติการรับรอง' },
    { key: 'requests', label: 'คำขอ' },
    { key: 'audits', label: 'ตรวจรักษาคุณภาพ' },
    ...(isStaff ? [{ key: 'complaints' as Tab, label: 'ข้อร้องเรียน' }] : []),
  ];
  const current = tabs.some((t) => t.key === tab) ? tab : 'info';

  return (
    <AdminLayout title="ข้อมูลร้านยา">
      <PrototypeBadge />
      <div className="max-w-5xl space-y-6">
        <div className="card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-xl font-extrabold tracking-tight min-w-0 break-words">
              {shop.name}
            </h2>
            <CertBadge status={shop.certStatus} />
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--ink-secondary)' }}>
            เลขใบรับรอง{' '}
            <span className="tabular-nums">{shop.qualityNo ?? '-'}</span> ·
            จังหวัด{shop.province}
          </p>
        </div>
        <Tabs
          label="ข้อมูลร้านยา"
          tabs={tabs}
          value={current}
          onChange={setTab}
        >
          {current === 'info' && <InfoTab shop={shop} />}
          {current === 'pharmacists' && <PharmacistTab shop={shop} />}
          {current === 'certs' && <CertHistoryTab shop={shop} />}
          {current === 'requests' && (
            <RequestsTab shop={shop} canOpen={hasAccess('/requests')} />
          )}
          {current === 'audits' && <AuditsTab shop={shop} />}
          {current === 'complaints' && <ComplaintsTab shop={shop} />}
        </Tabs>
      </div>
    </AdminLayout>
  );
}

export default function PharmacyDetailPage() {
  return (
    <Suspense>
      <Detail />
    </Suspense>
  );
}
