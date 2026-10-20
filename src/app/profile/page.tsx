'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { useAuth } from '@/contexts/AuthContext';
import { focusFirstError } from '@/lib/a11y';
import { roleLabels } from '@/mock';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_HINT = 'อย่างน้อย 8 ตัว มีทั้งตัวอักษรและตัวเลข';

function InfoCard() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const ref = useRef<HTMLFormElement>(null);
  if (!user) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (!name.trim()) err.name = 'ระบุชื่อ-สกุล';
    if (!email.trim()) err.email = 'ระบุอีเมล';
    else if (!EMAIL_RE.test(email.trim())) err.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    setErrors(err);
    if (Object.keys(err).length) return focusFirstError(ref.current);
    toast.success('บันทึกข้อมูลส่วนตัวแล้ว (ต้นแบบ — ไม่ถูกเก็บ)');
  };

  const rows: [string, string][] = [
    ['Username', user.username],
    ['บทบาท', roleLabels[user.role]],
    ['หน่วยงาน', user.org],
    ['จังหวัด', user.province ?? '-'],
  ];

  return (
    <form ref={ref} onSubmit={submit} noValidate className="card space-y-4">
      <h3 className="font-bold">ข้อมูลส่วนตัว</h3>
      <Field label="ชื่อ-สกุล" htmlFor="pf-name" error={errors.name}>
        <input
          id="pf-name"
          name="name"
          autoComplete="name"
          className={inputClass(errors.name)}
          value={name}
          onChange={(e) => setName(e.target.value)}
          {...fieldAria('pf-name', errors.name)}
        />
      </Field>
      <Field label="อีเมล" htmlFor="pf-email" error={errors.email}>
        <input
          id="pf-email"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          className={inputClass(errors.email)}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          {...fieldAria('pf-email', errors.email)}
        />
      </Field>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt style={{ color: 'var(--ink-secondary)' }}>{k}</dt>
            <dd className="min-w-0 break-words">{v}</dd>
          </div>
        ))}
      </dl>
      <button type="submit" className="btn-primary">
        บันทึก
      </button>
    </form>
  );
}

function PasswordCard() {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [errors, setErrors] = useState<
    Partial<Record<'cur' | 'next' | 'again', string>>
  >({});
  const ref = useRef<HTMLFormElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (!cur) err.cur = 'ระบุรหัสผ่านเดิม';
    if (!next) err.next = 'ระบุรหัสผ่านใหม่';
    else if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next))
      err.next = PW_HINT;
    if (!again) err.again = 'ยืนยันรหัสผ่านใหม่';
    else if (again !== next) err.again = 'รหัสผ่านไม่ตรงกัน';
    setErrors(err);
    if (Object.keys(err).length) return focusFirstError(ref.current);
    setCur('');
    setNext('');
    setAgain('');
    toast.success('เปลี่ยนรหัสผ่านแล้ว (ต้นแบบ — ไม่ได้ส่งจริง)');
  };

  return (
    <form ref={ref} onSubmit={submit} noValidate className="card space-y-4">
      <h3 className="font-bold">เปลี่ยนรหัสผ่าน</h3>
      <Field label="รหัสผ่านเดิม" htmlFor="pw-cur" error={errors.cur}>
        <input
          id="pw-cur"
          name="current-password"
          type="password"
          autoComplete="current-password"
          className={inputClass(errors.cur)}
          value={cur}
          onChange={(e) => setCur(e.target.value)}
          {...fieldAria('pw-cur', errors.cur)}
        />
      </Field>
      <Field
        label="รหัสผ่านใหม่"
        htmlFor="pw-new"
        error={errors.next}
        hint={PW_HINT}
      >
        <input
          id="pw-new"
          name="new-password"
          type="password"
          autoComplete="new-password"
          className={inputClass(errors.next)}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          {...fieldAria('pw-new', errors.next, PW_HINT)}
        />
      </Field>
      <Field label="ยืนยันรหัสผ่านใหม่" htmlFor="pw-again" error={errors.again}>
        <input
          id="pw-again"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          className={inputClass(errors.again)}
          value={again}
          onChange={(e) => setAgain(e.target.value)}
          {...fieldAria('pw-again', errors.again)}
        />
      </Field>
      <button type="submit" className="btn-primary">
        เปลี่ยนรหัสผ่าน
      </button>
    </form>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <AdminLayout title="โปรไฟล์">
      <PrototypeBadge />
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight">โปรไฟล์</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
          ข้อมูลส่วนตัวและรหัสผ่านของบัญชีคุณ
        </p>
      </div>
      {user && (
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <InfoCard />
          <PasswordCard />
        </div>
      )}
    </AdminLayout>
  );
}
