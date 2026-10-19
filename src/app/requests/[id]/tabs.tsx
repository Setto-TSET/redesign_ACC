'use client';

import { useRef, useState } from 'react';
import { IconFileText } from '@tabler/icons-react';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  actionLabels,
  relationLabels,
  typeLabel,
  visitMethodLabels,
} from '@/lib/constants';
import { focusFirstError } from '@/lib/a11y';
import { gppSections } from '@/lib/gppItems';
import { isAlive, stepDays } from '@/lib/requestRules';
import { GPP_PASS_PERCENT, scoreGpp } from '@/lib/gppRules';
import { formatDate, formatDateTime } from '@/lib/format';
import type {
  AccRequest,
  ActionResult,
  Assessor,
  Pharmacy,
  RequestDoc,
  UserRole,
} from '@/types/api';

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-zinc-100">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr]">
          <dt className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            {k}
          </dt>
          <dd className="text-sm font-medium break-words min-w-0">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const Empty = ({ text }: { text: string }) => (
  <p
    className="py-8 text-center text-sm"
    style={{ color: 'var(--ink-secondary)' }}
  >
    {text}
  </p>
);

const ErrorText = ({ id, text }: { id?: string; text?: string }) =>
  text ? (
    <p
      id={id}
      className="mt-1 text-xs"
      style={{ color: 'var(--danger)' }}
      role="alert"
    >
      {text}
    </p>
  ) : null;

/** วันที่ท้องถิ่น YYYY-MM-DD */
const today = () => new Date().toLocaleDateString('sv-SE');

export function InfoTab({
  req,
  shop,
  assessors,
}: {
  req: AccRequest;
  shop: Pharmacy | null;
  assessors: Assessor[];
}) {
  const a = req.applicant;
  const names = assessors
    .filter((x) => req.assessorIds.includes(x.id))
    .map((x) => x.name);
  const requestRows: [string, string][] = [
    ['ประเภทคำขอ', typeLabel(req.typeIds)],
  ];
  if (req.changeMode)
    requestRows.push([
      'การเปลี่ยนผู้รับอนุญาต',
      req.changeMode === 1
        ? 'จากบุคคล เป็น บุคคล'
        : 'จากบุคคล เป็น นิติบุคคล/บริษัท',
    ]);
  requestRows.push([
    'ผู้ตรวจประเมิน',
    names.length ? names.join(', ') : 'ยังไม่ได้มอบหมาย',
  ]);
  if (req.visit)
    requestRows.push([
      'นัดตรวจประเมิน',
      `${visitMethodLabels[req.visit.method]} · ${formatDate(req.visit.date)}`,
    ]);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-bold mb-1">คำขอ</h3>
        <Rows rows={requestRows} />
      </section>
      <section>
        <h3 className="font-bold mb-1">ผู้ยื่นคำขอ</h3>
        <Rows
          rows={[
            ['ชื่อ', `${a.firstName} ${a.lastName}`],
            [
              'ติดต่อ',
              [a.email, a.phone, a.lineId && `LINE ${a.lineId}`]
                .filter(Boolean)
                .join(' · '),
            ],
            [
              'ความเกี่ยวข้อง',
              a.relation === 9
                ? a.relationOther
                : a.relation
                  ? relationLabels[a.relation]
                  : '-',
            ],
          ]}
        />
      </section>
      {shop && (
        <section>
          <h3 className="font-bold mb-1">ร้านยา</h3>
          <Rows
            rows={[
              ['ชื่อร้าน', shop.name],
              ['ใบอนุญาต', shop.licenseNo],
              ['ที่ตั้ง', `${shop.address} จ.${shop.province}`],
              ['ผู้รับอนุญาต', shop.licensee],
              ['เบอร์โทร', shop.phone],
            ]}
          />
        </section>
      )}
    </div>
  );
}

export function DocsTab({
  req,
  canResubmit,
  onResubmit,
}: {
  req: AccRequest;
  canResubmit: boolean;
  onResubmit: (docs: RequestDoc[]) => Promise<ActionResult>;
}) {
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  const submit = async () => {
    if (files.length === 0) {
      setError('แนบไฟล์อย่างน้อย 1 ไฟล์ แล้วกดส่งอีกครั้ง');
      focusFirstError(formRef.current);
      return;
    }
    setBusy(true);
    try {
      const res = await onResubmit(
        files.map((name) => ({
          name,
          type: 'เอกสารเพิ่มเติม',
          uploadedAt: today(),
        })),
      );
      if ('error' in res) {
        setError(res.error);
        focusFirstError(formRef.current);
      } else {
        setFiles([]);
        setError('');
      }
    } catch {
      setError('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
      focusFirstError(formRef.current);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {req.docs.length === 0 ? (
        <Empty text="ยังไม่มีเอกสาร" />
      ) : (
        <ul className="divide-y divide-zinc-100">
          {req.docs.map((d, i) => (
            <li key={`${d.name}-${i}`} className="flex items-start gap-3 py-3">
              <IconFileText
                size={20}
                aria-hidden="true"
                className="shrink-0 mt-0.5"
                style={{ color: 'var(--ink-tertiary)' }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium break-words">{d.name}</p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  {d.type} · {formatDate(d.uploadedAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canResubmit && (
        <section
          ref={formRef}
          className="rounded-xl border p-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 className="font-bold">ส่งเอกสารเพิ่มเติม</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            แนบไฟล์ตามที่ สรร. ขอ แล้วกดส่ง ต้นแบบนี้เก็บเฉพาะชื่อไฟล์
          </p>
          <label className="btn-secondary mt-4 cursor-pointer">
            เลือกไฟล์
            <input
              type="file"
              name="newDocs"
              aria-invalid={!!error}
              aria-describedby={error ? 'newDocs-error' : undefined}
              aria-label="เลือกไฟล์เอกสารเพิ่มเติม"
              multiple
              accept=".pdf,image/*"
              className="sr-only"
              onChange={(e) => {
                const picked = [...(e.target.files ?? [])].map((f) => f.name);
                setFiles((prev) => [...prev, ...picked]);
                setError('');
                e.target.value = '';
              }}
            />
          </label>
          {files.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {files.map((f, i) => (
                <li
                  key={`${f}-${i}`}
                  className="break-words animate-stagger"
                  style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                >
                  {f}
                </li>
              ))}
            </ul>
          )}
          <ErrorText id="newDocs-error" text={error} />
          <button
            type="button"
            className="btn-primary mt-4"
            disabled={busy}
            onClick={submit}
          >
            {busy ? 'กำลังส่ง…' : actionLabels.resubmit_docs}
          </button>
        </section>
      )}
    </div>
  );
}

export function PaymentsTab({
  req,
  canAdd,
  onAdd,
}: {
  req: AccRequest;
  canAdd: boolean;
  onAdd: (p: { amount: number; fileName: string }) => Promise<ActionResult>;
}) {
  const [amount, setAmount] = useState('');
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!(Number(amount) > 0)) e.amount = 'กรอกจำนวนเงินมากกว่า 0';
    if (!fileName) e.file = 'แนบหลักฐานการโอน';
    setErrors(e);
    if (Object.keys(e).length) {
      focusFirstError(formRef.current);
      return;
    }
    setBusy(true);
    try {
      const res = await onAdd({ amount: Number(amount), fileName });
      if ('error' in res) {
        setErrors({ file: res.error });
        focusFirstError(formRef.current);
      } else {
        setAmount('');
        setFileName('');
      }
    } catch {
      setErrors({ file: 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง' });
      focusFirstError(formRef.current);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {req.payments.length === 0 ? (
        <Empty text="ยังไม่มีหลักฐานการโอนเงิน" />
      ) : (
        <ul className="divide-y divide-zinc-100">
          {req.payments.map((p, i) => (
            <li
              key={`${p.fileName}-${i}`}
              className="flex flex-wrap justify-between gap-2 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium break-words">{p.fileName}</p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  {formatDate(p.paidAt)}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {new Intl.NumberFormat('th-TH').format(p.amount)} บาท
              </span>
            </li>
          ))}
        </ul>
      )}

      {canAdd && (
        <section
          ref={formRef}
          className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 className="font-bold">เพิ่มหลักฐานการโอนเงิน</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="จำนวนเงิน (บาท)"
              htmlFor="amount"
              error={errors.amount}
            >
              <input
                id="amount"
                name="amount"
                type="number"
                min="0"
                inputMode="decimal"
                autoComplete="off"
                placeholder="1500…"
                className={inputClass(errors.amount)}
                {...fieldAria('amount', errors.amount)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <div>
              <span className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                หลักฐานการโอน
              </span>
              <label className="btn-secondary cursor-pointer">
                {fileName ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
                <input
                  type="file"
                  name="slip"
                  aria-invalid={!!errors.file}
                  aria-describedby={errors.file ? 'slip-error' : undefined}
                  aria-label="เลือกไฟล์หลักฐานการโอน"
                  accept=".pdf,image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFileName(f.name);
                    setErrors((prev) => ({ ...prev, file: '' }));
                    e.target.value = '';
                  }}
                />
              </label>
              {fileName && (
                <p className="mt-2 text-xs break-words">{fileName}</p>
              )}
              <ErrorText id="slip-error" text={errors.file} />
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={submit}
          >
            {busy ? 'กำลังบันทึก…' : 'บันทึกหลักฐานการโอน'}
          </button>
        </section>
      )}
    </div>
  );
}

export function ResultTab({ req, role }: { req: AccRequest; role: UserRole }) {
  const a = req.assessment;
  const score = a ? scoreGpp(gppSections, a.answers) : null;
  const self = req.selfAssessment
    ? scoreGpp(gppSections, req.selfAssessment.answers)
    : null;
  if (req.gppScore === undefined && !self)
    return <Empty text="ยังไม่มีผลประเมิน" />;
  const parts = score ?? self;
  return (
    <div className="space-y-6">
      {req.gppScore !== undefined && (
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            คะแนน GPP (ผู้ตรวจ)
          </span>
          <span className="text-3xl font-extrabold tabular-nums">
            {req.gppScore.toFixed(2)}%
          </span>
          {score && (
            <span
              className="text-sm tabular-nums"
              style={{ color: 'var(--ink-secondary)' }}
            >
              {score.got}/{score.max} คะแนน · เกณฑ์ {GPP_PASS_PERCENT}%
            </span>
          )}
        </div>
      )}
      {self && (
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          ร้านประเมินตนเอง{' '}
          <span
            className="font-semibold tabular-nums"
            style={{ color: 'var(--ink)' }}
          >
            {self.percent.toFixed(2)}%
          </span>{' '}
          ({self.got}/{self.max})
        </p>
      )}

      {parts && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {parts.sections.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 px-4 py-3 text-sm"
            >
              <span className="min-w-0">
                หมวด {s.id} {s.title}
              </span>
              <span className="shrink-0 text-right">
                {score && (
                  <span className="font-semibold tabular-nums">
                    {score.sections[i].percent}%
                  </span>
                )}
                {self && (
                  <span
                    className="block text-xs tabular-nums"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    ร้าน {self.sections[i].percent}%
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {a && (
        <Rows
          rows={[
            ['ข้อเสนอแนะถึงร้านยา', a.summary || '-'],
            // บันทึกภายในไม่แสดงให้ร้านยา (ตามที่ตกลงในประชุม 14 ต.ค.)
            ...(role === 'pharmacy'
              ? []
              : ([['บันทึกภายใน', a.internalNote || '-']] as [
                  string,
                  string,
                ][])),
            [
              'ผู้ตรวจ',
              `${a.by ?? '-'} · ${a.at ? formatDateTime(a.at) : '-'}`,
            ],
          ]}
        />
      )}
    </div>
  );
}

export function HistoryTab({ req }: { req: AccRequest }) {
  if (req.messages.length === 0) return <Empty text="ยังไม่มีประวัติ" />;
  const d = new Date();
  const now = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);
  const { steps, total } = stepDays(req, now);
  const last = req.messages.length - 1;
  return (
    <div className="space-y-5">
      <p
        className="rounded-xl px-4 py-3 text-sm"
        style={{ background: 'var(--border-light)' }}
      >
        ใช้เวลารวม <span className="font-bold">{total} วัน</span>{' '}
        {isAlive(req.status)
          ? 'นับจากวันยื่นถึงวันนี้ (ยังไม่ปิด)'
          : 'นับจากวันยื่นจนปิดคำขอ'}
      </p>
      <ol className="space-y-5">
        {[...req.messages].reverse().map((m, i) => (
          <li
            key={`${m.at}-${i}`}
            className="flex gap-3 animate-stagger"
            style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
          >
            <span
              className="mt-1.5 w-2.5 h-2.5 shrink-0 rounded-full"
              style={{ background: 'var(--accent)' }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {m.status && <StatusBadge status={m.status} />}
                {m.override && (
                  <span
                    className="badge"
                    style={{
                      background: 'var(--warn-soft)',
                      color: 'var(--warn)',
                    }}
                  >
                    แก้สถานะ
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm whitespace-pre-line break-words">
                {m.text}
              </p>
              <p
                className="mt-0.5 text-xs tabular-nums"
                style={{ color: 'var(--ink-secondary)' }}
              >
                {m.from} · {formatDateTime(m.at)} · ใช้เวลา {steps[last - i]}{' '}
                วันจากขั้นก่อน
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
