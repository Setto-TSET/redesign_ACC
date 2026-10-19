'use client';

import { IconAlertTriangle, IconCircleX } from '@tabler/icons-react';
import { Stepper } from '@/components/common/Stepper';
import { StatusBadge } from '@/components/common/StatusBadge';
import { actionLabels, requestStatusLabels, typeLabel } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type {
  AccRequest,
  Pharmacy,
  RequestAction,
  RequestStatus,
  UserRole,
} from '@/types/api';

const STEPS = [
  'รับคำขอ',
  'ตรวจเอกสาร',
  'มอบหมาย',
  'ประเมิน',
  'คณะกรรมการ',
  'ผล',
];

const stepOf: Partial<Record<RequestStatus, number>> = {
  submitted: 0,
  doc_review: 1,
  need_docs: 1,
  assigned: 2,
  assessed: 3,
  committee: 4,
  approved: 5,
};

/** ปุ่มรอง — ที่เหลือเป็นปุ่มหลัก */
const SECONDARY: RequestAction[] = ['reply', 'cancel', 'override'];

/** ข้อความล่าสุดที่พาคำขอมาสู่สถานะนี้ */
const lastText = (req: AccRequest, status: RequestStatus) =>
  [...req.messages].reverse().find((m) => m.status === status)?.text ?? '';

export function RequestHeader({
  req,
  shop,
  role,
  actions,
  onAction,
}: {
  req: AccRequest;
  shop: Pharmacy | null;
  role: UserRole;
  actions: RequestAction[];
  onAction: (action: RequestAction) => void;
}) {
  const step = stepOf[req.status];
  const ended = req.status === 'cancelled' || req.status === 'rejected';
  const primary = actions.filter((a) => !SECONDARY.includes(a));
  const secondary = actions.filter((a) => SECONDARY.includes(a));

  return (
    <div className="card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-mono text-xl font-bold">{req.no}</h2>
            <StatusBadge status={req.status} />
          </div>
          {shop && (
            <p className="mt-1 text-sm font-medium">
              {shop.name} · {shop.province}
            </p>
          )}
          <p
            className="mt-0.5 text-xs"
            style={{ color: 'var(--ink-secondary)' }}
          >
            {typeLabel(req.typeIds)} · ยื่นเมื่อ {formatDate(req.submittedAt)}
          </p>
        </div>
        {actions.length > 0 && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            {primary.map((a) => (
              <button
                key={a}
                type="button"
                className="btn-primary"
                onClick={() => onAction(a)}
              >
                {a === 'resubmit_docs' ? 'แนบเอกสารเพิ่ม' : actionLabels[a]}
              </button>
            ))}
            {secondary.map((a) => (
              <button
                key={a}
                type="button"
                className="btn-secondary"
                onClick={() => onAction(a)}
              >
                {a === 'resubmit_docs' ? 'แนบเอกสารเพิ่ม' : actionLabels[a]}
              </button>
            ))}
          </div>
        )}
      </div>

      {ended ? (
        <div
          role="status"
          className="flex gap-2 rounded-xl p-4 text-sm"
          style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
        >
          <IconCircleX size={20} className="shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold">{requestStatusLabels[req.status]}</p>
            <p className="mt-1 whitespace-pre-line break-words">
              {lastText(req, req.status)}
            </p>
          </div>
        </div>
      ) : (
        step !== undefined && <Stepper steps={STEPS} current={step} />
      )}

      {role === 'pharmacy' && req.status === 'need_docs' && (
        <div
          role="alert"
          className="flex gap-2 rounded-xl p-4 text-sm"
          style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}
        >
          <IconAlertTriangle
            size={20}
            className="shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="font-semibold">สรร. ขอเอกสารเพิ่มเติม</p>
            <p
              className="mt-1 whitespace-pre-line break-words"
              style={{ color: 'var(--ink)' }}
            >
              {lastText(req, 'need_docs')}
            </p>
            <p className="mt-1">
              แนบไฟล์ที่แท็บ &quot;เอกสาร&quot; แล้วกด &quot;
              {actionLabels.resubmit_docs}&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
