'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { AdminLayout } from '@/components/layout';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateLong } from '@/lib/format';
import { news } from '@/mock/prototype/content';

function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  if (!user) return <AdminLayout title="ข่าวประชาสัมพันธ์">{null}</AdminLayout>;
  const item = news.find((n) => n.id === id);

  if (!item)
    return (
      <AdminLayout title="ข่าวประชาสัมพันธ์">
        <PrototypeBadge />
        <div className="card text-center py-12">
          <p className="font-semibold">ไม่พบข่าวนี้</p>
          <Link href="/news" className="btn-secondary mt-6">
            กลับไปข่าวทั้งหมด
          </Link>
        </div>
      </AdminLayout>
    );

  const related = news
    .filter((n) => n.category === item.category && n.id !== item.id)
    .slice(0, 3);

  return (
    <AdminLayout title="ข่าวประชาสัมพันธ์">
      <PrototypeBadge />
      <Link
        href="/news"
        className="inline-flex items-center min-h-10 sm:min-h-0 text-sm font-semibold underline-offset-2 hover:underline"
        style={{ color: 'var(--accent)' }}
      >
        ← ข่าวทั้งหมด
      </Link>
      <article className="card mt-4">
        <h2 className="text-2xl font-extrabold tracking-tight break-words">
          {item.title}
        </h2>
        <p
          className="mt-2 text-sm flex flex-wrap gap-x-2"
          style={{ color: 'var(--ink-secondary)' }}
        >
          <span className="tabular-nums">
            {formatDateLong(item.publishedAt)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{item.category}</span>
        </p>
        <div className="mt-5 max-w-prose space-y-4 break-words leading-relaxed">
          {item.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-8" aria-labelledby="related-news">
          <h3 id="related-news" className="font-bold mb-3">
            ข่าวอื่นในหมวด {item.category}
          </h3>
          <ul className="space-y-2">
            {related.map((n, i) => (
              <li
                key={n.id}
                className="card animate-stagger"
                style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
              >
                <Link
                  href={`/news/${n.id}`}
                  className="font-semibold break-words underline-offset-2 hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  {n.title}
                </Link>
                <p
                  className="text-xs mt-1 tabular-nums"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  {formatDate(n.publishedAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AdminLayout>
  );
}

export default function NewsDetailPage() {
  return (
    <Suspense>
      <NewsDetail />
    </Suspense>
  );
}
