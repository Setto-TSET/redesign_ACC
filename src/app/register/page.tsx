'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { IconPill } from '@tabler/icons-react';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { Stepper } from '@/components/common/Stepper';
import { focusFirstError } from '@/lib/a11y';
import { api } from '@/lib/api';
import type { Registration } from '@/types/api';

const FIELDS: [keyof Registration, string][] = [
  ['name', 'ชื่อร้านยา'],
  ['address', 'ที่ตั้ง'],
  ['province', 'จังหวัด'],
  ['licensee', 'ชื่อผู้รับอนุญาต'],
  ['operator', 'ผู้มีหน้าที่ปฏิบัติการ'],
  ['operatorLicense', 'เลขใบประกอบวิชาชีพ'],
  ['phone', 'เบอร์โทร'],
  ['email', 'อีเมล'],
];

const inputProps: Partial<
  Record<keyof Registration, React.InputHTMLAttributes<HTMLInputElement>>
> = {
  email: { type: 'email', autoComplete: 'email', spellCheck: false },
  phone: { type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
  operatorLicense: { spellCheck: false },
  licenseNo: { spellCheck: false },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const [licenseNo, setLicenseNo] = useState('');
  const [form, setForm] = useState<Registration | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const lookup = async () => {
    setBusy(true);
    const found = await api.fda.lookup(licenseNo);
    setBusy(false);
    if (!found) {
      setErrors({
        licenseNo: 'ไม่พบเลขที่ใบอนุญาตนี้ ตรวจสอบรูปแบบ เช่น กท.28/2565',
      });
      focusFirstError(cardRef.current);
      return;
    }
    setErrors({});
    setForm(found);
  };

  const submit = async () => {
    if (!form) return;
    const e: Record<string, string> = {};
    for (const [key, label] of FIELDS)
      if (!form[key].trim()) e[key] = `กรอก${label}`;
    if (form.email && !EMAIL.test(form.email.trim()))
      e.email = 'อีเมลไม่ถูกต้อง';
    setErrors(e);
    if (Object.keys(e).length) {
      focusFirstError(cardRef.current);
      return;
    }
    setBusy(true);
    await api.registrations.create(form);
    toast.success(
      'ส่งข้อมูลลงทะเบียนแล้ว สรร. จะตรวจสอบและแจ้งบัญชีผู้ใช้ทางอีเมล',
    );
    router.push('/login');
  };

  return (
    <div
      className="min-h-screen animate-page px-4 py-10"
      style={{ background: 'var(--bg)' }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'var(--accent)' }}
          >
            <IconPill size={22} stroke={1.75} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              ลงทะเบียนร้านยา
            </h1>
            <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
              ระบบรับรองร้านยาคุณภาพ
            </p>
          </div>
        </div>

        <Stepper
          steps={['ตรวจสอบใบอนุญาต', 'ข้อมูลร้าน']}
          current={form ? 1 : 0}
        />

        <div className="card" ref={cardRef}>
          {!form ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                lookup();
              }}
              className="space-y-5"
            >
              <Field
                label="เลขที่ใบอนุญาตขายยา (ขย.5)"
                htmlFor="licenseNo"
                error={errors.licenseNo}
                hint="ระบบจะดึงข้อมูลร้านจาก อย. ให้อัตโนมัติ"
              >
                <input
                  id="licenseNo"
                  name="licenseNo"
                  autoComplete="off"
                  spellCheck={false}
                  className={inputClass(errors.licenseNo)}
                  {...fieldAria(
                    'licenseNo',
                    errors.licenseNo,
                    'ระบบจะดึงข้อมูลร้านจาก อย. ให้อัตโนมัติ',
                  )}
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  placeholder="กท.28/2565…"
                />
              </Field>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? 'กำลังตรวจสอบ…' : 'ดึงข้อมูลจาก อย.'}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
                ใบอนุญาต {form.licenseNo} — ตรวจสอบและแก้ไขข้อมูลให้ถูกต้อง
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                {FIELDS.map(([key, label]) => (
                  <Field
                    key={key}
                    label={label}
                    htmlFor={key}
                    error={errors[key]}
                  >
                    <input
                      id={key}
                      name={key}
                      autoComplete="off"
                      className={inputClass(errors[key])}
                      {...fieldAria(key, errors[key])}
                      {...inputProps[key]}
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    />
                  </Field>
                ))}
              </div>
              <div className="flex justify-between gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setForm(null);
                    setErrors({});
                  }}
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={submit}
                >
                  {busy ? 'กำลังส่ง…' : 'ส่งข้อมูลลงทะเบียน'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-sm text-center">
          มีบัญชีแล้ว?{' '}
          <Link
            href="/login"
            className="font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
