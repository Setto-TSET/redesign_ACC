'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout';
import { Stepper } from '@/components/common/Stepper';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { ScoreRing } from '@/components/prototype/ScoreRing';
import { useAuth } from '@/contexts/AuthContext';
import { focusFirstError } from '@/lib/a11y';
import { findPharmacy } from '@/mock/prototype/pharmacies';
import {
  ciChecklist,
  postAudits,
  qualityCategories,
  satisfactionLevels,
} from '@/mock/prototype/postAudit';
import { FindingModal, type DraftFinding } from './FindingModal';

const STEPS = ['ระบบร้านยาคุณภาพ', 'มาตรฐานบริการ Common illness', 'ตรวจทาน'];

interface Finding extends DraftFinding {
  category: string;
}

const muted = { color: 'var(--ink-secondary)' };

function Blocked({ children }: { children: string }) {
  return (
    <AdminLayout title="บันทึกผลตรวจ">
      <div className="card text-center py-12">
        <p className="font-semibold">{children}</p>
        <Link href="/post-audit" className="btn-secondary mt-6">
          กลับไปรายการ
        </Link>
      </div>
    </AdminLayout>
  );
}

export default function InspectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [qSummary, setQSummary] = useState('');
  const [answers, setAnswers] = useState<(boolean | null)[]>(
    Array(12).fill(null),
  );
  const [notes, setNotes] = useState<string[]>(Array(12).fill(''));
  const [satisfaction, setSatisfaction] = useState(0);
  const [ciSummary, setCiSummary] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  // editing: index ใน findings (-1 = เพิ่มใหม่) ต่อหมวด
  const [editing, setEditing] = useState<{
    category: string;
    index: number;
  } | null>(null);

  if (!user) return <AdminLayout title="บันทึกผลตรวจ">{null}</AdminLayout>;
  if (!['assessor', 'admin', 'superadmin'].includes(user.role))
    return <Blocked>คุณไม่มีสิทธิ์บันทึกผลตรวจ</Blocked>;
  const audit = postAudits.find((a) => a.id === id);
  if (!audit) return <Blocked>ไม่พบผลตรวจนี้</Blocked>;
  const shop = findPharmacy(audit.pharmacyId);
  const passed = answers.filter((a) => a === true).length;

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0 && !qSummary.trim()) e.qSummary = 'ระบุสรุปความเห็น';
    if (step === 1) {
      if (answers.some((a) => a === null)) e.table = 'ตอบให้ครบ 12 ข้อ';
      answers.forEach((a, i) => {
        if (a === false && !notes[i].trim()) e[`note${i}`] = 'ระบุสาเหตุ';
      });
      if (!satisfaction) e.satisfaction = 'เลือกระดับความพึงพอใจ';
      if (!ciSummary.trim()) e.ciSummary = 'ระบุสรุปผลตรวจ';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      // radio ไม่รองรับ aria-invalid — focus ข้อแรกที่ยังไม่ตอบเอง
      const firstBlank = answers.findIndex((x) => x === null);
      if (step === 1 && e.table)
        requestAnimationFrame(() =>
          cardRef.current
            ?.querySelector<HTMLElement>(`input[name="ci-${firstBlank}"]`)
            ?.focus(),
        );
      else focusFirstError(cardRef.current);
    }
    return Object.keys(e).length === 0;
  };

  const go = (s: number) => {
    setErrors({});
    setStep(s);
    window.scrollTo({ top: 0 });
  };

  const editingFinding =
    editing && editing.index >= 0 ? findings[editing.index] : undefined;

  return (
    <AdminLayout title="บันทึกผลตรวจ">
      <PrototypeBadge />
      <div className="max-w-3xl">
        <h2 className="text-2xl font-extrabold tracking-tight">บันทึกผลตรวจ</h2>
        <p className="text-sm mt-1 mb-6" style={muted}>
          {audit.no} · {shop?.name}
        </p>
        <Stepper steps={STEPS} current={step} />

        <div ref={cardRef} className="card space-y-5">
          {step === 0 && (
            <>
              {qualityCategories.map((c) => (
                <fieldset
                  key={c}
                  className="border rounded-lg p-4"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <legend className="px-1 text-sm font-semibold">{c}</legend>
                  {findings.every((f) => f.category !== c) ? (
                    <p className="text-sm" style={muted}>
                      ยังไม่มีข้อที่ไม่เป็นไปตามมาตรฐาน
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {findings.map(
                        (f, i) =>
                          f.category === c && (
                            <li
                              key={i}
                              className="flex flex-wrap items-start justify-between gap-2 text-sm"
                            >
                              <span className="min-w-0 break-words">
                                {f.text}{' '}
                                <span style={muted}>
                                  (รูป {f.files.length})
                                </span>
                              </span>
                              <span className="flex gap-2 shrink-0">
                                <button
                                  type="button"
                                  className="text-xs font-semibold underline"
                                  onClick={() =>
                                    setEditing({ category: c, index: i })
                                  }
                                >
                                  แก้ไข
                                </button>
                                <button
                                  type="button"
                                  className="text-xs font-semibold underline"
                                  style={{ color: 'var(--danger)' }}
                                  onClick={() =>
                                    window.confirm('ลบข้อนี้?') &&
                                    setFindings((xs) =>
                                      xs.filter((_, j) => j !== i),
                                    )
                                  }
                                >
                                  ลบ
                                </button>
                              </span>
                            </li>
                          ),
                      )}
                    </ul>
                  )}
                  <button
                    type="button"
                    className="btn-secondary mt-3"
                    onClick={() => setEditing({ category: c, index: -1 })}
                  >
                    เพิ่มข้อ
                  </button>
                </fieldset>
              ))}
              <Field
                label="สรุปความเห็น"
                htmlFor="q-summary"
                error={errors.qSummary}
              >
                <textarea
                  name="q-summary"
                  autoComplete="off"
                  id="q-summary"
                  rows={4}
                  className={inputClass(errors.qSummary)}
                  value={qSummary}
                  onChange={(e) => setQSummary(e.target.value)}
                  {...fieldAria('q-summary', errors.qSummary)}
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex items-center gap-4">
                <ScoreRing value={passed} total={12} label="ผ่าน" />
                <p className="text-sm" style={muted}>
                  ตอบแล้ว {answers.filter((a) => a !== null).length}/12 ข้อ
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ข้อ</th>
                      <th>ผล</th>
                      <th>ระบุ (กรณีไม่ตรง)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ciChecklist.map((t, i) => (
                      <tr key={t}>
                        <td>
                          {i + 1}. {t}
                        </td>
                        <td>
                          <div className="flex gap-4 whitespace-nowrap">
                            {([true, false] as const).map((v) => (
                              <label
                                key={String(v)}
                                className="flex items-center gap-1.5"
                              >
                                <input
                                  autoComplete="off"
                                  type="radio"
                                  name={`ci-${i}`}
                                  checked={answers[i] === v}
                                  onChange={() =>
                                    setAnswers((xs) =>
                                      xs.map((x, j) => (j === i ? v : x)),
                                    )
                                  }
                                />
                                {v ? 'ตรง' : 'ไม่ตรง'}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td>
                          {answers[i] === false && (
                            <input
                              name={`note-${i}`}
                              autoComplete="off"
                              id={`note-${i}`}
                              type="text"
                              aria-label={`ระบุข้อ ${i + 1}`}
                              className={inputClass(errors[`note${i}`])}
                              value={notes[i]}
                              onChange={(e) =>
                                setNotes((xs) =>
                                  xs.map((x, j) =>
                                    j === i ? e.target.value : x,
                                  ),
                                )
                              }
                              {...fieldAria(`note-${i}`, errors[`note${i}`])}
                            />
                          )}
                          {errors[`note${i}`] && (
                            <p
                              id={`note-${i}-error`}
                              className="mt-1 text-xs"
                              style={{ color: 'var(--danger)' }}
                              role="alert"
                            >
                              {errors[`note${i}`]}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {errors.table && (
                <p
                  className="text-xs"
                  style={{ color: 'var(--danger)' }}
                  role="alert"
                >
                  {errors.table}
                </p>
              )}
              <fieldset>
                <legend className="text-[13px] font-semibold text-zinc-700 mb-1.5">
                  ความพึงพอใจของผู้รับบริการ
                </legend>
                <div className="flex flex-wrap gap-4">
                  {satisfactionLevels.map((l, i) => (
                    <label
                      key={l}
                      className="flex items-center gap-1.5 text-sm"
                    >
                      <input
                        autoComplete="off"
                        type="radio"
                        name="satisfaction"
                        checked={satisfaction === i + 1}
                        onChange={() => setSatisfaction(i + 1)}
                      />
                      {l}
                    </label>
                  ))}
                </div>
                {errors.satisfaction && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: 'var(--danger)' }}
                    role="alert"
                  >
                    {errors.satisfaction}
                  </p>
                )}
              </fieldset>
              <Field
                label="สรุปผลตรวจ"
                htmlFor="ci-summary"
                error={errors.ciSummary}
              >
                <textarea
                  name="ci-summary"
                  autoComplete="off"
                  id="ci-summary"
                  rows={4}
                  className={inputClass(errors.ciSummary)}
                  value={ciSummary}
                  onChange={(e) => setCiSummary(e.target.value)}
                  {...fieldAria('ci-summary', errors.ciSummary)}
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="font-bold text-base">ระบบร้านยาคุณภาพ</h3>
                {qualityCategories.map((c) => (
                  <div key={c} className="mt-3">
                    <h4 className="font-semibold">{c}</h4>
                    {findings.some((f) => f.category === c) ? (
                      <ul className="list-disc pl-5">
                        {findings
                          .filter((f) => f.category === c)
                          .map((f, i) => (
                            <li key={i}>
                              {f.text} (รูป {f.files.length})
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p style={muted}>เป็นไปตามมาตรฐาน</p>
                    )}
                  </div>
                ))}
                <p className="mt-3">
                  <span className="font-semibold">สรุป: </span>
                  {qSummary}
                </p>
              </section>
              <section>
                <h3 className="font-bold text-base">
                  มาตรฐานบริการ Common illness
                </h3>
                <div className="my-2">
                  <ScoreRing value={passed} total={12} label="ผ่าน" />
                </div>
                <ul className="space-y-1">
                  {ciChecklist.map((t, i) => (
                    <li key={t}>
                      {i + 1}. {t} —{' '}
                      {answers[i] ? 'ตรง' : `ไม่ตรง (${notes[i]})`}
                    </li>
                  ))}
                </ul>
                <p className="mt-3">
                  ความพึงพอใจ: {satisfactionLevels[satisfaction - 1]}
                </p>
                <p>
                  <span className="font-semibold">สรุป: </span>
                  {ciSummary}
                </p>
              </section>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between gap-3">
          {step === 0 ? (
            <Link href={`/post-audit/${id}`} className="btn-secondary">
              ยกเลิก
            </Link>
          ) : (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => go(step - 1)}
            >
              ย้อนกลับ
            </button>
          )}
          {step < 2 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => validate() && go(step + 1)}
            >
              ถัดไป
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                toast.success('บันทึกผลตรวจแล้ว (ต้นแบบ — ไม่ถูกเก็บ)');
                router.push(`/post-audit/${id}?tab=quality`);
              }}
            >
              บันทึกผลตรวจ
            </button>
          )}
        </div>
      </div>

      {editing && (
        <FindingModal
          category={editing.category}
          initial={editingFinding}
          onCancel={() => setEditing(null)}
          onSave={(f) => {
            setFindings((xs) =>
              editing.index >= 0
                ? xs.map((x, i) => (i === editing.index ? { ...x, ...f } : x))
                : [...xs, { ...f, category: editing.category }],
            );
            setEditing(null);
          }}
        />
      )}
    </AdminLayout>
  );
}
