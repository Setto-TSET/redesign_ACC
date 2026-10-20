'use client';

import { useRef, useState } from 'react';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { Modal } from '@/components/prototype/Modal';
import { focusFirstError } from '@/lib/a11y';
import { newsCategories, type NewsItem } from '@/mock/prototype/content';

export interface NewsDraft {
  title: string;
  category: string;
  summary: string;
  body: string;
  pinned: boolean;
}

const toDraft = (n?: NewsItem): NewsDraft => ({
  title: n?.title ?? '',
  category: n?.category ?? newsCategories[0],
  summary: n?.summary ?? '',
  body: n?.body.join('\n\n') ?? '',
  pinned: !!n?.pinned,
});

export function NewsModal({
  initial,
  onCancel,
  onSave,
}: {
  initial?: NewsItem;
  onCancel: () => void;
  onSave: (d: NewsDraft) => void;
}) {
  const [base] = useState(() => toDraft(initial));
  const [d, setD] = useState<NewsDraft>(base);
  const [errors, setErrors] = useState<
    Partial<Record<'title' | 'summary' | 'body', string>>
  >({});
  const ref = useRef<HTMLDivElement>(null);
  const set = <K extends keyof NewsDraft>(k: K, v: NewsDraft[K]) =>
    setD((x) => ({ ...x, [k]: v }));

  const close = () => {
    const dirty = (Object.keys(base) as (keyof NewsDraft)[]).some(
      (k) => base[k] !== d[k],
    );
    if (dirty && !window.confirm('ทิ้งข้อมูลที่กรอกไว้?')) return;
    onCancel();
  };

  const save = () => {
    const err: typeof errors = {};
    if (!d.title.trim()) err.title = 'ระบุหัวข้อข่าว';
    if (!d.summary.trim()) err.summary = 'ระบุสรุปข่าว';
    if (!d.body.trim()) err.body = 'ระบุเนื้อหาข่าว';
    setErrors(err);
    if (Object.keys(err).length) return focusFirstError(ref.current);
    onSave({
      ...d,
      title: d.title.trim(),
      summary: d.summary.trim(),
      body: d.body.trim(),
    });
  };

  return (
    <Modal
      title={initial ? 'แก้ไขข่าว' : 'เพิ่มข่าว'}
      onClose={close}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={close}>
            ยกเลิก
          </button>
          <button type="button" className="btn-primary" onClick={save}>
            บันทึกข่าว
          </button>
        </>
      }
    >
      <div ref={ref} className="space-y-4">
        <Field label="หัวข้อ" htmlFor="news-title" error={errors.title}>
          <input
            id="news-title"
            name="news-title"
            autoComplete="off"
            data-autofocus
            className={inputClass(errors.title)}
            value={d.title}
            onChange={(e) => set('title', e.target.value)}
            {...fieldAria('news-title', errors.title)}
          />
        </Field>
        <Field label="หมวด" htmlFor="news-category">
          <select
            id="news-category"
            name="news-category"
            autoComplete="off"
            className="input-field"
            value={d.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {newsCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="สรุป" htmlFor="news-summary" error={errors.summary}>
          <input
            id="news-summary"
            name="news-summary"
            autoComplete="off"
            className={inputClass(errors.summary)}
            value={d.summary}
            onChange={(e) => set('summary', e.target.value)}
            {...fieldAria('news-summary', errors.summary)}
          />
        </Field>
        <Field
          label="เนื้อหา"
          htmlFor="news-body"
          error={errors.body}
          hint="เว้นบรรทัดว่างเพื่อแบ่งย่อหน้า"
        >
          <textarea
            id="news-body"
            name="news-body"
            autoComplete="off"
            rows={6}
            className={inputClass(errors.body)}
            value={d.body}
            onChange={(e) => set('body', e.target.value)}
            {...fieldAria(
              'news-body',
              errors.body,
              'เว้นบรรทัดว่างเพื่อแบ่งย่อหน้า',
            )}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="news-pinned"
            autoComplete="off"
            checked={d.pinned}
            onChange={(e) => set('pinned', e.target.checked)}
          />
          ปักหมุดไว้บนสุด
        </label>
      </div>
    </Modal>
  );
}
