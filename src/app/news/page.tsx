'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import toast from 'react-hot-toast';
import { IconPencil, IconPin, IconPlus } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { FilterChips } from '@/components/prototype/FilterChips';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/format';
import { useQueryState } from '@/lib/useQueryState';
import {
  news as seed,
  newsCategories,
  todayLocal,
  type NewsItem,
} from '@/mock/prototype/content';
import { NewsModal, type NewsDraft } from './NewsModal';

const CATS = ['all', ...newsCategories];

function NewsList() {
  const { user } = useAuth();
  const [cat, setCat] = useQueryState<string>('cat', 'all', CATS);
  const [items, setItems] = useState<NewsItem[]>(seed);
  // null = ปิด, 'new' = เพิ่ม, NewsItem = แก้ไข
  const [editing, setEditing] = useState<NewsItem | 'new' | null>(null);
  if (!user) return <AdminLayout title="ข่าวประชาสัมพันธ์">{null}</AdminLayout>;
  const canEdit = user.role === 'admin' || user.role === 'superadmin';

  const sorted = items
    .filter((n) => cat === 'all' || n.category === cat)
    .sort(
      (a, b) =>
        Number(!!b.pinned) - Number(!!a.pinned) ||
        b.publishedAt.localeCompare(a.publishedAt),
    );
  const options = CATS.map((k) => ({
    key: k,
    label: k === 'all' ? 'ทั้งหมด' : k,
  }));

  const save = (d: NewsDraft) => {
    const body = d.body.split(/\n\s*\n/).map((p) => p.trim());
    if (editing === 'new') {
      const id = String(Math.max(0, ...items.map((n) => Number(n.id))) + 1);
      setItems((xs) => [
        ...xs,
        {
          id,
          title: d.title,
          category: d.category,
          summary: d.summary,
          body,
          pinned: d.pinned,
          publishedAt: todayLocal(),
        },
      ]);
      toast.success('เพิ่มข่าวแล้ว');
    } else if (editing) {
      const id = editing.id;
      setItems((xs) =>
        xs.map((n) =>
          n.id === id
            ? {
                ...n,
                title: d.title,
                category: d.category,
                summary: d.summary,
                body,
                pinned: d.pinned,
              }
            : n,
        ),
      );
      toast.success('บันทึกการแก้ไขข่าวแล้ว');
    }
    setEditing(null);
  };

  return (
    <AdminLayout title="ข่าวประชาสัมพันธ์">
      <PrototypeBadge />
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            ข่าวประชาสัมพันธ์
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            ประกาศ กิจกรรม และการอบรมของสำนักงาน
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            className="btn-primary gap-2"
            onClick={() => setEditing('new')}
          >
            <IconPlus aria-hidden="true" size={18} stroke={1.75} />
            เพิ่มข่าว
          </button>
        )}
      </div>

      <div className="mb-5">
        <FilterChips
          label="หมวดข่าว"
          options={options}
          value={cat}
          onChange={setCat}
        />
      </div>

      {sorted.length === 0 ? (
        <div className="card text-center py-12">
          <p className="font-semibold">ยังไม่มีข่าวในหมวดนี้</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((n, i) => (
            <li
              key={n.id}
              className="card animate-stagger"
              style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="flex flex-wrap items-center gap-x-2 text-xs"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    {n.pinned && (
                      <span
                        className="inline-flex items-center gap-1 font-semibold"
                        style={{ color: 'var(--warn)' }}
                      >
                        <IconPin aria-hidden="true" size={14} />
                        ปักหมุด
                      </span>
                    )}
                    <span className="tabular-nums">
                      {formatDate(n.publishedAt)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{n.category}</span>
                  </p>
                  <h3 className="font-bold mt-1 break-words">
                    <Link
                      href={`/news/${n.id}`}
                      className="underline-offset-2 hover:underline"
                      style={{ color: 'var(--accent)' }}
                    >
                      {n.title}
                    </Link>
                  </h3>
                  <p className="text-sm mt-1 break-words">{n.summary}</p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    className="btn-secondary gap-1.5 shrink-0"
                    onClick={() => setEditing(n)}
                    aria-label={`แก้ไขข่าว ${n.title}`}
                  >
                    <IconPencil aria-hidden="true" size={16} />
                    แก้ไข
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <NewsModal
          initial={editing === 'new' ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </AdminLayout>
  );
}

export default function NewsPage() {
  return (
    <Suspense>
      <NewsList />
    </Suspense>
  );
}
