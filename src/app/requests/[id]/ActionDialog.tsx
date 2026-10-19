'use client';

import { useEffect, useState } from 'react';
import { Field, inputClass } from '@/components/common/Field';
import { certExpiry } from '@/lib/certRules';
import {
  actionLabels,
  replyTemplates,
  requestStatusLabels,
  visitMethodLabels,
} from '@/lib/constants';
import type {
  ActionInput,
  ActionResult,
  Assessor,
  RequestAction,
  RequestStatus,
  VisitMethod,
} from '@/types/api';

/** ป้ายของช่องข้อความ — action ที่ไม่อยู่ในนี้ไม่มีช่องข้อความ */
const MESSAGE_LABEL: Partial<Record<RequestAction, string>> = {
  reply: 'ข้อความถึงร้านยา',
  request_docs: 'เอกสารที่ขอเพิ่ม',
  reject: 'เหตุผลที่ไม่ผ่าน',
  cancel: 'เหตุผลที่ยกเลิก',
  override: 'เหตุผลที่แก้สถานะ',
};

/** วันนี้ตามเวลาท้องถิ่น YYYY-MM-DD */
const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

const WITH_TEMPLATES: RequestAction[] = ['reply', 'request_docs'];
const DANGER: RequestAction[] = ['reject', 'cancel', 'override'];

export function ActionDialog({
  action,
  current,
  assessors,
  loads = {},
  onClose,
  onSubmit,
}: {
  action: RequestAction;
  current: RequestStatus;
  assessors: Assessor[];
  /** ผู้ตรวจ id → จำนวนนัดที่ยังไม่ส่งผล */
  loads?: Record<number, number>;
  onClose: () => void;
  onSubmit: (input: ActionInput) => Promise<ActionResult>;
}) {
  const [message, setMessage] = useState('');
  const [picked, setPicked] = useState<number[]>([]);
  const [status, setStatus] = useState<RequestStatus | ''>('');
  const [method, setMethod] = useState<VisitMethod>('onsite');
  const [visitDate, setVisitDate] = useState('');
  const [issued, setIssued] = useState(today);
  const [expires, setExpires] = useState(() => certExpiry(today()));
  const [error, setError] = useState<{
    field?: keyof ActionInput;
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const messageLabel = MESSAGE_LABEL[action];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const errorFor = (f: keyof ActionInput) =>
    error?.field === f ? error.text : undefined;

  /** ช่องที่ action นี้แสดงจริง — error ของช่องอื่นต้องขึ้นเป็นข้อความรวม */
  const renderedFields: (keyof ActionInput)[] = [
    ...(action === 'override' ? (['status'] as const) : []),
    ...(action === 'assign' ? (['assessorIds', 'visit'] as const) : []),
    ...(action === 'approve' ? (['cert'] as const) : []),
    ...(messageLabel ? (['message'] as const) : []),
  ];
  const showGenericError =
    !!error && !(error.field && renderedFields.includes(error.field));

  const submit = async () => {
    setBusy(true);
    try {
      const res = await onSubmit({
        message,
        assessorIds: picked,
        status: status || undefined,
        ...(action === 'assign' ? { visit: { method, date: visitDate } } : {}),
        ...(action === 'approve' ? { cert: { no: '', issued, expires } } : {}),
      });
      if ('error' in res) setError({ field: res.field, text: res.error });
      else onClose();
    } catch {
      setError({ text: 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-content max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="action-title" className="text-lg font-bold">
          {actionLabels[action]}
        </h2>

        <div className="mt-5 space-y-5">
          {action === 'approve' && (
            <>
              <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
                ยืนยันว่าคำขอนี้ผ่านคณะกรรมการรับรองแล้ว
                ระบบออกเลขรับรองให้อัตโนมัติเมื่อบันทึก
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="วันที่ออกใบรับรอง" htmlFor="issued">
                  <input
                    id="issued"
                    type="date"
                    className={inputClass(errorFor('cert'))}
                    value={issued}
                    onChange={(e) => setIssued(e.target.value)}
                  />
                </Field>
                <Field
                  label="วันหมดอายุ"
                  htmlFor="expires"
                  error={errorFor('cert')}
                >
                  <div className="flex gap-2">
                    <input
                      id="expires"
                      type="date"
                      className={inputClass(errorFor('cert'))}
                      aria-invalid={!!errorFor('cert')}
                      value={expires}
                      onChange={(e) => setExpires(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-secondary shrink-0"
                      disabled={!issued}
                      onClick={() => setExpires(certExpiry(issued))}
                    >
                      +3 ปี
                    </button>
                  </div>
                </Field>
              </div>
            </>
          )}

          {action === 'override' && (
            <Field
              label="สถานะใหม่"
              htmlFor="status"
              error={errorFor('status')}
            >
              <select
                id="status"
                className={inputClass(errorFor('status'))}
                aria-invalid={!!errorFor('status')}
                value={status}
                onChange={(e) => setStatus(e.target.value as RequestStatus)}
              >
                <option value="">เลือกสถานะ</option>
                {(Object.keys(requestStatusLabels) as RequestStatus[])
                  .filter((s) => s !== current)
                  .map((s) => (
                    <option key={s} value={s}>
                      {requestStatusLabels[s]}
                    </option>
                  ))}
              </select>
            </Field>
          )}

          {action === 'assign' && (
            <fieldset>
              <legend className="block text-[13px] font-semibold text-zinc-700 mb-2">
                ผู้ตรวจประเมิน
              </legend>
              <div className="space-y-2">
                {assessors.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[var(--accent)]"
                      checked={picked.includes(a.id)}
                      onChange={() =>
                        setPicked((p) =>
                          p.includes(a.id)
                            ? p.filter((x) => x !== a.id)
                            : [...p, a.id],
                        )
                      }
                    />
                    <span className="flex-1">{a.name}</span>
                    <span
                      className="text-xs"
                      style={{
                        color: loads[a.id]
                          ? 'var(--warn)'
                          : 'var(--ink-tertiary)',
                      }}
                    >
                      รอประเมิน {loads[a.id] ?? 0} ร้าน
                    </span>
                  </label>
                ))}
              </div>
              {errorFor('assessorIds') && (
                <p
                  className="mt-1 text-xs"
                  style={{ color: 'var(--danger)' }}
                  role="alert"
                >
                  {errorFor('assessorIds')}
                </p>
              )}
            </fieldset>
          )}

          {action === 'assign' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset>
                <legend className="block text-[13px] font-semibold text-zinc-700 mb-2">
                  วิธีตรวจ
                </legend>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(visitMethodLabels) as VisitMethod[]).map(
                    (m) => (
                      <label
                        key={m}
                        className="flex cursor-pointer items-center gap-1.5 text-sm"
                      >
                        <input
                          type="radio"
                          name="method"
                          className="accent-[var(--accent)]"
                          checked={method === m}
                          onChange={() => setMethod(m)}
                        />
                        {visitMethodLabels[m]}
                      </label>
                    ),
                  )}
                </div>
              </fieldset>
              <Field
                label="วันนัดตรวจ"
                htmlFor="visitDate"
                error={errorFor('visit')}
              >
                <input
                  id="visitDate"
                  type="date"
                  className={inputClass(errorFor('visit'))}
                  aria-invalid={!!errorFor('visit')}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                />
              </Field>
            </div>
          )}

          {messageLabel && (
            <Field
              label={messageLabel}
              htmlFor="message"
              error={errorFor('message')}
            >
              {WITH_TEMPLATES.includes(action) && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {replyTemplates.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="rounded-full border px-3 py-1 text-xs text-left hover:bg-zinc-50"
                      style={{ borderColor: 'var(--border)' }}
                      onClick={() => setMessage((m) => (m ? `${m}\n${t}` : t))}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                id="message"
                rows={4}
                className={inputClass(errorFor('message'))}
                aria-invalid={!!errorFor('message')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Field>
          )}

          {showGenericError && error && (
            <p
              className="text-xs"
              style={{ color: 'var(--danger)' }}
              role="alert"
            >
              {error.text}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            ปิด
          </button>
          <button
            type="button"
            className={DANGER.includes(action) ? 'btn-danger' : 'btn-primary'}
            disabled={busy}
            onClick={submit}
          >
            {busy ? 'กำลังบันทึก…' : `ยืนยัน${actionLabels[action]}`}
          </button>
        </div>
      </div>
    </div>
  );
}
