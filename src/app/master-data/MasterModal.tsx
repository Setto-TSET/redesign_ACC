'use client';

import { useRef, useState } from 'react';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { Modal } from '@/components/prototype/Modal';
import { focusFirstError } from '@/lib/a11y';
import type { MasterItem } from '@/mock/prototype/admin';

export type MasterDraft = Pick<MasterItem, 'code' | 'name' | 'active'>;

export function MasterModal({
  initial,
  siblings,
  onCancel,
  onSave,
}: {
  initial?: MasterItem;
  /** รายการอื่นใน kind เดียวกัน ใช้ตรวจรหัสซ้ำ */
  siblings: MasterItem[];
  onCancel: () => void;
  onSave: (d: MasterDraft) => void;
}) {
  const [base] = useState<MasterDraft>(() => ({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    active: initial?.active ?? true,
  }));
  const [d, setD] = useState<MasterDraft>(base);
  const [errors, setErrors] = useState<{ code?: string; name?: string }>({});
  const ref = useRef<HTMLDivElement>(null);

  const close = () => {
    const dirty =
      d.code !== base.code || d.name !== base.name || d.active !== base.active;
    if (dirty && !window.confirm('ทิ้งข้อมูลที่กรอกไว้?')) return;
    onCancel();
  };

  const save = () => {
    const code = d.code.trim();
    const err: typeof errors = {};
    if (!code) err.code = 'ระบุรหัส';
    else if (siblings.some((s) => s.id !== initial?.id && s.code === code))
      err.code = 'รหัสนี้มีอยู่แล้ว';
    if (!d.name.trim()) err.name = 'ระบุชื่อ';
    setErrors(err);
    if (Object.keys(err).length) return focusFirstError(ref.current);
    onSave({ code, name: d.name.trim(), active: d.active });
  };

  return (
    <Modal
      title={initial ? 'แก้ไขข้อมูลหลัก' : 'เพิ่มข้อมูลหลัก'}
      onClose={close}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={close}>
            ยกเลิก
          </button>
          <button type="button" className="btn-primary" onClick={save}>
            บันทึก
          </button>
        </>
      }
    >
      <div ref={ref} className="space-y-4">
        <Field label="รหัส" htmlFor="master-code" error={errors.code}>
          <input
            id="master-code"
            name="master-code"
            autoComplete="off"
            spellCheck={false}
            data-autofocus
            className={inputClass(errors.code)}
            value={d.code}
            onChange={(e) => setD({ ...d, code: e.target.value })}
            {...fieldAria('master-code', errors.code)}
          />
        </Field>
        <Field label="ชื่อ" htmlFor="master-name" error={errors.name}>
          <input
            id="master-name"
            name="master-name"
            autoComplete="off"
            className={inputClass(errors.name)}
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value })}
            {...fieldAria('master-name', errors.name)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="master-active"
            autoComplete="off"
            checked={d.active}
            onChange={(e) => setD({ ...d, active: e.target.checked })}
          />
          ใช้งาน
        </label>
      </div>
    </Modal>
  );
}
