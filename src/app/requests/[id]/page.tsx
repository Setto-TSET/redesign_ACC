'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { doneLabels } from '@/lib/constants';
import { actionsFor, canAddPayment } from '@/lib/requestRules';
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
  'ข้อมูล',
  'เอกสาร',
  'การชำระเงิน',
  'ผลประเมิน',
  'ประวัติ',
] as const;
type Tab = (typeof TABS)[number];

/** action ที่ไม่ต้องกรอกอะไร — กดแล้วทำเลย */
const IMMEDIATE: RequestAction[] = ['start_review', 'to_committee'];

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  // undefined = กำลังโหลด, null = ไม่พบหรือไม่มีสิทธิ์
  const [req, setReq] = useState<AccRequest | null | undefined>();
  const [shop, setShop] = useState<Pharmacy | null>(null);
  const [assessors, setAssessors] = useState<Assessor[]>([]);
  const [tab, setTab] = useState<Tab>('ข้อมูล');
  const [dialog, setDialog] = useState<RequestAction | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.requests.get(id, user), api.assessors.list()])
      .then(([r, list]) => {
        setReq(r);
        setAssessors(list);
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
    if (action === 'resubmit_docs') return setTab('เอกสาร');
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
    เอกสาร: req.docs.length,
    ประวัติ: req.messages.length,
  };

  return (
    <AdminLayout title="รายละเอียดคำขอ">
      <div className="max-w-5xl space-y-6">
        <Link
          href="/requests"
          className="inline-block text-sm font-semibold"
          style={{ color: 'var(--accent)' }}
        >
          ← กลับไปรายการคำขอ
        </Link>

        <RequestHeader
          req={req}
          shop={shop}
          role={user.role}
          actions={actions}
          onAction={onAction}
        />

        <div className="card !p-0 overflow-hidden">
          <div
            role="tablist"
            aria-label="ส่วนของคำขอ"
            className="flex gap-1 overflow-x-auto border-b border-zinc-100 px-2"
          >
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={t === tab}
                onClick={() => setTab(t)}
                className="shrink-0 px-4 py-3 text-sm font-semibold border-b-2 -mb-px"
                style={
                  t === tab
                    ? { borderColor: 'var(--accent)', color: 'var(--accent)' }
                    : {
                        borderColor: 'transparent',
                        color: 'var(--ink-secondary)',
                      }
                }
              >
                {t}
                {counts[t] !== undefined && ` (${counts[t]})`}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="p-5 sm:p-6">
            {tab === 'ข้อมูล' && (
              <InfoTab req={req} shop={shop} assessors={assessors} />
            )}
            {tab === 'เอกสาร' && (
              <DocsTab
                req={req}
                canResubmit={actions.includes('resubmit_docs')}
                onResubmit={(newDocs) => run('resubmit_docs', { newDocs })}
              />
            )}
            {tab === 'การชำระเงิน' && (
              <PaymentsTab
                req={req}
                canAdd={canAddPayment(req, user)}
                onAdd={addPayment}
              />
            )}
            {tab === 'ผลประเมิน' && <ResultTab req={req} role={user.role} />}
            {tab === 'ประวัติ' && <HistoryTab req={req} />}
          </div>
        </div>
      </div>

      {dialog && (
        <ActionDialog
          action={dialog}
          current={req.status}
          assessors={assessors}
          onClose={() => setDialog(null)}
          onSubmit={(input) => run(dialog, input)}
        />
      )}
    </AdminLayout>
  );
}
