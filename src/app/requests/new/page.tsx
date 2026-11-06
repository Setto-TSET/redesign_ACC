'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout';
import { Stepper } from '@/components/common/Stepper';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { focusFirstError } from '@/lib/a11y';
import { api } from '@/lib/api';
import { requestTypes } from '@/lib/constants';
import { isAlive, validateStep, type StepErrors } from '@/lib/requestRules';
import type { AccRequest, RequestDraft } from '@/types/api';
import { ApplicantStep, DocsStep, ReviewStep, TypeStep } from './steps';

const STEPS = ['ประเภทคำขอ', 'ผู้ยื่นคำขอ', 'เอกสาร', 'ตรวจสอบและยืนยัน'];
const LAST = STEPS.length - 1;
const DRAFT_KEY = 'accpharm_request_draft';

const emptyDraft = (email: string): RequestDraft => ({
  typeIds: [],
  changeMode: 1,
  applicant: {
    firstName: '',
    lastName: '',
    email,
    phone: '',
    lineId: '',
    relation: null,
    relationOther: '',
  },
  docs: {},
  pledged: false,
});

export default function NewRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => emptyDraft(user?.email ?? ''));
  const [errors, setErrors] = useState<StepErrors>({});
  // undefined = กำลังโหลด, null = ไม่มีคำขอค้าง
  const [active, setActive] = useState<AccRequest | null | undefined>();
  const [restored, setRestored] = useState(false);
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // กู้ร่างจาก sessionStorage (อ่านหลัง mount เพื่อไม่ให้ hydration ไม่ตรง)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(DRAFT_KEY);
      if (stored) {
        const saved: RequestDraft = JSON.parse(stored);
        setDraft(saved);
        if (saved.typeIds.length > 0)
          toast('กู้คืนร่างที่บันทึกไว้แล้ว', { id: 'draft-restored' });
      }
    } catch {
      sessionStorage.removeItem(DRAFT_KEY);
    }
    setRestored(true);
  }, []);

  // บันทึกร่างอัตโนมัติทุกครั้งที่แก้
  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // บันทึกร่างไม่ได้ก็ยังกรอกต่อได้
    }
  }, [draft, restored]);

  useEffect(() => {
    if (!user?.pharmacyId) return;
    api.requests
      .list({ pharmacyId: user.pharmacyId })
      .then((list) => setActive(list.find((r) => isAlive(r.status)) ?? null))
      .catch(() => {
        toast.error('โหลดข้อมูลคำขอไม่สำเร็จ');
        setActive(null);
      });
  }, [user]);

  const update = (patch: Partial<RequestDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const check = () => {
    const e = validateStep(step, draft, requestTypes);
    setErrors(e);
    if (Object.keys(e).length > 0) focusFirstError(cardRef.current);
    return Object.keys(e).length === 0;
  };

  const goTo = (s: number) => {
    setStep(s);
    window.scrollTo({ top: 0 });
  };

  const submit = async () => {
    if (!check() || !user?.pharmacyId) return;
    setSaving(true);
    try {
      const req = await api.requests.create(draft, user.pharmacyId);
      sessionStorage.removeItem(DRAFT_KEY);
      toast.success(`ส่งคำขอ ${req.no} แล้ว`);
      router.push('/requests');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ส่งคำขอไม่สำเร็จ');
      setSaving(false);
    }
  };

  if (!user?.pharmacyId)
    return (
      <AdminLayout title="ยื่นคำขอรับรอง">
        <div className="card text-center py-12">
          <p className="font-semibold">ยื่นคำขอได้จากบัญชีร้านยาเท่านั้น</p>
          <Link href="/requests" className="btn-secondary mt-6">
            กลับไปรายการคำขอ
          </Link>
        </div>
      </AdminLayout>
    );

  if (active === undefined)
    return <AdminLayout title="ยื่นคำขอรับรอง">{null}</AdminLayout>;

  if (active)
    return (
      <AdminLayout title="ยื่นคำขอรับรอง">
        <div className="card max-w-xl">
          <h2 className="text-lg font-bold">มีคำขอที่กำลังดำเนินการอยู่</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="font-mono font-semibold">{active.no}</span>
            <StatusBadge status={active.status} />
          </div>
          <p className="mt-3 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            ยื่นคำขอใหม่ได้เมื่อคำขอนี้เสร็จสิ้นหรือถูกยกเลิก
          </p>
          <Link href={`/requests/${active.id}`} className="btn-primary mt-6">
            ดูคำขอนี้
          </Link>
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout title="ยื่นคำขอรับรอง">
      <div className="max-w-3xl">
        <Stepper steps={STEPS} current={step} />
        <div className="card" ref={cardRef}>
          <h2 className="text-lg font-bold mb-5">{STEPS[step]}</h2>
          {step === 0 && (
            <TypeStep draft={draft} update={update} errors={errors} />
          )}
          {step === 1 && (
            <ApplicantStep draft={draft} update={update} errors={errors} />
          )}
          {step === 2 && (
            <DocsStep draft={draft} update={update} errors={errors} />
          )}
          {step === 3 && (
            <ReviewStep draft={draft} update={update} errors={errors} />
          )}

          <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-slate-100">
            <button
              type="button"
              className="btn-secondary"
              disabled={step === 0}
              onClick={() => {
                setErrors({});
                goTo(step - 1);
              }}
            >
              ย้อนกลับ
            </button>
            {step < LAST ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (check()) goTo(step + 1);
                }}
              >
                ถัดไป
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                disabled={saving}
                onClick={submit}
              >
                {saving ? 'กำลังส่ง…' : 'ส่งคำขอ'}
              </button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--ink-tertiary)' }}>
          ระบบบันทึกร่างให้อัตโนมัติ ปิดหน้านี้แล้วกลับมาทำต่อได้
        </p>
      </div>
    </AdminLayout>
  );
}
