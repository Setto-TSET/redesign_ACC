'use client';

import { useRef, useState } from 'react';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { Modal } from '@/components/prototype/Modal';
import { focusFirstError } from '@/lib/a11y';

export interface DraftFinding {
  text: string;
  /** เก็บเฉพาะชื่อไฟล์ — ต้นแบบไม่อัปโหลดจริง */
  files: string[];
}

export function FindingModal({
  category,
  initial,
  onCancel,
  onSave,
}: {
  category: string;
  initial?: DraftFinding;
  onCancel: () => void;
  onSave: (f: DraftFinding) => void;
}) {
  const [text, setText] = useState(initial?.text ?? '');
  const [files, setFiles] = useState<string[]>(initial?.files ?? []);
  const [errors, setErrors] = useState<{ text?: string; files?: string }>({});
  const ref = useRef<HTMLDivElement>(null);

  const save = () => {
    const err: typeof errors = {};
    if (!text.trim()) err.text = 'ระบุข้อที่ไม่เป็นไปตามมาตรฐาน';
    if (files.length > 4) err.files = 'แนบรูปได้ไม่เกิน 4 รูป';
    setErrors(err);
    if (err.text || err.files) return focusFirstError(ref.current);
    onSave({ text: text.trim(), files });
  };

  return (
    <Modal
      title={`${initial ? 'แก้ไข' : 'เพิ่ม'}ข้อ — ${category}`}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            ยกเลิก
          </button>
          <button type="button" className="btn-primary" onClick={save}>
            บันทึกข้อ
          </button>
        </>
      }
    >
      <div ref={ref} className="space-y-4">
        <Field
          label="ข้อที่ไม่เป็นไปตามมาตรฐาน"
          htmlFor="finding-text"
          error={errors.text}
        >
          <textarea
            name="finding-text"
            autoComplete="off"
            id="finding-text"
            data-autofocus
            rows={3}
            className={inputClass(errors.text)}
            value={text}
            onChange={(e) => setText(e.target.value)}
            {...fieldAria('finding-text', errors.text)}
          />
        </Field>
        <Field
          label="รูปประกอบ (0–4 รูป)"
          htmlFor="finding-files"
          error={errors.files}
        >
          <input
            name="finding-files"
            autoComplete="off"
            id="finding-files"
            type="file"
            accept="image/*"
            multiple
            className={inputClass(errors.files)}
            onChange={(e) =>
              setFiles([...(e.target.files ?? [])].map((f) => f.name))
            }
            {...fieldAria('finding-files', errors.files)}
          />
          {files.length > 0 && (
            <ul className="mt-2 text-xs list-disc pl-5">
              {files.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </Field>
      </div>
    </Modal>
  );
}
