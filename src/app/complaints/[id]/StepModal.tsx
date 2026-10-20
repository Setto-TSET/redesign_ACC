'use client';

import { useState } from 'react';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { Modal } from '@/components/prototype/Modal';
import {
  actionOptions,
  complaintSteps,
  councilResults,
  findingResults,
  severities,
} from '@/mock/prototype/complaints';

const DATE_STEPS = [6, 8, 9, 11, 13];
const today = () => new Date().toISOString().slice(0, 10);

function RadioGroup({
  legend,
  name,
  options,
  value,
  onChange,
  error,
}: {
  legend: string;
  name: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <fieldset>
        <legend className="text-[13px] font-semibold text-zinc-700 mb-1.5">
          {legend}
        </legend>
        {options.map((o, i) => (
          <label key={o} className="flex items-center gap-2 text-sm py-1">
            <input
              id={`${name}-${i}`}
              data-autofocus={i === 0 ? true : undefined}
              type="radio"
              name={name}
              autoComplete="off"
              checked={value === o}
              onChange={() => onChange(o)}
            />
            {o}
          </label>
        ))}
      </fieldset>
      {error && (
        <p
          role="alert"
          className="mt-1 text-xs"
          style={{ color: 'var(--danger)' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** กรอกข้อมูลขั้นที่ `index` ของ complaintSteps — onSave ส่งวันที่และข้อความสรุปสำหรับ log */
export function StepModal({
  index,
  defaultUser,
  onCancel,
  onSave,
}: {
  index: number;
  defaultUser: string;
  onCancel: () => void;
  onSave: (date: string, text: string) => void;
}) {
  const [date, setDate] = useState('');
  const [detail, setDetail] = useState('');
  const [finding, setFinding] = useState('');
  const [severity, setSeverity] = useState('');
  const [round, setRound] = useState('');
  const [action, setAction] = useState('');
  const [stopDate, setStopDate] = useState('');
  const [agency, setAgency] = useState('');
  const [warnBy, setWarnBy] = useState('');
  const [result, setResult] = useState('');
  const [other, setOther] = useState('');
  const [closer, setCloser] = useState(defaultUser);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasDate = DATE_STEPS.includes(index) || index === 14;
  const warn = action.startsWith('ตักเตือน');

  const save = () => {
    const err: [string, string, string][] = []; // [key, message, elementId]
    const need = (ok: unknown, key: string, msg: string, id = key) =>
      ok || err.push([key, msg, id]);
    if (hasDate) need(date, 'date', 'เลือกวันที่');
    if (index === 7) need(detail.trim(), 'detail', 'กรอกรายละเอียดการแสวงหา');
    if (index === 9) {
      need(finding, 'finding', 'เลือกผลการสรุป', 'finding-0');
    }
    if (index === 11)
      need(Number(round) >= 1, 'round', 'ระบุครั้งที่ (ตั้งแต่ 1)');
    if (index === 10) {
      need(action, 'action', 'เลือกการดำเนินการ', 'action-0');
      if (action === 'แจ้งให้หยุดการบริการ')
        need(stopDate, 'stopDate', 'เลือกวันที่ให้หยุดบริการ');
      if (action === 'ส่งเรื่อง สปสช.')
        need(agency.trim(), 'agency', 'ระบุหน่วยงาน');
      if (warn) need(warnBy.trim(), 'warnBy', 'ระบุผู้ตักเตือน');
    }
    if (index === 12) {
      need(result, 'result', 'เลือกผลการพิจารณา', 'result-0');
      if (result === 'อื่น ๆ') need(other.trim(), 'other', 'ระบุผลการพิจารณา');
    }
    if (index === 14) need(closer.trim(), 'closer', 'ระบุผู้ปิดเรื่อง');
    setErrors(Object.fromEntries(err.map(([k, m]) => [k, m])));
    if (err.length) {
      requestAnimationFrame(() => document.getElementById(err[0][2])?.focus());
      return;
    }

    const parts: string[] = [];
    if (index === 9) parts.push(`สรุป: ${finding}`);
    if (severity) parts.push(`ความรุนแรง: ${severity}`);
    if (index === 11) parts.push(`ครั้งที่ ${round}`);
    if (index === 10) {
      parts.push(action);
      if (stopDate) parts.push(`หยุดบริการ ${stopDate}`);
      if (agency) parts.push(`หน่วยงาน ${agency.trim()}`);
      if (warn) parts.push(`โดย ${warnBy.trim()}`);
    }
    if (index === 12)
      parts.push(result === 'อื่น ๆ' ? `อื่น ๆ: ${other.trim()}` : result);
    if (index === 14) parts.push(`ผู้ปิด: ${closer.trim()}`);
    if (detail.trim()) parts.push(detail.trim());
    onSave(date || today(), parts.join(' · ') || complaintSteps[index]);
  };

  const dateField = (
    key: string,
    label: string,
    value: string,
    set: (v: string) => void,
    first = false,
  ) => (
    <Field label={label} htmlFor={key} error={errors[key]}>
      <input
        id={key}
        type="date"
        name={key}
        autoComplete="off"
        data-autofocus={first ? true : undefined}
        className={inputClass(errors[key])}
        value={value}
        onChange={(e) => set(e.target.value)}
        {...fieldAria(key, errors[key])}
      />
    </Field>
  );

  const text = (
    key: string,
    label: string,
    value: string,
    set: (v: string) => void,
    first = false,
  ) => (
    <Field label={label} htmlFor={key} error={errors[key]}>
      <input
        id={key}
        name={key}
        autoComplete="off"
        data-autofocus={first ? true : undefined}
        className={inputClass(errors[key])}
        value={value}
        onChange={(e) => set(e.target.value)}
        {...fieldAria(key, errors[key])}
      />
    </Field>
  );

  return (
    <Modal
      title={`บันทึกขั้น ${complaintSteps[index]}`}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            ยกเลิก
          </button>
          <button type="button" className="btn-primary" onClick={save}>
            บันทึก
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {index === 14 && dateField('date', 'วันที่ปิด', date, setDate, true)}
        {index !== 14 &&
          DATE_STEPS.includes(index) &&
          dateField('date', 'วันที่', date, setDate, true)}
        {index === 11 && (
          <Field label="ครั้งที่" htmlFor="round" error={errors.round}>
            <input
              id="round"
              type="number"
              min={1}
              name="round"
              autoComplete="off"
              className={inputClass(errors.round)}
              value={round}
              onChange={(e) => setRound(e.target.value)}
              {...fieldAria('round', errors.round)}
            />
          </Field>
        )}
        {index === 9 && (
          <>
            <RadioGroup
              legend="ผลการสรุป"
              name="finding"
              options={findingResults}
              value={finding}
              onChange={setFinding}
              error={errors.finding}
            />
            <Field label="ความรุนแรง" htmlFor="severity">
              <select
                id="severity"
                name="severity"
                autoComplete="off"
                className="input-field"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="">ไม่ระบุ</option>
                {severities.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </>
        )}
        {index === 10 && (
          <>
            <RadioGroup
              legend="การดำเนินการ"
              name="action"
              options={actionOptions}
              value={action}
              onChange={setAction}
              error={errors.action}
            />
            {action === 'แจ้งให้หยุดการบริการ' &&
              dateField(
                'stopDate',
                'วันที่ให้หยุดบริการ',
                stopDate,
                setStopDate,
              )}
            {action === 'ส่งเรื่อง สปสช.' &&
              text('agency', 'หน่วยงาน', agency, setAgency)}
            {warn && text('warnBy', 'ตักเตือนโดย', warnBy, setWarnBy)}
          </>
        )}
        {index === 12 && (
          <>
            <RadioGroup
              legend="ผลการพิจารณา"
              name="result"
              options={councilResults}
              value={result}
              onChange={setResult}
              error={errors.result}
            />
            {result === 'อื่น ๆ' && text('other', 'ระบุ', other, setOther)}
          </>
        )}
        {index === 14 && text('closer', 'ผู้ปิดเรื่อง', closer, setCloser)}
        {index === 7 ? (
          <Field
            label="รายละเอียดการแสวงหา"
            htmlFor="detail"
            error={errors.detail}
          >
            <textarea
              id="detail"
              name="detail"
              autoComplete="off"
              rows={4}
              data-autofocus
              className={inputClass(errors.detail)}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              {...fieldAria('detail', errors.detail)}
            />
          </Field>
        ) : (
          (DATE_STEPS.includes(index) || index === 14) && (
            <Field label="รายละเอียด" htmlFor="detail">
              <textarea
                id="detail"
                name="detail"
                autoComplete="off"
                rows={3}
                className="input-field"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
              />
            </Field>
          )
        )}
      </div>
    </Modal>
  );
}
