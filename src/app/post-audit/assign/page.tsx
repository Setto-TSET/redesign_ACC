'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout';
import { Stepper } from '@/components/common/Stepper';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { useAuth } from '@/contexts/AuthContext';
import { focusFirstError } from '@/lib/a11y';
import { formatDate } from '@/lib/format';
import { assessors } from '@/mock';
import { protoPharmacies, provinces } from '@/mock/prototype/pharmacies';
import { postAudits } from '@/mock/prototype/postAudit';

const STEPS = ['เลือกร้าน', 'ผู้ตรวจและวันนัด', 'ยืนยัน'];
const YEARS = [2569, 2570];

/** YYYY-MM-DD ตามเวลาท้องถิ่น (ไม่ใช้ toISOString ที่เป็น UTC) */
const todayLocal = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export default function AssignPage() {
  const router = useRouter();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [year, setYear] = useState(String(YEARS[0]));
  const [term, setTerm] = useState('');
  const [province, setProvince] = useState('all');
  const [picked, setPicked] = useState<number[]>([]);
  const [assessorId, setAssessorId] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [method, setMethod] = useState<'onsite' | 'online'>('onsite');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user) return <AdminLayout title="มอบหมายประจำปี">{null}</AdminLayout>;
  if (user.role !== 'admin' && user.role !== 'superadmin')
    return (
      <AdminLayout title="มอบหมายประจำปี">
        <div className="card text-center py-12">
          <p className="font-semibold">หน้านี้สำหรับเจ้าหน้าที่ สรร.</p>
          <Link href="/post-audit" className="btn-secondary mt-6">
            กลับไปรายการตรวจรักษาคุณภาพ
          </Link>
        </div>
      </AdminLayout>
    );

  const taken = new Set(
    postAudits.filter((a) => String(a.year) === year).map((a) => a.pharmacyId),
  );
  const shown = protoPharmacies.filter(
    (p) =>
      p.certStatus === 'A' &&
      !taken.has(p.id) &&
      (province === 'all' || p.province === province) &&
      (!term.trim() || p.name.includes(term.trim())),
  );
  const allShownPicked =
    shown.length > 0 && shown.every((p) => picked.includes(p.id));
  const assessor = assessors.find((a) => String(a.id) === assessorId);

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0 && picked.length === 0) e.picked = 'เลือกอย่างน้อย 1 ร้าน';
    if (step === 1) {
      if (!assessorId) e.assessor = 'เลือกผู้ตรวจ';
      if (!visitDate) e.visitDate = 'ระบุวันนัดตรวจ';
      else if (visitDate < todayLocal())
        e.visitDate = 'วันนัดต้องไม่ก่อนวันนี้';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) focusFirstError(cardRef.current);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0 });
  };

  const toggle = (id: number) =>
    setPicked((xs) =>
      xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id],
    );

  return (
    <AdminLayout title="มอบหมายประจำปี">
      <PrototypeBadge />
      <div className="max-w-3xl">
        <h2 className="text-2xl font-extrabold tracking-tight mb-1">
          มอบหมายตรวจรักษาคุณภาพประจำปี
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--ink-secondary)' }}>
          เลือกร้านที่ได้รับการรับรอง แล้วกำหนดผู้ตรวจและวันนัด
        </p>
        <Stepper steps={STEPS} current={step} />

        <div ref={cardRef} className="card space-y-5">
          {step === 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="ปี" htmlFor="pa-year">
                  <select
                    name="pa-year"
                    autoComplete="off"
                    id="pa-year"
                    className="input-field"
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value);
                      setPicked([]);
                    }}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="ค้นหาร้าน" htmlFor="pa-term">
                  <input
                    name="pa-term"
                    id="pa-term"
                    type="search"
                    className="input-field"
                    autoComplete="off"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="ชื่อร้าน…"
                  />
                </Field>
                <Field label="จังหวัด" htmlFor="pa-province">
                  <select
                    name="pa-province"
                    autoComplete="off"
                    id="pa-province"
                    className="input-field"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                  >
                    <option value="all">ทุกจังหวัด</option>
                    {provinces.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      name="pa-all"
                      autoComplete="off"
                      type="checkbox"
                      checked={allShownPicked}
                      disabled={shown.length === 0}
                      onChange={() =>
                        setPicked((xs) =>
                          allShownPicked
                            ? xs.filter((x) => !shown.some((p) => p.id === x))
                            : [
                                ...xs,
                                ...shown
                                  .map((p) => p.id)
                                  .filter((id) => !xs.includes(id)),
                              ],
                        )
                      }
                    />
                    เลือกทั้งหมดที่แสดง
                  </label>
                  <span
                    className="text-xs"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    เลือกแล้ว {picked.length} ร้าน
                  </span>
                </div>
                {shown.length === 0 ? (
                  <p
                    className="text-sm py-6 text-center"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    ไม่มีร้านที่พร้อมมอบหมายตามตัวกรองนี้
                  </p>
                ) : (
                  <ul
                    className="divide-y divide-zinc-100 border rounded-lg max-h-96 overflow-y-auto"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {shown.map((p) => (
                      <li key={p.id}>
                        <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50">
                          <input
                            name="pa-shop"
                            autoComplete="off"
                            type="checkbox"
                            checked={picked.includes(p.id)}
                            onChange={() => toggle(p.id)}
                            {...(errors.picked ? { 'aria-invalid': true } : {})}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">
                              {p.name}
                            </span>
                            <span
                              className="block text-xs"
                              style={{ color: 'var(--ink-secondary)' }}
                            >
                              {p.province} · {p.licenseNo}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                {errors.picked && (
                  <p
                    className="mt-2 text-xs"
                    style={{ color: 'var(--danger)' }}
                    role="alert"
                  >
                    {errors.picked}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Field
                label="ผู้ตรวจ"
                htmlFor="pa-assessor"
                error={errors.assessor}
              >
                <select
                  name="pa-assessor"
                  autoComplete="off"
                  id="pa-assessor"
                  className={inputClass(errors.assessor)}
                  value={assessorId}
                  onChange={(e) => setAssessorId(e.target.value)}
                  {...fieldAria('pa-assessor', errors.assessor)}
                >
                  <option value="">เลือกผู้ตรวจ…</option>
                  {assessors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="วันนัดตรวจ"
                htmlFor="pa-date"
                error={errors.visitDate}
              >
                <input
                  name="pa-date"
                  autoComplete="off"
                  id="pa-date"
                  type="date"
                  min={todayLocal()}
                  className={inputClass(errors.visitDate)}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  {...fieldAria('pa-date', errors.visitDate)}
                />
              </Field>
              <fieldset>
                <legend className="text-[13px] font-semibold text-zinc-700 mb-1.5">
                  วิธีตรวจ
                </legend>
                <div className="flex gap-6">
                  {(
                    [
                      ['onsite', 'ตรวจที่ร้าน'],
                      ['online', 'ตรวจออนไลน์'],
                    ] as const
                  ).map(([k, l]) => (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <input
                        autoComplete="off"
                        type="radio"
                        name="method"
                        checked={method === k}
                        onChange={() => setMethod(k)}
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {step === 2 && (
            <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
              <dt style={{ color: 'var(--ink-secondary)' }}>ปี</dt>
              <dd className="font-medium">{year}</dd>
              <dt style={{ color: 'var(--ink-secondary)' }}>จำนวนร้าน</dt>
              <dd className="font-medium">{picked.length} ร้าน</dd>
              <dt style={{ color: 'var(--ink-secondary)' }}>ผู้ตรวจ</dt>
              <dd className="font-medium">{assessor?.name}</dd>
              <dt style={{ color: 'var(--ink-secondary)' }}>วันนัดตรวจ</dt>
              <dd className="font-medium">{formatDate(visitDate)}</dd>
              <dt style={{ color: 'var(--ink-secondary)' }}>วิธีตรวจ</dt>
              <dd className="font-medium">
                {method === 'onsite' ? 'ตรวจที่ร้าน' : 'ตรวจออนไลน์'}
              </dd>
              <dt style={{ color: 'var(--ink-secondary)' }}>ร้านที่เลือก</dt>
              <dd>
                <ul className="list-disc pl-5 space-y-0.5">
                  {protoPharmacies
                    .filter((p) => picked.includes(p.id))
                    .map((p) => (
                      <li key={p.id}>{p.name}</li>
                    ))}
                </ul>
              </dd>
            </dl>
          )}
        </div>

        <div className="mt-6 flex justify-between gap-3">
          {step === 0 ? (
            <Link href="/post-audit" className="btn-secondary">
              ยกเลิก
            </Link>
          ) : (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setErrors({});
                setStep(step - 1);
              }}
            >
              ย้อนกลับ
            </button>
          )}
          {step < 2 ? (
            <button type="button" className="btn-primary" onClick={next}>
              ถัดไป
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                toast.success(`มอบหมาย ${picked.length} ร้านแล้ว`);
                router.push('/post-audit');
              }}
            >
              ยืนยันมอบหมาย
            </button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
