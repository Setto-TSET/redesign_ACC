'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout';
import { CycleTimeline } from '@/components/prototype/CycleTimeline';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/format';
import {
  complaints,
  complaintSteps,
  stageOfStep,
  type Complaint,
} from '@/mock/prototype/complaints';
import { findPharmacy } from '@/mock/prototype/pharmacies';
import { SeverityBadge, StageBadge } from '../ComplaintBadges';
import { StepModal } from './StepModal';

const LAST = complaintSteps.length;

function NotFound() {
  return (
    <AdminLayout title="ข้อร้องเรียน">
      <PrototypeBadge />
      <div className="card text-center py-12">
        <p className="font-semibold">ไม่พบข้อร้องเรียนนี้</p>
        <Link href="/complaints" className="btn-secondary mt-6">
          กลับไปรายการ
        </Link>
      </div>
    </AdminLayout>
  );
}

function Detail({ initial }: { initial: Complaint }) {
  const { user } = useAuth();
  const [c, setC] = useState(initial);
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const shop = c.pharmacyId ? findPharmacy(c.pharmacyId) : undefined;
  const closed = c.step >= LAST;

  const record = (date: string, text: string) => {
    const label = complaintSteps[c.step];
    setC((x) => ({
      ...x,
      step: x.step + 1,
      log: [...x.log, { step: x.step, date, text }],
    }));
    setOpen(false);
    toast.success(`บันทึกขั้น ${label} แล้ว`);
  };

  const closeNow = () => {
    if (!window.confirm('ปิดเรื่องนี้โดยข้ามขั้นที่เหลือ?')) return;
    const d = new Date();
    const date = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    setC((x) => ({
      ...x,
      step: LAST,
      log: [
        ...x.log,
        { step: LAST - 1, date, text: 'ปิดเรื่องโดยข้ามขั้นที่เหลือ' },
      ],
    }));
    toast.success('ปิดเรื่องแล้ว');
  };

  const rows: [string, React.ReactNode][] = [
    ['วันที่รับ', formatDate(c.receivedAt)],
    ['ช่องทาง', c.channel],
    ['ผู้ร้องเรียน', `${c.complainant.name} (${c.complainant.contact})`],
    [
      'ร้านที่ถูกร้องเรียน',
      shop ? (
        <Link
          href={`/pharmacies/${shop.id}`}
          className="underline-offset-2 hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          {shop.name}
        </Link>
      ) : (
        (c.pharmacyText ?? '-')
      ),
    ],
    ['ผู้รับเรื่อง', c.receiver],
    ['มาตรฐานที่เกี่ยวข้อง', c.standards.join(', ') || '-'],
    ['บริการที่เกี่ยวข้อง', c.service],
    ['ประเด็นปัญหา', c.issue],
    ['ความรุนแรง', <SeverityBadge key="s" severity={c.severity} />],
    ['รายละเอียด', c.detail],
    ['รูปหลักฐาน', c.photos ? `${c.photos} รูป` : '-'],
  ];

  return (
    <AdminLayout title="ข้อร้องเรียน">
      <PrototypeBadge />
      <div className="max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold">{c.no}</p>
            <h2 className="text-xl font-extrabold tracking-tight mt-0.5 break-words">
              {c.issue}
            </h2>
          </div>
          <StageBadge stage={stageOfStep(c.step)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-2 self-start">
            <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
              {rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt style={{ color: 'var(--ink-secondary)' }}>{k}</dt>
                  <dd className="font-medium break-words">{v}</dd>
                </div>
              ))}
            </dl>
            {!closed && (
              <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setOpen(true)}
                >
                  บันทึกขั้นถัดไป: {complaintSteps[c.step]}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeNow}
                >
                  ปิดเรื่อง
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="text-sm font-bold mb-4">ขั้นตอนการดำเนินการ</h3>
            <CycleTimeline
              orientation="vertical"
              current={c.step}
              steps={complaintSteps.map((label, i) => {
                const l = c.log.find((x) => x.step === i);
                return { label, date: l?.date, note: l?.text };
              })}
            />
          </div>
        </div>
      </div>
      {open && (
        <StepModal
          index={c.step}
          defaultUser={user.name}
          onCancel={() => setOpen(false)}
          onSave={record}
        />
      )}
    </AdminLayout>
  );
}

function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  if (!user) return <AdminLayout title="ข้อร้องเรียน">{null}</AdminLayout>;
  const found = complaints.find((x) => x.id === id);
  if (!found) return <NotFound />;
  return <Detail key={id} initial={structuredClone(found)} />;
}

export default function ComplaintDetailPage() {
  return (
    <Suspense>
      <ComplaintDetail />
    </Suspense>
  );
}
