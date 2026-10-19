'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { doneLabels } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { useQueryState } from '@/lib/useQueryState';
import { actionsFor, canAddPayment, canSelfAssess } from '@/lib/requestRules';
import type {
  AccRequest,
  ActionInput,
  Assessor,
  Pharmacy,
  RequestAction,
} from '@/types/api';
import { ActionDialog } from './ActionDialog';
import { RequestHeader } from './RequestHeader';
import { DocsTab, HistoryTab, InfoTab, PaymentsTab, ResultTab } from './tabs';

const TABS = [
  { key: 'info', label: 'ข้อมูล' },
  { key: 'docs', label: 'เอกสาร' },
  { key: 'payments', label: 'การชำระเงิน' },
  { key: 'result', label: 'ผลประเมิน' },
  { key: 'history', label: 'ประวัติ' },
] as const;
type Tab = (typeof TABS)[number]['key'];
const TAB_KEYS = TABS.map((t) => t.key);

/** action ที่ไม่ต้องกรอกอะไร — กดแล้วทำเลย */
const IMMEDIATE: RequestAction[] = ['start_review', 'to_committee'];

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, hasAccess } = useAuth();
  const router = useRouter();
  // undefined = กำลังโหลด, null = ไม่พบหรือไม่มีสิทธิ์
  const [req, setReq] = useState<AccRequest | null | undefined>();
  const [shop, setShop] = useState<Pharmacy | null>(null);
  const [assessors, setAssessors] = useState<Assessor[]>([]);
  const [loads, setLoads] = useState<Record<number, number>>({});
  const [tab, setTab] = useQueryState<Tab>('tab', 'info', TAB_KEYS);
  const [dialog, setDialog] = useState<RequestAction | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.requests.get(id, user),
      api.assessors.list(),
      api.requests.list(),
    ])
      .then(([r, list, all]) => {
        setReq(r);
        setAssessors(list);
        // ภาระงานผู้ตรวจ = นัดที่มอบหมายแล้วแต่ยังไม่ส่งผล
        const count: Record<number, number> = {};
        for (const x of all.filter((x) => x.status === 'assigned'))
          for (const a of x.assessorIds) count[a] = (count[a] ?? 0) + 1;
        setLoads(count);
        if (r) return api.pharmacies.get(r.pharmacyId).then(setShop);
      })
      .catch(() => {
        toast.error('โหลดคำขอไม่สำเร็จ');
        setReq(null);
      });
  }, [id, user]);

  if (!user || req === undefined)
    return <AdminLayout title="รายละเอียดคำขอ">{null}</AdminLayout>;

  if (req === null)
    return (
      <AdminLayout title="รายละเอียดคำขอ">
        <div className="card text-center py-12">
          <p className="font-semibold">ไม่พบคำขอ</p>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            คำขอนี้ไม่มีอยู่ หรือคุณไม่มีสิทธิ์ดู
          </p>
          <Link href="/requests" className="btn-secondary mt-6">
            กลับไปรายการคำขอ
          </Link>
        </div>
      </AdminLayout>
    );

  const actions = actionsFor(req.status, user.role);

  const run = async (action: RequestAction, input: ActionInput = {}) => {
    const res = await api.requests.act(req.id, action, input, user);
    if ('request' in res) {
      setReq(res.request);
      toast.success(doneLabels[action]);
    }
    return res;
  };

  const onAction = async (action: RequestAction) => {
    if (action === 'resubmit_docs') return setTab('docs');
    if (action === 'submit_assessment')
      return router.push(`/requests/${req.id}/assess`);
    if (IMMEDIATE.includes(action)) {
      const res = await run(action);
      if ('error' in res) toast.error(res.error);
      return;
    }
    setDialog(action);
  };

  const addPayment = async (p: { amount: number; fileName: string }) => {
    const res = await api.requests.addPayment(req.id, p, user);
    if ('request' in res) {
      setReq(res.request);
      toast.success('บันทึกหลักฐานการโอนแล้ว');
    }
    return res;
  };

  const counts: Partial<Record<Tab, number>> = {
    docs: req.docs.length,
    history: req.messages.length,
  };

  return (
    <AdminLayout title="รายละเอียดคำขอ">
      <div className="max-w-5xl space-y-6">
        <Link
          href="/requests"
          className="inline-block text-sm font-semibold"
          style={{ color: 'var(--accent)' }}
        >
          <span aria-hidden="true">←</span> กลับไปรายการคำขอ
        </Link>

        <RequestHeader
          req={req}
          shop={shop}
          role={user.role}
          actions={actions}
          onAction={onAction}
        />

        {canSelfAssess(req, user) && (
          <div
            className="card flex flex-wrap items-center justify-between gap-3"
            style={{ background: 'var(--info-soft)' }}
          >
            <p className="text-sm">
              {req.selfAssessment
                ? 'ประเมินตนเองแล้ว แก้ไขได้จนกว่า สรร. จะมอบหมายผู้ตรวจ'
                : 'ประเมินตนเองตามเกณฑ์ GPP ก่อนผู้ตรวจลงพื้นที่'}
            </p>
            <Link href={`/requests/${req.id}/assess`} className="btn-primary">
              {req.selfAssessment ? 'แก้ไขผลประเมินตนเอง' : 'ประเมินตนเอง'}
            </Link>
          </div>
        )}

        {req.cert && (
          <div
            className="card flex flex-wrap items-center justify-between gap-3"
            style={{ background: 'var(--accent-soft)' }}
          >
            <p className="text-sm">
              ออกใบรับรองแล้ว{' '}
              <span className="font-mono font-bold">{req.cert.no}</span> ·
              ใช้ได้ถึง {formatDate(req.cert.expires)}
            </p>
            {hasAccess('/certificates') && (
              <Link
                href={`/certificates/${req.pharmacyId}`}
                className="btn-secondary"
              >
                ดู / พิมพ์ใบรับรอง
              </Link>
            )}
          </div>
        )}

        <div className="card !p-0 overflow-hidden">
          <div
            role="tablist"
            aria-label="ส่วนของคำขอ"
            className="flex gap-1 overflow-x-auto border-b border-zinc-100 px-2"
            onKeyDown={(e) => {
              const el = (e.target as HTMLElement).closest('[role=tab]');
              if (!el) return;
              const i = TAB_KEYS.indexOf(el.id.slice(4) as Tab);
              const n = TABS.length;
              const j =
                e.key === 'ArrowRight'
                  ? (i + 1) % n
                  : e.key === 'ArrowLeft'
                    ? (i - 1 + n) % n
                    : e.key === 'Home'
                      ? 0
                      : e.key === 'End'
                        ? n - 1
                        : -1;
              if (j < 0) return;
              e.preventDefault();
              const next = TABS[j];
              setTab(next.key);
              document.getElementById(`tab-${next.key}`)?.focus();
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                id={`tab-${t.key}`}
                type="button"
                role="tab"
                aria-controls="tab-panel"
                aria-selected={t.key === tab}
                tabIndex={t.key === tab ? 0 : -1}
                onClick={() => setTab(t.key)}
                className="shrink-0 px-4 py-3 text-sm font-semibold border-b-2 -mb-px hover:bg-zinc-50"
                style={
                  t.key === tab
                    ? { borderColor: 'var(--accent)', color: 'var(--accent)' }
                    : {
                        borderColor: 'transparent',
                        color: 'var(--ink-secondary)',
                      }
                }
              >
                {t.label}
                {counts[t.key] !== undefined && (
                  <>
                    {' ('}
                    <span className="tabular-nums">{counts[t.key]}</span>
                    {')'}
                  </>
                )}
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id="tab-panel"
            aria-labelledby={`tab-${tab}`}
            key={tab}
            className="p-5 sm:p-6 animate-fade"
          >
            {tab === 'info' && (
              <InfoTab req={req} shop={shop} assessors={assessors} />
            )}
            {tab === 'docs' && (
              <DocsTab
                req={req}
                canResubmit={actions.includes('resubmit_docs')}
                onResubmit={(newDocs) => run('resubmit_docs', { newDocs })}
              />
            )}
            {tab === 'payments' && (
              <PaymentsTab
                req={req}
                canAdd={canAddPayment(req, user)}
                onAdd={addPayment}
              />
            )}
            {tab === 'result' && <ResultTab req={req} role={user.role} />}
            {tab === 'history' && <HistoryTab req={req} />}
          </div>
        </div>
      </div>

      {dialog && (
        <ActionDialog
          action={dialog}
          current={req.status}
          assessors={assessors}
          loads={loads}
          onClose={() => setDialog(null)}
          onSubmit={(input) => run(dialog, input)}
        />
      )}
    </AdminLayout>
  );
}
