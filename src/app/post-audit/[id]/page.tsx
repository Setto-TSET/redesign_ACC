'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { Tabs } from '@/components/prototype/Tabs';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/format';
import { useQueryState } from '@/lib/useQueryState';
import { assessors } from '@/mock';
import { findPharmacy } from '@/mock/prototype/pharmacies';
import {
  auditPartTitles,
  overallStatus,
  postAudits,
  type AuditPart,
  type PostAudit,
} from '@/mock/prototype/postAudit';
import { AuditStatusBadge } from '../AuditStatusBadge';
import { HistoryTab, InfoTab, PartPanel } from './parts';

const TAB_KEYS = ['info', 'quality', 'ci', 'history'] as const;
type Tab = (typeof TAB_KEYS)[number];

function NotFound() {
  return (
    <AdminLayout title="ผลตรวจรักษาคุณภาพ">
      <div className="card text-center py-12">
        <p className="font-semibold">ไม่พบผลตรวจนี้</p>
        <Link href="/post-audit" className="btn-secondary mt-6">
          กลับไปรายการ
        </Link>
      </div>
    </AdminLayout>
  );
}

function Detail({ initial }: { initial: PostAudit }) {
  const { user } = useAuth();
  const router = useRouter();
  const [audit, setAudit] = useState(initial);
  const [tab, setTab] = useQueryState<Tab>('tab', 'info', TAB_KEYS);
  if (!user) return null;
  const shop = findPharmacy(audit.pharmacyId)!;

  const change = (
    part: AuditPart,
    patch: Partial<PostAudit['parts'][AuditPart]>,
    text: string,
  ) => {
    const at = new Date().toISOString();
    setAudit((a) => ({
      ...a,
      parts: { ...a.parts, [part]: { ...a.parts[part], ...patch } },
      history: [...a.history, { at, by: user.name, text }],
    }));
    toast.success(text);
  };

  const canInspect =
    user.role === 'assessor' &&
    user.id === audit.assessorId &&
    (audit.parts.quality.status === 'pending' ||
      audit.parts.ci.status === 'pending');

  return (
    <AdminLayout title="ผลตรวจรักษาคุณภาพ">
      <PrototypeBadge />
      <div className="max-w-5xl space-y-6">
        <div className="card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-semibold">{audit.no}</p>
              <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
                {shop.name}
              </h2>
            </div>
            <AuditStatusBadge status={overallStatus(audit)} />
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--ink-secondary)' }}>
            ปี {audit.year} · ผู้ตรวจ{' '}
            {assessors.find((a) => a.id === audit.assessorId)?.name} · นัดตรวจ{' '}
            {formatDate(audit.visitDate)} (
            {audit.method === 'onsite' ? 'ตรวจที่ร้าน' : 'ตรวจออนไลน์'})
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <AuditStatusBadge
              small
              prefix="คุณภาพ: "
              status={audit.parts.quality.status}
            />
            <AuditStatusBadge
              small
              prefix="Common illness: "
              status={audit.parts.ci.status}
            />
          </div>
        </div>

        <Tabs
          label="ส่วนของผลตรวจ"
          tabs={[
            { key: 'info', label: 'ข้อมูล' },
            { key: 'quality', label: 'ระบบร้านยาคุณภาพ' },
            { key: 'ci', label: 'มาตรฐานบริการ' },
            { key: 'history', label: 'ประวัติ', count: audit.history.length },
          ]}
          value={tab}
          onChange={setTab}
        >
          {tab === 'info' && (
            <InfoTab
              shop={shop}
              canInspect={canInspect}
              onInspect={() => router.push(`/post-audit/${audit.id}/inspect`)}
            />
          )}
          {(tab === 'quality' || tab === 'ci') && (
            <PartPanel
              audit={audit}
              part={tab}
              role={user.role}
              onNotify={() =>
                change(
                  tab,
                  { status: 'fixing', notifiedAt: new Date().toISOString() },
                  `แจ้งร้านแล้ว (${auditPartTitles[tab]})`,
                )
              }
              onClose={() =>
                change(
                  tab,
                  { status: 'closed', closedAt: new Date().toISOString() },
                  `ปิดผลแล้ว (${auditPartTitles[tab]})`,
                )
              }
              onRework={(reason) =>
                change(
                  tab,
                  { status: 'fixing', reply: undefined, repliedAt: undefined },
                  `ให้แก้ไขเพิ่ม (${auditPartTitles[tab]}): ${reason}`,
                )
              }
              onReply={(text, files) =>
                change(
                  tab,
                  {
                    status: 'replied',
                    repliedAt: new Date().toISOString(),
                    reply: `${text} (แนบ: ${files.join(', ')})`,
                  },
                  `ส่งการแก้ไขแล้ว (${auditPartTitles[tab]})`,
                )
              }
            />
          )}
          {tab === 'history' && <HistoryTab history={audit.history} />}
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function PostAuditDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  if (!user) return <AdminLayout title="ผลตรวจรักษาคุณภาพ">{null}</AdminLayout>;
  const found = postAudits.find((a) => a.id === id);
  const allowed =
    found && (user.role !== 'pharmacy' || found.pharmacyId === user.pharmacyId);
  if (!found || !allowed) return <NotFound />;
  // key: เปลี่ยน id แล้ว clone ใหม่
  return <Detail key={id} initial={structuredClone(found)} />;
}

export default function PostAuditDetailPage() {
  return (
    <Suspense>
      <PostAuditDetail />
    </Suspense>
  );
}
