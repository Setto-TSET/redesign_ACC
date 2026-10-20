'use client';

import { useRef, useState } from 'react';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { Modal } from '@/components/prototype/Modal';
import { focusFirstError } from '@/lib/a11y';
import { roleLabels } from '@/mock';
import type { ProtoUser } from '@/mock/prototype/admin';
import { provinces } from '@/mock/prototype/pharmacies';
import type { UserRole } from '@/types/api';

export type UserDraft = Omit<ProtoUser, 'id' | 'active'>;

const ROLES = Object.keys(roleLabels) as UserRole[];
const USERNAME_RE = /^[a-z0-9._]{4,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errs = Partial<
  Record<'name' | 'username' | 'email' | 'org' | 'province', string>
>;

export function UserModal({
  initial,
  existing,
  onCancel,
  onSave,
}: {
  initial?: ProtoUser;
  /** รายการผู้ใช้ทั้งหมด ใช้ตรวจ username ซ้ำ */
  existing: ProtoUser[];
  onCancel: () => void;
  onSave: (d: UserDraft) => void;
}) {
  const [base] = useState<UserDraft>(() => ({
    name: initial?.name ?? '',
    username: initial?.username ?? '',
    email: initial?.email ?? '',
    role: initial?.role ?? 'pharmacy',
    org: initial?.org ?? '',
    province: initial?.province ?? '',
  }));
  const [d, setD] = useState<UserDraft>(base);
  const [errors, setErrors] = useState<Errs>({});
  const ref = useRef<HTMLDivElement>(null);
  const set = <K extends keyof UserDraft>(k: K, v: UserDraft[K]) =>
    setD((x) => ({ ...x, [k]: v }));

  const close = () => {
    const dirty = (Object.keys(base) as (keyof UserDraft)[]).some(
      (k) => base[k] !== d[k],
    );
    if (dirty && !window.confirm('ทิ้งข้อมูลที่กรอกไว้?')) return;
    onCancel();
  };

  const save = () => {
    const err: Errs = {};
    const username = d.username.trim();
    if (!d.name.trim()) err.name = 'ระบุชื่อ-สกุล';
    if (!username) err.username = 'ระบุ username';
    else if (!USERNAME_RE.test(username))
      err.username = 'ใช้ a–z, 0–9, จุด, ขีดล่าง อย่างน้อย 4 ตัว';
    else if (
      existing.some((u) => u.id !== initial?.id && u.username === username)
    )
      err.username = 'username นี้มีผู้ใช้แล้ว';
    if (!d.email.trim()) err.email = 'ระบุอีเมล';
    else if (!EMAIL_RE.test(d.email.trim()))
      err.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (!d.org.trim()) err.org = 'ระบุหน่วยงาน';
    if (d.role === 'ppho' && !d.province) err.province = 'เลือกจังหวัด';
    setErrors(err);
    if (Object.keys(err).length) return focusFirstError(ref.current);
    onSave({
      name: d.name.trim(),
      username,
      email: d.email.trim(),
      role: d.role,
      org: d.org.trim(),
      province: d.role === 'ppho' ? d.province : undefined,
    });
  };

  return (
    <Modal
      title={initial ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'}
      onClose={close}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={close}>
            ยกเลิก
          </button>
          <button type="button" className="btn-primary" onClick={save}>
            บันทึกผู้ใช้
          </button>
        </>
      }
    >
      <div ref={ref} className="space-y-4">
        <Field label="ชื่อ-สกุล" htmlFor="user-name" error={errors.name}>
          <input
            id="user-name"
            name="user-name"
            autoComplete="off"
            data-autofocus
            className={inputClass(errors.name)}
            value={d.name}
            onChange={(e) => set('name', e.target.value)}
            {...fieldAria('user-name', errors.name)}
          />
        </Field>
        <Field label="Username" htmlFor="user-username" error={errors.username}>
          <input
            id="user-username"
            name="user-username"
            autoComplete="off"
            spellCheck={false}
            className={inputClass(errors.username)}
            value={d.username}
            onChange={(e) => set('username', e.target.value)}
            {...fieldAria('user-username', errors.username)}
          />
        </Field>
        <Field label="อีเมล" htmlFor="user-email" error={errors.email}>
          <input
            id="user-email"
            name="user-email"
            type="email"
            autoComplete="off"
            spellCheck={false}
            className={inputClass(errors.email)}
            value={d.email}
            onChange={(e) => set('email', e.target.value)}
            {...fieldAria('user-email', errors.email)}
          />
        </Field>
        <Field label="บทบาท" htmlFor="user-role">
          <select
            id="user-role"
            name="user-role"
            autoComplete="off"
            className="input-field"
            value={d.role}
            onChange={(e) => set('role', e.target.value as UserRole)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabels[r]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="หน่วยงาน" htmlFor="user-org" error={errors.org}>
          <input
            id="user-org"
            name="user-org"
            autoComplete="off"
            className={inputClass(errors.org)}
            value={d.org}
            onChange={(e) => set('org', e.target.value)}
            {...fieldAria('user-org', errors.org)}
          />
        </Field>
        {d.role === 'ppho' && (
          <Field
            label="จังหวัด"
            htmlFor="user-province"
            error={errors.province}
          >
            <select
              id="user-province"
              name="user-province"
              autoComplete="off"
              className={inputClass(errors.province)}
              value={d.province ?? ''}
              onChange={(e) => set('province', e.target.value)}
              {...fieldAria('user-province', errors.province)}
            >
              <option value="">เลือกจังหวัด…</option>
              {provinces.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
        )}
      </div>
    </Modal>
  );
}
