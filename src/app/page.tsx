'use client';

import {
  IconBuildingStore,
  IconCertificate,
  IconFileCertificate,
  IconMessageReport,
} from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { PharmacyHome } from '@/components/home/PharmacyHome';
import { useAuth } from '@/contexts/AuthContext';
import { roleLabels } from '@/mock';

// ตัวเลขยังเป็นค่าตัวอย่างสำหรับ role อื่นนอกจากร้านยา — F2 เป็นต้นไปจะดึงจาก lib/api.ts ตาม role
const stats = [
  { label: 'ร้านยาทั้งหมด', value: '12', icon: IconBuildingStore },
  { label: 'รับรองแล้ว', value: '6', icon: IconCertificate },
  { label: 'คำขอที่กำลังดำเนินการ', value: '5', icon: IconFileCertificate },
  { label: 'ข้อร้องเรียนที่ยังไม่ปิด', value: '2', icon: IconMessageReport },
];

const sampleRows = [
  {
    no: 'NEW-6900012',
    shop: 'ร้านยาเภสัชรักษ์',
    province: 'นนทบุรี',
    status: ['badge-info', 'ตรวจสอบเอกสาร'],
  },
  {
    no: 'REN-6900007',
    shop: 'ร้านยาสุขภาพดี สาขาบางนา',
    province: 'กรุงเทพมหานคร',
    status: ['badge-warning', 'รอผู้ประเมินตรวจสอบ'],
  },
  {
    no: 'NEW-6900001',
    shop: 'ร้านยาบ้านหมอยา',
    province: 'กรุงเทพมหานคร',
    status: ['badge-success', 'ผ่านการรับรอง'],
  },
  {
    no: 'REN-6900005',
    shop: 'ร้านยาสุราษฎร์การแพทย์',
    province: 'สุราษฎร์ธานี',
    status: ['badge-error', 'ไม่ผ่านการรับรอง'],
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AdminLayout title="หน้าหลัก">
      <div className="mb-8">
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          {user && roleLabels[user.role]} · {user?.org}
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight mt-1">
          สวัสดี {user?.name}
        </h2>
      </div>

      {user?.role === 'pharmacy' && user.pharmacyId ? (
        <PharmacyHome pharmacyId={user.pharmacyId} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <div
                  className="stat-icon"
                  style={{
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  <s.icon size={22} stroke={1.5} />
                </div>
                <div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card mt-6 !p-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
              <h3 className="font-bold tracking-tight">คำขอล่าสุด</h3>
              <div className="flex gap-2">
                <button className="btn-secondary">ดูทั้งหมด</button>
                <button className="btn-primary">ยื่นคำขอใหม่</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>เลขที่คำขอ</th>
                    <th>ร้านยา</th>
                    <th>จังหวัด</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((r) => (
                    <tr key={r.no}>
                      <td className="font-mono !text-zinc-800">{r.no}</td>
                      <td className="!text-zinc-800 font-medium">{r.shop}</td>
                      <td>{r.province}</td>
                      <td>
                        <span className={`badge ${r.status[0]}`}>
                          {r.status[1]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
