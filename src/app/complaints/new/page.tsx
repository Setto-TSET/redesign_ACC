'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Field, fieldAria, inputClass } from '@/components/common/Field';
import { AdminLayout } from '@/components/layout';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { useAuth } from '@/contexts/AuthContext';
import {
  channels,
  complaints,
  services,
  severities,
  standards,
} from '@/mock/prototype/complaints';
import { protoPharmacies } from '@/mock/prototype/pharmacies';

type Errors = Partial<
  Record<
    'channel' | 'name' | 'contact' | 'shop' | 'issue' | 'severity' | 'detail',
    string
  >
>;

const legend = 'text-sm font-bold mb-3';

function NewComplaintForm({ defaultReceiver }: { defaultReceiver: string }) {
  const router = useRouter();
  const [channel, setChannel] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [shopQ, setShopQ] = useState('');
  const [shopId, setShopId] = useState<number | null>(null);
  const [manual, setManual] = useState(false);
  const [shopText, setShopText] = useState('');
  const [receiver, setReceiver] = useState(defaultReceiver);
  const [picked, setPicked] = useState<string[]>([]);
  const [service, setService] = useState(services[0]);
  const [issue, setIssue] = useState('');
  const [severity, setSeverity] = useState('');
  const [detail, setDetail] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});

  const term = shopQ.trim().toLowerCase();
  const results = term
    ? protoPharmacies
        .filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.province.toLowerCase().includes(term),
        )
        .slice(0, 8)
    : [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Errors = {};
    if (!channel) err.channel = 'เลือกช่องทางการแจ้งเรื่อง';
    if (!name.trim()) err.name = 'กรอกชื่อผู้ร้องเรียน';
    if (!contact.trim()) err.contact = 'กรอกข้อมูลติดต่อผู้ร้องเรียน';
    if (manual ? !shopText.trim() : shopId === null)
      err.shop = manual
        ? 'ระบุชื่อร้านหรือที่อยู่'
        : 'ค้นหาและเลือกร้านที่ถูกร้องเรียน หรือเลือก "ไม่อยู่ในรายชื่อ"';
    if (!issue.trim()) err.issue = 'กรอกประเด็นปัญหา';
    if (!severity) err.severity = 'เลือกระดับความรุนแรง';
    if (!detail.trim()) err.detail = 'กรอกรายละเอียด';
    setErrors(err);

    const order: [keyof Errors, string][] = [
      ['channel', 'channel'],
      ['name', 'cname'],
      ['contact', 'ccontact'],
      ['shop', manual ? 'shop-text' : 'shop-q'],
      ['issue', 'issue'],
      ['severity', 'severity-0'],
      ['detail', 'detail'],
    ];
    const first = order.find(([k]) => err[k]);
    if (first) {
      requestAnimationFrame(() => document.getElementById(first[1])?.focus());
      return;
    }
    toast.success(
      `รับเรื่องแล้ว เลขที่ ร.2569/${String(complaints.length + 1).padStart(3, '0')} (ต้นแบบ)`,
    );
    router.push('/complaints');
  };

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl space-y-6">
      <fieldset className="card space-y-4">
        <legend className={legend}>1. ช่องทางการแจ้งเรื่อง</legend>
        <Field label="ช่องทาง" htmlFor="channel" error={errors.channel}>
          <select
            id="channel"
            name="channel"
            autoComplete="off"
            className={inputClass(errors.channel)}
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            {...fieldAria('channel', errors.channel)}
          >
            <option value="">เลือกช่องทาง</option>
            {channels.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset className="card space-y-4">
        <legend className={legend}>2. ผู้ร้องเรียน</legend>
        <Field label="ชื่อ" htmlFor="cname" error={errors.name}>
          <input
            id="cname"
            name="complainant-name"
            autoComplete="name"
            className={inputClass(errors.name)}
            value={name}
            onChange={(e) => setName(e.target.value)}
            {...fieldAria('cname', errors.name)}
          />
        </Field>
        <Field label="ช่องทางติดต่อ" htmlFor="ccontact" error={errors.contact}>
          <input
            id="ccontact"
            name="complainant-contact"
            autoComplete="off"
            className={inputClass(errors.contact)}
            placeholder="081-234-5678 หรือ name@example.com…"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            {...fieldAria('ccontact', errors.contact)}
          />
        </Field>
      </fieldset>

      <fieldset className="card space-y-4">
        <legend className={legend}>3. ร้านที่ถูกร้องเรียน</legend>
        {!manual && (
          <>
            <Field label="ค้นหาร้าน" htmlFor="shop-q">
              <input
                id="shop-q"
                type="search"
                name="shop-q"
                autoComplete="off"
                spellCheck={false}
                className={inputClass(errors.shop)}
                placeholder="ชื่อร้านหรือจังหวัด…"
                value={shopQ}
                onChange={(e) => setShopQ(e.target.value)}
                aria-invalid={!!errors.shop}
                aria-describedby={errors.shop ? 'shop-error' : undefined}
              />
            </Field>
            {term && (
              <div className="space-y-1">
                {results.length === 0 ? (
                  <p
                    className="text-sm"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    ไม่พบร้านที่ตรงกับคำค้น
                  </p>
                ) : (
                  <div role="radiogroup" aria-label="ผลการค้นหาร้าน">
                    {results.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 text-sm py-1.5"
                      >
                        <input
                          type="radio"
                          name="pharmacyId"
                          autoComplete="off"
                          checked={shopId === p.id}
                          onChange={() => setShopId(p.id)}
                        />
                        {p.name}
                        <span style={{ color: 'var(--ink-secondary)' }}>
                          · {p.province}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="manual"
            autoComplete="off"
            checked={manual}
            onChange={(e) => setManual(e.target.checked)}
          />
          ไม่อยู่ในรายชื่อ ระบุเอง
        </label>
        {manual && (
          <Field label="ชื่อร้านหรือที่อยู่" htmlFor="shop-text">
            <input
              id="shop-text"
              name="shop-text"
              autoComplete="off"
              className={inputClass(errors.shop)}
              value={shopText}
              onChange={(e) => setShopText(e.target.value)}
              aria-invalid={!!errors.shop}
              aria-describedby={errors.shop ? 'shop-error' : undefined}
            />
          </Field>
        )}
        {errors.shop && (
          <p
            id="shop-error"
            role="alert"
            className="text-xs"
            style={{ color: 'var(--danger)' }}
          >
            {errors.shop}
          </p>
        )}
      </fieldset>

      <fieldset className="card space-y-4">
        <legend className={legend}>4. รายละเอียดเรื่อง</legend>
        <Field label="ผู้รับเรื่อง" htmlFor="receiver">
          <input
            id="receiver"
            name="receiver"
            autoComplete="off"
            className="input-field"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
          />
        </Field>
        <div role="group" aria-labelledby="std-label">
          <p
            id="std-label"
            className="block text-[13px] font-semibold text-zinc-700 mb-1.5"
          >
            มาตรฐานที่เกี่ยวข้อง
          </p>
          {standards.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm py-1">
              <input
                type="checkbox"
                name="standards"
                autoComplete="off"
                value={s}
                checked={picked.includes(s)}
                onChange={(e) =>
                  setPicked((p) =>
                    e.target.checked ? [...p, s] : p.filter((x) => x !== s),
                  )
                }
              />
              {s}
            </label>
          ))}
        </div>
        <Field label="บริการที่เกี่ยวข้อง" htmlFor="service">
          <select
            id="service"
            name="service"
            autoComplete="off"
            className="input-field"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            {services.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="ประเด็นปัญหา" htmlFor="issue" error={errors.issue}>
          <input
            id="issue"
            name="issue"
            autoComplete="off"
            className={inputClass(errors.issue)}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            {...fieldAria('issue', errors.issue)}
          />
        </Field>
        <div>
          <fieldset>
            <legend className="text-[13px] font-semibold text-zinc-700 mb-1.5">
              ความรุนแรง
            </legend>
            <div className="flex flex-wrap gap-6">
              {severities.map((s, i) => (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <input
                    id={`severity-${i}`}
                    type="radio"
                    name="severity"
                    autoComplete="off"
                    checked={severity === s}
                    onChange={() => setSeverity(s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </fieldset>
          {errors.severity && (
            <p
              role="alert"
              className="mt-1 text-xs"
              style={{ color: 'var(--danger)' }}
            >
              {errors.severity}
            </p>
          )}
        </div>
        <Field label="รายละเอียด" htmlFor="detail" error={errors.detail}>
          <textarea
            id="detail"
            name="detail"
            autoComplete="off"
            rows={4}
            className={inputClass(errors.detail)}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            {...fieldAria('detail', errors.detail)}
          />
        </Field>
        <Field label="รูปหลักฐาน (ไม่บังคับ)" htmlFor="photos">
          <input
            id="photos"
            type="file"
            name="photos"
            autoComplete="off"
            accept="image/*"
            multiple
            className="input-field"
            onChange={(e) =>
              setFiles([...(e.target.files ?? [])].map((f) => f.name))
            }
          />
          {files.length > 0 && (
            <ul className="mt-2 text-xs list-disc pl-5">
              {files.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </Field>
      </fieldset>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push('/complaints')}
        >
          ยกเลิก
        </button>
        <button type="submit" className="btn-primary">
          บันทึกรับเรื่อง
        </button>
      </div>
    </form>
  );
}

export default function NewComplaintPage() {
  const { user } = useAuth();
  return (
    <AdminLayout title="รับเรื่องร้องเรียน">
      <PrototypeBadge />
      <h2 className="text-2xl font-extrabold tracking-tight mb-6">
        รับเรื่องร้องเรียนใหม่
      </h2>
      {user && <NewComplaintForm defaultReceiver={user.name} />}
    </AdminLayout>
  );
}
