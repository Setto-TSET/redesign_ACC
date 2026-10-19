'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { IconSearch } from '@tabler/icons-react';
import { CertBadge } from '@/components/common/StatusBadge';
import { AdminLayout } from '@/components/layout';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Pharmacy } from '@/types/api';

/** ร้านที่มีใบรับรอง (แทน PrintCert.aspx) — ใหม่สุดก่อน */
export default function CertificatesPage() {
  const [shops, setShops] = useState<Pharmacy[] | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.pharmacies
      .list()
      .then((list) =>
        setShops(
          list
            .filter((p) => p.qualityNo)
            .sort((a, b) =>
              (b.certIssued ?? '').localeCompare(a.certIssued ?? ''),
            ),
        ),
      )
      .catch(() => toast.error('โหลดรายการใบรับรองไม่สำเร็จ'));
  }, []);

  const term = q.trim();
  const rows = (shops ?? []).filter(
    (p) =>
      !term || [p.name, p.qualityNo, p.province].some((v) => v?.includes(term)),
  );

  return (
    <AdminLayout title="พิมพ์ใบรับรอง">
      <div className="max-w-5xl space-y-5">
        <div className="relative">
          <IconSearch
            aria-hidden="true"
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--ink-tertiary)' }}
          />
          <input
            type="search"
            name="q"
            autoComplete="off"
            className="input-field-search"
            placeholder="ค้นหาชื่อร้าน เลขรับรอง หรือจังหวัด…"
            aria-label="ค้นหาใบรับรอง"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="card !p-0 overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>เลขรับรอง</th>
                <th>ร้านยา</th>
                <th>ให้ไว้</th>
                <th>หมดอายุ</th>
                <th>สถานะ</th>
                <th>
                  <span className="sr-only">การทำงาน</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono font-semibold whitespace-nowrap">
                    {p.qualityNo}
                  </td>
                  <td>
                    {p.name}
                    <span
                      className="block text-xs"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {p.province}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    {formatDate(p.certIssued)}
                  </td>
                  <td className="whitespace-nowrap">
                    {formatDate(p.certExpires)}
                  </td>
                  <td className="whitespace-nowrap">
                    <CertBadge status={p.certStatus} />
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <Link
                      href={`/certificates/${p.id}`}
                      className="btn-secondary"
                    >
                      ดู / พิมพ์
                    </Link>
                  </td>
                </tr>
              ))}
              {shops && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">
                    ไม่พบใบรับรอง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
