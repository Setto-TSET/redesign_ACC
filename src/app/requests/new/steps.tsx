'use client';

import { IconCircleCheckFilled, IconCircleDashed } from '@tabler/icons-react';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import {
  pledgeItems,
  pledgeWarning,
  relationLabels,
  requestTypes,
  typeLabel,
} from '@/lib/constants';
import {
  CHANGE_TYPE_IDS,
  MAIN_TYPE_IDS,
  mainTypeOf,
  needsPledge,
  requiredDocs,
  setMainType,
  toggleChangeType,
  type StepErrors,
} from '@/lib/requestRules';
import type { Applicant, ApplicantRelation, RequestDraft } from '@/types/api';

export interface StepProps {
  draft: RequestDraft;
  update: (patch: Partial<RequestDraft>) => void;
  errors: StepErrors;
}

const typeById = (id: number) => requestTypes.find((t) => t.id === id)!;

const ErrorText = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="mt-2 text-xs" style={{ color: 'var(--danger)' }} role="alert">
      {msg}
    </p>
  ) : null;

const optionClass = (on: boolean) =>
  `flex gap-3 items-start rounded-xl border p-4 cursor-pointer transition-colors ${
    on
      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
      : 'border-[var(--border)] hover:border-zinc-300'
  }`;

const Muted = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm mb-3" style={{ color: 'var(--ink-secondary)' }}>
    {children}
  </p>
);

export function TypeStep({ draft, update, errors }: StepProps) {
  const main = mainTypeOf(draft.typeIds);
  const mainOptions = [
    ...MAIN_TYPE_IDS.map((id) => {
      const t = typeById(id);
      return { id: t.id as number | null, label: t.label, hint: t.hint };
    }),
    {
      id: null,
      label: 'ไม่ขอรับรองหรือต่ออายุ',
      hint: 'แจ้งเปลี่ยนแปลงข้อมูลร้านอย่างเดียว',
    },
  ];

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="font-bold mb-1">ขอรับรองหรือต่ออายุ</legend>
        <Muted>เลือกได้ 1 ข้อ</Muted>
        <div className="grid gap-2">
          {mainOptions.map((o) => (
            <label key={o.id ?? 0} className={optionClass(main === o.id)}>
              <input
                type="radio"
                name="mainType"
                aria-invalid={!!errors.typeIds}
                className="mt-1 accent-[var(--accent)]"
                checked={main === o.id}
                onChange={() =>
                  update({ typeIds: setMainType(draft.typeIds, o.id) })
                }
              />
              <span>
                <span className="block text-sm font-semibold">{o.label}</span>
                <span
                  className="block text-xs mt-0.5"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  {o.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-bold mb-1">แจ้งเปลี่ยนแปลงข้อมูลร้าน</legend>
        <Muted>เลือกได้หลายข้อ หรือไม่เลือกเลยก็ได้</Muted>
        <div className="grid gap-2">
          {CHANGE_TYPE_IDS.map(typeById).map((t) => {
            const on = draft.typeIds.includes(t.id);
            return (
              <div key={t.id}>
                <label className={optionClass(on)}>
                  <input
                    type="checkbox"
                    aria-invalid={!!errors.typeIds}
                    className="mt-1 accent-[var(--accent)]"
                    checked={on}
                    onChange={() =>
                      update({ typeIds: toggleChangeType(draft.typeIds, t.id) })
                    }
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      {t.label}
                    </span>
                    <span
                      className="block text-xs mt-0.5"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {t.hint}
                    </span>
                  </span>
                </label>
                {t.id === 5 && on && (
                  <div className="flex flex-wrap gap-x-6 gap-y-2 px-4 py-3 text-sm">
                    {(
                      [
                        [1, 'จากบุคคล เป็น บุคคล'],
                        [2, 'จากบุคคล เป็น นิติบุคคล/บริษัท'],
                      ] as const
                    ).map(([v, l]) => (
                      <label key={v} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="changeMode"
                          className="accent-[var(--accent)]"
                          checked={draft.changeMode === v}
                          onChange={() => update({ changeMode: v })}
                        />
                        {l}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <ErrorText msg={errors.typeIds} />
    </div>
  );
}

type TextKey = 'firstName' | 'lastName' | 'email' | 'phone' | 'lineId';

export function ApplicantStep({ draft, update, errors }: StepProps) {
  const a = draft.applicant;
  const set = (patch: Partial<Applicant>) =>
    update({ applicant: { ...a, ...patch } });

  const text = (
    key: TextKey,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <Field label={label} htmlFor={key} error={errors[key]}>
      <input
        id={key}
        name={key}
        className={inputClass(errors[key])}
        {...fieldAria(key, errors[key])}
        value={a[key]}
        onChange={(e) => set({ [key]: e.target.value } as Partial<Applicant>)}
        {...props}
      />
    </Field>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {text('firstName', 'ชื่อ', { autoComplete: 'given-name' })}
        {text('lastName', 'นามสกุล', { autoComplete: 'family-name' })}
        {text('email', 'อีเมล', {
          type: 'email',
          autoComplete: 'email',
          spellCheck: false,
          placeholder: 'name@example.com…',
        })}
        {text('phone', 'เบอร์โทร', {
          type: 'tel',
          autoComplete: 'tel',
          placeholder: '0812345678…',
        })}
        {text('lineId', 'LINE ID (ถ้ามี)', {
          autoComplete: 'off',
          spellCheck: false,
        })}
      </div>

      <fieldset>
        <legend className="block text-[13px] font-semibold text-zinc-700 mb-2">
          ความเกี่ยวข้องกับร้านยา
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(relationLabels).map(([v, l]) => {
            const value = Number(v) as ApplicantRelation;
            return (
              <label key={v} className={optionClass(a.relation === value)}>
                <input
                  type="radio"
                  name="relation"
                  aria-invalid={!!errors.relation}
                  className="mt-1 accent-[var(--accent)]"
                  checked={a.relation === value}
                  onChange={() => set({ relation: value })}
                />
                <span className="text-sm">{l}</span>
              </label>
            );
          })}
        </div>
        <ErrorText msg={errors.relation} />
      </fieldset>

      {a.relation === 9 && (
        <Field
          label="ระบุความเกี่ยวข้อง"
          htmlFor="relationOther"
          error={errors.relationOther}
        >
          <input
            id="relationOther"
            name="relationOther"
            autoComplete="off"
            className={inputClass(errors.relationOther)}
            {...fieldAria('relationOther', errors.relationOther)}
            value={a.relationOther}
            onChange={(e) => set({ relationOther: e.target.value })}
          />
        </Field>
      )}
    </div>
  );
}

export function DocsStep({ draft, update, errors }: StepProps) {
  const docs = requiredDocs(draft.typeIds, requestTypes);
  return (
    <div className="space-y-4">
      <Muted>
        เอกสารที่ต้องแนบสำหรับคำขอนี้ {docs.length} รายการ รองรับไฟล์ PDF
        หรือรูปภาพ
      </Muted>
      <ul className="space-y-3">
        {docs.map((doc, i) => {
          const file = draft.docs[doc];
          const error = errors[`doc:${doc}`];
          return (
            <li
              key={doc}
              className="animate-stagger rounded-xl border p-4"
              style={
                {
                  borderColor: error ? 'var(--danger)' : 'var(--border)',
                  '--i': Math.min(i, 7),
                } as React.CSSProperties
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {file ? (
                    <IconCircleCheckFilled
                      size={20}
                      aria-hidden="true"
                      className="shrink-0"
                      style={{ color: 'var(--accent)' }}
                    />
                  ) : (
                    <IconCircleDashed
                      size={20}
                      aria-hidden="true"
                      className="shrink-0"
                      style={{ color: 'var(--ink-faint)' }}
                    />
                  )}
                  <span className="text-sm font-medium">{doc}</span>
                </div>
                <label className="btn-secondary cursor-pointer !py-1.5 !px-4 !text-xs">
                  {file ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
                  <input
                    type="file"
                    name={doc}
                    aria-label={`เลือกไฟล์ ${doc}`}
                    aria-invalid={!!error}
                    accept=".pdf,image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) update({ docs: { ...draft.docs, [doc]: f.name } });
                    }}
                  />
                </label>
              </div>
              {file && (
                <p
                  className="mt-2 pl-7 text-xs truncate"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  {file}
                </p>
              )}
              {error && (
                <p
                  className="mt-2 pl-7 text-xs"
                  style={{ color: 'var(--danger)' }}
                  role="alert"
                >
                  {error}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>
        ต้นแบบนี้เก็บเฉพาะชื่อไฟล์ ยังไม่อัปโหลดจริง
      </p>
    </div>
  );
}

export function ReviewStep({ draft, update, errors }: StepProps) {
  const a = draft.applicant;
  const rows: [string, string][] = [
    ['ประเภทคำขอ', typeLabel(draft.typeIds)],
    ['ผู้ยื่นคำขอ', `${a.firstName} ${a.lastName}`],
    [
      'ติดต่อ',
      [a.email, a.phone, a.lineId && `LINE ${a.lineId}`]
        .filter(Boolean)
        .join(' · '),
    ],
    [
      'ความเกี่ยวข้อง',
      a.relation === 9
        ? a.relationOther
        : a.relation
          ? relationLabels[a.relation]
          : '-',
    ],
    ['เอกสาร', `${requiredDocs(draft.typeIds, requestTypes).length} รายการ`],
  ];

  return (
    <div className="space-y-6">
      <dl className="divide-y divide-zinc-100">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-3 sm:grid-cols-[160px_1fr]">
            <dt className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
              {k}
            </dt>
            <dd className="text-sm font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      {needsPledge(draft.typeIds) && (
        <div className="rounded-xl p-5" style={{ background: 'var(--bg)' }}>
          <h3 className="font-bold">คำรับรองของผู้ยื่นคำขอ</h3>
          <ol className="mt-3 space-y-1.5 text-sm list-decimal pl-5">
            {pledgeItems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs" style={{ color: 'var(--ink-secondary)' }}>
            {pledgeWarning}
          </p>
          <label className="mt-4 flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              name="pledged"
              aria-invalid={!!errors.pledged}
              className="w-4 h-4 accent-[var(--accent)]"
              checked={draft.pledged}
              onChange={(e) => update({ pledged: e.target.checked })}
            />
            รับทราบและให้คำรับรอง
          </label>
          <ErrorText msg={errors.pledged} />
        </div>
      )}
    </div>
  );
}
