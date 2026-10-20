'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { IconMessageCircle } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { roleLabels } from '@/mock';
import { formatDateTime } from '@/lib/format';
import { focusFirstError } from '@/lib/a11y';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { Modal } from '@/components/prototype/Modal';
import { Tabs } from '@/components/prototype/Tabs';
import {
  feedbackKinds,
  toCsv,
  type FeedbackEntry,
  type FeedbackKind,
} from './csv';
import {
  FEEDBACK_KEY,
  loadFeedback,
  loadName,
  saveFeedback,
  saveName,
} from './store';

type Tab = 'new' | 'sent';
type Errors = { kind?: string; message?: string };

const download = (list: FeedbackEntry[]) => {
  const blob = new Blob([toCsv(list)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `accpharm-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  // คืน URL หลังเบราว์เซอร์เริ่มดาวน์โหลดแล้ว
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

/** ปุ่มลอยเก็บข้อเสนอแนะจากผู้ทดสอบ — เก็บใน localStorage แล้วดาวน์โหลดเป็น CSV */
export function FeedbackButton() {
  const { user } = useAuth();
  const roleName = user ? roleLabels[user.role] : 'ยังไม่เข้าสู่ระบบ';

  const [list, setList] = useState<FeedbackEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('new');
  const [pageName, setPageName] = useState('');
  // draft อยู่ที่นี่ เพราะ Tabs remount panel ตอนสลับแท็บ
  const [kind, setKind] = useState<FeedbackKind | ''>('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // โหลดหลัง mount เพื่อเลี่ยง hydration mismatch (localStorage มีเฉพาะฝั่ง client)
    /* eslint-disable react-hooks/set-state-in-effect */
    setList(loadFeedback());
    setName(loadName());
    /* eslint-enable react-hooks/set-state-in-effect */
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === FEEDBACK_KEY) setList(loadFeedback());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const openModal = () => {
    setPageName(
      document.querySelector('h1')?.textContent?.trim() || document.title,
    );
    setTab('new');
    setErrors({});
    setOpen(true);
  };

  const close = useCallback(() => {
    if (message.trim() && !window.confirm('ทิ้งข้อความที่พิมพ์ไว้?')) return;
    setMessage('');
    setKind('');
    setErrors({});
    setOpen(false);
  }, [message]);

  const submit = () => {
    const next: Errors = {};
    if (!kind) next.kind = 'เลือกประเภท';
    if (!message.trim()) next.message = 'กรอกข้อความ';
    setErrors(next);
    if (!kind || next.message) {
      focusFirstError(boxRef.current);
      return;
    }
    const entry: FeedbackEntry = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      page: pageName,
      path: location.pathname + location.search,
      role: roleName,
      kind,
      message: message.trim(),
      name: name.trim(),
    };
    const nextList = [entry, ...list];
    if (!saveFeedback(nextList)) {
      toast.error('บันทึกไม่ได้ เบราว์เซอร์ไม่อนุญาตให้เก็บข้อมูล');
      return;
    }
    setList(nextList);
    saveName(name);
    toast.success('บันทึกข้อเสนอแนะแล้ว ขอบคุณ');
    setKind('');
    setMessage('');
    setErrors({});
    setOpen(false);
  };

  const remove = (e: FeedbackEntry) => {
    if (!window.confirm('ลบข้อเสนอแนะนี้?')) return;
    const nextList = list.filter((x) => x.id !== e.id);
    if (saveFeedback(nextList)) setList(nextList);
    else toast.error('ลบไม่ได้ เบราว์เซอร์ไม่อนุญาตให้เก็บข้อมูล');
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="ส่งข้อเสนอแนะ"
        className="btn-primary rounded-full shadow-lg fixed bottom-5 right-5 z-30 print:hidden !px-3 sm:!px-4"
      >
        <IconMessageCircle aria-hidden="true" size={20} />
        <span className="hidden sm:inline">ข้อเสนอแนะ</span>
        {list.length > 0 && (
          <span className="tabular-nums text-xs font-bold bg-white/25 rounded-full px-1.5">
            {list.length}
          </span>
        )}
      </button>

      {open && (
        <Modal title="ส่งข้อเสนอแนะ" size="lg" onClose={close}>
          <div ref={boxRef}>
            <Tabs
              label="ข้อเสนอแนะ"
              value={tab}
              onChange={setTab}
              tabs={[
                { key: 'new', label: 'เขียนใหม่' },
                { key: 'sent', label: 'ที่ส่งไว้', count: list.length },
              ]}
            >
              {tab === 'new' ? (
                <form
                  noValidate
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                >
                  <p className="text-xs text-zinc-500">
                    หน้า: {pageName} · {roleName}
                  </p>
                  <fieldset
                    aria-describedby={errors.kind ? 'fb-kind-error' : undefined}
                  >
                    <legend className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                      ประเภท
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(Object.keys(feedbackKinds) as FeedbackKind[]).map(
                        (k, i) => (
                          <label
                            key={k}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="radio"
                              name="feedbackKind"
                              value={k}
                              checked={kind === k}
                              onChange={() => {
                                setKind(k);
                                setErrors((x) => ({ ...x, kind: undefined }));
                              }}
                              aria-invalid={i === 0 ? !!errors.kind : undefined}
                            />
                            {feedbackKinds[k]}
                          </label>
                        ),
                      )}
                    </div>
                    {errors.kind && (
                      <p
                        id="fb-kind-error"
                        role="alert"
                        className="mt-1 text-xs"
                        style={{ color: 'var(--danger)' }}
                      >
                        {errors.kind}
                      </p>
                    )}
                  </fieldset>
                  <Field
                    label="ข้อความ"
                    htmlFor="fb-message"
                    error={errors.message}
                  >
                    <textarea
                      id="fb-message"
                      data-autofocus
                      rows={5}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        setErrors((x) => ({ ...x, message: undefined }));
                      }}
                      className={inputClass(errors.message)}
                      {...fieldAria('fb-message', errors.message)}
                    />
                  </Field>
                  <Field label="ชื่อ (ไม่บังคับ)" htmlFor="fb-name">
                    <input
                      id="fb-name"
                      name="feedbackName"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass()}
                    />
                  </Field>
                  <div className="flex justify-end">
                    <button type="submit" className="btn-primary">
                      บันทึก
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={list.length === 0}
                    onClick={() => download(list)}
                  >
                    ดาวน์โหลดทั้งหมด (.csv)
                  </button>
                  {list.length === 0 ? (
                    <p className="text-sm text-zinc-500">ยังไม่มีข้อเสนอแนะ</p>
                  ) : (
                    <ul className="divide-y divide-zinc-100">
                      {list.map((e) => (
                        <li key={e.id} className="py-3 space-y-1 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold">
                              {feedbackKinds[e.kind]}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {formatDateTime(e.at)}
                            </span>
                            <button
                              type="button"
                              onClick={() => remove(e)}
                              aria-label={`ลบข้อเสนอแนะ ${formatDateTime(e.at)}`}
                              className="ml-auto text-xs font-semibold"
                              style={{ color: 'var(--danger)' }}
                            >
                              ลบ
                            </button>
                          </div>
                          <p className="text-xs text-zinc-500 break-words">
                            {e.page} · {e.path} · {e.role}
                          </p>
                          <p className="whitespace-pre-wrap break-words">
                            {e.message}
                          </p>
                          {e.name && (
                            <p className="text-xs text-zinc-500 break-words">
                              โดย {e.name}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Tabs>
          </div>
        </Modal>
      )}
    </>
  );
}
