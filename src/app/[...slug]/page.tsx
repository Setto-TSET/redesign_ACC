'use client';

import Link from 'next/link';
import { IconTools } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';

// ponytail: หน้าเดียวรับทุกเมนูที่ยังไม่ได้ทำ (ขั้นที่ 2–3) — ลบทิ้งเมื่อทุกหน้ามีไฟล์ของตัวเองแล้ว
export default function ComingSoonPage() {
  return (
    <AdminLayout title="กำลังพัฒนา">
      <div className="card flex flex-col items-center text-center py-16">
        <span
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          <IconTools aria-hidden="true" size={26} stroke={1.5} />
        </span>
        <h2 className="mt-4 text-lg font-bold">
          หน้านี้อยู่ในขั้นที่ 2–3 ของแผน PoC
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--ink-secondary)' }}>
          ขั้นที่ 1 ทำ design system, layout, เมนูตาม role และหน้า login
        </p>
        <Link href="/" className="btn-secondary mt-6">
          กลับหน้าหลัก
        </Link>
      </div>
    </AdminLayout>
  );
}
