'use client';

import { useRef, useState } from 'react';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { Modal } from '@/components/prototype/Modal';
import { focusFirstError } from '@/lib/a11y';
import { docCategories, type DocItem } from '@/mock/prototype/content';

export interface DocDraft {
  title: string;
  category: string;
  /** มีเมื่อเลือกไฟล์ใหม่ — ต้นแบบเก็บแค่ชนิดและขนาด */
  file?: { fileType: DocItem['fileType']; sizeKb: number };
}

const typeOf = (name: string): DocItem['fileType'] | undefined => {
  const ext = name.split('.').pop()?.toLowerCase();
  return ext === 'pdf'
    ? 'PDF'
    : ext === 'docx'
      ? 'DOCX'
      : ext === 'xlsx'
        ? 'XLSX'
        : undefined;
};

export function DocModal({
  initial,
  onCancel,
  onSave,
}: {
  initial?: DocItem;
  onCancel: () => void;
  onSave: (d: DocDraft) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [category, setCategory] = useState(
    initial?.category ?? docCategories[0],
  );
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ title?: string; file?: string }>({});
  const ref = useRef<HTMLDivElement>(null);

  const close = () => {
    const dirty =
      title !== (initial?.title ?? '') ||
      category !== (initial?.category ?? docCategories[0]) ||
      !!file;
    if (dirty && !window.confirm('ทิ้งข้อมูลที่กรอกไว้?')) return;
    onCancel();
  };

  const save = () => {
    const err: typeof errors = {};
    if (!title.trim()) err.title = 'ระบุชื่อเอกสาร';
    const fileType = file ? typeOf(file.name) : undefined;
    if (!initial && !file) err.file = 'เลือกไฟล์เอกสาร';
    else if (file && !fileType) err.file = 'รองรับเฉพาะ PDF, DOCX, XLSX';
    setErrors(err);
    if (err.title || err.file) return focusFirstError(ref.current);
    onSave({
      title: title.trim(),
      category,
      file:
        file && fileType
          ? { fileType, sizeKb: Math.max(1, Math.round(file.size / 1024)) }
          : undefined,
    });
  };

  return (
    <Modal
      title={initial ? 'แก้ไขเอกสาร' : 'เพิ่มเอกสาร'}
      onClose={close}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={close}>
            ยกเลิก
          </button>
          <button type="button" className="btn-primary" onClick={save}>
            บันทึกเอกสาร
          </button>
        </>
      }
    >
      <div ref={ref} className="space-y-4">
        <Field label="ชื่อเอกสาร" htmlFor="doc-title" error={errors.title}>
          <input
            id="doc-title"
            name="doc-title"
            autoComplete="off"
            data-autofocus
            className={inputClass(errors.title)}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            {...fieldAria('doc-title', errors.title)}
          />
        </Field>
        <Field label="หมวด" htmlFor="doc-category">
          <select
            id="doc-category"
            name="doc-category"
            autoComplete="off"
            className="input-field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {docCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field
          label={initial ? 'ไฟล์ใหม่ (ไม่บังคับ)' : 'ไฟล์'}
          htmlFor="doc-file"
          error={errors.file}
          hint="PDF, DOCX หรือ XLSX"
        >
          <input
            id="doc-file"
            name="doc-file"
            autoComplete="off"
            type="file"
            accept=".pdf,.docx,.xlsx"
            className={inputClass(errors.file)}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            {...fieldAria('doc-file', errors.file, 'PDF, DOCX หรือ XLSX')}
          />
        </Field>
      </div>
    </Modal>
  );
}
