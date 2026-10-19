'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  IconAlertTriangle,
  IconCamera,
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from '@tabler/icons-react';
import { Field } from '@/components/common/Field';
import { AdminLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { visitMethodLabels } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { gppSections } from '@/lib/gppItems';
import { GPP_PASS_PERCENT, scoreGpp } from '@/lib/gppRules';
import { actionsFor, canSelfAssess } from '@/lib/requestRules';
import type {
  AccRequest,
  GppAnswer,
  GppAssessment,
  GppItem,
  Pharmacy,
} from '@/types/api';

const levelLabels: Record<number, string> = {
  0: 'ปรับปรุง',
  1: 'พอใช้',
  2: 'ดี',
};
const MAX_PHOTOS = 4;
const empty: GppAssessment = { answers: {}, summary: '', internalNote: '' };

export default function AssessPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  // undefined = กำลังโหลด, null = ไม่พบหรือไม่มีสิทธิ์
  const [req, setReq] = useState<AccRequest | null | undefined>();
  const [shop, setShop] = useState<Pharmacy | null>(null);
  const [draft, setDraft] = useState<GppAssessment>(empty);
  const [section, setSection] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  // ร้านยาใช้หน้านี้ประเมินตนเอง ผู้ตรวจใช้บันทึกผลจริง — ร่างแยกกัน
  const isSelf = user?.role === 'pharmacy';
  const draftKey = isSelf ? `${id}-self` : id;
  const title = isSelf ? 'ประเมินตนเอง GPP' : 'ประเมิน GPP';

  useEffect(() => {
    if (!user) return;
    api.requests
      .get(id, user)
      .then((r) => {
        setReq(r);
        setDraft(
          api.assessmentDrafts.load(draftKey) ??
            (isSelf ? r?.selfAssessment : undefined) ??
            empty,
        );
        if (r) return api.pharmacies.get(r.pharmacyId).then(setShop);
      })
      .catch(() => {
        toast.error('โหลดคำขอไม่สำเร็จ');
        setReq(null);
      });
  }, [id, user, draftKey, isSelf]);

  if (!user || req === undefined)
    return <AdminLayout title={title}>{null}</AdminLayout>;

  const allowed =
    req &&
    (isSelf
      ? canSelfAssess(req, user)
      : actionsFor(req.status, user.role).includes('submit_assessment'));
  if (!req || !allowed)
    return (
      <AdminLayout title={title}>
        <div className="card text-center py-12">
          <p className="font-semibold">ประเมินคำขอนี้ไม่ได้</p>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            คำขอไม่ได้มอบหมายให้คุณ หรือส่งผลประเมินไปแล้ว
          </p>
          <Link href={`/requests/${id}`} className="btn-secondary mt-6">
            กลับไปรายละเอียดคำขอ
          </Link>
        </div>
      </AdminLayout>
    );

  const score = scoreGpp(gppSections, draft.answers);
  const current = gppSections[section];
  const isLast = section === gppSections.length - 1;

  const update = (next: GppAssessment) => {
    setDraft(next);
    api.assessmentDrafts.save(draftKey, next);
  };
  const setAnswer = (itemId: string, patch: Partial<GppAnswer>) => {
    const prev = draft.answers[itemId];
    update({
      ...draft,
      answers: {
        ...draft.answers,
        [itemId]: { ...prev, ...patch },
      },
    });
  };

  const goTo = (i: number) => {
    setSection(i);
    window.scrollTo({ top: 0 });
  };

  const trySubmit = () => {
    if (score.missing.length) {
      const first = score.missing[0];
      toast.error(
        `ยังไม่ได้ประเมิน ${score.missing.length} ข้อ (เริ่มที่ข้อ ${first})`,
      );
      goTo(gppSections.findIndex((s) => s.items.some((i) => i.id === first)));
      return;
    }
    if (isSelf) return saveSelf();
    setConfirming(true);
  };

  const saveSelf = async () => {
    const res = await api.requests.saveSelfAssessment(req.id, draft, user);
    if ('error' in res) return toast.error(res.error);
    api.assessmentDrafts.clear(draftKey);
    toast.success('บันทึกผลประเมินตนเองแล้ว');
    router.push(`/requests/${req.id}`);
  };

  const submit = async () => {
    setBusy(true);
    const res = await api.requests.act(
      req.id,
      'submit_assessment',
      { assessment: draft },
      user,
    );
    setBusy(false);
    if ('error' in res) return toast.error(res.error);
    api.assessmentDrafts.clear(draftKey);
    toast.success('ส่งผลประเมินแล้ว');
    router.push(`/requests/${req.id}`);
  };

  return (
    <AdminLayout title={title}>
      <div className="max-w-4xl space-y-5">
        <Link
          href={`/requests/${req.id}`}
          className="inline-block text-sm font-semibold"
          style={{ color: 'var(--accent)' }}
        >
          ← กลับไปรายละเอียดคำขอ
        </Link>

        {/* สรุปคะแนนสด — ติดบนจอเมื่อเลื่อน */}
        <div className="card sticky top-2 z-10 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-mono text-lg font-bold">{req.no}</h2>
              <p className="text-sm font-medium">{shop?.name}</p>
              {req.visit && (
                <p
                  className="text-xs"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  {visitMethodLabels[req.visit.method]} ·{' '}
                  {formatDate(req.visit.date)}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold leading-none">
                {score.percent.toFixed(2)}%
              </p>
              <p
                className="mt-1 text-xs"
                style={{ color: 'var(--ink-secondary)' }}
              >
                {score.got}/{score.max} คะแนน · เกณฑ์ {GPP_PASS_PERCENT}%
              </p>
            </div>
          </div>
          <div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--border-light)' }}
              role="progressbar"
              aria-valuenow={score.answered}
              aria-valuemax={score.total}
              aria-label="ความคืบหน้า"
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(score.answered / score.total) * 100}%`,
                  background: 'var(--accent)',
                }}
              />
            </div>
            <p
              className="mt-1 text-xs"
              style={{ color: 'var(--ink-secondary)' }}
            >
              ประเมินแล้ว {score.answered}/{score.total} ข้อ ·
              บันทึกร่างอัตโนมัติ
            </p>
          </div>
          {score.criticalFails.length > 0 && (
            <p
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--danger-soft)',
                color: 'var(--danger)',
              }}
            >
              <IconAlertTriangle size={16} className="shrink-0" />
              Critical Defect ได้ 0: ข้อ {score.criticalFails.join(', ')}
            </p>
          )}
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
            {gppSections.map((s, i) => {
              const part = score.sections[i];
              const left = s.items.filter((it) =>
                score.missing.includes(it.id),
              ).length;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === section}
                  onClick={() => goTo(i)}
                  className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={
                    i === section
                      ? {
                          background: 'var(--accent)',
                          borderColor: 'var(--accent)',
                          color: '#fff',
                        }
                      : {
                          borderColor: 'var(--border)',
                          color: 'var(--ink-secondary)',
                        }
                  }
                >
                  หมวด {s.id} · {left ? `เหลือ ${left}` : `${part.percent}%`}
                </button>
              );
            })}
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="text-lg font-bold">
            หมวดที่ {current.id} {current.title}
          </h3>
          {current.items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              answer={draft.answers[item.id]}
              selfLevel={
                isSelf ? undefined : req.selfAssessment?.answers[item.id]?.level
              }
              onChange={(patch) => setAnswer(item.id, patch)}
            />
          ))}
        </section>

        {isLast && !isSelf && (
          <section className="card space-y-4">
            <h3 className="font-bold">สรุปผลการตรวจ</h3>
            <Field
              label="ข้อเสนอแนะถึงร้านยา"
              htmlFor="summary"
              hint="ร้านยาเห็นข้อความนี้"
            >
              <textarea
                id="summary"
                rows={3}
                className="input-field"
                value={draft.summary}
                onChange={(e) => update({ ...draft, summary: e.target.value })}
              />
            </Field>
            <Field
              label="บันทึกภายใน"
              htmlFor="internal"
              hint="เห็นเฉพาะเจ้าหน้าที่ สรร. และผู้ตรวจ"
            >
              <textarea
                id="internal"
                rows={3}
                className="input-field"
                value={draft.internalNote}
                onChange={(e) =>
                  update({ ...draft, internalNote: e.target.value })
                }
              />
            </Field>
          </section>
        )}

        <div className="flex items-center justify-between gap-3 pb-8">
          <button
            type="button"
            className="btn-secondary"
            disabled={section === 0}
            onClick={() => goTo(section - 1)}
          >
            <IconChevronLeft size={16} /> หมวดก่อนหน้า
          </button>
          {isLast ? (
            <button type="button" className="btn-primary" onClick={trySubmit}>
              {isSelf ? 'บันทึกผลประเมินตนเอง' : 'ส่งผลประเมิน'}
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => goTo(section + 1)}
            >
              หมวดถัดไป <IconChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {confirming && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => !busy && setConfirming(false)}
        >
          <div
            className="modal-content max-w-md p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="text-lg font-bold">
              ส่งผลประเมิน GPP
            </h2>
            <p
              className="mt-3 text-sm"
              style={{ color: 'var(--ink-secondary)' }}
            >
              คะแนน {score.percent.toFixed(2)}% ({score.got}/{score.max})
              {score.criticalFails.length > 0 &&
                ` · Critical ได้ 0 จำนวน ${score.criticalFails.length} ข้อ`}
              <br />
              ส่งแล้วแก้ไขไม่ได้ คำขอจะไปรอ สรร. ตรวจสอบ
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={() => setConfirming(false)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                onClick={submit}
              >
                ยืนยันส่งผล
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function ItemCard({
  item,
  answer,
  selfLevel,
  onChange,
}: {
  item: GppItem;
  answer?: GppAnswer;
  /** คะแนนที่ร้านประเมินตนเอง (แสดงให้ผู้ตรวจเทียบ) */
  selfLevel?: number | 'na';
  onChange: (patch: Partial<GppAnswer>) => void;
}) {
  const photos = answer?.photos ?? [];
  const options: (number | 'na')[] = [
    ...item.levels,
    ...(item.canNa ? (['na'] as const) : []),
  ];

  const addPhotos = (files: FileList | null) => {
    if (!files?.length) return;
    const names = [...photos, ...Array.from(files, (f) => f.name)];
    if (names.length > MAX_PHOTOS)
      toast.error(`แนบรูปได้สูงสุด ${MAX_PHOTOS} รูปต่อข้อ`);
    onChange({ photos: names.slice(0, MAX_PHOTOS) });
  };

  return (
    <article className="card space-y-3">
      <div className="flex items-start gap-3">
        <span className="font-mono text-sm font-bold shrink-0">{item.id}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed">{item.text}</p>
          <p
            className="mt-1 flex flex-wrap gap-2 text-xs"
            style={{ color: 'var(--ink-secondary)' }}
          >
            <span>น้ำหนัก {item.weight}</span>
            {item.critical && (
              <span className="badge badge-error">Critical Defect</span>
            )}
            {selfLevel !== undefined && (
              <span className="badge badge-info">
                ร้านประเมิน:{' '}
                {selfLevel === 'na'
                  ? 'ไม่มี'
                  : `${levelLabels[selfLevel]} (${selfLevel})`}
              </span>
            )}
          </p>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label={`ระดับคะแนนข้อ ${item.id}`}
      >
        {options.map((o) => {
          const selected = answer?.level === o;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ level: o })}
              className="min-h-11 rounded-xl border px-4 text-sm font-semibold"
              style={
                selected
                  ? o === 0
                    ? {
                        background: 'var(--danger-soft)',
                        borderColor: 'var(--danger)',
                        color: 'var(--danger)',
                      }
                    : o === 'na'
                      ? {
                          background: 'var(--border-light)',
                          borderColor: 'var(--ink-tertiary)',
                          color: 'var(--ink)',
                        }
                      : {
                          background: 'var(--accent-soft)',
                          borderColor: 'var(--accent)',
                          color: 'var(--accent)',
                        }
                  : {
                      borderColor: 'var(--border)',
                      color: 'var(--ink-secondary)',
                    }
              }
            >
              {o === 'na' ? 'ไม่มี' : `${levelLabels[o]} (${o})`}
            </button>
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
        <input
          className="input-field"
          placeholder="หมายเหตุ (ถ้ามี)"
          aria-label={`หมายเหตุข้อ ${item.id}`}
          value={answer?.remark ?? ''}
          onChange={(e) => onChange({ remark: e.target.value })}
        />
        <label
          className={`btn-secondary cursor-pointer ${photos.length >= MAX_PHOTOS ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <IconCamera size={16} /> แนบรูป ({photos.length}/{MAX_PHOTOS})
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              addPhotos(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      {photos.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <li
              key={`${p}-${i}`}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-xs"
              style={{ background: 'var(--border-light)' }}
            >
              <span className="max-w-40 truncate">{p}</span>
              <button
                type="button"
                aria-label={`ลบรูป ${p}`}
                onClick={() =>
                  onChange({ photos: photos.filter((_, j) => j !== i) })
                }
              >
                <IconX size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
