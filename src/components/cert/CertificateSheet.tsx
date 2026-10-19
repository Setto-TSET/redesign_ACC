import { formatDateLong } from '@/lib/format';
import type { Pharmacy } from '@/types/api';

/**
 * หน้าตาใบรับรองสำหรับดูตัวอย่างและพิมพ์ (A4 แนวนอน)
 * ponytail: layout ประมาณจาก ReportViewer เดิม — รอแบบใบรับรองจริงจาก สรร.
 */
export function CertificateSheet({ shop }: { shop: Pharmacy }) {
  return (
    <div
      className="print-area relative mx-auto py-8 sm:aspect-[297/210] sm:py-0 w-full max-w-4xl overflow-hidden bg-white text-center"
      style={{ border: '10px double var(--accent)', color: 'var(--ink)' }}
    >
      <div className="flex h-full flex-col items-center justify-center gap-[2.2%] px-[8%]">
        <p
          className="text-[clamp(10px,1.6vw,15px)] font-semibold tracking-wide"
          style={{ color: 'var(--accent)' }}
        >
          สภาเภสัชกรรม
        </p>
        <h2 className="text-[clamp(18px,3.4vw,34px)] font-extrabold">
          ใบรับรองร้านยาคุณภาพ
        </h2>
        <p className="text-[clamp(10px,1.5vw,14px)]">ให้ไว้เพื่อแสดงว่า</p>
        <p className="text-[clamp(16px,2.8vw,28px)] font-bold">{shop.name}</p>
        <p className="max-w-[80%] text-[clamp(9px,1.3vw,13px)]">
          {shop.address} จ.{shop.province}
          <br />
          ใบอนุญาตขายยา {shop.licenseNo} · ผู้รับอนุญาต {shop.licensee}
        </p>
        <p className="text-[clamp(10px,1.5vw,14px)]">
          ได้ผ่านการรับรองตามมาตรฐานร้านยาคุณภาพของสภาเภสัชกรรม
        </p>
        <p className="font-mono text-[clamp(11px,1.6vw,16px)] font-bold">
          เลขที่ {shop.qualityNo}
        </p>
        <p className="text-[clamp(9px,1.3vw,13px)]">
          ให้ไว้ ณ วันที่ {formatDateLong(shop.certIssued)} · ใช้ได้ถึงวันที่{' '}
          {formatDateLong(shop.certExpires)}
        </p>
        <div className="mt-[3%] text-[clamp(9px,1.2vw,12px)]">
          <div
            className="mx-auto mb-1 h-px w-48"
            style={{ background: 'var(--ink-tertiary)' }}
          />
          (ลงนาม) ผู้มีอำนาจลงนาม
        </div>
      </div>
      <span
        className="pointer-events-none absolute right-4 top-3 text-[10px] font-semibold"
        style={{ color: 'var(--ink-tertiary)' }}
      >
        ตัวอย่าง PoC
      </span>
    </div>
  );
}
