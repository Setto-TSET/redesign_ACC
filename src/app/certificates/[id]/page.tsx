'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IconPrinter } from '@tabler/icons-react';
import { CertificateSheet } from '@/components/cert/CertificateSheet';
import { AdminLayout } from '@/components/layout';
import { api } from '@/lib/api';
import type { Pharmacy } from '@/types/api';

export default function CertificatePage() {
  const { id } = useParams<{ id: string }>();
  // undefined = กำลังโหลด, null = ไม่พบหรือยังไม่มีใบรับรอง
  const [shop, setShop] = useState<Pharmacy | null | undefined>();

  useEffect(() => {
    api.pharmacies
      .get(Number(id))
      .then((p) => setShop(p?.qualityNo ? p : null))
      .catch(() => setShop(null));
  }, [id]);

  return (
    <AdminLayout title="ใบรับรอง">
      <div className="max-w-4xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/certificates"
            className="text-sm font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            ← กลับไปรายการใบรับรอง
          </Link>
          {shop && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => window.print()}
            >
              <IconPrinter size={16} /> พิมพ์ใบรับรอง
            </button>
          )}
        </div>
        {shop === null && (
          <div className="card text-center py-12">
            <p className="font-semibold">ร้านนี้ยังไม่มีใบรับรอง</p>
          </div>
        )}
        {shop && <CertificateSheet shop={shop} />}
      </div>
    </AdminLayout>
  );
}
