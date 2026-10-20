'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { focusFirstError } from '@/lib/a11y';
import { defaultSettings } from '@/mock/prototype/admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Form {
  gppPass: string;
  certYears: string;
  acceptRequests: boolean;
  adminEmail: string;
}

const toForm = (s: typeof defaultSettings): Form => ({
  gppPass: String(s.gppPass),
  certYears: String(s.certYears),
  acceptRequests: s.acceptRequests,
  adminEmail: s.adminEmail,
});

export default function SettingsPage() {
  const [saved, setSaved] = useState<Form>(() => toForm(defaultSettings));
  const [f, setF] = useState<Form>(saved);
  const [errors, setErrors] = useState<
    Partial<Record<'gppPass' | 'certYears' | 'adminEmail', string>>
  >({});
  const ref = useRef<HTMLFormElement>(null);

  const dirty = (Object.keys(f) as (keyof Form)[]).some(
    (k) => f[k] !== saved[k],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    const gpp = Number(f.gppPass);
    const years = Number(f.certYears);
    if (!f.gppPass.trim() || !Number.isInteger(gpp) || gpp < 50 || gpp > 100)
      err.gppPass = 'ระบุเลขจำนวนเต็ม 50–100';
    if (
      !f.certYears.trim() ||
      !Number.isInteger(years) ||
      years < 1 ||
      years > 5
    )
      err.certYears = 'ระบุเลขจำนวนเต็ม 1–5';
    if (!f.adminEmail.trim()) err.adminEmail = 'ระบุอีเมล';
    else if (!EMAIL_RE.test(f.adminEmail.trim()))
      err.adminEmail = 'รูปแบบอีเมลไม่ถูกต้อง';
    setErrors(err);
    if (Object.keys(err).length) return focusFirstError(ref.current);
    setSaved({ ...f, adminEmail: f.adminEmail.trim() });
    setF((x) => ({ ...x, adminEmail: x.adminEmail.trim() }));
    toast.success('บันทึกการตั้งค่าแล้ว (ต้นแบบ — ไม่ถูกเก็บ)');
  };

  const reset = () => {
    setF(toForm(defaultSettings));
    setSaved(toForm(defaultSettings));
    setErrors({});
    toast.success('คืนค่าเดิมแล้ว');
  };

  return (
    <AdminLayout title="ตั้งค่าระบบ">
      <PrototypeBadge />
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight">ตั้งค่าระบบ</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
          เกณฑ์และค่าเริ่มต้นของการรับรองร้านยา
        </p>
      </div>

      <form
        ref={ref}
        onSubmit={submit}
        noValidate
        className="card max-w-xl space-y-5"
      >
        <Field
          label="เกณฑ์ผ่าน GPP (%)"
          htmlFor="set-gpp"
          error={errors.gppPass}
          hint="ช่วง 50–100"
        >
          <input
            id="set-gpp"
            name="gpp-pass"
            type="number"
            inputMode="numeric"
            min={50}
            max={100}
            autoComplete="off"
            className={`${inputClass(errors.gppPass)} tabular-nums`}
            value={f.gppPass}
            onChange={(e) => setF({ ...f, gppPass: e.target.value })}
            {...fieldAria('set-gpp', errors.gppPass, 'ช่วง 50–100')}
          />
        </Field>
        <Field
          label="อายุใบรับรอง (ปี)"
          htmlFor="set-years"
          error={errors.certYears}
          hint="ช่วง 1–5 ปี"
        >
          <input
            id="set-years"
            name="cert-years"
            type="number"
            inputMode="numeric"
            min={1}
            max={5}
            autoComplete="off"
            className={`${inputClass(errors.certYears)} tabular-nums`}
            value={f.certYears}
            onChange={(e) => setF({ ...f, certYears: e.target.value })}
            {...fieldAria('set-years', errors.certYears, 'ช่วง 1–5 ปี')}
          />
        </Field>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            role="switch"
            name="accept-requests"
            autoComplete="off"
            aria-checked={f.acceptRequests}
            checked={f.acceptRequests}
            onChange={(e) => setF({ ...f, acceptRequests: e.target.checked })}
          />
          เปิดรับคำขอรับรอง
        </label>
        <Field
          label="อีเมลผู้ดูแล"
          htmlFor="set-email"
          error={errors.adminEmail}
        >
          <input
            id="set-email"
            name="admin-email"
            type="email"
            autoComplete="off"
            spellCheck={false}
            className={inputClass(errors.adminEmail)}
            value={f.adminEmail}
            onChange={(e) => setF({ ...f, adminEmail: e.target.value })}
            {...fieldAria('set-email', errors.adminEmail)}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={!dirty}>
            บันทึก
          </button>
          <button type="button" className="btn-secondary" onClick={reset}>
            คืนค่าเดิม
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
