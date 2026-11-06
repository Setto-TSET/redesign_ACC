'use client';

import { Suspense, useState } from 'react';
import toast from 'react-hot-toast';
import {
  IconDownload,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypeXls,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { FilterChips } from '@/components/prototype/FilterChips';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/format';
import { useQueryState } from '@/lib/useQueryState';
import {
  docCategories,
  documents as seed,
  todayLocal,
  type DocItem,
} from '@/mock/prototype/content';
import { DocModal, type DocDraft } from './DocModal';

const CATS = ['all', ...docCategories];
const nf = new Intl.NumberFormat('th-TH');
const icons = {
  PDF: IconFileTypePdf,
  DOCX: IconFileTypeDocx,
  XLSX: IconFileTypeXls,
};

function DocumentList() {
  const { user } = useAuth();
  const [cat, setCat] = useQueryState<string>('cat', 'all', CATS);
  const [q, setQ] = useQueryState<string>('q', '');
  const [items, setItems] = useState<DocItem[]>(seed);
  const [editing, setEditing] = useState<DocItem | 'new' | null>(null);
  if (!user) return <AdminLayout title="เอกสารดาวน์โหลด">{null}</AdminLayout>;
  const canEdit = user.role === 'admin' || user.role === 'superadmin';

  const term = q.trim().toLowerCase();
  const byTerm = items.filter(
    (d) => !term || d.title.toLowerCase().includes(term),
  );
  const visible = byTerm.filter((d) => cat === 'all' || d.category === cat);
  const options = CATS.map((k) => ({
    key: k,
    label: k === 'all' ? 'ทั้งหมด' : k,
    count:
      k === 'all'
        ? byTerm.length
        : byTerm.filter((d) => d.category === k).length,
  }));

  const save = (d: DocDraft) => {
    if (editing === 'new' && d.file) {
      const id = String(Math.max(0, ...items.map((x) => Number(x.id))) + 1);
      const file = d.file;
      setItems((xs) => [
        ...xs,
        {
          id,
          title: d.title,
          category: d.category,
          ...file,
          updatedAt: todayLocal(),
        },
      ]);
    } else if (editing && editing !== 'new') {
      const id = editing.id;
      setItems((xs) =>
        xs.map((x) =>
          x.id === id
            ? {
                ...x,
                title: d.title,
                category: d.category,
                ...d.file,
                updatedAt: todayLocal(),
              }
            : x,
        ),
      );
    }
    setEditing(null);
  };

  // ลบทันที + เลิกทำได้ใน toast แทนกล่องยืนยัน (การลบย้อนกลับได้)
  const remove = (d: DocItem) => {
    const at = items.findIndex((x) => x.id === d.id);
    setItems((xs) => xs.filter((x) => x.id !== d.id));
    toast(
      (t) => (
        <span className="flex items-center gap-3">
          ลบ “{d.title}” แล้ว
          <button
            type="button"
            className="-my-2 shrink-0 whitespace-nowrap py-2 font-semibold underline underline-offset-2"
            onClick={() => {
              setItems((xs) =>
                xs.some((x) => x.id === d.id)
                  ? xs
                  : [...xs.slice(0, at), d, ...xs.slice(at)],
              );
              toast.dismiss(t.id);
            }}
          >
            เลิกทำ
          </button>
        </span>
      ),
      { duration: 8000 },
    );
  };

  return (
    <AdminLayout title="เอกสารดาวน์โหลด">
      <PrototypeBadge />
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            ระเบียบ แบบฟอร์ม และคู่มือการใช้งาน
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            className="btn-primary gap-2"
            onClick={() => setEditing('new')}
          >
            <IconPlus aria-hidden="true" size={18} stroke={1.75} />
            เพิ่มเอกสาร
          </button>
        )}
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:p-5 border-b border-slate-100">
          <div className="relative">
            <IconSearch
              aria-hidden="true"
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--ink-tertiary)' }}
            />
            <input
              type="search"
              name="q"
              autoComplete="off"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input-field !pl-10"
              placeholder="ค้นหาชื่อเอกสาร…"
              aria-label="ค้นหาเอกสาร"
            />
          </div>
          <FilterChips
            label="หมวดเอกสาร"
            options={options}
            value={cat}
            onChange={setCat}
          />
        </div>

        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold">ไม่พบเอกสารที่ตรงกับตัวกรอง</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((d, i) => {
              const Icon = icons[d.fileType];
              return (
                <li
                  key={d.id}
                  className="animate-stagger flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5"
                  style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                >
                  <Icon
                    aria-hidden="true"
                    size={28}
                    stroke={1.5}
                    className="shrink-0"
                    style={{ color: 'var(--accent)' }}
                  />
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="font-semibold break-words">{d.title}</p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {d.category} · {d.fileType} ·{' '}
                      <span className="tabular-nums">
                        {nf.format(d.sizeKb)} KB
                      </span>{' '}
                      · ปรับปรุง{' '}
                      <span className="tabular-nums">
                        {formatDate(d.updatedAt)}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary gap-1.5"
                      aria-label={`ดาวน์โหลด ${d.title}`}
                      onClick={() =>
                        toast(
                          `ต้นแบบ: ระบบจริงจะดาวน์โหลดไฟล์ ${d.title}.${d.fileType.toLowerCase()}`,
                        )
                      }
                    >
                      <IconDownload aria-hidden="true" size={16} />
                      ดาวน์โหลด
                    </button>
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          className="btn-secondary gap-1.5"
                          aria-label={`แก้ไข ${d.title}`}
                          onClick={() => setEditing(d)}
                        >
                          <IconPencil aria-hidden="true" size={16} />
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          className="btn-secondary gap-1.5"
                          aria-label={`ลบ ${d.title}`}
                          onClick={() => remove(d)}
                          style={{ color: 'var(--danger)' }}
                        >
                          <IconTrash aria-hidden="true" size={16} />
                          ลบ
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && (
        <DocModal
          initial={editing === 'new' ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </AdminLayout>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense>
      <DocumentList />
    </Suspense>
  );
}
