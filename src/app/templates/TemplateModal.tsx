'use client';

import { useRef, useState } from 'react';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { Modal } from '@/components/prototype/Modal';
import { focusFirstError } from '@/lib/a11y';
import type { ReplyTemplate } from '@/mock/prototype/admin';

export type TemplateDraft = Omit<ReplyTemplate, 'id'>;

const VARS = {
  '{ชื่อร้าน}': 'ร้านยาสุขใจฟาร์มาซี',
  '{เลขที่คำขอ}': 'REN-2569-0012',
} as const;

const preview = (body: string) =>
  Object.entries(VARS).reduce((s, [k, v]) => s.split(k).join(v), body);

export function TemplateModal({
  initial,
  onCancel,
  onSave,
}: {
  initial?: ReplyTemplate;
  onCancel: () => void;
  onSave: (d: TemplateDraft) => void;
}) {
  const [base] = useState<TemplateDraft>(() => ({
    name: initial?.name ?? '',
    body: initial?.body ?? '',
  }));
  const [d, setD] = useState<TemplateDraft>(base);
  const [errors, setErrors] = useState<{ name?: string; body?: string }>({});
  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const close = () => {
    if (
      (d.name !== base.name || d.body !== base.body) &&
      !window.confirm('ทิ้งข้อมูลที่กรอกไว้?')
    )
      return;
    onCancel();
  };

  const insert = (v: string) => {
    const el = bodyRef.current;
    const s = el?.selectionStart ?? d.body.length;
    const e = el?.selectionEnd ?? d.body.length;
    setD((x) => ({ ...x, body: x.body.slice(0, s) + v + x.body.slice(e) }));
    // คืน caret หลังข้อความที่แทรก (หลัง React render ค่าใหม่)
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(s + v.length, s + v.length);
    });
  };

  const save = () => {
    const err: typeof errors = {};
    if (!d.name.trim()) err.name = 'ระบุชื่อ template';
    if (!d.body.trim()) err.body = 'ระบุข้อความ';
    setErrors(err);
    if (Object.keys(err).length) return focusFirstError(ref.current);
    onSave({ name: d.name.trim(), body: d.body.trim() });
  };

  return (
    <Modal
      size="lg"
      title={initial ? 'แก้ไข template' : 'เพิ่ม template'}
      onClose={close}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={close}>
            ยกเลิก
          </button>
          <button type="button" className="btn-primary" onClick={save}>
            บันทึก template
          </button>
        </>
      }
    >
      <div ref={ref} className="space-y-4">
        <Field label="ชื่อ" htmlFor="tpl-name" error={errors.name}>
          <input
            id="tpl-name"
            name="tpl-name"
            autoComplete="off"
            data-autofocus
            className={inputClass(errors.name)}
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value })}
            {...fieldAria('tpl-name', errors.name)}
          />
        </Field>
        <Field label="ข้อความ" htmlFor="tpl-body" error={errors.body}>
          <textarea
            id="tpl-body"
            name="tpl-body"
            autoComplete="off"
            rows={5}
            ref={bodyRef}
            className={inputClass(errors.body)}
            value={d.body}
            onChange={(e) => setD({ ...d, body: e.target.value })}
            {...fieldAria('tpl-body', errors.body)}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">แทรกตัวแปร</span>
          {Object.keys(VARS).map((v) => (
            <button
              key={v}
              type="button"
              className="btn-secondary font-mono"
              onClick={() => insert(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <div
          className="rounded-lg p-3 text-sm"
          style={{ background: 'var(--border-light)' }}
        >
          <p
            className="text-xs font-semibold mb-1"
            style={{ color: 'var(--ink-secondary)' }}
          >
            ตัวอย่าง
          </p>
          <p className="break-words whitespace-pre-wrap" aria-live="polite">
            {preview(d.body) || '—'}
          </p>
        </div>
      </div>
    </Modal>
  );
}
