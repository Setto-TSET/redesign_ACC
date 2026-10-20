'use client';

import { useRef, useState } from 'react';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { CycleTimeline } from '@/components/prototype/CycleTimeline';
import { DrawCheck } from '@/components/prototype/DrawCheck';
import { Modal } from '@/components/prototype/Modal';
import { ScoreRing } from '@/components/prototype/ScoreRing';
import { focusFirstError } from '@/lib/a11y';
import { formatDate, formatDateTime } from '@/lib/format';
import {
  auditPartTitles,
  ciChecklist,
  cycleIndex,
  cycleSteps,
  qualityCategories,
  satisfactionLevels,
  type AuditPart,
  type PostAudit,
} from '@/mock/prototype/postAudit';
import type { Pharmacy, UserRole } from '@/types/api';
import { AuditStatusBadge } from '../AuditStatusBadge';

export function InfoTab({
  shop,
  canInspect,
  onInspect,
}: {
  shop: Pharmacy;
  canInspect: boolean;
  onInspect: () => void;
}) {
  return (
    <div className="space-y-5">
      <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
        <dt style={{ color: 'var(--ink-secondary)' }}>ที่อยู่</dt>
        <dd>
          {shop.address} จ.{shop.province}
        </dd>
        <dt style={{ color: 'var(--ink-secondary)' }}>ผู้ดำเนินกิจการ</dt>
        <dd>{shop.licensee}</dd>
        <dt style={{ color: 'var(--ink-secondary)' }}>ใบอนุญาต</dt>
        <dd>{shop.licenseNo}</dd>
        <dt style={{ color: 'var(--ink-secondary)' }}>เวลาทำการ</dt>
        <dd>{shop.hours}</dd>
      </dl>
      {canInspect && (
        <button type="button" className="btn-primary" onClick={onInspect}>
          เริ่มตรวจ
        </button>
      )}
    </div>
  );
}

export function HistoryTab({ history }: { history: PostAudit['history'] }) {
  return (
    <ol className="space-y-3">
      {[...history]
        .sort((a, b) => b.at.localeCompare(a.at))
        .map((h, i) => (
          <li key={i} className="text-sm">
            <span
              className="tabular-nums"
              style={{ color: 'var(--ink-secondary)' }}
            >
              {formatDateTime(h.at)}
            </span>{' '}
            · <span className="font-medium">{h.by}</span> · {h.text}
          </li>
        ))}
    </ol>
  );
}

type Dialog = 'notify' | 'rework' | null;

export function PartPanel({
  audit,
  part,
  role,
  onNotify,
  onClose,
  onRework,
  onReply,
}: {
  audit: PostAudit;
  part: AuditPart;
  role: UserRole;
  onNotify: () => void;
  onClose: () => void;
  onRework: (reason: string) => void;
  onReply: (text: string, files: string[]) => void;
}) {
  const r = audit.parts[part];
  const isStaff = role === 'admin' || role === 'superadmin';
  const [dialog, setDialog] = useState<Dialog>(null);
  const passed = r.checklist.filter((c) => c === true).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {r.status === 'closed' && <DrawCheck size={32} />}
        <h3 className="text-lg font-bold">{auditPartTitles[part]}</h3>
        <AuditStatusBadge status={r.status} />
      </div>

      <CycleTimeline
        steps={cycleSteps.map((label, i) => ({
          label,
          date: [
            audit.visitDate,
            r.notifiedAt,
            r.repliedAt,
            undefined,
            r.closedAt,
          ][i],
        }))}
        current={cycleIndex(r.status)}
      />

      {r.status === 'pending' ? (
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          ยังไม่มีผลตรวจในส่วนนี้
        </p>
      ) : part === 'quality' ? (
        <div className="space-y-4">
          {qualityCategories.map((c) => {
            const items = r.findings.filter((f) => f.category === c);
            return (
              <div key={c}>
                <h4 className="text-sm font-semibold">{c}</h4>
                {items.length === 0 ? (
                  <p
                    className="text-sm"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    เป็นไปตามมาตรฐาน
                  </p>
                ) : (
                  <ul className="list-disc pl-5 text-sm space-y-0.5">
                    {items.map((f, i) => (
                      <li key={i}>
                        {f.text}{' '}
                        <span style={{ color: 'var(--ink-secondary)' }}>
                          (รูป {f.photos})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <ScoreRing value={passed} total={12} label="ผ่าน" />
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ข้อ</th>
                  <th>ผล</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {ciChecklist.map((t, i) => (
                  <tr key={t}>
                    <td>
                      {i + 1}. {t}
                    </td>
                    <td>{r.checklist[i] ? 'ตรง' : 'ไม่ตรง'}</td>
                    <td>{r.checklistNotes[i] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {r.satisfaction && (
            <p className="text-sm">
              ความพึงพอใจ: {satisfactionLevels[r.satisfaction - 1]}
            </p>
          )}
        </div>
      )}

      {r.summary && (
        <div>
          <h4 className="text-sm font-semibold">สรุปผลตรวจ</h4>
          <p className="text-sm mt-1">{r.summary}</p>
        </div>
      )}

      {r.reply && (
        <div>
          <h4 className="text-sm font-semibold">
            ร้านแจ้งกลับ ({formatDate(r.repliedAt)})
          </h4>
          <p className="text-sm mt-1">{r.reply}</p>
        </div>
      )}

      {r.status === 'closed' && (
        <p className="flex items-center gap-2 text-sm font-semibold">
          <DrawCheck size={24} />
          ปิดผลเมื่อ {formatDate(r.closedAt)}
        </p>
      )}

      {isStaff && r.status === 'notify' && (
        <button
          type="button"
          className="btn-primary"
          onClick={() => setDialog('notify')}
        >
          แจ้งร้าน
        </button>
      )}
      {isStaff && r.status === 'replied' && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={onClose}>
            ปิดผล
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setDialog('rework')}
          >
            ให้แก้ไขเพิ่ม
          </button>
        </div>
      )}
      {role === 'pharmacy' && r.status === 'fixing' && (
        <ReplyForm onReply={onReply} />
      )}

      {dialog === 'notify' && (
        <Modal
          title="แจ้งร้านให้แก้ไข"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDialog(null)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn-primary"
                data-autofocus
                onClick={() => {
                  setDialog(null);
                  onNotify();
                }}
              >
                ยืนยันแจ้งร้าน
              </button>
            </>
          }
        >
          <p className="text-sm">
            ระบบจะแจ้งร้านให้แก้ไขตามผลตรวจส่วน “{auditPartTitles[part]}”
          </p>
        </Modal>
      )}
      {dialog === 'rework' && (
        <ReworkModal
          onCancel={() => setDialog(null)}
          onSubmit={(reason) => {
            setDialog(null);
            onRework(reason);
          }}
        />
      )}
    </div>
  );
}

function ReworkModal({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const submit = () => {
    if (!reason.trim()) {
      setError('ระบุเหตุผล');
      focusFirstError(ref.current);
      return;
    }
    onSubmit(reason.trim());
  };
  return (
    <Modal
      title="ให้แก้ไขเพิ่ม"
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            ยกเลิก
          </button>
          <button type="button" className="btn-primary" onClick={submit}>
            ส่งกลับให้ร้านแก้ไข
          </button>
        </>
      }
    >
      <div ref={ref}>
        <Field label="เหตุผล" htmlFor="rework-reason" error={error}>
          <textarea
            id="rework-reason"
            data-autofocus
            rows={4}
            className={inputClass(error)}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            {...fieldAria('rework-reason', error)}
          />
        </Field>
      </div>
    </Modal>
  );
}

function ReplyForm({
  onReply,
}: {
  onReply: (text: string, files: string[]) => void;
}) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ text?: string; files?: string }>({});
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      noValidate
      className="space-y-4 border-t border-zinc-100 pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        const err: typeof errors = {};
        if (!text.trim()) err.text = 'ระบุรายละเอียดการแก้ไข';
        if (files.length < 1 || files.length > 4) err.files = 'แนบรูป 1–4 รูป';
        setErrors(err);
        if (err.text || err.files) return focusFirstError(ref.current);
        onReply(text.trim(), files);
      }}
    >
      <h4 className="font-semibold">ส่งการแก้ไข</h4>
      <Field
        label="รายละเอียดการแก้ไข"
        htmlFor="reply-text"
        error={errors.text}
      >
        <textarea
          id="reply-text"
          rows={4}
          className={inputClass(errors.text)}
          value={text}
          onChange={(e) => setText(e.target.value)}
          {...fieldAria('reply-text', errors.text)}
        />
      </Field>
      <Field
        label="รูปหลักฐาน (1–4 รูป)"
        htmlFor="reply-files"
        error={errors.files}
      >
        <input
          id="reply-files"
          type="file"
          accept="image/*"
          multiple
          className={inputClass(errors.files)}
          onChange={(e) =>
            setFiles([...(e.target.files ?? [])].map((f) => f.name))
          }
          {...fieldAria('reply-files', errors.files)}
        />
        {files.length > 0 && (
          <ul className="mt-2 text-xs list-disc pl-5">
            {files.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}
      </Field>
      <button type="submit" className="btn-primary">
        ส่งการแก้ไข
      </button>
    </form>
  );
}
